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
 * `--base` (default `DEFAULT_BASE`, the last pre-4.28 tag) is compared
 * against the one in the
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

/**
 * The last release BEFORE the 4.28.0 contrast pass — a tag, deliberately, not
 * `origin/release`.
 *
 * A branch name was the original default and became wrong the moment this work
 * merged: `origin/release` now contains the very changes this tool exists to
 * diff, so it compared the new palette against itself and found nothing to
 * restore. It failed quietly, which is the worst shape for this particular
 * tool, since an empty stylesheet is exactly what "nothing changed" looks like.
 * A tag cannot drift that way — 4.27.6 is a fixed point in history and stays
 * the right answer however far release moves on.
 */
export const DEFAULT_BASE = '4.27.6';
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

/**
 * A selector that declared no value at all for `property` on `base` -- so its
 * rendered value came from whatever ancestor the CONSUMER'S OWN markup put
 * around it, not from this library -- and on `current` declares it through a
 * brand-new `var(--name, <literal>)`. `diffPalette` cannot see this shape at
 * all: it is keyed by custom-property NAME across the whole snapshot, and a
 * name absent from `previous` reads as "new, no previous default", which is
 * right for a selector that already had SOME declaration for `property` and
 * wrong for one that had none, since "none" was never "defaults to nothing"
 * for an inherited property -- it was actively resolving to a value nothing
 * in this component's own source would show you.
 */
export type InheritanceRestore = {
  readonly name: string;
  readonly property: string;
  readonly selector: string;
  readonly file: string;
  readonly line: number;
};

/**
 * CSS properties that inherit from an ancestor by default when a selector
 * declares nothing for them -- the fixed, spec-defined set this detector is
 * scoped to, not a guess. A property outside this set (`background-color`,
 * `border`, `width`, `display`, ...) has a fixed, non-context-dependent
 * INITIAL value when undeclared, so a selector newly giving one of those a
 * literal default is an ordinary new-property case with a real, single old
 * default (the initial value) -- not this hazard, and not something this
 * detector claims to cover.
 */
const INHERITED_PROPERTIES: ReadonlySet<string> = new Set([
  'color',
  'cursor',
  'direction',
  'font',
  'font-family',
  'font-size',
  'font-style',
  'font-variant',
  'font-weight',
  'letter-spacing',
  'line-height',
  'list-style',
  'list-style-image',
  'list-style-position',
  'list-style-type',
  'text-align',
  'text-indent',
  'text-transform',
  'visibility',
  'white-space',
  'word-spacing'
]);

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

// ------------------------------------------------------- inheritance restores

/** Replaces comment CONTENT with spaces, one-for-one except newlines, so a literal `{`/`}` inside a comment cannot desynchronise `ruleBlocks`' brace matching while every offset and line number stays valid. */
export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
}

