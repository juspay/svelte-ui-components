#!/usr/bin/env node
// Enforces DESIGN_PRINCIPLES.md's event-casing rule:
//   - native DOM events forwarded as-is stay lowercase (onclick, onkeydown, ...)
//     to match Svelte 5's own idiom for real DOM event attributes
//   - every other (synthesized) event is camelCase from the character right
//     after "on" (onRowClick, onCenterTextClick, ...)
//
// This catches exactly the class of bug found across the codebase before this
// rule existed: a prop that starts "on" + lowercase word, then switches to
// camelCase partway through (onleftImageClick, oncenterTextClick), or one
// that's lowercase throughout despite being a made-up, multi-word event name
// (onbarclick) — neither a real native event name nor valid camelCase.
//
// event-casing-baseline.json grandfathers the violations that already
// existed when this check was introduced: renaming any of them is a
// breaking prop-name change for real consumers, not something to do as a
// drive-by lint fix. This check's job is to stop the count from growing,
// not to retroactively rewrite the public API. Fix an entry, then remove
// it from the baseline in the same PR.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const NATIVE_EVENTS = new Set([
  'click',
  'dblclick',
  'auxclick',
  'contextmenu',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseenter',
  'mouseleave',
  'mouseover',
  'mouseout',
  'keydown',
  'keyup',
  'keypress',
  'focus',
  'blur',
  'focusin',
  'focusout',
  'input',
  'change',
  'submit',
  'reset',
  'select',
  'invalid',
  'scroll',
  'wheel',
  'resize',
  'drag',
  'dragstart',
  'dragend',
  'dragenter',
  'dragleave',
  'dragover',
  'drop',
  'touchstart',
  'touchend',
  'touchmove',
  'touchcancel',
  'pointerdown',
  'pointerup',
  'pointermove',
  'pointerenter',
  'pointerleave',
  'pointerover',
  'pointerout',
  'pointercancel',
  'copy',
  'cut',
  'paste',
  'load',
  'error',
  'abort',
  'animationstart',
  'animationend',
  'animationiteration',
  'transitionend',
  'transitionstart',
  'toggle',
  'close',
  'cancel',
  // HTMLMediaElement (audio/video)
  'play',
  'pause',
  'ended',
  'volumechange',
  'timeupdate',
  'loadstart',
  'loadeddata',
  'loadedmetadata',
  'canplay',
  'canplaythrough',
  'seeking',
  'seeked',
  'waiting',
  'stalled',
  'suspend',
  'progress',
  'ratechange',
  'durationchange',
  'emptied'
]);

const PROP_LINE = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\??:/;
// DOM event types a genuine forward would hand straight to the caller.
const DOM_EVENT_TYPE =
  /\b(?:Event|UIEvent|MouseEvent|KeyboardEvent|FocusEvent|InputEvent|ClipboardEvent|PointerEvent|TouchEvent|DragEvent|WheelEvent|SubmitEvent|AnimationEvent|TransitionEvent|ProgressEvent)\b/;
const root = join(import.meta.dirname, '..');

function findPropertiesFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...findPropertiesFiles(full));
    } else if (entry === 'properties.ts') {
      out.push(full);
    }
  }
  return out;
}

function checkFile(path) {
  const violations = [];
  const lines = readFileSync(path, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const m = line.match(PROP_LINE);
    if (!m) {
      return;
    }
    const name = m[1];
    if (!/^on[a-zA-Z]/.test(name)) {
      return;
    }

    const rest = name.slice(2);
    const restLower = rest.toLowerCase();
    // A prop only forwards a native event if it hands the caller a DOM event.
    // Matching on the NAME alone mis-flagged six correct props whose names
    // collide with a DOM event but which pass domain data instead:
    // TypewriterText's onProgress passes a TypewriterProgress, Table's onToggle
    // passes (rowIndex, checked, originalIndex), ThinkingIndicator's onToggle
    // takes nothing. Lowercasing those would rename correct props into wrong
    // ones, so the declared type decides, not the spelling.
    const isNative = NATIVE_EVENTS.has(restLower) && DOM_EVENT_TYPE.test(line);

    if (isNative) {
      if (rest !== restLower) {
        violations.push({
          line: i + 1,
          name,
          reason: `native DOM event "${restLower}" should stay lowercase: on${restLower}`
        });
      }
    } else if (/^[a-z]/.test(rest)) {
      const fixed = 'on' + rest[0].toUpperCase() + rest.slice(1);
      violations.push({
        line: i + 1,
        name,
        reason: `synthesized event should be camelCase: ${fixed} (word boundaries beyond the first may need a manual pass)`
      });
    }
  });
  return violations;
}

const baseline = new Set(
  JSON.parse(readFileSync(join(import.meta.dirname, 'event-casing-baseline.json'), 'utf8'))
);
const files = findPropertiesFiles(join(root, 'src', 'lib'));

let newCount = 0;
let knownCount = 0;

for (const file of files) {
  const rel = file.replace(root + '/', '');
  const violations = checkFile(file);
  for (const v of violations) {
    const key = `${rel}::${v.name}`;
    if (baseline.has(key)) {
      knownCount++;
    } else {
      newCount++;
      console.log(`${rel}:${v.line}  ${v.name}  —  ${v.reason}`);
    }
  }
}

console.log(
  `\n${knownCount} known (grandfathered) violation(s), ${newCount} new violation(s), across ${files.length} properties.ts files.`
);

if (newCount > 0) {
  console.log(
    'New event-casing violations found. Either fix the name, or if it is genuinely a native DOM event this list is missing, add it to NATIVE_EVENTS.'
  );
  process.exit(1);
}
