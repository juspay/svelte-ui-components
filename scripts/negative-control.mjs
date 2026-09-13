#!/usr/bin/env node
/**
 * Run a command with one file temporarily modified, then put the ORIGINAL BYTES
 * back — never `git checkout`.
 *
 * A negative control is the only thing that proves a test is not vacuous, so
 * this repo runs them constantly: break the fix, watch the test fail, restore.
 * The restore step is where it goes wrong. `git checkout <file>` looks like
 * "undo my edit" and is actually "make this file match HEAD", which in a shared
 * worktree silently throws away every uncommitted change in that file --
 * including work someone else has in progress. That is not hypothetical: it
 * discarded a finished implementation in `src/lib/utils.ts` here, and it was
 * only caught because a check had just been tightened enough to see it.
 *
 * It is the same failure family as the repo-wide ban on bare `git stash`: a git
 * command that quietly discards work you did not write.
 *
 * So this never consults git at all. It reads the bytes, applies a mutation,
 * runs the command, and writes the bytes back in a `finally` — restoring on
 * success, on failure, on throw, and on SIGINT.
 *
 *   node scripts/negative-control.mjs <file> <find> <replace> -- <command...>
 *
 * Example — prove the aria-sort test actually tests aria-sort:
 *
 *   node scripts/negative-control.mjs src/lib/Table/Table.svelte \
 *     'aria-sort={isColumnSortable(colIndex)' 'data-was-sort={(' \
 *     -- npx playwright test tests/table-aria-sort.spec.ts
 *
 * Exit code is the command's, so a control that FAILS to fail is visible: a
 * zero here means the test passed without the code under test, which makes it
 * worthless.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const argv = process.argv.slice(2);
const separator = argv.indexOf('--');

if (separator === -1 || separator < 3) {
  console.error(
    'usage: node scripts/negative-control.mjs <file> <find> <replace> -- <command...>\n' +
      '       <find> must appear EXACTLY once in <file>.'
  );
  process.exit(2);
}

const [file, find, replace] = argv.slice(0, 3);
const command = argv.slice(separator + 1);

if (command.length === 0) {
  console.error('negative-control: no command given after --');
  process.exit(2);
}

const original = readFileSync(file, 'utf8');

// Exactly once, or not at all. A `find` that matches twice would mutate a site
// the author never looked at, and one that matches zero times would run the
// command against unmodified code and report a meaningless pass.
const occurrences = original.split(find).length - 1;
if (occurrences !== 1) {
  console.error(
    `negative-control: <find> matches ${occurrences} times in ${file}; it must match exactly once.`
  );
  process.exit(2);
}

let restored = false;
const restore = () => {
  if (restored) {
    return;
  }
  restored = true;
  writeFileSync(file, original);
  console.error(`negative-control: restored ${file} (${original.length} bytes)`);
};

// Ctrl-C during a long browser run must not leave the tree broken.
process.on('SIGINT', () => {
  restore();
  process.exit(130);
});

try {
  writeFileSync(file, original.replace(find, replace));
  console.error(`negative-control: mutated ${file}; running ${command.join(' ')}`);
  const result = spawnSync(command[0], command.slice(1), { stdio: 'inherit' });
  restore();
  if (result.status === 0) {
    console.error(
      '\nnegative-control: the command exited 0 with the code under test removed.\n' +
        'If that command was a TEST, it does not test what it claims to — treat this\n' +
        'as a failure. If it was a pipeline (`... | tail`) or a grep, the exit code is\n' +
        "the LAST stage's and says nothing about the test; read the output instead."
    );
  }
  process.exit(result.status ?? 1);
} finally {
  restore();
}
