#!/usr/bin/env node
/**
 * WCAG 2.4.7 (Focus Visible): an element that suppresses its focus indicator
 * with nothing standing in for it leaves a keyboard user with no sign focus
 * ever moved. Tabs.svelte shipped exactly this — full roving-focus logic in
 * script (`focusedKey`, `focusedIndex`, a shared `getActiveElement`), and then
 * `outline: none` on the item with no `:focus-visible` replacement anywhere in
 * the file. The tests all asserted `document.activeElement` and passed,
 * correctly — focus really did move. Nobody asserted anything a sighted
 * keyboard user could see. A sweep of the rest of `src/lib` for the same
 * defect class found eleven more: ChatBubble, Input, CommandMenu, Gallery,
 * ChatComposer, ListItem, DateRangePicker (twice), Book, Menu/SplitButton, and
 * Modal — each a real, reachable focus target with an unconditional or
 * default-`none` outline and no compensating rule anywhere in the file.
 *
 * "Outline suppressed" is not itself the defect — `outline: none` is routine
 * and correct wherever a DIFFERENT declaration already stands in for it. This
 * file exists to tell those apart, not to ban the property. Three shapes cover
 * every legitimate case this sweep found:
 *
 *  1. Self-compensation: the SAME rule that suppresses outline (so its own
 *     selector already carries a focus pseudo-class) also sets another real,
 *     visible property in the same declaration block. Menu's
 *     `.menu-item:focus { background-color: ...; outline: ...none; }` and
 *     Checkbox's `.box:focus-visible { outline: none; box-shadow: ...; }` are
 *     this shape.
 *
 *  2. Cross-rule, same token: the suppressing rule's selector is bare (no
 *     focus pseudo, e.g. `.book { outline: none; }`), and a DIFFERENT rule in
 *     the same file — sharing a class or tag token with the suppressing
 *     selector — carries a focus pseudo-class and a real compensating
 *     declaration. Sheet's `.sheet-panel` / `.sheet-panel:focus-visible` pair,
 *     and every one of this sweep's own fixes (`.book` / `.book:focus-visible`,
 *     `.panel` / `.panel:focus-visible`, ...), are this shape.
 *
 *  3. Ancestor `:focus-within` on a DIFFERENTLY NAMED wrapper: the actually-
 *     focused element's outline is suppressed, and the visible replacement
 *     lives on a surrounding container whose class shares no token with it —
 *     Select's `.select-search` (inside `.select-trigger`, pre-existing) and
 *     this sweep's own `.input` inside `.chat-composer`, `.drp-date-input-value`
 *     inside `.drp-date-input`, and `.drp-time-field` inside `.drp-time-input`.
 *     A static, DOM-blind reader cannot correlate an ancestor by lineage, only
 *     by shared vocabulary — so shape 3 is not detected, it is allowed by a
 *     short, explicit, justified list below (the same pattern
 *     `check-css-contract.js` uses for INTENTIONALLY_LIGHT_ONLY). A new
 *     instance of this shape needs a human to add an entry, or this gate
 *     reports a false positive — see UNCHECKED at the bottom.
 *
 * Anything that suppresses outline and matches none of the three is reported.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const LIB = join(ROOT, 'src/lib');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

const isStyled = (f) => /\.(svelte|css)$/.test(f) && !/\.test\./.test(f);

/**
 * A small, explicit, justified exemption list for shape 3 above (ancestor
 * `:focus-within` on a class name that shares no token with the suppressed
 * element — see the file header). Keyed by `relative/path:line`, where `line`
 * is the line of the suppressing `outline` declaration itself, exactly as this
 * gate reports a violation — so an entry here reads the same way a violation
 * would, and moving the declaration invalidates the entry rather than silently
 * carrying it to the wrong line.
 *
 * Each entry names `ancestorToken` — the ancestor's own class — rather than
 * just asserting "this is fine": the gate still looks that token up in the
 * SAME compensator index shape 2 uses, and only allows the suppression when a
 * rule carrying that token actually has a focus pseudo-class and a real
 * compensating declaration RIGHT NOW. A first draft of this list stored only
 * a justification string and trusted it unconditionally — a negative control
 * that broke `.chat-composer:focus-within` (renamed the class, nothing else)
 * passed cleanly, because nothing ever re-checked the promise. That is a
 * false-negative machine: it would stay green through the exact regression it
 * exists to catch. Requiring the token to still resolve turns the allowlist
 * from "a human once verified this" into "a human pointed at the rule, and
 * the gate keeps checking it is still there" — the same division of labour as
 * shape 2, just with the ancestor named by hand instead of found by shared
 * vocabulary.
 */