/** Index of the `}` that closes the block `openIndex` (a `{`) opened, or -1 if unterminated. Braces are globally balanced in valid CSS, so this never needs an upper bound from the caller. */
function matchingBrace(css: string, openIndex: number): number {
  let depth = 1;
  for (let index = openIndex + 1; index < css.length; index++) {
    if (css[index] === '{') {
      depth += 1;
    } else if (css[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

export type RuleBlock = {
  readonly selector: string;
  readonly body: string;
  /** Offset of `body`'s first character within the `css` text `ruleBlocks` was called with. */
  readonly bodyStart: number;
};

/**
 * Every leaf style rule in one block of CSS text (already comment-stripped):
 * a selector followed by a `{ declarations }` body that itself contains no
 * further nested rule -- this codebase does not use CSS nesting under
 * `src/lib`, so a declaration body is never recursed into. An at-rule's
 * prelude (`@supports (...)`, `@media (...)`, `@keyframes name`) is never
 * recorded as a rule itself -- its body is scanned in turn, so `.loader`
 * inside `@supports { ... }` is still found, but `@supports (...)` is not
 * mistaken for a selector that some file could plausibly also carry.
 */
export function ruleBlocks(css: string): readonly RuleBlock[] {
  const blocks: RuleBlock[] = [];
  const scan = (start: number, end: number): void => {
    let cursor = start;
    while (cursor < end) {
      const openIndex = css.indexOf('{', cursor);
      if (openIndex === -1 || openIndex >= end) {
        return;
      }
      const closeIndex = matchingBrace(css, openIndex);
      if (closeIndex === -1) {
        return;
      }
      const selector = css.slice(cursor, openIndex).trim();
      const bodyStart = openIndex + 1;
      if (selector.startsWith('@')) {
        scan(bodyStart, closeIndex);
      } else if (selector.length > 0) {
        blocks.push({ selector, body: css.slice(bodyStart, closeIndex), bodyStart });
      }
      cursor = closeIndex + 1;
    }
  };
  scan(0, css.length);
  return blocks;
}

type CssRegion = {
  readonly text: string;
  /** Offset of `text`'s first character within the original file source. */
  readonly fileOffset: number;
};

/**
 * The CSS-bearing region(s) of one file. A `.css` file's whole content is one
 * region at offset 0; a `.svelte` file contributes each `<style>` block's
 * inner content (never the whole file -- Svelte's own markup uses `{...}`
 * pervasively for expressions, which `ruleBlocks` would otherwise misparse as
 * rule bodies). Any other extension has no CSS to find.
 */
function cssRegions(source: string, file: string): readonly CssRegion[] {
  if (file.endsWith('.css')) {
    return [{ text: source, fileOffset: 0 }];
  }
  if (!file.endsWith('.svelte')) {
    return [];
  }
  const regions: CssRegion[] = [];
  for (const match of source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    const matchIndex = typeof match.index === 'number' ? match.index : 0;
    const contentStart = matchIndex + match[0].indexOf(match[1]);
    regions.push({ text: match[1], fileOffset: contentStart });
  }
  return regions;
}

/** Whether `body` declares `property` at all, in any form -- literal or `var()`. Only used to rule OUT the inheritance case; a false positive here (matching inside a value) would wrongly suppress a real finding, which is the safe direction to err in. */
function declaresProperty(body: string, property: string): boolean {
  return new RegExp(`(?:^|[;{}\\s])${property}\\s*:`).test(body);
}

/**
 * `property`'s own-literal `var(--name, <literal>)` declaration inside
 * `body`, if it has one -- reusing `fallbackEnd`/`normalize`/`isOwnLiteral` so
 * a delegating fallback (`var(--x, var(--y, red))`) is excluded exactly the
 * same way `extractFallbackSites` excludes it elsewhere in this file.
 * `regionText` is the full region `body` was sliced from (so `fallbackEnd`
 * can read past `body`'s own end when the fallback itself contains a `)`),
 * and the returned offset is relative to that same region text.
 */
function ownLiteralDeclaration(
  body: string,
  bodyStart: number,
  regionText: string,
  property: string
): { readonly name: string; readonly offset: number } | null {
  const pattern = new RegExp(
    `(?:^|[;{}\\s])${property}\\s*:\\s*var\\(\\s*(--[a-zA-Z0-9-]+)\\s*,\\s*`
  );
  const match = pattern.exec(body);
  if (match === null || typeof match.index !== 'number') {
    return null;
  }
  const fallbackStart = bodyStart + match.index + match[0].length;
  const closeIndex = fallbackEnd(regionText, fallbackStart);
  if (closeIndex === -1) {
    return null;
  }
  const literal = normalize(regionText.slice(fallbackStart, closeIndex));
  if (!isOwnLiteral(literal)) {
    return null;
  }
  return { name: match[1], offset: bodyStart + match.index };
}

/**
 * The inheritance-restore findings for one file: every selector present in
 * BOTH `previousSource` and `currentSource` that gained an own-literal
 * `var()` declaration for a CSS-inherited property (see `INHERITED_PROPERTIES`)
 * it did not declare at all before.
 *
 * Two things are deliberately NOT flagged, matching `diffPalette`'s own
 * "no previous default to restore" stance for genuinely new things:
 *   - a selector `previousSource` has no rule for at all (new markup, or a
 *     rename this file-scoped, exact-text comparison cannot follow) -- there
 *     is no prior rendered value to have regressed from;
 *   - a selector that already declared `property` at `previousSource`, by any
 *     means -- even when the CURRENT declaration's custom-property name is
 *     itself brand new, the rule always had SOME explicit value for this
 *     property, so nothing was ever resolving by inheritance here.
 *
 * Returns `[]` for a file with no base version to compare against (a file
 * added since `previousSource`), mirroring `buildLegacyPalette`'s own
 * "nothing to diff" treatment of that case for the literal-pin pipeline.
 */
export function findInheritanceRestores(
  previousSource: string | null,
  currentSource: string,
  file: string
): readonly InheritanceRestore[] {
  if (previousSource === null) {
    return [];
  }
  const currentRegions = cssRegions(currentSource, file);
  if (currentRegions.length === 0) {
    return [];
  }

  const previousBlocksBySelector = new Map<string, readonly RuleBlock[]>();
  for (const region of cssRegions(previousSource, file)) {
    for (const block of ruleBlocks(stripComments(region.text))) {
      const existing = previousBlocksBySelector.get(block.selector) ?? [];
      previousBlocksBySelector.set(block.selector, [...existing, block]);
    }
  }

  const restores: InheritanceRestore[] = [];
  for (const region of currentRegions) {
    const strippedRegion = stripComments(region.text);
    for (const block of ruleBlocks(strippedRegion)) {
      const previousBlocks = previousBlocksBySelector.get(block.selector);
      if (typeof previousBlocks === 'undefined') {
        continue;
      }
      for (const property of INHERITED_PROPERTIES) {
        if (
          previousBlocks.some((previousBlock) => declaresProperty(previousBlock.body, property))
        ) {
          continue;
        }
        const declared = ownLiteralDeclaration(
          block.body,
          block.bodyStart,
          strippedRegion,
          property
        );
        if (declared === null) {
          continue;
        }
        restores.push({
          name: declared.name,
          property,
          selector: block.selector,
          file,
          line: lineOf(currentSource, region.fileOffset + declared.offset)
        });
      }
    }
  }
  return restores;
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

/**
 * Renders the `inheritanceRestores` section. Not a literal pin: `property`
 * resolved by inheritance on `base` because nothing declared it, and the
 * empty-value trick below is the only mechanism that can put that back.
 *
 * `--name: inherit;` looks like the obvious rule and does NOT work: written
 * at `:root`, an unregistered custom property's `inherit` resolves to ITS OWN
 * initial value -- because `:root` has no parent to inherit from -- and that
 * initial value is the guaranteed-invalid value, i.e. exactly the same state
 * as never declaring `--name` at all. It is a no-op, not a restoration; the
 * component's own literal fallback would still win.
 *
 * An EMPTY value is what actually works, because of a narrower rule: `var()`
 * only substitutes its fallback when the referenced property is *unset*
 * (holds the guaranteed-invalid value). Once `--name` has ANY value -- even
 * an empty one -- `var()` substitutes THAT value verbatim instead, with no
 * regard for whether it makes sense in context. Substituting nothing in for
 * `property: var(--name, <literal>)` leaves `property:` with no value, which
 * fails that property's own grammar and makes the declaration invalid at
 * computed-value time -- and per the cascade, a property invalid at
 * computed-value time computes to its INHERITED value when the property is
 * (like every property in `INHERITED_PROPERTIES`) inherited by default. That
 * is exactly the pre-existing behaviour: inherit from the ancestor.
 */
function renderInheritanceSection(restores: readonly InheritanceRestore[]): string {
  const header = [
    '',
    '',
    '/*',
    ' * Not literal pins -- these properties did not exist on the selectors',
    ' * below at all before this change, so each one rendered whatever value',
    ' * its ANCESTOR supplied, not a value from this library. There is no old',
    ' * literal to restore, only inheritance to put back, which is why the',
    ' * rule shape differs from the pins above.',
    ' *',
    ' * `--name: inherit;` would NOT do this: at :root there is no parent, so',
    " * an unregistered custom property's `inherit` resolves to its own",
    ' * initial value -- the guaranteed-invalid value -- exactly as if it were',
    ' * never declared. An EMPTY value is what actually works: var(--name,',
    ' * <fallback>) uses <fallback> only while --name is unset; once --name',
    ' * has ANY value, even an empty one, that value is substituted instead,',
    ' * which here leaves the declaration with no value at all -- invalid at',
    ' * computed-value time, which for an inherited property computes to',
    ' * exactly the old behaviour: inherit from the ancestor.',
    ' */'
  ].join('\n');

  const rules = restores
    .map(
      (restore) =>
        `:root { ${restore.name}: ; }   /* ${restore.property} on ${restore.selector} (${restore.file}:${restore.line}) was inherited, never declared */`
    )
    .join('\n');

  return `${header}\n${rules}\n`;
}

export function renderStylesheet(
  diff: PaletteDiff,
  previousVersionLabel: string | null,
  inheritanceRestores: readonly InheritanceRestore[] = []
): string {
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

  const inheritanceBlock =
    inheritanceRestores.length === 0 ? '' : renderInheritanceSection(inheritanceRestores);

  if (diff.ambiguous.length === 0) {
    return `${header}${rules}${inheritanceBlock}\n`;
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

  return `${header}${rules}${inheritanceBlock}${ambiguousBlock}`;
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
    // `git fetch origin release` was the instruction while the default was a
    // branch. The default is a TAG now, which that command does not fetch, so
    // following the old advice failed again identically -- an error message
    // that sends you round the same loop is worse than none.
    throw new Error(
      `cannot resolve --base '${ref}' in ${root}. ` +
        `Fetch it first (git fetch origin --tags for a tag, git fetch origin <branch> ` +
        `for a branch), or pass a ref that exists.`
    );
  }
}

export function buildLegacyPalette(root: string, base: string): string {
  assertRefExists(root, base);
  const previousSites: FallbackSite[] = [];
  const currentSites: FallbackSite[] = [];
  const inheritanceRestores: InheritanceRestore[] = [];

  for (const file of listLibraryFiles(root)) {
    const relPath = relative(root, file);
    const currentSource = readFileSync(file, 'utf8');
    currentSites.push(...extractFallbackSites(currentSource, relPath));

    const previousSource = readAtRef(root, base, relPath);
    if (previousSource === null) {
      continue;
    }
    previousSites.push(...extractFallbackSites(previousSource, relPath));
    inheritanceRestores.push(...findInheritanceRestores(previousSource, currentSource, relPath));
  }

  // Sorted for a deterministic report -- directory traversal order is not
  // otherwise guaranteed, and diffPalette's own pins are sorted the same way.
  inheritanceRestores.sort(
    (a, b) => a.name.localeCompare(b.name) || a.selector.localeCompare(b.selector)
  );

  const diff = diffPalette(groupSites(previousSites), groupSites(currentSites));
  return renderStylesheet(diff, previousVersionLabel(root, base), inheritanceRestores);
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
