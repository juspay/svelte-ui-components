#!/usr/bin/env node
/**
 * Two mistakes that are invisible in the Svelte build and break every
 * `<sui-*>` element, because both stop at a shadow boundary.
 *
 * 1. `document.activeElement` reports the shadow HOST, never the element
 *    focused inside the shadow root. Any comparison against an inner node is
 *    then permanently false -- which is how Gallery's lightbox focus trap
 *    silently stopped holding: its Tab-wrap asked
 *    `document.activeElement === first` and neither branch could ever run.
 *    `_interaction/focus.ts` exports `getActiveElement(node)` for this.
 *
 * 2. `container.contains(event.target)` in a document- or window-level
 *    listener. Once an event crosses a shadow boundary its target is
 *    retargeted to the host, an ANCESTOR of the container, so `contains()` is
 *    false for a click on the container itself. That is how four popovers came
 *    to close on the click that opened them. `_interaction/dismissal.ts`
 *    exports `eventHitsInside(container, event)`.
 *
 * Both had a correct shared helper in the tree already and were still written
 * the wrong way nine and five times over -- Sheet used the helper in one
 * function and read raw in another, in the same file. That is a rule living in
 * people's heads, which is what this file is for.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src/lib');

// The helpers themselves must read the raw APIs -- that is their whole job.
const ALLOWED = new Set(['src/lib/_interaction/focus.ts', 'src/lib/_interaction/dismissal.ts']);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(svelte|ts)$/.test(entry) && !/\.test\.(ts|svelte)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const stripComments = (line) => line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');

const violations = [];
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  if (ALLOWED.has(rel)) {
    continue;
  }
  const source = readFileSync(file, 'utf8');
  const lines = source.split('\n');
  let inBlockComment = false;

  /**
   * Identifiers holding an event target. The rule below used to require the
   * literal `.contains(event.target)` on one line, so ToolCallLog wrote
   * `const target = event.target;` and then `chipEl.contains(target)` and the
   * gate saw nothing -- one local variable of indirection hiding the same
   * defect, which left <sui-tool-call-log>'s popover unusable from the day it
   * shipped. A gate that matches one spelling of a defect only ever catches
   * authors who happened to use that spelling.
   */
  const eventAliases = new Set();
  // The assignment must BE the target and nothing more. Matching any expression
  // that merely starts with it flagged ContextMenu, where
  // `const active = event.target instanceof Node ? getActiveElement(...) : null`
  // passes the target through the shadow-AWARE helper -- a derived value, not an
  // alias -- and a second, unrelated `active` on another line then read as the
  // defect. This tracking is file-scoped, not scope-aware, so it has to be
  // narrow enough that a name collision cannot invent a violation.
  for (const m of source.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*(?:event|e|evt)\.target\s*;/g)) {
    eventAliases.add(m[1]);
  }
  for (const m of source.matchAll(
    /(?:const|let|var)\s*\{[^}]*\btarget\b(?:\s*:\s*(\w+))?[^}]*\}\s*=\s*(?:event|e)\b/g
  )) {
    eventAliases.add(typeof m[1] === 'string' ? m[1] : 'target');
  }

  /**
   * Retargeting only happens to a listener OUTSIDE the shadow root. A handler
   * bound on an element inside the component -- an inline `onclick` on a row --
   * receives the real target, so `target.closest()` there is correct and this
   * rule must not fire on it. Rule 3's own rationale says as much ("on a
   * document-level listener the target is the host"), but the check applied to
   * every event-target closest() regardless, and flagged Table's row-activation
   * guard, which is bound inline on the row. Over-broad in the opposite
   * direction to the alias case above: that one missed a real defect, this one
   * invented one.
   */
  const listensAboveTheBoundary = /(?:document|window)\.addEventListener/.test(source);
  lines.forEach((raw, i) => {
    const trimmed = raw.trim();
    if (inBlockComment) {
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      return;
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
      }
      return;
    }
    if (trimmed.startsWith('*') || trimmed.startsWith('//')) {
      return;
    }
    const line = stripComments(raw);
    if (line.includes('document.activeElement')) {
      violations.push({
        file: rel,
        line: i + 1,
        rule: 'document.activeElement',
        fix: 'getActiveElement(node) from _interaction/focus'
      });
    }
    const aliasContainment = [...eventAliases].find((name) =>
      new RegExp(`\\.contains\\(\\s*${name}\\s*\\)`).test(line)
    );
    if (/\.contains\(\s*(event|e)\.target\s*\)/.test(line)) {
      violations.push({
        file: rel,
        line: i + 1,
        rule: 'contains(event.target)',
        fix: 'eventHitsInside(container, event) from _interaction/dismissal'
      });
    } else if (typeof aliasContainment === 'string') {
      violations.push({
        file: rel,
        line: i + 1,
        rule: `contains(${aliasContainment}) where ${aliasContainment} holds an event target`,
        fix: 'eventHitsInside(container, event) from _interaction/dismissal'
      });
    }
    // `target.closest(...)` where target came from an event: on a document-level
    // listener the target is the host, so closest() walks the wrong tree. Found
    // live in SoundKit, which attaches to `document` by default.
    if (
      listensAboveTheBoundary &&
      /\b(target|node|el|element)\.closest\(/.test(line) &&
      /target/.test(line)
    ) {
      violations.push({
        file: rel,
        line: i + 1,
        rule: 'eventTarget.closest()',
        fix: 'closestInEventPath(event, selector) from _interaction/dismissal'
      });
    }
  });
}

if (violations.length > 0) {
  console.error(`\n${violations.length} shadow-unsafe read(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.rule} does not cross a shadow boundary — use ${v.fix}\n`);
  }
  process.exit(1);
}

// A guard named for a hazard CLASS gets read as covering the class. It covers two
// shapes. Naming the gap in the passing output is what stops a green run from
// being mistaken for coverage -- a sibling repo shipped a shadow-safety ratchet
// that printed OK over a live `.contains(event.target)` defect for exactly this
// reason: its own rule list never enumerated that shape.
const UNCHECKED = [
  'event.relatedTarget (focusout/mouseout retargets the same way as target)',
  'document.elementFromPoint / elementsFromPoint (returns the host)',
  'window.getSelection() (does not descend into shadow trees)',
  'document.querySelector reaching for a node inside a shadow root'
];

console.log('0 shadow-unsafe reads across src/lib.');
console.log(
  '  checked 4 shapes: document.activeElement, contains(event.target),\n    contains(alias) where the alias holds an event target,\n    eventTarget.closest() in a file that listens above the shadow boundary'
);
console.log('  NOT checked — a pass here says nothing about these:');
for (const shape of UNCHECKED) {
  console.log(`    - ${shape}`);
}