const ANCESTOR_FOCUS_WITHIN_ALLOWLIST = new Map([
  [
    'src/lib/Select/Select.svelte:1265',
    {
      ancestorToken: '.select-trigger',
      note: '.select-search has no focus rule of its own; compensated by the ancestor .select-trigger:focus-within (same file, ~line 1161). Pre-existing; line numbers shifted +15 when the motion-token migration tokenized .select-trigger.'
    }
  ],
  [
    'src/lib/ChatComposer/ChatComposer.svelte:396',
    {
      ancestorToken: '.chat-composer',
      note: '.input has no focus rule of its own; compensated by the ancestor .chat-composer:focus-within (same file, ~line 363).'
    }
  ],
  [
    'src/lib/DateRangePicker/DateRangePicker.svelte:1670',
    {
      ancestorToken: '.drp-date-input',
      note: '.drp-date-input-value has no focus rule of its own; compensated by the ancestor .drp-date-input:focus-within (same file, ~line 1659).'
    }
  ],
  [
    'src/lib/DateRangePicker/DateRangePicker.svelte:1772',
    {
      ancestorToken: '.drp-time-input',
      note: '.drp-time-field has no focus rule of its own; compensated by the ancestor .drp-time-input:focus-within (same file, ~line 1746).'
    }
  ]
]);

// Bare tag-name selectors this sweep actually met (Input's `textarea, input`).
// A real tag-selector parser is not worth it for four known names; see UNCHECKED.
const TAG_TOKENS = ['input', 'textarea', 'select', 'button', 'a'];

function selectorTokens(selector) {
  const tokens = new Set();
  for (const m of selector.matchAll(/\.[a-zA-Z_][\w-]*/g)) {
    tokens.add(m[0]);
  }
  for (const tag of TAG_TOKENS) {
    if (new RegExp(`(^|[\\s>+~,(])${tag}(?=[\\s.:#\\[,)]|$)`).test(selector)) {
      tokens.add(tag);
    }
  }
  return tokens;
}

const FOCUS_PSEUDO = /:focus(-visible|-within)?\b/;

const COMPENSATING_PROPS = new Set([
  'outline',
  'box-shadow',
  'border',
  'border-color',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'background',
  'background-color'
]);

function isSuppressingOutlineValue(value) {
  const v = value.replace(/\s*!important\s*$/i, '').trim();
  if (/^(none|0|0px)$/i.test(v)) {
    return true;
  }
  return /^var\(\s*--[\w-]+\s*,\s*(none|0|0px)\s*\)$/i.test(v);
}

function isRealCompensatingValue(value) {
  const v = value.replace(/\s*!important\s*$/i, '').trim();
  if (/^(none|0|0px|initial|inherit|unset|transparent)$/i.test(v)) {
    return false;
  }
  // var(--x, <same non-values>) is exactly as absent as the literal would be.
  if (/^var\(\s*--[\w-]+\s*,\s*(none|0|0px|transparent)\s*\)$/i.test(v)) {
    return false;
  }
  return true;
}

/** Declarations inside a rule body, as {prop, value}. No nested braces reach
 * here (at-rules are peeled off in parseRules below), so a plain split on `;`
 * is enough — except a `;` inside a quoted string or data: URI, which this
 * does not special-case; see UNCHECKED. */
function parseDeclarations(body) {
  const decls = [];
  for (const raw of body.split(';')) {
    const idx = raw.indexOf(':');
    if (idx === -1) {
      continue;
    }
    const prop = raw.slice(0, idx).trim().toLowerCase();
    const value = raw.slice(idx + 1).trim();
    if (prop.length === 0 || value.length === 0) {
      continue;
    }
    decls.push({ prop, value });
  }
  return decls;
}

