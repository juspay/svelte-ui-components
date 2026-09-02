import { parse } from 'svelte/compiler';

export const LIBRARY = '@juspay/svelte-ui-components';

/** Peer requirement of the 3.x line, from its published package.json. */
export const SVELTE_PEER_MAJOR = 5;

export type FindingReason =
  | 'default-back-control'
  | 'indeterminate-spread'
  | 'legacy-back-selector';

export type Finding = {
  readonly file: string;
  readonly line: number;
  readonly reason: FindingReason;
  readonly detail: string;
};

export type ManifestReport = {
  readonly currentRange: string | null;
  readonly svelteRange: string | null;
  readonly blockers: readonly string[];
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return typeof value === 'object' && value !== null ? (value as UnknownRecord) : {};
}

function readDependency(manifest: unknown, name: string): string | null {
  const root = asRecord(manifest);
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const value = asRecord(root[field])[name];
    if (typeof value === 'string') {
      return value;
    }
  }
  return null;
}

/** First major version mentioned in a range, or null when none can be read. */
function majorOf(range: string): number | null {
  const match = /(\d+)\./.exec(range);
  return match === null ? null : Number(match[1]);
}

/**
 * Checks a consumer's manifest for anything that would prevent taking 3.x.
 *
 * Deliberately reads the manifest rather than node_modules: an installed tree
 * can be stale relative to what the project declares, and reading the wrong one
 * produces a confidently wrong answer about which Svelte a project is on.
 */
export function analyzeManifest(manifest: unknown): ManifestReport {
  const currentRange = readDependency(manifest, LIBRARY);
  const svelteRange = readDependency(manifest, 'svelte');
  const blockers: string[] = [];

  if (currentRange === null) {
    blockers.push(`${LIBRARY} is not a dependency of this project`);
  }

  if (svelteRange === null) {
    blockers.push('svelte is not a dependency; 3.x requires svelte ^5.41.2');
  } else {
    const major = majorOf(svelteRange);
    if (major !== null && major < SVELTE_PEER_MAJOR) {
      blockers.push(
        `svelte ${svelteRange} is below the 3.x peer requirement of ^5.41.2 — migrate to Svelte 5 first`
      );
    }
  }

  return { currentRange, svelteRange, blockers };
}

/** Local names bound to the library's Toolbar export in this file. */
function toolbarNames(source: string): ReadonlySet<string> {
  const names = new Set<string>();
  const importPattern = new RegExp(
    `import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${LIBRARY.replace('/', '\\/')}['"]`,
    'g'
  );
  for (const match of source.matchAll(importPattern)) {
    for (const clause of match[1].split(',')) {
      const [imported, local] = clause.split(/\s+as\s+/).map((part) => part.trim());
      if (imported === 'Toolbar') {
        names.add(local ?? imported);
      }
    }
  }
  return names;
}

function lineOf(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}

type AttributeSummary = {
  readonly explicitlyDisabled: boolean;
  readonly hasOwnIcon: boolean;
  readonly hasSpread: boolean;
};

function summarize(node: UnknownRecord): AttributeSummary {
  const attributes = Array.isArray(node.attributes) ? node.attributes : [];
  let explicitlyDisabled = false;
  let hasOwnIcon = false;
  let hasSpread = false;

  for (const raw of attributes) {
    const attribute = asRecord(raw);
    if (attribute.type === 'SpreadAttribute') {
      hasSpread = true;
      continue;
    }
    if (attribute.name === 'showBackButton') {
      // Only a literal false is treated as disabling; a bound expression could
      // be either, and guessing would produce a silently wrong report.
      const rendered = JSON.stringify(attribute.value ?? '');
      explicitlyDisabled = rendered.includes('false');
    }
    if (attribute.name === 'backIcon') {
      hasOwnIcon = true;
    }
  }

  return { explicitlyDisabled, hasOwnIcon, hasSpread };
}

function walk(node: unknown, visit: (node: UnknownRecord) => void): void {
  if (Array.isArray(node)) {
    for (const child of node) {
      walk(child, visit);
    }
    return;
  }
  const record = asRecord(node);
  if (typeof record.type === 'string') {
    visit(record);
  }
  for (const value of Object.values(record)) {
    if (typeof value === 'object' && value !== null) {
      walk(value, visit);
    }
  }
}

/**
 * Finds everything in one `.svelte` file that 3.0.0's Toolbar change affects.
 *
 * The change is narrow: with no `backIcon`, the default back control went from
 * `<div role="button"><img src="…cdn…"></div>` to `<button aria-label><svg/></button>`.
 * So a usage only matters when that control actually renders — which rules out
 * `showBackButton={false}` and any caller-supplied `backIcon`, both of which
 * keep their previous behaviour exactly.
 */
export function analyzeSvelte(source: string, file: string): readonly Finding[] {
  const names = toolbarNames(source);
  if (names.size === 0) {
    return [];
  }

  const findings: Finding[] = [];

  let ast: unknown;
  try {
    ast = parse(source, { modern: true });
  } catch {
    return [
      {
        file,
        line: 1,
        reason: 'indeterminate-spread',
        detail: 'file could not be parsed; review this Toolbar usage by hand'
      }
    ];
  }

  walk(ast, (node) => {
    if (node.type !== 'Component' || typeof node.name !== 'string' || !names.has(node.name)) {
      return;
    }
    const { explicitlyDisabled, hasOwnIcon, hasSpread } = summarize(node);
    const line = lineOf(source, typeof node.start === 'number' ? node.start : 0);

    if (explicitlyDisabled || hasOwnIcon) {
      return;
    }
    if (hasSpread) {
      findings.push({
        file,
        line,
        reason: 'indeterminate-spread',
        detail: `<${node.name}> spreads props, so showBackButton/backIcon cannot be read statically — confirm by hand`
      });
      return;
    }
    findings.push({
      file,
      line,
      reason: 'default-back-control',
      detail: `<${node.name}> renders the default back control, whose markup changed from <div><img></div> to <button><svg></button>`
    });
  });

  // Styles are checked textually: a selector reaching into the back control's
  // markup breaks regardless of which Toolbar instance it was written for.
  const styleMatch = /<style[^>]*>([\s\S]*?)<\/style>/g;
  for (const match of source.matchAll(styleMatch)) {
    const legacy = /\.back[^{}]*\bimg\b/.exec(match[1]);
    if (legacy !== null) {
      findings.push({
        file,
        line: lineOf(source, match.index + legacy.index),
        reason: 'legacy-back-selector',
        detail:
          'selector targets an <img> inside the back control; the default control now renders an inline <svg>'
      });
    }
  }

  return findings;
}
