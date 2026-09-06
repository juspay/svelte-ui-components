import { describe, expect, it } from 'vitest';
import { bumpForCommit, bumpForRange, unreleasedCommits } from './version-bump.js';

const commit = (subject: string, body = '') => ({ subject, body });

describe('a single commit', () => {
  it('reads feat as minor and fix as patch', () => {
    expect(bumpForCommit(commit('feat(chat): add a marker'))).toBe('minor');
    expect(bumpForCommit(commit('fix(chat): stop the flicker'))).toBe('patch');
  });

  it('reads an exclamation mark as breaking, on any type', () => {
    expect(bumpForCommit(commit('feat(events)!: remove the legacy spellings'))).toBe('major');
    expect(bumpForCommit(commit('fix(wc)!: drop the alias'))).toBe('major');
    expect(bumpForCommit(commit('docs(release)!: cut it as 4.0.0'))).toBe('major');
  });

  it('reads a BREAKING CHANGE footer as breaking, whatever the subject', () => {
    expect(
      bumpForCommit(commit('fix(wc): restore the type coverage', 'BREAKING CHANGE: gone.'))
    ).toBe('major');
    expect(bumpForCommit(commit('chore(deps): bump', 'BREAKING CHANGE: gone.'))).toBe('major');
  });

  it('only honours a BREAKING CHANGE footer at the start of a line', () => {
    // Prose mentioning the words mid-sentence is not a footer, and must not
    // silently turn a patch into a major.
    expect(
      bumpForCommit(commit('fix(docs): explain', 'This is not a BREAKING CHANGE: it is prose.'))
    ).toBe('patch');
  });

  it('treats maintenance types as patch, and anything unrecognised as patch', () => {
    expect(bumpForCommit(commit('chore(release): 4.0.0'))).toBe('patch');
    expect(bumpForCommit(commit('docs(readme): fix a typo'))).toBe('patch');
    expect(bumpForCommit(commit('nonsense subject with no type'))).toBe('patch');
  });

  it('tolerates a Jira prefix, which the workflow has always allowed', () => {
    expect(bumpForCommit(commit('BZ-1234: feat(chat): add a marker'))).toBe('minor');
    expect(bumpForCommit(commit('BZ-1234: feat(events)!: remove them'))).toBe('major');
  });
});

describe('a range of commits', () => {
  it('takes the strongest bump in the range, not the newest commit', () => {
    // This is the whole point. 3.5.1 shipped a breaking removal as a patch
    // because the workflow read only `git log -1` -- a `fix:` sitting on top
    // of an unreleased `feat!:` four commits down.
    const range = [
      commit('fix(wc): restore the type coverage the host-reserved rename removed, and gate it'),
      commit('feat(ChatMessage): mark a turn with a leading accent bar via `marker`'),
      commit('feat(ChatMessage): reveal a streamed message progressively via TypewriterText'),
      commit('feat(events)!: remove the 3.x legacy spellings and host-reserved element props'),
      commit('feat(events): make every event prop lowercase, keeping the old spellings as aliases')
    ];
    expect(bumpForRange(range)).toBe('major');
  });

  it('promotes to minor when the range holds a feat under a fix', () => {
    expect(bumpForRange([commit('fix(a): b'), commit('feat(c): d')])).toBe('minor');
  });

  it('stays patch when the range is only fixes and chores', () => {
    expect(bumpForRange([commit('fix(a): b'), commit('chore(c): d')])).toBe('patch');
  });

  it('is patch for an empty range rather than throwing', () => {
    expect(bumpForRange([])).toBe('patch');
  });

  it('ignores the release job’s own commits', () => {
    // The workflow commits `chore(release): X` back to the branch. Counting it
    // would be harmless today, but a range that contains *only* it means
    // nothing new has landed.
    expect(bumpForRange([commit('chore(release): 4.0.0'), commit('feat(a): b')])).toBe('minor');
  });
});

describe('the two packages have separate release commits', () => {
  // The MCP job commits `chore(release): mcp 4.0.2`; the root job commits
  // `chore(release): 4.0.0`. Both exist on this branch. A boundary that
  // matched `^chore(release):` loosely would let an MCP release hide the
  // root package's unreleased commits -- the same class of bug as reading
  // only the newest commit.
  it('does not let an MCP release commit end the root range', () => {
    const log = [
      commit('fix(a): a fix'),
      commit('chore(release): mcp 4.0.2'),
      commit('feat(events)!: a breaking change the root package has not released'),
      commit('chore(release): 4.0.0')
    ];
    expect(bumpForRange(unreleasedCommits(log))).toBe('major');
  });

  it('does not let the root release commit end the MCP range', () => {
    const log = [
      commit('fix(mcp): a fix'),
      commit('chore(release): 4.0.0'),
      commit('feat(mcp)!: a breaking change MCP has not released'),
      commit('chore(release): mcp 4.0.2')
    ];
    expect(bumpForRange(unreleasedCommits(log, 'mcp'))).toBe('major');
  });

  it('excludes both kinds of release commit from driving a bump', () => {
    expect(bumpForRange([commit('chore(release): mcp 4.0.2'), commit('fix(a): b')])).toBe('patch');
  });
});

describe('choosing the range', () => {
  it('stops at the most recent release commit', () => {
    const log = [
      commit('fix(wc): a fix'),
      commit('feat(events)!: a breaking feature'),
      commit('chore(release): 3.5.0'),
      commit('feat(old): already released, must not count')
    ];
    expect(unreleasedCommits(log).map((entry) => entry.subject)).toEqual([
      'fix(wc): a fix',
      'feat(events)!: a breaking feature'
    ]);
  });

  it('takes the whole log when no release commit is present', () => {
    const log = [commit('fix(a): b'), commit('feat(c): d')];
    expect(unreleasedCommits(log)).toHaveLength(2);
  });

  it('returns nothing when the newest commit is the release itself', () => {
    // Immediately after a release, before anything new merges.
    expect(unreleasedCommits([commit('chore(release): 4.0.0'), commit('feat(a): b')])).toEqual([]);
  });
});

describe('a history window that did not reach the boundary', () => {
  // The window has to be capped, or a repository with a long history blows the
  // subprocess buffer. But "no boundary in the window" has two very different
  // causes, and silently treating them alike is how a released `feat!` gets
  // counted a second time and inflates the next bump.
  it('treats a complete history with no release commit as all-unreleased', () => {
    const log = [commit('feat(a): b'), commit('fix(c): d')];
    expect(unreleasedCommits(log, 'root', { truncated: false })).toHaveLength(2);
  });

  it('refuses to answer when the window was truncated before any boundary', () => {
    const log = [commit('feat(a): b'), commit('fix(c): d')];
    expect(() => unreleasedCommits(log, 'root', { truncated: true })).toThrowError(
      /truncated|boundary/i
    );
  });

  it('is unbothered by truncation when the boundary is inside the window', () => {
    const log = [commit('feat(a): b'), commit('chore(release): 4.0.0'), commit('feat(old): x')];
    expect(unreleasedCommits(log, 'root', { truncated: true })).toHaveLength(1);
  });
});
