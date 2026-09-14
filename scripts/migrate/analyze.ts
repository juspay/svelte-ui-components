import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { intersects } from 'semver';
import { parse } from 'svelte/compiler';

export const LIBRARY = '@juspay/svelte-ui-components';

/** Peer requirement of the 3.x line, from its published package.json. */
export const SVELTE_PEER_RANGE = '^5.41.2';

export type FindingReason =
  | 'default-back-control'
  | 'indeterminate-spread'
  | 'legacy-back-selector'
  /** InputButton's `mandatory` now also sets native required/aria-required. */
  | 'inputbutton-mandatory'
  /** A stylesheet reaches into PieChart/SankeyChart's renamed tooltip class. */
  | 'chart-tooltip-slot-selector'
  /** A `sui-*` element used where the browser's old implicit inline mattered. */
  | 'host-display-inline'
  /** A chart's new 160px floor will overflow a narrower flex/grid cell. */
  | 'chart-min-width'
  /** `sui-chat-composer`'s `recording` lost `reflect: true`; the attribute no longer tracks it. */
  | 'chat-composer-recording-reflect';

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

/**
 * One `src/wc/components/*.wc.svelte` wrapper, as the 4.0.0 generator actually
 * built it: which Svelte component it wraps, the custom-element tag it
 * registered, and the `:host` display default it gave that tag.
 */
export type WcComponent = {
  readonly component: string;
  readonly tag: string;
  readonly display: 'block' | 'inline-block';
};

/**
 * Reads the {component, tag, display} of every `sui-*` wrapper straight from
 * `src/wc/components`, rather than hardcoding the 98 -- a hardcoded list drifts
 * the moment a component is added, renamed, or its display default changes,
 * and would then silently under- or over-report `host-display-inline`,
 * `chart-min-width`, and the `<sui-input-button>` spelling below it.
 *
 * `repoRoot` is this library's OWN repo root, not the consumer root the CLI is
 * pointed at -- the wrapper sources this reads exist only here. A root that
 * does not resolve to a checkout with these sources (a published tree with no
 * `src/`, say) yields `[]` rather than a guess: the detectors that depend on
 * this list then simply find nothing, which is what "the source of truth
 * that used to answer this question is not present" ought to mean here.
 */
export function readWcComponents(repoRoot: string): readonly WcComponent[] {
  const dir = join(repoRoot, 'src/wc/components');
  let entries: readonly string[];
  try {
    entries = readdirSync(dir).filter((name) => name.endsWith('.wc.svelte'));
  } catch {
    return [];
  }

  const components: WcComponent[] = [];
  for (const file of entries) {
    const component = file.slice(0, -'.wc.svelte'.length);
    const source = readFileSync(join(dir, file), 'utf8');

    // The wrapped component's own name, read off the import that brings it in
    // -- `Card.wc.svelte` always imports `Card` from `$lib/Card/Card.svelte` --
    // rather than assumed equal to the filename, so a wrapper that diverges
    // from that convention is skipped instead of silently mismatched.
    const importPattern = new RegExp(
      `import\\s+\\w+\\s+from\\s+'\\$lib/${component}/${component}\\.svelte'`
    );
    const tagMatch = /tag:\s*'([^']+)'/.exec(source);
    const displayMatch = /display:\s*var\(--sui-[\w-]+-display,\s*(block|inline-block)\)/.exec(
      source
    );
    if (!importPattern.test(source) || tagMatch === null || displayMatch === null) {
      continue;
    }
    components.push({
      component,
      tag: tagMatch[1],
      display: displayMatch[1] === 'inline-block' ? 'inline-block' : 'block'
    });
  }
  return components;
}

export type AnalyzeContext = {
  readonly wcComponents: readonly WcComponent[];
};

/**
 * Default context for callers that only care about the Toolbar/InputButton
 * checks reachable through a named import: those never need the wrapper list,
 * and every existing caller of `analyzeSvelte` predates its existence.
 */
const EMPTY_CONTEXT: AnalyzeContext = { wcComponents: [] };

const EMPTY_NAMES: ReadonlySet<string> = new Set();

