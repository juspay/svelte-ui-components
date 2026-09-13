#!/usr/bin/env node
/**
 * `.only` in a committed test file, which silently disables every OTHER test in
 * that file while the suite still exits 0.
 *
 * It is the sharpest member of a class this project keeps meeting: a green run
 * that is green because nothing ran. A `test.only` left in after debugging turns
 * a 40-assertion spec into a 1-assertion spec, and every signal downstream --
 * CI, the merge gate, a report saying "all tests pass" -- is technically true
 * and completely misleading. Nobody has to be careless for this to ship; it is
 * the normal debugging tool, and the failure is forgetting to remove it.
 *
 * The same shape has already bitten this suite twice. `test.skip(cond)` applies
 * to the whole enclosing describe, and once skipped all 94 visual routes while
 * reporting success. And a `test.fixme` asserting that a feature did not exist
 * outlived the feature being built, so the library shipped a capability with a
 * skipped test denying it.
 *
 * Only `.only` is gated here, because only `.only` is never legitimate in
 * committed code. `skip` and `fixme` are real tools and cannot be banned -- see
 * the limits printed on a pass.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const ROOTS = ['tests', 'src'];

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.(test|spec)\.[jt]s$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
};

const files = ROOTS.flatMap((r) => walk(join(ROOT, r)));
const FOCUS = /\b(?:test|it|describe|suite|context)\s*\.\s*only\s*\(/;

const violations = [];
for (const file of files) {
  const rel = relative(ROOT, file);
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((raw, i) => {
      // A line that is wholly a comment cannot focus anything, and the prose in
      // this repo discusses `.only` by name in several places.
      const line = raw.replace(/\/\/.*$/, '');
      if (line.trim().startsWith('*') || !FOCUS.test(line)) {
        return;
      }
      violations.push({ file: rel, line: i + 1, text: raw.trim().slice(0, 100) });
    });
}

if (violations.length > 0) {
  console.error(
    `\n${violations.length} focused test(s) — these disable every OTHER test in their file:\n`
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.text}`);
    console.error(
      '    The suite will still exit 0, so CI, the merge gate and any report saying\n' +
        '    "all tests pass" are technically true and completely misleading.\n' +
        '    Remove the `.only` before committing.\n'
    );
  }
  process.exit(1);
}

console.log(`0 focused tests across ${files.length} spec files.`);
console.log('  NOT checked — a pass here says nothing about these:');
for (const shape of [
  '`test.skip` / `test.fixme`, which are legitimate and cannot be banned',
  'a `fixme` whose stated reason has since become FALSE — a skipped test denying a feature that now exists (this shipped here, and only a person reading it caught it)',
  'a test that runs but asserts nothing, or asserts against a stub',
  'a spec file nobody imports, or a glob that stopped matching it'
]) {
  console.log(`    - ${shape}`);
}
