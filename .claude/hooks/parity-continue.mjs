#!/usr/bin/env node
/**
 * Stop hook: the thing that stops the programme forgetting itself.
 *
 * Across a week the same failure repeated -- a session would close out a
 * visible slice, report it, and the rest of the backlog would quietly fall off
 * the end of the turn. Nobody decided to drop SD-* and CW-*; they were simply
 * not in the last summary, and the next session inherited the summary rather
 * than the tree.
 *
 * So on every stop this re-derives the backlog from source (scripts/parity-ledger.mjs
 * reads the code, not a document) and, while actionable items remain, returns the
 * list as the reason to keep going.
 *
 * Three rails, because a hook that always blocks is a trap, not a tool:
 *
 *   1. `stop_hook_active` -- Claude Code sets this when the current turn was
 *      itself started by this hook. Honouring it is what stops a tight loop.
 *   2. A continuation budget in .parity/continuations. When it runs out the hook
 *      stands down and says so, rather than blocking forever.
 *   3. A kill switch: `touch .parity/STOP`. Checked first, before anything else.
 *
 * The budget resets whenever the ledger's actionable count falls, since real
 * progress is the only evidence that continuing is worth anything.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const STATE_DIR = join(ROOT, '.parity');
const KILL = join(STATE_DIR, 'STOP');
const STATE = join(STATE_DIR, 'continuations.json');
const MAX_CONTINUATIONS = 30;

const allow = (note) => {
  if (note) {
    process.stderr.write(`parity-continue: ${note}\n`);
  }
  process.exit(0);
};

const readStdin = () => {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
};

const input = readStdin();

// Rail 1: never fight Claude Code's own loop breaker.
if (input.stop_hook_active === true) {
  allow('stop_hook_active is set; standing down');
}

// Rail 3 (checked early, so it works even if the ledger is broken).
if (existsSync(KILL)) {
  allow('.parity/STOP present; standing down');
}

let ledger;
try {
  const out = execFileSync('node', [join(ROOT, 'scripts', 'parity-ledger.mjs'), '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 60_000
  });
  ledger = JSON.parse(out);
} catch (error) {
  // A hook that fails closed would block every stop on its own bug.
  allow(`ledger did not run (${error.message.split('\n')[0]}); standing down`);
}

const openOrPartial = ledger.items.filter((i) => i.status === 'open' || i.status === 'partial');
const blocked = ledger.items.filter((i) => i.status === 'blocked');

/**
 * Items an agent is already working. The ledger reads source and cannot know
 * this, so telling the session to "pick up the next one" sent it at work that
 * was in flight -- which collides, duplicates, and three cycles running was the
 * only thing left to pick up.
 *
 * Stale entries are the obvious hazard: an assignment for an agent that died
 * would hide an item forever. So an assignment expires, and an expired one is
 * reported as needing a check rather than silently dropped or silently kept.
 */
const ASSIGNED = join(STATE_DIR, 'assigned.json');
const ASSIGNMENT_TTL_MS = 4 * 60 * 60 * 1000;
const assignments = (() => {
  try {
    return JSON.parse(readFileSync(ASSIGNED, 'utf8'));
  } catch {
    return {};
  }
})();
const now = Date.now();
const assignedFresh = new Map();
const assignedStale = new Map();
for (const [id, entry] of Object.entries(assignments)) {
  const age = now - Date.parse(entry.since);
  (Number.isFinite(age) && age < ASSIGNMENT_TTL_MS ? assignedFresh : assignedStale).set(
    id,
    entry.agent
  );
}

const actionable = openOrPartial.filter((i) => !assignedFresh.has(i.id));
const inFlight = openOrPartial.filter((i) => assignedFresh.has(i.id));

// An item whose remaining work needs a person is not something to "pick up".
// Listing it under that instruction is advice no agent can act on, and repeated
// often enough it teaches everyone to skim the list. When only those remain,
// stand down and surface them as the questions they are.
if (actionable.length === 0) {
  if (inFlight.length > 0) {
    const lines = inFlight.map((i) => `  ${i.id} — ${i.title} (${assignedFresh.get(i.id)})`);
    const staleNote =
      assignedStale.size > 0
        ? `\n\n${assignedStale.size} assignment(s) have expired and may be dead agents: ${[...assignedStale.keys()].join(', ')}. Check whether that work is still running before treating those items as covered.`
        : '';
    allow(
      `every remaining item is assigned to a running agent (${lines.length}); nothing to pick up${staleNote}`
    );
  }
  if (blocked.length > 0) {
    console.log(
      JSON.stringify({
        decision: 'block',
        reason: [
          `Every item an agent can close is closed. ${blocked.length} remain and each needs a DECISION, not work:`,
          ...blocked.map((i) => `  ${i.id} — ${i.title}\n      ${i.evidence}`),
          '',
          'Put these to the user plainly, say what each decision changes, and stop.',
          'Do not start them: there is nothing to start.'
        ].join('\n')
      })
    );
    process.exit(0);
  }
  allow('ledger reports 0 actionable items');
}

if (!existsSync(STATE_DIR)) {
  mkdirSync(STATE_DIR, { recursive: true });
}

const previous = (() => {
  try {
    return JSON.parse(readFileSync(STATE, 'utf8'));
  } catch {
    return { used: 0, lastActionable: Number.POSITIVE_INFINITY };
  }
})();

// Rail 2, with its reset: shrinking the backlog buys a fresh budget, so a
// session that is genuinely landing work is never cut off, and one that is
// spinning without closing anything is.
const progressed = actionable.length < previous.lastActionable;
const used = progressed ? 0 : previous.used + 1;
writeFileSync(STATE, JSON.stringify({ used, lastActionable: actionable.length }, null, 1));

if (used > MAX_CONTINUATIONS) {
  allow(
    `continuation budget spent (${MAX_CONTINUATIONS} stops with no reduction in the backlog); standing down`
  );
}

const byPack = actionable.reduce((acc, i) => {
  (acc[i.pack] ??= []).push(i);
  return acc;
}, {});

const lines = Object.entries(byPack).map(
  ([pack, items]) => `  ${pack}: ${items.map((i) => `${i.id} (${i.status})`).join(', ')}`
);

const reason = [
  `${actionable.length} of ${ledger.items.length} parity items are still actionable, derived just now from source:`,
  ...lines,
  '',
  `Pick up the next one rather than stopping. Run \`node scripts/parity-ledger.mjs --open\` for each item's`,
  'evidence line, which names exactly what was counted and therefore what would have to change.',
  '',
  `If the remaining work genuinely needs a decision from the user, say so and stop -- but say which item`,
  'and which decision, so it can be answered. To end this loop deliberately: touch .parity/STOP',
  `(continuation ${used} of ${MAX_CONTINUATIONS} without backlog reduction).`,
  ...(inFlight.length > 0
    ? [
        '',
        `${inFlight.length} further item(s) are already being worked and are NOT yours to start: ${inFlight.map((i) => `${i.id} (${assignedFresh.get(i.id)})`).join(', ')}.`
      ]
    : [])
].join('\n');

console.log(JSON.stringify({ decision: 'block', reason }));
process.exit(0);
