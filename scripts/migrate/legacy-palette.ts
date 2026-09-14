import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Generates a stylesheet that pins every `src/lib` custom property whose
 * literal `var(--name, <fallback>)` default PR 598's WCAG-AA contrast pass
 * darkened, back to the value a consumer who never overrode the token saw
 * before this change.
 *
 * The list is derived by diffing, never hand-written: for every property with
 * a literal (non-delegating) fallback under `src/lib/**`, the fallback on
 * `--base` (default `origin/release`) is compared against the one in the
 * current working tree, and a rule is emitted for each one that changed. A
 * property whose fallback was ALREADY inconsistent across call sites before
 * this change -- two different literals for the same `--name` in different
 * components -- cannot be restored by one `:root` rule without being wrong
 * at whichever site did not carry that literal, so those are reported in a
 * trailing comment instead of guessed at (see `diffPalette`).
 *
 * A fallback that itself forwards to another custom property
 * (`var(--x, var(--motion-duration, 0.2s))`) is not this property's own
 * literal and is excluded from the comparison entirely -- see `isOwnLiteral`.
 * Without that, an unrelated pass in the same PR that wrapped several
 * duration/easing fallbacks in `var(--motion-*, …)` would be reported here as
 * though it were a contrast change.
 *
 *   node --experimental-strip-types scripts/migrate/legacy-palette.ts [--root <repo>] [--base <ref>] [--out <path>]
 *
 * Prints to stdout when `--out` is absent. Never writes to `src/lib` itself --
 * this only ever produces the standalone stylesheet.
 */