/**
 * Flattens a stylesheet into {selector, body, bodyStart} rules, recursing
 * through `@media`/`@supports`/`@container` (their prelude carries no
 * specificity of its own, so a rule inside one is checked exactly like a
 * top-level one) and skipping `@keyframes` bodies entirely — `0%`/`from`/`to`
 * are not selectors, and treating them as such would read "to" as a bare-word
 * token. `bodyStart` is an absolute offset into the ORIGINAL file text, so a
 * line number recovered from it is correct even from inside nested `@media`.
 */
function parseRules(css, baseOffset, out) {
  let i = 0;
  const n = css.length;
  while (i < n) {
    const braceIdx = css.indexOf('{', i);
    if (braceIdx === -1) {
      break;
    }
    const prelude = css.slice(i, braceIdx).trim();
    let depth = 1;
    let j = braceIdx + 1;
    while (j < n && depth > 0) {
      if (css[j] === '{') {
        depth += 1;
      } else if (css[j] === '}') {
        depth -= 1;
      }
      j += 1;
    }
    const bodyStart = braceIdx + 1;
    const bodyEnd = j - 1;
    const body = css.slice(bodyStart, Math.max(bodyStart, bodyEnd));

    if (/^@(-webkit-)?keyframes\b/i.test(prelude)) {
      // Skip: its "selectors" are percentages/from/to, not CSS selectors.
    } else if (/^@(media|supports|container)\b/i.test(prelude)) {
      parseRules(body, baseOffset + bodyStart, out);
    } else if (prelude.startsWith('@')) {
      // @font-face, @page, etc. — declarations, not element selectors; not
      // relevant to a focus-indicator sweep.
    } else if (prelude.length > 0) {
      out.push({ selector: prelude, body, bodyStart: baseOffset + bodyStart });
    }
    i = j;
  }
}

/**
 * Blanks `/* ... *\/` comments to spaces (newlines kept as newlines) rather
 * than deleting them, so every later offset — and the line numbers recovered
 * from them — stays valid against the ORIGINAL file text. Without this, a
 * comment that documents a fix by naming the class it's ABOUT (every comment
 * this sweep wrote does exactly that, e.g. "`.input` below sets outline:
 * none...") reads as if that class token were part of the next rule's
 * selector, and the gate credits shape 2 (cross-rule, same token) for a match
 * that was really the allowlisted shape 3 — passing for the wrong reason,
 * which breaks the moment someone rephrases the comment.
 */
function stripCssComments(text) {
  let out = '';
  let i = 0;
  const n = text.length;
  while (i < n) {
    if (text[i] === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      for (let k = i; k < stop; k += 1) {
        out += text[k] === '\n' ? '\n' : ' ';
      }
      i = stop;
    } else {
      out += text[i];
      i += 1;
    }
  }
  return out;
}

/**
 * Finds each real `<style>...</style>` block. Deliberately NOT a single global
 * regex scan for `<style[^>]*>` over the whole file: ListItem's own loader
 * comment says, in English, that the animation "lives in the component's own
 * `<style>` because..." — a literal `<style>` substring sitting INSIDE the
 * first (real) block, before its closing tag. A global scan finds that text
 * as a second "opening tag", starts a second block at that offset, and the
 * whole remainder of the real block gets parsed twice — not a hypothetical,
 * it is exactly why ListItem's one `.prevent-focus:focus` rule surfaced
 * twice while this was being built. Advancing the search cursor to AFTER each
 * real closing tag means a decoy inside an already-open block is never
 * reached as a place to start a new one.
 */
function extractStyleBlocks(fullText) {
  const blocks = [];
  let cursor = 0;
  const openRe = /<style[^>]*>/;
  for (;;) {
    const rest = fullText.slice(cursor);
    const m = openRe.exec(rest);
    if (m === null) {
      break;
    }
    const openStart = cursor + m.index;
    const contentStart = openStart + m[0].length;
    const closeIdx = fullText.indexOf('</style>', contentStart);
    if (closeIdx === -1) {
      break;
    }
    blocks.push({ css: fullText.slice(contentStart, closeIdx), offset: contentStart });
    cursor = closeIdx + '</style>'.length;
  }
  return blocks;
}

