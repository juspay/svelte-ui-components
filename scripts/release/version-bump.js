#!/usr/bin/env node
// Chooses the semver bump for a release from EVERY commit since the last
// release, not just the newest one.
//
// The newest-commit-only rule shipped a breaking change as a patch. 3.5.1
// carried `feat(events)!: remove the 3.x legacy spellings` four commits down,
// but the workflow read `git log -1`, saw `fix(wc): ...` on top, and computed
// `patch`. Consumers on `^3.5.0` were moved onto it by a routine install, and
// because Svelte drops an unknown prop without erroring, their handlers simply
// stopped running.
//
// The boundary is the most recent `chore(release):` commit rather than the
// most recent tag. The release job pushes that commit before it pushes the
// tag, and the workflow's own comments describe the window where a publish
// succeeds and the tag push does not -- so a tag can be missing for a version
// that is already on the registry, while the release commit cannot.

import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

// These mirror the shell the workflow used, deliberately, so a single commit
// classifies exactly as it always did and only the range is new. Note the
// asymmetry carried over with them: the type is matched case-insensitively but
// the `!` is not, so `FEAT!:` is a feature rather than a breaking one. That is
// preserved rather than fixed here -- widening what counts as breaking is a
// separate change, and this one is about not missing the breaking commits the
// rule already recognises.
const BREAKING_FOOTER = /^BREAKING CHANGE:/im;
const MAINTENANCE = 'build|chore|ci|docs|style|refactor|perf|test';
const FEAT = /(^|: )feat(\(.+\))?!?:/i;
const FEAT_BREAKING = /feat(\(.+\))?!:/;
const FIX = /(^|: )fix(\(.+\))?!?:/i;
const FIX_BREAKING = /fix(\(.+\))?!:/;
const OTHER = new RegExp(`(^|: )(${MAINTENANCE})(\\(.+\\))?!?:`, 'i');
const OTHER_BREAKING = new RegExp(`(${MAINTENANCE})(\\(.+\\))?!:`);

// Two packages release from this branch and each commits its own landmark:
// the root job writes `chore(release): 4.0.0`, the MCP job writes
// `chore(release): mcp 4.0.2`. Both are on this history. They have to be told
// apart, because either one ending the other's range would hide unreleased
// commits -- the same failure as reading only the newest commit, one level up.
const ROOT_RELEASE = /^chore\(release\): \d/;
const MCP_RELEASE = /^chore\(release\): mcp\b/;
// Neither package's own release commit should ever drive a bump.
const ANY_RELEASE = /^chore\(release\):/;
const RANK = { patch: 0, minor: 1, major: 2 };

/**
 * @typedef {{ subject: string, body: string }} Commit
 * @typedef {'major' | 'minor' | 'patch'} Bump
 * @typedef {'root' | 'mcp'} Target
 */

/**
 * @param {Commit} commit
 * @returns {Bump}
 */
export function bumpForCommit({ subject, body }) {
  const breaking = BREAKING_FOOTER.test(body ?? '');
  if (FEAT.test(subject)) {
    return FEAT_BREAKING.test(subject) || breaking ? 'major' : 'minor';
  }
  if (FIX.test(subject)) {
    return FIX_BREAKING.test(subject) || breaking ? 'major' : 'patch';
  }
  if (OTHER.test(subject)) {
    return OTHER_BREAKING.test(subject) || breaking ? 'major' : 'patch';
  }
  return breaking ? 'major' : 'patch';
}

/**
 * The strongest bump anything in the range asks for.
 *
 * @param {readonly Commit[]} commits
 * @returns {Bump}
 */
export function bumpForRange(commits) {
  return commits
    .filter((commit) => !ANY_RELEASE.test(commit.subject))
    .reduce((strongest, commit) => {
      const next = bumpForCommit(commit);
      return RANK[next] > RANK[strongest] ? next : strongest;
    }, /** @type {Bump} */ ('patch'));
}

/**
 * Everything newer than the last release commit *for this package*. `log` is
 * newest-first, the order `git log` gives.
 *
 * @param {readonly Commit[]} log
 * @param {Target} [target]
 * @returns {readonly Commit[]}
 */
export function unreleasedCommits(log, target = 'root') {
  const isBoundary = target === 'mcp' ? MCP_RELEASE : ROOT_RELEASE;
  const boundary = log.findIndex((commit) => isBoundary.test(commit.subject));
  return boundary === -1 ? [...log] : log.slice(0, boundary);
}

/**
 * @param {{ cwd?: string, path?: string }} [options]
 * @returns {readonly Commit[]}
 */
export function readLog(options = {}) {
  // NUL between subject and body, record separator between commits: a commit
  // body contains newlines and can contain almost anything else.
  const args = ['log', '--pretty=format:%s%x00%b%x1e', '-n', '200'];
  if (typeof options.path === 'string') {
    args.push('--', options.path);
  }
  const raw = execFileSync('git', args, {
    cwd: options.cwd,
    encoding: 'utf8'
  });
  return raw
    .split('\x1e')
    .map((record) => record.replace(/^\n/, ''))
    .filter((record) => record.trim() !== '')
    .map((record) => {
      const [subject, body = ''] = record.split('\x00');
      return { subject, body };
    });
}

function main() {
  /** @type {Target} */
  const target = process.argv.includes('--mcp') ? 'mcp' : 'root';
  // MCP versions only what happened inside `mcp/`, which is also what gates
  // the job running at all. The root package versions the whole tree.
  const log = readLog(target === 'mcp' ? { path: 'mcp' } : {});
  const range = unreleasedCommits(log, target);
  const bump = bumpForRange(range);

  const label = target === 'mcp' ? 'MCP' : 'root';
  if (range.length === 0) {
    console.log(`No ${label} commits since its last release commit; defaulting to patch.`);
  } else {
    console.log(`Considering ${range.length} ${label} commit(s) since its last release:`);
    for (const commit of range) {
      console.log(`  ${bumpForCommit(commit).padEnd(5)}  ${commit.subject}`);
    }
  }
  console.log(`Version bump: ${bump.toUpperCase()}`);

  const out = process.env.GITHUB_OUTPUT;
  if (typeof out === 'string' && out !== '') {
    appendFileSync(out, `version_type=${bump}\n`);
  }
}

// Only run as a CLI, so the test can import the pure parts.
if (process.argv[1] === import.meta.filename) {
  main();
}
