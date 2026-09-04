import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('renders basic markdown', () => {
    const output = renderMarkdown('This is **bold** and `code`.');
    expect(output).toContain('<strong>bold</strong>');
    expect(output).toContain('<code>code</code>');
  });

  it('renders GFM tables and fenced code blocks', () => {
    const table = renderMarkdown('| a | b |\n| --- | --- |\n| 1 | 2 |');
    expect(table).toContain('<table>');
    expect(table).toContain('<td>1</td>');

    const fence = renderMarkdown('```\nconst x = 1;\n```');
    expect(fence).toContain('<pre><code>');
    expect(fence).toContain('const x = 1;');
  });

  it('renders lists and headings', () => {
    const output = renderMarkdown('## Title\n\n- one\n- two');
    expect(output).toContain('<h2>Title</h2>');
    expect(output).toContain('<li>one</li>');
  });

  it('escapes raw block HTML instead of passing it through', () => {
    const output = renderMarkdown('<script>alert(1)</script>');
    expect(output).not.toContain('<script>');
    expect(output).toContain('&lt;script&gt;');
  });

  it('escapes raw inline HTML instead of passing it through', () => {
    const output = renderMarkdown('hi <img src=x onerror=alert(1)> there');
    expect(output).not.toContain('<img');
    expect(output).toContain('&lt;img');
  });

  it('keeps http, https, mailto, tel and relative links', () => {
    expect(renderMarkdown('[a](https://example.com)')).toContain('href="https://example.com"');
    expect(renderMarkdown('[a](http://example.com)')).toContain('href="http://example.com"');
    expect(renderMarkdown('[a](mailto:x@y.z)')).toContain('href="mailto:x@y.z"');
    expect(renderMarkdown('[a](tel:+15550100)')).toContain('href="tel:+15550100"');
    expect(renderMarkdown('[a](/docs/setup)')).toContain('href="/docs/setup"');
    expect(renderMarkdown('[a](#section)')).toContain('href="#section"');
  });

  it('opens external links in a new tab with noopener; internal links stay same-tab', () => {
    const external = renderMarkdown('[a](https://example.com)');
    expect(external).toContain('target="_blank"');
    expect(external).toContain('rel="noopener noreferrer"');

    const relative = renderMarkdown('[a](/docs/setup)');
    expect(relative).not.toContain('target="_blank"');

    const mail = renderMarkdown('[a](mailto:x@y.z)');
    expect(mail).not.toContain('target="_blank"');
  });

  it('applies the protocol allow-list to autolinks and bare URLs too', () => {
    const bare = renderMarkdown('Visit https://example.com today');
    expect(bare).toContain('href="https://example.com"');

    const autolink = renderMarkdown('<https://example.com>');
    expect(autolink).toContain('href="https://example.com"');

    // Angle-bracket autolinks accept any scheme, so they exercise the same
    // renderer.link guard as explicit links.
    const smuggled = renderMarkdown('<javascript:alert(1)>');
    expect(smuggled).not.toContain('href="javascript:');
    expect(smuggled).not.toContain('<a');
  });

  it('strips javascript: links but keeps their text', () => {
    const output = renderMarkdown('[click me](javascript:alert(1))');
    expect(output).not.toContain('javascript:');
    expect(output).not.toContain('<a');
    expect(output).toContain('click me');
  });

  it('strips data: links', () => {
    const output = renderMarkdown('[x](data:text/html,<script>alert(1)</script>)');
    expect(output).not.toContain('href="data:');
    expect(output).not.toContain('<a');
  });

  // This assertion used to be `not.toContain('javascript:')` with a comment
  // saying the anchor MAY survive because attribute-escaping kept it inert.
  // Both halves were wrong. The emitted href was `jav&#x09;ascript:alert(1)`,
  // which does not contain the literal substring `javascript:` -- so the test
  // passed -- while the browser decoded the reference back to a tab and
  // resolved the anchor's protocol to `javascript:`, which executes on click.
  // A substring check on the serialised HTML cannot see that. Asserting that
  // NO anchor is emitted is the only form that holds.
  it.each([
    ['hex reference', '[x](jav&#x09;ascript:alert(1))'],
    ['decimal reference', '[x](jav&#9;ascript:alert(1))'],
    ['named tab', '[x](jav&Tab;ascript:alert(1))'],
    ['named newline', '[x](jav&NewLine;ascript:alert(1))'],
    ['leading whitespace', '[x]( javascript:alert(1))'],
    ['mixed case', '[x](JaVaScRiPt:alert(1))']
  ])('emits no anchor at all for a smuggled protocol (%s)', (_label, source) => {
    const output = renderMarkdown(source);
    expect(output).not.toContain('<a');
    expect(output).not.toContain('javascript:');
    // The link text survives as escaped text, so nothing is silently lost.
    expect(output).toContain('x');
  });

  // The unsafe-autolink case is already covered above; what was missing is the
  // positive half -- that stripping unsafe protocols did not also break the
  // safe ones, which is the regression a protocol-check change could cause.
  // The parser cache is module-scoped and therefore shared across SSR requests
  // and across tests in a file. That is only safe if a cached instance carries
  // no per-parse state, so pin it: interleaving different inputs and both
  // `breaks` modes through the same cached instances must be order-independent.
  it('reuses cached parser instances without carrying state between renders', () => {
    const first = renderMarkdown('# one');
    const other = renderMarkdown('**two**');
    const firstAgain = renderMarkdown('# one');
    expect(firstAgain).toBe(first);
    expect(other).not.toBe(first);

    const softBreak = 'a\nb';
    const withBreaks = renderMarkdown(softBreak, { breaks: true });
    const withoutBreaks = renderMarkdown(softBreak);
    expect(withBreaks).not.toBe(withoutBreaks);
    // Re-request each mode after the other has been used.
    expect(renderMarkdown(softBreak, { breaks: true })).toBe(withBreaks);
    expect(renderMarkdown(softBreak)).toBe(withoutBreaks);
  });

  it('keeps safe autolinks working', () => {
    const output = renderMarkdown('<https://example.com>');
    expect(output).toContain('href="https://example.com"');
  });

  it('drops images with unsafe protocols but keeps their alt text', () => {
    const output = renderMarkdown('![diagram](javascript:alert(1))');
    expect(output).not.toContain('<img');
    expect(output).toContain('diagram');
  });

  it('keeps https images', () => {
    const output = renderMarkdown('![alt](https://example.com/a.png)');
    expect(output).toContain('<img');
    expect(output).toContain('src="https://example.com/a.png"');
  });

  it('honors the breaks option', () => {
    expect(renderMarkdown('a\nb')).not.toContain('<br>');
    expect(renderMarkdown('a\nb', { breaks: true })).toContain('<br>');
  });

  it('returns an empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('');
  });

  it('renders inline markdown without block elements', () => {
    const output = renderMarkdown('**bold** and [x](https://a.b)', { inline: true });
    expect(output).toContain('<strong>bold</strong>');
    expect(output).toContain('href="https://a.b"');
    expect(output).not.toContain('<p>');
  });

  it('sanitizes inline mode the same way as block mode', () => {
    const html = renderMarkdown('hi <img src=x onerror=alert(1)>', { inline: true });
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');

    const link = renderMarkdown('[x](javascript:alert(1))', { inline: true });
    expect(link).not.toContain('javascript:');
    expect(link).not.toContain('<a');
  });
});

