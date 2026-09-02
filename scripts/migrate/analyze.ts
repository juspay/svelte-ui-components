import { intersects } from 'semver';
import { parse } from 'svelte/compiler';

export const LIBRARY = '@juspay/svelte-ui-components';

/** Peer requirement of the 3.x line, from its published package.json. */
export const SVELTE_PEER_RANGE = '^5.41.2';

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

/**
 * Reads an unknown value as a record of unknown fields.
 *
 * Copies the own enumerable keys rather than asserting the type. Assertions are
 * banned repo-wide and so are type predicates, so there is no way to tell the
 * compiler that a narrowed `object` really is keyed by string. The copy is
 * shallow, so nested nodes keep their identity and traversal is unaffected.
 *
 * `Reflect.get` rather than `value[key]`, because indexing a value typed
 * `object` is itself an error without an assertion — the very thing being
 * avoided. `defineProperty` rather than assignment, because one input here is a
 * consumer's `package.json`: `JSON.parse` turns `__proto__` into an ordinary
 * own key, and assigning it would re-point this copy's prototype instead of
 * adding a field, so a manifest declaring nothing could still answer for
 * `dependencies` through the chain.
 *
 * Only string keys are copied. The Svelte AST and `package.json` have no
 * symbol-keyed fields, and reading one is never the question being asked here.
 */
function asRecord(value: unknown): UnknownRecord {
  if (typeof value !== 'object' || value === null) {
    return {};
  }
  const record: UnknownRecord = {};
  for (const key of Object.keys(value)) {
    Object.defineProperty(record, key, {
      value: Reflect.get(value, key),
      enumerable: true,
      writable: true,
      configurable: true
    });
  }
  return record;
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

/**
 * Whether a declared range permits any version satisfying the 3.x peer.
 *
 * Comparing major numbers is not enough in either direction: an exact `5.0.0`
 * shares the major but does not satisfy `^5.41.2`, and `^4 || ^5` looks like a
 * 4 to a first-number read while genuinely intersecting. Range intersection is
 * the actual question being asked.
 */
function satisfiesPeer(range: string): boolean {
  try {
    // `loose` changes the answer for exactly one shape worth having: a version
    // written with a leading zero (`^05.41.2`), which strict parsing throws on
    // and would therefore report as a blocker it is not. It does not loosen
    // prerelease handling -- `^5.41.2-alpha` and `>=5.0.0-0` resolve the same
    // either way -- and genuinely unparseable ranges still throw.
    return intersects(range, SVELTE_PEER_RANGE, { loose: true });
  } catch {
    // An unparseable range (a git URL, a workspace protocol) cannot be shown to
    // satisfy the peer, and silently passing it would be the wrong default.
    return false;
  }
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
    if (!satisfiesPeer(svelteRange)) {
      blockers.push(
        `svelte ${svelteRange} does not satisfy the 3.x peer requirement of ${SVELTE_PEER_RANGE}`
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

/** True only for `{false}` — not for a bound expression or the string "false". */
function isFalseLiteral(value: unknown): boolean {
  // Svelte types an attribute value as `true | ExpressionTag | Array<Text |
  // ExpressionTag>`, and quoting a single expression (`="{false}"`) produces
  // the one-element array rather than the bare tag. Reading only the bare shape
  // reports a Toolbar whose control genuinely never renders.
  const single = Array.isArray(value) && value.length === 1 ? value[0] : value;
  const tag = asRecord(single);
  if (tag.type !== 'ExpressionTag') {
    return false;
  }
  const expression = asRecord(tag.expression);
  return expression.type === 'Literal' && expression.value === false;
}

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
      // Only the Boolean literal `false` disables the control. This used to
      // test `JSON.stringify(value).includes('false')`, which matched unrelated
      // AST properties -- a MemberExpression carries `"computed":false`, so
      // `showBackButton={cfg.showBack}` read as disabled and its affected
      // Toolbar went unreported. A false negative is the worst outcome here.
      explicitlyDisabled = isFalseLiteral(attribute.value);
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
      // legacy.index is an offset into the style CONTENT, while match.index
      // points at the opening <style> tag, so the two must be bridged by the
      // tag's own length or a multiline block reports the tag's line instead.
      const contentStart = match.index + match[0].indexOf(match[1]);
      findings.push({
        file,
        line: lineOf(source, contentStart + legacy.index),
        reason: 'legacy-back-selector',
        detail:
          'selector targets an <img> inside the back control; the default control now renders an inline <svg>'
      });
    }
  }

  return findings;
}
