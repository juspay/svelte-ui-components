#!/usr/bin/env node
// Enforces DESIGN_PRINCIPLES.md's event-casing rule: every event prop is
// `on` followed by the event name in lowercase — onclick, onrowclick,
// onoverlayclick — whether the browser fires the event or the component
// invents it. One rule, no native/synthetic judgement call.
//
// The one tolerated exception is a declaration marked `@deprecated`: the 3.x
// releases keep the earlier camelCase and mixed-case spellings alive as
// aliases so consumers can migrate with `npx sui-codemod`, and 4.0.0 removes
// them. An uppercase letter in an event prop that is NOT deprecated is a new
// violation and fails the build.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PROP_LINE = /^\s*(on[A-Za-z]+)\??:/;
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

// A declaration runs from its first line to the first `;` at bracket depth
// zero, so a multi-line arrow type is read whole before deciding whether the
// prop is a callback at all (`onErrorMessage?: string` is not an event).
function declarationText(lines, from) {
  let depth = 0;
  const parts = [];
  for (let i = from; i < lines.length; i++) {
    parts.push(lines[i]);
    for (const character of lines[i]) {
      if (character === '(' || character === '{' || character === '[') {
        depth += 1;
      } else if (character === ')' || character === '}' || character === ']') {
        depth -= 1;
      } else if (character === ';' && depth === 0) {
        return parts.join('\n');
      }
    }
  }
  return parts.join('\n');
}

function docBlockAbove(lines, index) {
  const block = [];
  for (let i = index - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.length === 0 || !/^(\/\*\*|\*|\/\/)/.test(line)) {
      break;
    }
    block.unshift(line);
  }
  return block.join('\n');
}

function checkFile(path) {
  const violations = [];
  let deprecated = 0;
  const lines = readFileSync(path, 'utf8').split('\n');
  let owner = '';
  lines.forEach((line, i) => {
    const typeLine = line.match(/^(?:export )?type (\w+)\b/);
    if (typeLine) {
      owner = typeLine[1];
    }
    const m = line.match(PROP_LINE);
    if (!m) {
      return;
    }
    // Only a component's own props are in scope: a callback key on a config
    // object (`TableColumn.onToggle`, a chat adapter) is declared in a type not
    // named `…Properties`, or nested deeper than the props type's own members.
    if (!owner.endsWith('Properties') || m[0].length - m[0].trimStart().length !== 2) {
      return;
    }
    const name = m[1];
    if (!declarationText(lines, i).includes('=>')) {
      return;
    }
    if (name === name.toLowerCase()) {
      return;
    }
    if (docBlockAbove(lines, i).includes('@deprecated')) {
      deprecated += 1;
      return;
    }
    violations.push({
      line: i + 1,
      name,
      reason: `event props are lowercase: on${name.slice(2).toLowerCase()} (keep ${name} only as a @deprecated alias)`
    });
  });
  return { violations, deprecated };
}

const files = findPropertiesFiles(join(root, 'src', 'lib'));

let violationCount = 0;
let deprecatedCount = 0;

for (const file of files) {
  const rel = file.replace(root + '/', '');
  const { violations, deprecated } = checkFile(file);
  deprecatedCount += deprecated;
  for (const v of violations) {
    violationCount++;
    console.log(`${rel}:${v.line}  ${v.name}  —  ${v.reason}`);
  }
}

console.log(
  `\n${violationCount} event-casing violation(s), ${deprecatedCount} deprecated alias(es) awaiting 4.0.0, across ${files.length} properties.ts files.`
);

if (violationCount > 0) {
  console.log(
    'New event-casing violations found. Event props are lowercase throughout; an old spelling may only remain as a @deprecated alias.'
  );
  process.exit(1);
}
