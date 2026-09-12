import { describe, it, expect } from 'vitest';
import { renderMarkdown, unwrapMarkdownFence } from './markdown';

/**
 * Models emitting markdown very often wrap the whole answer in a fence:
 *
 * ```markdown
 * # Real heading
 * ```
 *
 * Rendered literally that is a code block, so the consumer shows source instead
 * of a document. `unwrapFence` opts into removing exactly that wrapper.
 *
 * The reason this is opt-in and narrowly anchored: a peer's live implementation
 * used an unanchored, global regex, so a message *explaining* markdown by
 * quoting a fenced sample had its sample unwrapped and rendered as live markup.
 * Every case below that returns the source unchanged exists to keep that from
 * happening here.
 */
describe('unwrapFence', () => {
  const wrapped = '```markdown\n# Heading\n\nSome **bold** text.\n```';

  it('is off by default, so a fenced answer still renders as a code block', () => {
    const output = renderMarkdown(wrapped);
    expect(output).toContain('<pre><code');
    expect(output).not.toContain('<h1>Heading</h1>');
  });

  it('renders the inner document when opted in', () => {
    const output = renderMarkdown(wrapped, { unwrapFence: true });
    expect(output).toContain('<h1>Heading</h1>');
    expect(output).toContain('<strong>bold</strong>');
    expect(output).not.toContain('<pre><code');
  });

  it('accepts the md spelling as well as markdown', () => {
    const output = renderMarkdown('```md\n# Heading\n```', { unwrapFence: true });
    expect(output).toContain('<h1>Heading</h1>');
  });

  it('is case-insensitive about the info string', () => {
    const output = renderMarkdown('```MarkDown\n# Heading\n```', { unwrapFence: true });
    expect(output).toContain('<h1>Heading</h1>');
  });

  it('tolerates whitespace around and inside the fence line', () => {
    const output = renderMarkdown('\n\n```markdown   \n# Heading\n```  \n\n', {
      unwrapFence: true
    });
    expect(output).toContain('<h1>Heading</h1>');
  });

  it('unwraps a tilde fence too, since markdown treats both as fences', () => {
    const output = renderMarkdown('~~~markdown\n# Heading\n~~~', { unwrapFence: true });
    expect(output).toContain('<h1>Heading</h1>');
  });

  // CommonMark permits a closing fence LONGER than its opening. A `\1`
  // backreference does not merely refuse those -- it matches the last N ticks
  // and sweeps the surplus into the body, so the content comes back with a
  // stray delimiter glued to it. These pin the whole length relationship.
  it('accepts a closing fence longer than the opening, per CommonMark', () => {
    const output = renderMarkdown('```markdown\n# Heading\n````', { unwrapFence: true });
    expect(output).toContain('<h1>Heading</h1>');
    // The surplus tick must not survive into the rendered body.
    expect(output).not.toContain('`');
  });

  it('accepts a longer tilde close too', () => {
    const output = renderMarkdown('~~~markdown\n# Heading\n~~~~', { unwrapFence: true });
    expect(output).toContain('<h1>Heading</h1>');
    expect(output).not.toContain('~');
  });

  it('refuses a closing fence SHORTER than the opening', () => {
    const output = renderMarkdown('````markdown\n# Heading\n```', { unwrapFence: true });
    expect(output).toContain('<pre><code');
    expect(output).not.toContain('<h1>');
  });

  it('refuses a closing fence of the other character', () => {
    const output = renderMarkdown('```markdown\n# Heading\n~~~', { unwrapFence: true });
    expect(output).not.toContain('<h1>');
  });

  // ── Everything below must NOT unwrap ────────────────────────────────────────

  it('leaves a fence that is not the whole body alone', () => {
    const source = 'Here is an example:\n\n```markdown\n# Not the whole message\n```';
    const output = renderMarkdown(source, { unwrapFence: true });
    expect(output).toContain('<pre><code');
    expect(output).not.toContain('<h1>');
  });

  it('leaves a fence followed by trailing prose alone', () => {
    const source = '```markdown\n# Heading\n```\n\nAnd some commentary after it.';
    const output = renderMarkdown(source, { unwrapFence: true });
    expect(output).toContain('<pre><code');
  });

  it('refuses when the body still contains a fence delimiter', () => {
    // Ambiguous: the outer fence may not be the wrapper at all. Refusing keeps
    // a message that quotes fenced code from being reinterpreted as markup.
    const source = '```markdown\n# Heading\n\n```js\nalert(1)\n```\n```';
    const output = renderMarkdown(source, { unwrapFence: true });
    expect(output).toContain('<pre><code');
  });

  it('leaves an unlabelled fence alone, which may be code the author meant', () => {
    const output = renderMarkdown('```\n# Not necessarily markdown\n```', {
      unwrapFence: true
    });
    expect(output).toContain('<pre><code');
  });

  it('leaves a fence labelled as another language alone', () => {
    const output = renderMarkdown('```python\nprint("hi")\n```', { unwrapFence: true });
    expect(output).toContain('<pre><code');
    expect(output).toContain('print');
  });

  it('does not change ordinary markdown that has no wrapper', () => {
    const plain = '# Heading\n\nSome text.';
    expect(renderMarkdown(plain, { unwrapFence: true })).toBe(renderMarkdown(plain));
  });

  it('still escapes raw HTML inside an unwrapped body', () => {
    const output = renderMarkdown('```markdown\n<img src=x onerror=alert(1)>\n```', {
      unwrapFence: true
    });
    expect(output).not.toContain('<img');
    expect(output).toContain('&lt;img');
  });

  it('stays linear on a closing delimiter followed by many tabs (no ReDoS)', () => {
    // Regression for a polynomial-backtracking match: `[ \t]*\s*$` paired two
    // quantifiers over overlapping character classes, so a real delimiter
    // followed by a long tab run and one trailing character made the engine
    // try every split between the two before giving up. Chat/model text is
    // uncontrolled input, so this had to stay fast rather than merely correct.
    const adversarial = '```markdown\nhello\n```' + '\t'.repeat(50_000) + 'X';
    const start = performance.now();
    const result = unwrapMarkdownFence(adversarial);
    const elapsed = performance.now() - start;
    expect(result).toBe(adversarial);
    expect(elapsed).toBeLessThan(500);
  });
});