const DEFAULT_BASE = 'origin/release';
const RELEVANT_FILE = /\.(?:svelte|ts|css)$/;
const EXCLUDED_FILE = /\.(?:test|spec)\.(?:svelte|ts)$/;
const VAR_WITH_FALLBACK = /var\(\s*(--[a-zA-Z0-9-]+)\s*,\s*/g;

export type FallbackSite = {
  readonly file: string;
  readonly line: number;
  readonly name: string;
  readonly literal: string;
};

export type PropertySnapshot = ReadonlyMap<string, readonly FallbackSite[]>;

export type PinRule = {
  readonly name: string;
  readonly previousLiteral: string;
};

export type AmbiguousProperty = {
  readonly name: string;
  /** One representative site per distinct literal `--name` fell back to before this change. */
  readonly sites: readonly FallbackSite[];
};

export type PaletteDiff = {
  readonly pins: readonly PinRule[];
  readonly ambiguous: readonly AmbiguousProperty[];
};

/** Index of the `)` that closes the `var(` this fallback opened, or -1 if unterminated. */
function fallbackEnd(source: string, start: number): number {
  let depth = 1;
  for (let i = start; i < source.length; i++) {
    const character = source[i];
    if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

function lineOf(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}

function normalize(fallback: string): string {
  return fallback.replace(/\s+/g, ' ').trim();
}

/**
 * True for a fallback that is this property's OWN default -- a fixed colour,
 * length, keyword, or `light-dark(...)` pair. False for a fallback that only
 * forwards to another custom property, because that value belongs to
 * whichever property it defers to, not to this one. Un-nested is not
 * required: `var(--tooltip-border-radius, var(--radius, 4px))` and
 * `var(--x, calc(1px + var(--y, 2px)))` are both exclusions, since either way
 * the literal a consumer actually sees is controlled by a token this
 * property does not own.
 */
function isOwnLiteral(fallback: string): boolean {
  return !fallback.includes('var(');
}

/**
 * Every `var(--name, <literal>)` occurrence in one file, restricted to
 * fallbacks that are the property's own literal (see `isOwnLiteral`).
 */
export function extractFallbackSites(source: string, file: string): readonly FallbackSite[] {
  const sites: FallbackSite[] = [];
  for (const match of source.matchAll(VAR_WITH_FALLBACK)) {
    const matchStart = typeof match.index === 'number' ? match.index : -1;
    if (matchStart === -1) {
      continue;
    }
    const fallbackStart = matchStart + match[0].length;
    const closeIndex = fallbackEnd(source, fallbackStart);
    if (closeIndex === -1) {
      continue;
    }
    const literal = normalize(source.slice(fallbackStart, closeIndex));
    if (!isOwnLiteral(literal)) {
      continue;
    }
    sites.push({ file, line: lineOf(source, matchStart), name: match[1], literal });
  }
  return sites;
}

export function groupSites(sites: readonly FallbackSite[]): PropertySnapshot {
  const groups = new Map<string, readonly FallbackSite[]>();
  for (const site of sites) {
    groups.set(site.name, [...(groups.get(site.name) ?? []), site]);
  }
  return groups;
}

function distinctLiterals(sites: readonly FallbackSite[]): readonly string[] {
  return [...new Set(sites.map((site) => site.literal))];
}

function sameLiteralSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((literal, index) => literal === sortedB[index]);
}

/** One site per distinct literal, in first-seen order -- enough to show where each came from. */
function representativeSites(sites: readonly FallbackSite[]): readonly FallbackSite[] {
  const seen = new Set<string>();
  const representatives: FallbackSite[] = [];
  for (const site of sites) {
    if (seen.has(site.literal)) {
      continue;
    }
    seen.add(site.literal);
    representatives.push(site);
  }
  return representatives;
}

/**
 * Compares two snapshots of the same property namespace and decides, per
 * property, whether a single `:root` rule can restore its previous default.
 *
 * Only properties present in `previous` are considered -- a property that
 * only exists in `current` is new, not changed, and has no previous default
 * to restore. A property whose `previous` fallback was already inconsistent
 * across call sites is reported in `ambiguous` rather than `pins`: picking
 * any one of its old literals for a single `:root` rule would silently
 * overwrite whichever call site relied on the other one, which is a wrong
 * answer dressed as a confident one.
 */
export function diffPalette(previous: PropertySnapshot, current: PropertySnapshot): PaletteDiff {
  const pins: PinRule[] = [];
  const ambiguous: AmbiguousProperty[] = [];

  for (const name of [...previous.keys()].sort()) {
    const previousSites = previous.get(name) ?? [];
    const currentSites = current.get(name) ?? [];
    if (currentSites.length === 0) {
      // Removed entirely (or its remaining fallbacks all delegate now) --
      // a consumer has nothing left to override, and pinning a value for a
      // token that no longer resolves to one would be inventing a rule.
      continue;
    }

    const previousLiterals = distinctLiterals(previousSites);
    const currentLiterals = distinctLiterals(currentSites);
    if (sameLiteralSet(previousLiterals, currentLiterals)) {
      continue;
    }

    if (previousLiterals.length > 1) {
      ambiguous.push({ name, sites: representativeSites(previousSites) });
      continue;
    }

    pins.push({ name, previousLiteral: previousLiterals[0] });
  }

  return { pins, ambiguous };
}

function propertyNoun(count: number): string {
  return count === 1 ? 'property' : 'properties';
}

export function renderStylesheet(diff: PaletteDiff, previousVersionLabel: string | null): string {
  const versionPhrase = previousVersionLabel === null ? 'pre-AA' : previousVersionLabel;
  const header = [
    '/*',
    ' * Legacy palette -- pins this library to its pre-AA contrast fallbacks.',
    ' *',
    ' * PR 598 ran a WCAG-AA contrast pass over src/lib that darkened the',
    ' * literal fallback of the custom properties below. A consumer who never',
    ' * overrode one of these tokens rendered the OLD colour at an unchanged',
    ' * call site, and this stylesheet restores exactly that -- nothing more.',
    ' *',
    ' * Several of the values restored here FAIL WCAG AA; that is why the pass',
    ' * changed them. Adopting the new defaults -- i.e. NOT loading this file --',
    ' * is the intended end state. This exists to make that change reviewable',
    ' * one property at a time, not to be a permanent fixture in a consumer',
    ' * build.',
    ' *',
    ` * ${diff.pins.length} ${propertyNoun(diff.pins.length)} pinned below.${
      diff.ambiguous.length === 0
        ? ''
        : ` ${diff.ambiguous.length} more could not be -- see the note at the end.`
    }`,
    ' *',
    ' * Generated by scripts/migrate/legacy-palette.ts -- do not hand edit.',
    ' */',
    ''
  ].join('\n');

  const rules = diff.pins
    .map(
      (pin) =>
        `:root { ${pin.name}: ${pin.previousLiteral}; }   /* was the ${versionPhrase} default */`
    )
    .join('\n');

  if (diff.ambiguous.length === 0) {
    return `${header}${rules}\n`;
  }

  const ambiguousBlock = [
    '',
    '',
    '/*',
    ' * Not pinned above -- each of these already had more than one literal',
    ' * fallback across src/lib before this change, so no single :root rule',
    ' * could restore "the previous default" without being wrong at some call',
    ' * site. Review the sites below by hand if your snapshots depend on them.',
    ' */',
    ...diff.ambiguous.map(
      (entry) =>
        `/* ${entry.name}: ${entry.sites.map((site) => `${site.literal} (${site.file}:${site.line})`).join(', ')} */`
    ),
    ''
  ].join('\n');

  return `${header}${rules}${ambiguousBlock}`;
}

// ------------------------------------------------------------------- driver

function listLibraryFiles(root: string): readonly string[] {
  const libDir = join(root, 'src', 'lib');
  const found: string[] = [];
  const visit = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(full);
        continue;
      }
      if (RELEVANT_FILE.test(entry.name) && !EXCLUDED_FILE.test(entry.name)) {
        found.push(full);
      }
    }
  };
  visit(libDir);
  return found;
}