/** Local names this file binds to each of the library's named imports. */
function importedNames(source: string): ReadonlyMap<string, ReadonlySet<string>> {
  const byExport = new Map<string, Set<string>>();
  const importPattern = new RegExp(
    `import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${LIBRARY.replace('/', '\\/')}['"]`,
    'g'
  );
  for (const match of source.matchAll(importPattern)) {
    for (const clause of match[1].split(',')) {
      const trimmed = clause.trim();
      if (trimmed.length === 0) {
        continue;
      }
      const [imported, local] = trimmed.split(/\s+as\s+/).map((part) => part.trim());
      const set = byExport.get(imported) ?? new Set<string>();
      set.add(local ?? imported);
      byExport.set(imported, set);
    }
  }
  return byExport;
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

/** An enclosing `RegularElement`, tracked so a node can ask "what tag is my nearest element ancestor". */
type ElementAncestor = {
  readonly name: string;
  readonly node: UnknownRecord;
};

/** True for a `Text` node whose content is only formatting whitespace -- it collapses in rendered HTML, so it does not itself break an inline run. */
function isWhitespaceOnlyText(raw: unknown): boolean {
  const record = asRecord(raw);
  return (
    record.type === 'Text' && typeof record.data === 'string' && record.data.trim().length === 0
  );
}

/**
 * Standard HTML tags whose UA-stylesheet default is inline or inline-block --
 * the shapes that genuinely sit *beside* a neighbour rather than stacking
 * with it. Deliberately narrower than `TEXT_FLOW_ELEMENTS`: that set answers
 * "is this tag's own content model text-flow" (so it includes block-level
 * `p`/`li`/`td`/`h1`-`h6`), while this one answers "does this tag occupy a
 * line the way an inline box does" -- a `<div>` sibling never counts, however
 * text-flow-ish its own contents are.
 */
const INLINE_HTML_ELEMENTS: ReadonlySet<string> = new Set([
  'a',
  'abbr',
  'b',
  'bdi',
  'bdo',
  'br',
  'button',
  'cite',
  'code',
  'data',
  'dfn',
  'em',
  'i',
  'img',
  'input',
  'kbd',
  'label',
  'mark',
  'output',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'select',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'textarea',
  'time',
  'u',
  'var',
  'wbr'
]);

/** True for a raw sibling node that itself sits inline: another `sui-*` element, non-whitespace text, or a known inline HTML tag. */
function isInlineLevelSibling(raw: unknown): boolean {
  const record = asRecord(raw);
  if (record.type === 'Text') {
    return typeof record.data === 'string' && record.data.trim().length > 0;
  }
  if (record.type === 'RegularElement' && typeof record.name === 'string') {
    return record.name.startsWith('sui-') || INLINE_HTML_ELEMENTS.has(record.name);
  }
  // Everything else (an ExpressionTag, a Comment, an IfBlock/EachBlock, a
  // Component) is neither skippable whitespace nor a known inline shape, so
  // scanning stops here without a verdict -- a false negative rather than a
  // guess at what that construct renders.
  return false;
}

/**
 * Walks outward from `siblings[index]` in one direction, skipping only
 * whitespace-only text (it collapses, so it does not separate two elements
 * that are otherwise adjacent), and reports whether the first real neighbour
 * found is itself inline-level.
 */
function nearestNeighbourIsInline(
  siblings: readonly unknown[],
  index: number,
  step: 1 | -1
): boolean {
  for (let i = index + step; i >= 0 && i < siblings.length; i += step) {
    if (!isWhitespaceOnlyText(siblings[i])) {
      return isInlineLevelSibling(siblings[i]);
    }
  }
  return false;
}

/** Whether the sibling at `index` has an inline-level neighbour on either side, formatting whitespace aside. */
function hasAdjacentInlineContent(siblings: readonly unknown[], index: number): boolean {
  return (
    nearestNeighbourIsInline(siblings, index, -1) || nearestNeighbourIsInline(siblings, index, 1)
  );
}

/**
 * Same traversal as `walk`, threading the nearest enclosing `RegularElement`,
 * and (for a node positioned directly in some Fragment's own child list)
 * whether it has an inline-level sibling there. `host-display-inline` and
 * `chart-min-width` both turn on "what does the immediate parent/neighbours
 * look like", which a parent-blind walk cannot answer -- kept separate from
 * `walk` itself rather than adding parameters there, so the existing Toolbar
 * traversal is untouched.
 *
 * Non-element wrapper nodes (`IfBlock`, `EachBlock`, a `Component`) pass the
 * ancestor through unchanged: an `{#if}` or another component between a chart
 * and its styled `<div>` doesn't change which DOM element the chart actually
 * lands inside.
 *
 * `Fragment` nodes (every element's `.fragment`, and the file's own root one)
 * are intercepted rather than walked generically: only there is the ordered,
 * same-processing-pass sibling list available to compute adjacency against.
 * Once inside an `{#if}`/`{#each}`'s own nested fragment, siblings are that
 * construct's, not the surrounding DOM's -- a sui-* element that only sits
 * beside inline content through a conditional branch is a false negative,
 * not a guess.
 */
function walkWithParent(
  node: unknown,
  parent: ElementAncestor | null,
  visit: (node: UnknownRecord, parent: ElementAncestor | null, hasInlineSibling: boolean) => void,
  hasInlineSibling = false
): void {
  if (Array.isArray(node)) {
    for (const child of node) {
      walkWithParent(child, parent, visit, hasInlineSibling);
    }
    return;
  }
  const record = asRecord(node);
  if (typeof record.type !== 'string') {
    return;
  }
  visit(record, parent, hasInlineSibling);
  const nextParent: ElementAncestor | null =
    record.type === 'RegularElement' && typeof record.name === 'string'
      ? { name: record.name, node: record }
      : parent;

  if (record.type === 'Fragment' && Array.isArray(record.nodes)) {
    // Bound to a local rather than read back off `record.nodes` inside the
    // callback below: narrowing a property access does not survive into a
    // nested closure, and re-reading it there would need an assertion to
    // recover the array type -- banned repo-wide. A local const keeps the
    // narrowing without one.
    const siblings = record.nodes;
    siblings.forEach((child, index) => {
      walkWithParent(child, nextParent, visit, hasAdjacentInlineContent(siblings, index));
    });
    return;
  }

  for (const value of Object.values(record)) {
    if (typeof value === 'object' && value !== null) {
      walkWithParent(value, nextParent, visit, false);
    }
  }
}

const CHART_TOOLTIP_SLOT_DETAIL =
  "selector targets '.chart-tooltip-slot'; PieChart/SankeyChart's custom-tooltip " +
  "wrapper is now '.chart-tooltip.unstyled' (plus '.portal' when tooltipPortal is set)";

/**
 * `.chart-tooltip-slot` findings inside one block of CSS text (a `.css` file's
 * whole contents, or one `<style>` block's contents). `cssOffset` bridges CSS
 * offsets back to `source` offsets for a `<style>` block, where the two differ
 * by the length of everything before the block; it is `0` for a standalone
 * `.css` file, where they are the same text.
 */
function chartTooltipSlotFindings(
  css: string,
  file: string,
  source: string,
  cssOffset: number
): Finding[] {
  const findings: Finding[] = [];
  for (const match of css.matchAll(/\.chart-tooltip-slot\b/g)) {
    findings.push({
      file,
      line: lineOf(source, cssOffset + match.index),
      reason: 'chart-tooltip-slot-selector',
      detail: CHART_TOOLTIP_SLOT_DETAIL
    });
  }
  return findings;
}

const CHAT_COMPOSER_RECORDING_CSS_DETAIL =
  "selector targets 'sui-chat-composer[recording]'; recording lost reflect: true (it is now " +
  "{ type: 'String' }), so the attribute is never set by the property and this selector will " +
  'never match — setting el.recording still works, and a presence attribute you set yourself ' +
  'still means true, so read el.recording rather than chasing this as a real regression';

/**
 * `sui-chat-composer[recording]` findings inside one block of CSS text, same
 * split as `chartTooltipSlotFindings` above and for the same reason: a `.css`
 * file's whole contents, or one `<style>` block's contents, with `cssOffset`
 * bridging back to `source` offsets. The tag is a literal here rather than
 * read off `readWcComponents`: unlike the 98-wrapper detectors, this reason
 * targets exactly one named component with a tag that cannot rename itself
 * out from under a hardcoded string any more than `.chart-tooltip-slot` above
 * can, so there is no drift risk to design around.
 */
function chatComposerRecordingSelectorFindings(
  css: string,
  file: string,
  source: string,
  cssOffset: number
): Finding[] {
  const findings: Finding[] = [];
  for (const match of css.matchAll(/sui-chat-composer\[\s*recording\b[^\]]*\]/g)) {
    findings.push({
      file,
      line: lineOf(source, cssOffset + match.index),
      reason: 'chat-composer-recording-reflect',
      detail: CHAT_COMPOSER_RECORDING_CSS_DETAIL
    });
  }
  return findings;
}

