import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown';

// Regression coverage for #524: MarkdownText's link/image protocol allow-list
// was fixed (http/https/mailto/tel for links, http/https for images) with no
// way to narrow it, forcing consumers whose own link policy is stricter (e.g.
// http(s)-only, no live mailto:/tel:) to pre-mangle the markdown SOURCE with
// their own regex before it ever reached this component. `sanitize.
// allowedProtocols` removes that workaround by letting a caller restrict
// which of the library's own default protocols survive, without touching the
// "raw HTML never passes through" guarantee, which stays unconditional.
describe('renderMarkdown — configurable protocol allow-list (sanitize.allowedProtocols)', () => {
  it('keeps the default allow-list when sanitize is not supplied', () => {
    expect(renderMarkdown('[a](https://example.com)')).toContain('href="https://example.com"');
    expect(renderMarkdown('[a](mailto:x@y.z)')).toContain('href="mailto:x@y.z"');
    expect(renderMarkdown('[a](tel:+15550100)')).toContain('href="tel:+15550100"');
  });

  it('drops mailto: and tel: links when allowedProtocols narrows to http(s) only', () => {
    const sanitize = { allowedProtocols: ['http:', 'https:'] };

    const https = renderMarkdown('[a](https://example.com)', { sanitize });
    expect(https).toContain('href="https://example.com"');

    const mail = renderMarkdown('[a](mailto:x@y.z)', { sanitize });
    expect(mail).not.toContain('href="mailto:');
    expect(mail).not.toContain('<a');
    expect(mail).toContain('a');

    const tel = renderMarkdown('[a](tel:+15550100)', { sanitize });
    expect(tel).not.toContain('href="tel:');
    expect(tel).not.toContain('<a');
  });

  it('cannot widen the allow-list beyond the library default for that surface', () => {
    // javascript: was never a default-safe link protocol, so listing it here
    // must not resurrect it -- allowedProtocols can only narrow.
    const output = renderMarkdown('[x](javascript:alert(1))', {
      sanitize: { allowedProtocols: ['javascript:', 'http:', 'https:'] }
    });
    expect(output).not.toContain('javascript:');
    expect(output).not.toContain('<a');
  });

  it('applies the same narrowed allow-list to images', () => {
    const sanitize = { allowedProtocols: ['https:'] };
    const httpImage = renderMarkdown('![alt](http://example.com/a.png)', { sanitize });
    expect(httpImage).not.toContain('<img');
    expect(httpImage).toContain('alt');

    const httpsImage = renderMarkdown('![alt](https://example.com/a.png)', { sanitize });
    expect(httpsImage).toContain('<img');
    expect(httpsImage).toContain('src="https://example.com/a.png"');
  });

  it('an empty allow-list drops every link and image, keeping their text', () => {
    const sanitize = { allowedProtocols: [] as string[] };
    const link = renderMarkdown('[a](https://example.com)', { sanitize });
    expect(link).not.toContain('<a');
    expect(link).toContain('a');

    const image = renderMarkdown('![alt](https://example.com/a.png)', { sanitize });
    expect(image).not.toContain('<img');
    expect(image).toContain('alt');
  });

  it('raw HTML still always escapes regardless of sanitize', () => {
    const output = renderMarkdown('<script>alert(1)</script>', {
      sanitize: { allowedProtocols: ['http:', 'https:'] }
    });
    expect(output).not.toContain('<script>');
    expect(output).toContain('&lt;script&gt;');
  });

  it('is case-insensitive and does not carry state between differently-configured renders', () => {
    const upper = renderMarkdown('[a](mailto:x@y.z)', {
      sanitize: { allowedProtocols: ['HTTP:', 'HTTPS:'] }
    });
    expect(upper).not.toContain('href="mailto:');

    // Re-requesting the unrestricted default after a narrowed render must not
    // have been left narrowed by a shared cache entry.
    expect(renderMarkdown('[a](mailto:x@y.z)')).toContain('href="mailto:x@y.z"');
  });
});