/**
 * `path` as it stood at `ref`, or null when it did not exist there (a file
 * added since `ref` has nothing to diff against).
 *
 * `execFileSync`'s `utf8` encoding decodes the raw stdout buffer directly --
 * unlike `grep`, which treats a NUL byte as a binary-file signal and refuses
 * to search the file at all. `origin/release`'s own `src/lib/_chart/geometry.ts`
 * carries one, which is why this reads through git and node rather than
 * shelling out to grep.
 */
function readAtRef(root: string, ref: string, path: string): string | null {
  try {
    return execFileSync('git', ['show', `${ref}:${path}`], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 64,
      // Pipe stderr rather than inheriting it. A file added since `ref` makes
      // git print `fatal: path ... exists on disk, but not in <ref>`, which is
      // the expected answer here (a new file has no previous fallback to pin),
      // not a failure -- but inherited it reaches the terminal ahead of the
      // generated stylesheet and reads as though the run died.
      // `assertRefExists` is what keeps this from swallowing a real problem:
      // a bad ref fails loudly there instead of silently emptying every file
      // here and yielding a stylesheet that pins nothing.
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch {
    return null;
  }
}

function previousVersionLabel(root: string, base: string): string | null {
  const manifest = readAtRef(root, base, 'package.json');
  if (manifest === null) {
    return null;
  }
  const match = /"version"\s*:\s*"(\d+)\.(\d+)\.\d+"/.exec(manifest);
  return match === null ? null : `${match[1]}.${match[2]}.x`;
}

/**
 * Fails loudly when `ref` is not a commit this repo can read.
 *
 * Every per-file read below treats a git failure as "this file did not exist
 * at `ref`", which is correct for a file added since. But an unresolvable ref
 * fails that way for EVERY file, and the run then reports zero changed
 * fallbacks -- a clean, plausible, entirely empty stylesheet that looks like
 * "nothing changed" rather than "nothing was compared". Checking the ref once,
 * here, is what separates those two answers.
 */
function assertRefExists(root: string, ref: string): void {
  try {
    execFileSync('git', ['rev-parse', '--verify', `${ref}^{commit}`], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch {
    throw new Error(
      `cannot resolve --base '${ref}' in ${root}. ` +
        `Fetch it first (git fetch origin release), or pass a ref that exists.`
    );
  }
}

export function buildLegacyPalette(root: string, base: string): string {
  assertRefExists(root, base);
  const previousSites: FallbackSite[] = [];
  const currentSites: FallbackSite[] = [];

  for (const file of listLibraryFiles(root)) {
    const relPath = relative(root, file);
    const currentSource = readFileSync(file, 'utf8');
    currentSites.push(...extractFallbackSites(currentSource, relPath));

    const previousSource = readAtRef(root, base, relPath);
    if (previousSource === null) {
      continue;
    }
    previousSites.push(...extractFallbackSites(previousSource, relPath));
  }

  const diff = diffPalette(groupSites(previousSites), groupSites(currentSites));
  return renderStylesheet(diff, previousVersionLabel(root, base));
}

const entrypoint = process.argv[1];
const invokedDirectly =
  typeof entrypoint === 'string' && import.meta.url === pathToFileURL(entrypoint).href;

if (invokedDirectly) {
  const argv = process.argv.slice(2);
  const rootFlag = argv.indexOf('--root');
  const root = rootFlag === -1 ? process.cwd() : argv[rootFlag + 1];
  const baseFlag = argv.indexOf('--base');
  const base = baseFlag === -1 ? DEFAULT_BASE : argv[baseFlag + 1];
  const outFlag = argv.indexOf('--out');
  const outPath = outFlag === -1 ? null : argv[outFlag + 1];

  const stylesheet = buildLegacyPalette(root, base);
  if (outPath === null) {
    console.log(stylesheet);
  } else {
    writeFileSync(outPath, stylesheet);
    console.log(`wrote ${outPath}`);
  }
}