function makeLineFinder(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\n') {
      starts.push(i + 1);
    }
  }
  return (pos) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= pos) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return lo + 1;
  };
}

const violations = [];
let checkedFiles = 0;
let checkedRules = 0;
let checkedSuppressions = 0;
let selfCompensated = 0;
let crossRuleCompensated = 0;
let allowlisted = 0;
const allowlistSeen = new Set();

for (const file of walk(LIB)) {
  if (!isStyled(file)) {
    continue;
  }
  const rel = relative(ROOT, file);
  const fullText = readFileSync(file, 'utf8');
  const isSvelte = /\.svelte$/.test(file);
  const blocks = isSvelte ? extractStyleBlocks(fullText) : [{ css: fullText, offset: 0 }];
  if (blocks.length === 0) {
    continue;
  }
  checkedFiles += 1;
  const lineOf = makeLineFinder(fullText);

  const rules = [];
  for (const block of blocks) {
    parseRules(stripCssComments(block.css), block.offset, rules);
  }
  checkedRules += rules.length;

  // Pre-index: for a given token, every rule whose selector carries that
  // token AND a focus pseudo-class AND has at least one real compensating
  // declaration in its own body (shape 2).
  const compensatorsByToken = new Map();
  for (const rule of rules) {
    if (!FOCUS_PSEUDO.test(rule.selector)) {
      continue;
    }
    const decls = parseDeclarations(rule.body);
    const hasReal = decls.some(
      (d) => COMPENSATING_PROPS.has(d.prop) && isRealCompensatingValue(d.value)
    );
    if (!hasReal) {
      continue;
    }
    for (const token of selectorTokens(rule.selector)) {
      if (!compensatorsByToken.has(token)) {
        compensatorsByToken.set(token, []);
      }
      compensatorsByToken.get(token).push(rule);
    }
  }

  for (const rule of rules) {
    const decls = parseDeclarations(rule.body);
    const outlineDecls = decls.filter((d) => d.prop === 'outline');
    for (const decl of outlineDecls) {
      if (!isSuppressingOutlineValue(decl.value)) {
        continue;
      }
      checkedSuppressions += 1;
      const declIdxInBody = rule.body.indexOf(decl.value, rule.body.indexOf(decl.prop));
      const absPos = rule.bodyStart + Math.max(0, declIdxInBody);
      const line = lineOf(absPos);
      const key = `${rel}:${line}`;

      // Shape 1: self-compensation.
      if (FOCUS_PSEUDO.test(rule.selector)) {
        const selfReal = decls.some(
          (d) => d !== decl && COMPENSATING_PROPS.has(d.prop) && isRealCompensatingValue(d.value)
        );
        if (selfReal) {
          selfCompensated += 1;
          continue;
        }
      }

      // Shape 2: cross-rule, shared token.
      const tokens = selectorTokens(rule.selector);
      let compensated = false;
      for (const token of tokens) {
        if (!compensatorsByToken.has(token)) {
          continue;
        }
        const candidates = compensatorsByToken.get(token);
        if (candidates.some((c) => c !== rule)) {
          compensated = true;
          break;
        }
        // The only compensator sharing this token IS the suppressing rule
        // itself (already covered by shape 1) — token alone proves nothing
        // further here, keep looking at other tokens.
      }
      if (compensated) {
        crossRuleCompensated += 1;
        continue;
      }

      // Shape 3: explicit ancestor allowlist — but re-verified, not trusted.
      // See the Map's own header comment for why a bare "this is fine" string
      // was not enough.
      if (ANCESTOR_FOCUS_WITHIN_ALLOWLIST.has(key)) {
        allowlistSeen.add(key);
        const allowEntry = ANCESTOR_FOCUS_WITHIN_ALLOWLIST.get(key);
        const ancestorCandidates = compensatorsByToken.has(allowEntry.ancestorToken)
          ? compensatorsByToken.get(allowEntry.ancestorToken)
          : [];
        if (ancestorCandidates.length > 0) {
          allowlisted += 1;
          continue;
        }
        violations.push({
          file: rel,
          line,
          selector: rule.selector,
          note:
            `allowlisted on the promise that "${allowEntry.ancestorToken}" carries a focus-pseudo ` +
            `rule with a real compensating declaration elsewhere in this file, but no such rule ` +
            `exists right now — the ancestor rule the allowlist entry names was renamed, removed, ` +
            `or lost its compensating declaration. Allowlist note: ${allowEntry.note}`
        });
        continue;
      }

      violations.push({ file: rel, line, selector: rule.selector, note: null });
    }
  }
}