// The wrapper is emitted by a post-processor over marked's HTML rather than by a
// renderer override, so it is pinned here on the string it produces. The demo-page
// tests cover the browser behaviour; these cover the contract a demo refactor
// could silently drop.
describe('renderMarkdown — table wrapping', () => {
  const table = '| a | b |\n| --- | --- |\n| 1 | 2 |';

  it('wraps a table in a focusable scroll wrapper', () => {
    const output = renderMarkdown(table);
    expect(output).toContain('<div class="markdown-table-wrapper" tabindex="0"><table>');
    expect(output).toContain('</table></div>');
    expect(output.match(/<div class="markdown-table-wrapper"/g)).toHaveLength(1);
  });

  it('names the region only when a label is supplied', () => {
    const unlabelled = renderMarkdown(table);
    expect(unlabelled).not.toContain('role=');
    expect(unlabelled).not.toContain('aria-label=');

    const labelled = renderMarkdown(table, { tableLabel: 'Recent orders' });
    expect(labelled).toContain(
      '<div class="markdown-table-wrapper" tabindex="0" role="region" aria-label="Recent orders"><table>'
    );

    // An empty label is no label: a region without a name is worse than none.
    const empty = renderMarkdown(table, { tableLabel: '' });
    expect(empty).not.toContain('role=');
    expect(empty).toContain('tabindex="0"');
  });

  it('escapes the label so it cannot break out of the attribute', () => {
    const output = renderMarkdown(table, { tableLabel: 'a"b<c>&d' });
    expect(output).toContain('aria-label="a&quot;b&lt;c&gt;&amp;d"');
    expect(output).not.toContain('aria-label="a"b');
  });

  it('gives each of several tables its own wrapper', () => {
    const output = renderMarkdown(`${table}\n\nbetween\n\n${table}`, { tableLabel: 'x' });
    expect(output.match(/<div class="markdown-table-wrapper"/g)).toHaveLength(2);
    expect(output.match(/<\/table><\/div>/g)).toHaveLength(2);
    expect(output.match(/<table>/g)).toHaveLength(2);
  });

  it('does not wrap in inline mode, which renders no block elements', () => {
    const output = renderMarkdown(table, { inline: true, tableLabel: 'x' });
    expect(output).not.toContain('markdown-table-wrapper');
    expect(output).not.toContain('<table>');
  });

  it('leaves markdown without a table untouched', () => {
    expect(renderMarkdown('plain **text**')).not.toContain('markdown-table-wrapper');
  });
});