const CHAT_COMPOSER_RECORDING_JS_DETAIL =
  "reads 'recording' back with getAttribute/hasAttribute on what looks like a chat-composer — it " +
  'lost reflect: true, so this now returns null/false even while recording is set; read the ' +
  'el.recording PROPERTY instead. Setting the property still works, and a presence attribute you ' +
  'set yourself still means true';

/**
 * `getAttribute('recording')` / `hasAttribute('recording')`, gated on the
 * file also spelling out the literal tag somewhere (markup, or a
 * `querySelector('sui-chat-composer')` string) -- the same same-file textual
 * co-occurrence bound `legacy-back-selector` already relies on rather than
 * tracing which element a variable actually holds, which this format cannot
 * do without a real type checker. A file that reaches a chat-composer through
 * a differently-named variable with no literal tag anywhere in the same file
 * is a false negative this cannot see; a file that mentions the tag once and
 * reads an unrelated element's `recording` attribute elsewhere is the false
 * positive this bound accepts in exchange.
 */
function chatComposerRecordingAttributeFindings(source: string, file: string): Finding[] {
  if (!source.includes('sui-chat-composer')) {
    return [];
  }
  const findings: Finding[] = [];
  for (const match of source.matchAll(
    /\.(?:getAttribute|hasAttribute)\(\s*(['"])recording\1\s*\)/g
  )) {
    findings.push({
      file,
      line: lineOf(source, match.index),
      reason: 'chat-composer-recording-reflect',
      detail: CHAT_COMPOSER_RECORDING_JS_DETAIL
    });
  }
  return findings;
}

type StyleBlock = {
  readonly content: string;
  readonly contentStart: number;
};

function styleBlocks(source: string): readonly StyleBlock[] {
  const blocks: StyleBlock[] = [];
  for (const match of source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    // match.index points at the opening <style> tag, while the content starts
    // further in by the tag's own (variable) length -- bridged here or a
    // multiline block reports the tag's line instead of the content's.
    const contentStart = match.index + match[0].indexOf(match[1]);
    blocks.push({ content: match[1], contentStart });
  }
  return blocks;
}

/**
 * Checks a `<InputButton>` / `<sui-input-button>` node for the 4.0.0 defect:
 * `mandatory` used to draw only a decorative asterisk, and now also sets
 * native `required`/`aria-required` (`typeof required === 'boolean' ?
 * required : mandatory === true` -- `required` wins whenever it is passed at
 * all, matching its declared `boolean` prop type). A form that relied on
 * submitting this field empty now fails client-side validation.
 */
function inputButtonFinding(
  node: UnknownRecord,
  displayName: string,
  file: string,
  source: string
): Finding | null {
  const attributes = Array.isArray(node.attributes) ? node.attributes : [];
  let hasRequired = false;
  let mandatoryTruthy = false;

  for (const raw of attributes) {
    const attribute = asRecord(raw);
    if (attribute.type === 'SpreadAttribute') {
      const line = lineOf(source, typeof node.start === 'number' ? node.start : 0);
      return {
        file,
        line,
        reason: 'indeterminate-spread',
        detail: `<${displayName}> spreads props, so mandatory/required cannot be read statically — confirm by hand`
      };
    }
    if (attribute.name === 'required') {
      hasRequired = true;
    }
    if (attribute.name === 'mandatory') {
      // A literal `mandatory={false}` behaves identically before and after
      // 4.0.0 (no asterisk then, no `required` now), so it is not a defect.
      mandatoryTruthy = !isFalseLiteral(attribute.value);
    }
  }

  if (hasRequired || !mandatoryTruthy) {
    return null;
  }
  const line = lineOf(source, typeof node.start === 'number' ? node.start : 0);
  return {
    file,
    line,
    reason: 'inputbutton-mandatory',
    detail: `<${displayName}> passes mandatory without required — mandatory now also sets native required/aria-required on the underlying Input, so a form that used to submit this field empty will fail client-side validation`
  };
}

const TEXT_FLOW_ELEMENTS: ReadonlySet<string> = new Set([
  'p',
  'span',
  'li',
  'td',
  'label',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
  'button'
]);

/** Which shape triggered `host-display-inline`, so the detail can name the actual reason instead of a generic one. */
type HostDisplayTrigger = 'text-flow-parent' | 'inline-sibling';

function hostDisplayInlineFinding(
  node: UnknownRecord,
  wc: WcComponent,
  parent: ElementAncestor,
  file: string,
  source: string,
  trigger: HostDisplayTrigger
): Finding {
  const line = lineOf(source, typeof node.start === 'number' ? node.start : 0);
  // The text-flow-parent wording is unchanged from before this reason grew a
  // second trigger, so an existing report naming this shape reads exactly as
  // it always has.
  const detail =
    trigger === 'text-flow-parent'
      ? `<${wc.tag}> is a direct child of <${parent.name}>, a text-flow element — the wrapper ` +
        `now declares display: ${wc.display} (previously the browser's implicit inline for an ` +
        `unknown element), which can change this line's layout; override with --${wc.tag}-display ` +
        'if inline is still wanted'
      : `<${wc.tag}> sits beside other inline-level content inside <${parent.name}> — the wrapper ` +
        `now declares display: ${wc.display} (previously the browser's implicit inline for an ` +
        'unknown element), which can pull it onto its own line instead of alongside its neighbour; ' +
        `override with --${wc.tag}-display if inline is still wanted`;
  return { file, line, reason: 'host-display-inline', detail };
}

/**
 * A parent's inline `style` attribute text, when it is expressible as a single
 * plain string literal (`style="..."`) rather than a bound expression or a
 * `style:` directive. Those aren't readable from source alone, so this
 * returns `null` for them -- "unknown", not "absent" -- and callers must
 * treat a `null` as "cannot tell", never as "no style".
 */
function inlineStyleText(parent: UnknownRecord): string | null {
  const attributes = Array.isArray(parent.attributes) ? parent.attributes : [];
  for (const raw of attributes) {
    const attribute = asRecord(raw);
    if (attribute.type !== 'Attribute' || attribute.name !== 'style') {
      continue;
    }
    const value = attribute.value;
    if (!Array.isArray(value) || value.length !== 1) {
      continue;
    }
    const text = asRecord(value[0]);
    if (text.type !== 'Text' || typeof text.data !== 'string') {
      continue;
    }
    return text.data;
  }
  return null;
}

/**
 * A parent's inline `width`/`flex-basis`, when it is a plain literal string
 * (`style="width: 120px"`) below the chart's new 160px floor. Anything else --
 * a bound style, a `style:width` directive, a percentage or `rem` value, a
 * class-based width -- is not readable from this file alone and is not
 * reported, rather than guessed.
 */
function inlineNarrowWidth(
  parent: UnknownRecord
): { readonly property: string; readonly px: number } | null {
  const style = inlineStyleText(parent);
  if (style === null) {
    return null;
  }
  const match = /(width|flex-basis)\s*:\s*(\d+(?:\.\d+)?)px/.exec(style);
  if (match === null) {
    return null;
  }
  const px = Number(match[2]);
  return px < 160 ? { property: match[1], px } : null;
}

/**
 * True when the parent's inline style makes it a flex or grid container. A
 * flex/grid item's OWN `display` is overridden by the layout mode regardless
 * of what it declares (the used value becomes `block` either way per the
 * flex/grid box spec), so a `sui-*` child's new block default changes
 * nothing about whether it shares a line with its siblings there -- the
 * container decides that, not the child. Anything not readable as a plain
 * literal (a class, a bound style, a `style:display` directive) is
 * "unknown", not "false", and this fails open the same way `inlineNarrowWidth`
 * does for a width it cannot read: it returns false, so the sibling check
 * below still runs rather than silently skipping a real positive.
 */
function parentIsFlexOrGridContainer(parent: UnknownRecord): boolean {
  const style = inlineStyleText(parent);
  return style !== null && /display\s*:\s*(inline-)?(flex|grid)\b/.test(style);
}

function chartMinWidthFinding(
  node: UnknownRecord,
  componentName: string,
  parent: ElementAncestor | null,
  file: string,
  source: string
): Finding | null {
  if (parent === null) {
    return null;
  }
  const narrow = inlineNarrowWidth(parent.node);
  if (narrow === null) {
    return null;
  }
  const line = lineOf(source, typeof node.start === 'number' ? node.start : 0);
  return {
    file,
    line,
    reason: 'chart-min-width',
    detail:
      `<${componentName}> renders inside a <${parent.name}> with an inline ${narrow.property} ` +
      `of ${narrow.px}px — the chart's new 160px min-width (--chart-min-width) will overflow it ` +
      'instead of shrinking to fit'
  };
}

/**
 * Finds everything in one `.svelte` file that a 3.x-or-later change affects,
 * across every reason this module knows about.
 *
 * `context.wcComponents` (from `readWcComponents`, over THIS library's own
 * `src/wc/components`) is what lets `host-display-inline`, `chart-min-width`'s
 * `<sui-*-chart>` form, and the `<sui-input-button>` spelling of
 * `inputbutton-mandatory` recognise a raw custom-element tag; without it
 * (the default) only the named-import forms — `<Toolbar>`, `<InputButton>`,
 * `<PieChart>` and friends — are reachable, since only a resolved import name
 * is available for free.
 */
export function analyzeSvelte(
  source: string,
  file: string,
  context: AnalyzeContext = EMPTY_CONTEXT
): readonly Finding[] {
  const findings: Finding[] = [];

  // Textual and independent of every other check: a stylesheet can select
  // `.chart-tooltip-slot` without this file rendering PieChart/SankeyChart
  // itself (a shared global stylesheet, say), so this must not be gated behind
  // a chart import the way legacy-back-selector below is gated behind Toolbar.
  const blocks = styleBlocks(source);
  for (const block of blocks) {
    findings.push(...chartTooltipSlotFindings(block.content, file, source, block.contentStart));
    findings.push(
      ...chatComposerRecordingSelectorFindings(block.content, file, source, block.contentStart)
    );
  }
  // Same independence, for the JS half of the same defect: a script can read
  // `getAttribute('recording')` off a chat-composer without this file ever
  // importing ChatComposer as a named export (a raw custom element, or an
  // element obtained via `document.querySelector`), so this is not gated
  // behind `context.wcComponents` the way the AST-based checks below are.
  findings.push(...chatComposerRecordingAttributeFindings(source, file));

  const byExport = importedNames(source);
  const toolbarNames = byExport.get('Toolbar') ?? EMPTY_NAMES;
  const inputButtonNames = byExport.get('InputButton') ?? EMPTY_NAMES;

  const chartComponents = context.wcComponents.filter((wc) => wc.component.endsWith('Chart'));
  const chartLocalNames = new Map<string, string>();
  for (const chart of chartComponents) {
    for (const local of byExport.get(chart.component) ?? EMPTY_NAMES) {
      chartLocalNames.set(local, chart.component);
    }
  }
  const chartTagToComponent = new Map(chartComponents.map((wc) => [wc.tag, wc.component] as const));
  const hostTagMap = new Map(context.wcComponents.map((wc) => [wc.tag, wc] as const));
  const inputButtonTag =
    context.wcComponents.find((wc) => wc.component === 'InputButton')?.tag ?? null;

  const mightUseCustomElement = hostTagMap.size > 0 && source.includes('sui-');
  const needsAst =
    toolbarNames.size > 0 ||
    inputButtonNames.size > 0 ||
    chartLocalNames.size > 0 ||
    mightUseCustomElement;
  if (!needsAst) {
    return findings;
  }

  let ast: unknown;
  try {
    ast = parse(source, { modern: true });
  } catch {
    findings.push({
      file,
      line: 1,
      reason: 'indeterminate-spread',
      detail: 'file could not be parsed; review this usage by hand'
    });
    return findings;
  }

  // Toolbar: unchanged traversal, kept on the original parent-blind `walk` --
  // this check never needed to know its parent, and reusing the newer,
  // ancestor-tracking walker here would be a change with nothing to show for it.
  if (toolbarNames.size > 0) {
    walk(ast, (node) => {
      if (
        node.type !== 'Component' ||
        typeof node.name !== 'string' ||
        !toolbarNames.has(node.name)
      ) {
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
    for (const block of blocks) {
      const legacy = /\.back[^{}]*\bimg\b/.exec(block.content);
      if (legacy !== null) {
        findings.push({
          file,
          line: lineOf(source, block.contentStart + legacy.index),
          reason: 'legacy-back-selector',
          detail:
            'selector targets an <img> inside the back control; the default control now renders an inline <svg>'
        });
      }
    }
  }

  walkWithParent(ast, null, (node, parent, hasInlineSibling) => {
    if (node.type === 'Component' && typeof node.name === 'string') {
      if (inputButtonNames.has(node.name)) {
        const finding = inputButtonFinding(node, node.name, file, source);
        if (finding !== null) {
          findings.push(finding);
        }
      }
      const chartComponent = chartLocalNames.get(node.name);
      if (typeof chartComponent !== 'undefined') {
        const finding = chartMinWidthFinding(node, node.name, parent, file, source);
        if (finding !== null) {
          findings.push(finding);
        }
      }
      return;
    }
    if (node.type === 'RegularElement' && typeof node.name === 'string') {
      if (node.name === inputButtonTag) {
        const finding = inputButtonFinding(node, node.name, file, source);
        if (finding !== null) {
          findings.push(finding);
        }
      }
      const chartTagComponent = chartTagToComponent.get(node.name);
      if (typeof chartTagComponent !== 'undefined') {
        const finding = chartMinWidthFinding(node, node.name, parent, file, source);
        if (finding !== null) {
          findings.push(finding);
        }
      }
      const hostDefault = hostTagMap.get(node.name);
      if (typeof hostDefault !== 'undefined' && parent !== null) {
        // Two independent triggers, checked in this order so the more
        // specific (and pre-existing) text-flow-parent wording wins when a
        // usage happens to satisfy both, e.g. `<p>Status: <sui-badge/></p>`.
        // The flex/grid guard applies only to the newer sibling trigger --
        // widening it to also suppress the text-flow-parent path would be a
        // behaviour change to a rule this pass was told to leave alone.
        if (TEXT_FLOW_ELEMENTS.has(parent.name)) {
          findings.push(
            hostDisplayInlineFinding(node, hostDefault, parent, file, source, 'text-flow-parent')
          );
        } else if (hasInlineSibling && !parentIsFlexOrGridContainer(parent.node)) {
          findings.push(
            hostDisplayInlineFinding(node, hostDefault, parent, file, source, 'inline-sibling')
          );
        }
      }
    }
  });

  return findings;
}

/**
 * `chart-tooltip-slot-selector` and `chat-composer-recording-reflect`'s CSS
 * shape in a standalone `.css` file. Split out from `analyzeSvelte` because a
 * `.css` file has no `<style>` tags to locate first — its whole content
 * already is the CSS. Does not also run `chatComposerRecordingAttributeFindings`:
 * that one is JS-shaped, and a `.css` file has none.
 */
export function analyzeStylesheet(source: string, file: string): readonly Finding[] {
  return [
    ...chartTooltipSlotFindings(source, file, source, 0),
    ...chatComposerRecordingSelectorFindings(source, file, source, 0)
  ];
}