// Regression coverage for #524's second half: the only escape hatch from a
// markdown-generated tag the library itself decided to allow (images, in
// particular) used to be pre-mangling the SOURCE by hand or keeping a whole
// second hand-rolled renderer around, because MarkdownText's own tags were
// not configurable at all. `sanitize.allowedTags` narrows which
// markdown-GENERATED tags render as themselves; everything else still comes
// through as plain text, never dropped outright.
describe('renderMarkdown — configurable tag allow-list (sanitize.allowedTags)', () => {
  it('renders every tag normally when allowedTags is not supplied', () => {
    const output = renderMarkdown('# Title\n\n**bold** and ![alt](https://example.com/a.png)');
    expect(output).toContain('<h1>');
    expect(output).toContain('<strong>');
    expect(output).toContain('<img');
  });

  it('drops images (keeping alt text) when "img" is left out of allowedTags', () => {
    const output = renderMarkdown('![a cat](https://example.com/cat.png)', {
      sanitize: { allowedTags: ['p'] }
    });
    expect(output).not.toContain('<img');
    expect(output).toContain('a cat');
  });

  it('an unsafe protocol is still stripped even when its tag is in allowedTags', () => {
    // allowedTags narrows further than the protocol guard; it must never
    // reopen a hole the protocol allow-list already closed.
    const output = renderMarkdown('[x](javascript:alert(1))', {
      sanitize: { allowedTags: ['a'] }
    });
    expect(output).not.toContain('javascript:');
    expect(output).not.toContain('<a');
  });

  it('flattens headings to plain inline text, keeping nested formatting', () => {
    const output = renderMarkdown('# **Loud** Title', {
      sanitize: { allowedTags: ['strong'] }
    });
    expect(output).not.toContain('<h1>');
    expect(output).toContain('<strong>Loud</strong>');
  });

  it('drops list markup but keeps each item\'s content when "ul" is excluded', () => {
    const output = renderMarkdown('- one\n- two', { sanitize: { allowedTags: ['p'] } });
    expect(output).not.toContain('<ul>');
    expect(output).not.toContain('<li>');
    expect(output).toContain('one');
    expect(output).toContain('two');
  });

  it('degrades a table to plain text rows when "table" is excluded', () => {
    const output = renderMarkdown('| A | B |\n| --- | --- |\n| 1 | 2 |', {
      sanitize: { allowedTags: ['p'] }
    });
    expect(output).not.toContain('<table>');
    expect(output).toContain('A');
    expect(output).toContain('1');
  });

  it('raw HTML still always escapes regardless of allowedTags', () => {
    const output = renderMarkdown('<script>alert(1)</script>', {
      sanitize: { allowedTags: ['script'] }
    });
    expect(output).not.toContain('<script>alert');
    expect(output).toContain('&lt;script&gt;');
  });

  it('an unrecognised tag name is ignored rather than erroring', () => {
    expect(() =>
      renderMarkdown('**bold**', { sanitize: { allowedTags: ['not-a-real-tag'] } })
    ).not.toThrow();
  });
});

// Regression coverage for #524's task-list half: GFM task-list checkboxes
// always render, with no way to keep the plain list text instead.
describe('renderMarkdown — task-list checkboxes (sanitize.disableTaskLists)', () => {
  it('renders a disabled checkbox by default', () => {
    const output = renderMarkdown('- [ ] todo\n- [x] done');
    expect(output).toContain('type="checkbox"');
    expect(output).toContain('disabled');
  });

  it('drops the checkbox but keeps the item text when disableTaskLists is true', () => {
    const output = renderMarkdown('- [ ] todo\n- [x] done', {
      sanitize: { disableTaskLists: true }
    });
    expect(output).not.toContain('type="checkbox"');
    expect(output).toContain('todo');
    expect(output).toContain('done');
    expect(output).toContain('<li>');
  });

  it('does not carry the toggle between differently-configured renders', () => {
    const off = renderMarkdown('- [ ] todo', { sanitize: { disableTaskLists: true } });
    expect(off).not.toContain('type="checkbox"');
    expect(renderMarkdown('- [ ] todo')).toContain('type="checkbox"');
  });
});