const unusedAllowlistEntries = Array.from(ANCESTOR_FOCUS_WITHIN_ALLOWLIST.keys()).filter(
  (k) => !allowlistSeen.has(k)
);
if (unusedAllowlistEntries.length > 0) {
  // The suppressing declaration this entry was written for is gone (fixed
  // properly, or the line moved) — a stale entry is a silent hole for the
  // NEXT unrelated violation that happens to land on the same line.
  console.error(
    `\n${unusedAllowlistEntries.length} stale allowlist entr(ies) in ${relative(ROOT, new URL(import.meta.url).pathname)}:\n`
  );
  for (const k of unusedAllowlistEntries) {
    console.error(
      `  ${k} — no matching outline suppression found there anymore. Remove the entry.`
    );
  }
  console.error('');
  process.exit(1);
}

if (violations.length > 0) {
  console.error(`\n${violations.length} focus indicator suppressed with no visible replacement:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    if (v.note === null) {
      console.error(`    ${v.selector} suppresses outline; no self, cross-rule, or allowlisted`);
      console.error(`    replacement found in this file (WCAG 2.4.7).\n`);
    } else {
      console.error(`    ${v.selector} suppresses outline (WCAG 2.4.7).`);
      console.error(`    ${v.note}\n`);
    }
  }
  process.exit(1);
}

const UNCHECKED = [
  'whether the replacement is actually PERCEIVABLE — rendered, not display:none/visibility:hidden, not zero-size, not covered — this reads source text only, no browser',
  'WCAG 1.4.11-style 3:1 contrast of the focus indicator against whatever is actually behind it (check-contrast.mjs is the runtime tool for adjacent text contrast; nothing here plays that role for a focus ring)',
  'JS-driven or inline styles, or any style injected at runtime rather than present in a <style> block or .css file',
  'whether the suppressed element is actually reachable/focusable at runtime — a role/tabindex bug that makes an element unreachable would hide it from this gate exactly as it hides it from a keyboard user',
  'the ancestor-:focus-within-on-a-differently-named-wrapper shape (shape 3): a human still has to name WHICH ancestor token compensates (a new instance needs an allowlist entry or this gate false-positives on it) — the gate re-verifies that named ancestor rule still exists and still compensates on every run, but it never discovers the correlation itself',
  'bare tag-name selectors beyond input/textarea/select/button/a (TAG_TOKENS) — a suppression scoped to some other bare element selector falls through as an unmatched token, not a caught violation',
  'a `;` inside a quoted string or data: URI inside a declaration value splits the declaration list incorrectly',
  'non-Svelte/CSS style sources — Shadow DOM CSS injected from outside src/lib, or any custom element registered elsewhere'
];

console.log(
  `0 unreplaced focus-indicator suppressions across ${checkedFiles} styled file(s) in src/lib ` +
    `(${checkedRules} rule(s), ${checkedSuppressions} outline suppression(s) examined).`
);
console.log(
  `  ${selfCompensated} self-compensated, ${crossRuleCompensated} cross-rule same-token compensated, ` +
    `${allowlisted} allowlisted (ancestor :focus-within on an unrelated class name).`
);
console.log('  NOT checked — a pass here says nothing about these:');
for (const item of UNCHECKED) {
  console.log(`    - ${item}`);
}
