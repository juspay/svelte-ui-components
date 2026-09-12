import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown';
// Used to build stand-in sanitizers that parse and re-serialise, which is what a
// real sanitizer does. Not an assertion about the library's own parser: if the
// implementation ever swaps parse5 out, these stand-ins still model the
// behaviour under test and only this import moves.
import { parseFragment, serialize } from 'parse5';

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

  it('adds tableWrapperClass so a consumer selector matches the wrapper', () => {
    const output = renderMarkdown(table, { tableWrapperClass: 'markdown-table-scroll' });
    expect(output).toContain(
      '<div class="markdown-table-wrapper markdown-table-scroll" tabindex="0"><table>'
    );
  });

  it('falls back to the default wrapper class when tableWrapperClass is empty', () => {
    const output = renderMarkdown(table, { tableWrapperClass: '' });
    expect(output).toContain('<div class="markdown-table-wrapper" tabindex="0"><table>');
  });

  it('falls back to the default wrapper class when tableWrapperClass is whitespace-only', () => {
    // Pins that a whitespace-only value is trimmed to empty rather than
    // surviving as a meaningless custom class, matching the documented
    // "empty string keeps the default" behaviour for the empty case above.
    const output = renderMarkdown(table, { tableWrapperClass: '   ' });
    expect(output).toContain('<div class="markdown-table-wrapper" tabindex="0"><table>');
  });

  it('combines a custom tableWrapperClass with tableLabel', () => {
    const output = renderMarkdown(table, {
      tableWrapperClass: 'markdown-table-scroll',
      tableLabel: 'Recent orders'
    });
    expect(output).toContain(
      '<div class="markdown-table-wrapper markdown-table-scroll" tabindex="0" role="region" aria-label="Recent orders"><table>'
    );
  });

  it('keeps the built-in wrapper class alongside a custom one', () => {
    // The wrapper is a `tabindex="0"` scroll container (5cb4df4). Its
    // overflow-x, its focus ring and the table's max-content width are all
    // scoped to `.markdown-table-wrapper` in MarkdownText.svelte, and a Svelte
    // scoped selector cannot be templated to a caller's class name. Replacing
    // the class would leave a focusable element that cannot scroll and shows no
    // focus ring -- undoing the accessibility fix that made it focusable.
    const output = renderMarkdown(table, { tableWrapperClass: 'markdown-table-scroll' });
    expect(output).toContain('class="markdown-table-wrapper markdown-table-scroll"');
  });

  it('adds nothing when no custom class is given', () => {
    const output = renderMarkdown(table, {});
    expect(output).toContain('class="markdown-table-wrapper"');
  });

  it('escapes tableWrapperClass so it cannot break out of the attribute', () => {
    const output = renderMarkdown(table, { tableWrapperClass: '" onmouseover="alert(1)' });
    // The hostile value must never appear as a live, unescaped attribute --
    // that would close `class="..."` early and inject a new attribute.
    expect(output).not.toContain('" onmouseover="alert(1)"');
    expect(output).not.toContain('<div class="" onmouseover=');
    expect(output).toContain('class="markdown-table-wrapper &quot; onmouseover=&quot;alert(1)"');
  });
});

describe('renderMarkdown — injected raw-HTML sanitizer', () => {
  const raw = 'Hello <b>bold</b> and <img src=x onerror=alert(1)>';

  it('escapes raw HTML by default, exactly as before', () => {
    const output = renderMarkdown(raw);
    expect(output).toContain('&lt;b&gt;bold&lt;/b&gt;');
    expect(output).not.toContain('<b>bold</b>');
  });

  it('still escapes when sanitize mode is on but no sanitizer is supplied', () => {
    // The unsafe path has to be unreachable by OMISSION, not by discipline.
    // Turning the flag on without supplying a sanitizer must not start emitting
    // raw HTML -- a consumer who half-configures this gets today's behaviour.
    const output = renderMarkdown(raw, { sanitize: { rawHtml: 'sanitize' } });
    expect(output).toContain('&lt;b&gt;bold&lt;/b&gt;');
    expect(output).not.toContain('<b>bold</b>');
  });

  it('routes the raw token through a supplied sanitizer and emits its output', () => {
    const seen: string[] = [];
    const output = renderMarkdown(raw, {
      sanitize: {
        rawHtml: 'sanitize',
        htmlSanitizer: (html) => {
          seen.push(html);
          return html.replace(/<img[^>]*>/g, '');
        }
      }
    });

    // The library hands over the raw token and inserts what comes back. It does
    // not decide content policy, and it does not second-guess the result.
    expect(seen.join('')).toContain('<b>');
    expect(output).toContain('<b>bold</b>');
    expect(output).not.toContain('onerror');
  });

  it('falls back to escaping when the sanitizer throws', () => {
    // A consumer's sanitizer is arbitrary code. If it fails, the safe path is
    // the one that was already there -- never the raw token.
    const output = renderMarkdown(raw, {
      sanitize: {
        rawHtml: 'sanitize',
        htmlSanitizer: () => {
          throw new Error('sanitizer exploded');
        }
      }
    });
    expect(output).toContain('&lt;b&gt;bold&lt;/b&gt;');
    expect(output).not.toContain('<b>bold</b>');
  });

  it('falls back to escaping when the sanitizer returns a non-string', () => {
    const output = renderMarkdown(raw, {
      sanitize: {
        rawHtml: 'sanitize',
        htmlSanitizer: () => null as unknown as string
      }
    });
    expect(output).toContain('&lt;b&gt;bold&lt;/b&gt;');
  });

  it('ignores a sanitizer while the mode is escape or strip', () => {
    // The sanitizer is only consulted in sanitize mode, so supplying one cannot
    // silently change what the other two modes do.
    const escaped = renderMarkdown(raw, {
      sanitize: { rawHtml: 'escape', htmlSanitizer: (html) => html }
    });
    expect(escaped).toContain('&lt;b&gt;bold&lt;/b&gt;');

    const stripped = renderMarkdown(raw, {
      sanitize: { rawHtml: 'strip', htmlSanitizer: (html) => html }
    });
    expect(stripped).not.toContain('<b>');
    expect(stripped).not.toContain('&lt;b&gt;');
  });

  it('applies in inline mode too', () => {
    const output = renderMarkdown('an <b>inline</b> tag', {
      inline: true,
      sanitize: { rawHtml: 'sanitize', htmlSanitizer: (html) => html }
    });
    expect(output).toContain('<b>');
  });

  it('does not let a sanitizer widen the link protocol allow-list', () => {
    // Markdown links go through hasSafeProtocol regardless of raw-HTML policy.
    // A permissive sanitizer must not reach markdown-syntax links at all.
    const output = renderMarkdown('[click](javascript:alert(1))', {
      sanitize: { rawHtml: 'sanitize', htmlSanitizer: (html) => html }
    });
    expect(output).not.toContain('javascript:');
  });
});

describe('rawHtml: sanitize — the trust boundary', () => {
  // The library does not second-guess the sanitizer. A caller who passes a
  // permissive one gets exactly what it returns, script tag and all. Asserting
  // that explicitly is the point: it pins the contract, and it would fail if the
  // library ever started re-escaping the sanitizer's output -- which would look
  // like a safety improvement while silently breaking every correct caller.
  /*
   * Where the protocol allow-list stops. Both halves are asserted together
   * because the asymmetry is the contract: markdown syntax is the library's to
   * guard, raw HTML is the caller's. Re-checking the second would mean parsing
   * and rewriting the sanitizer's output, which is the sanitization this option
   * exists to delegate -- so the boundary is pinned rather than closed, and it
   * cannot move without this test changing.
   */
  it('guards a markdown-syntax javascript: link but not a raw-HTML one', () => {
    const permissive = (html: string): string => html;

    expect(
      renderMarkdown('[click](javascript:alert(1))', {
        sanitize: { rawHtml: 'sanitize', htmlSanitizer: permissive }
      })
    ).not.toContain('javascript:');

    expect(
      renderMarkdown('<a href="javascript:alert(1)">click</a>', {
        sanitize: { rawHtml: 'sanitize', htmlSanitizer: permissive }
      })
    ).toContain('javascript:alert(1)');
  });

  it('emits whatever the sanitizer returns, including markup it did not remove', () => {
    const output = renderMarkdown('<script>alert(1)</script>', {
      sanitize: { rawHtml: 'sanitize', htmlSanitizer: (html) => html }
    });
    expect(output).toContain('<script>alert(1)</script>');
  });

  /*
   * The mirror of the case above, because the contract cuts both ways and the
   * caller's configuration decides which side they land on. Stands in for
   * `DOMPurify.sanitize(html, { ALLOWED_TAGS })` without the dependency.
   *
   * Deliberately a parse-and-prune rather than a regex. A regex tag filter is
   * the exact thing this PR argues a caller should not write -- `/<\/script>/`
   * alone does not match `</script >`, which CodeQL flags as `js/bad-tag-filter`
   * -- and a test is read as an example whether or not it is meant as one.
   */
  type PruneNode = { nodeName: string; childNodes?: PruneNode[] };
  const withoutScripts = (html: string): string => {
    const prune = (node: PruneNode): void => {
      if (!node.childNodes) {
        return;
      }
      node.childNodes = node.childNodes.filter((child) => child.nodeName !== 'script');
      node.childNodes.forEach(prune);
    };
    const fragment = parseFragment(html);
    prune(fragment);
    return serialize(fragment);
  };

  it('a sanitizer that drops script elements removes them, and keeps the prose around them', () => {
    const output = renderMarkdown('before <script>alert(1)</script> after', {
      sanitize: { rawHtml: 'sanitize', htmlSanitizer: withoutScripts }
    });
    expect(output).not.toContain('<script');
    expect(output).toContain('before');
    expect(output).toContain('after');
  });

  it('drops a script element written with a spaced end tag, which a regex filter misses', () => {
    const output = renderMarkdown('before <script>alert(1)</script > after', {
      sanitize: { rawHtml: 'sanitize', htmlSanitizer: withoutScripts }
    });
    expect(output).not.toContain('<script');
    expect(output).not.toContain('alert(1)');
  });

  /*
   * The fallback is not merely "safe", it is the escape path byte for byte.
   * That matters for SSR: a browser-only sanitizer throws on the server and
   * succeeds on the client, and this pins the server half to a known rendering
   * rather than to something the fallback invented.
   */
  it('a throwing sanitizer produces exactly what escape mode produces', () => {
    const source = 'Hello <b>bold</b>\n\n<div class="callout">\n\n**inside**\n\n</div>';
    const thrown = renderMarkdown(source, {
      sanitize: {
        rawHtml: 'sanitize',
        htmlSanitizer: () => {
          throw new Error('no DOM on the server');
        }
      }
    });
    expect(thrown).toBe(renderMarkdown(source, { sanitize: { rawHtml: 'escape' } }));
  });

  it('falls back to escaping when the sanitizer throws', () => {
    const output = renderMarkdown('<b>hi</b>', {
      sanitize: {
        rawHtml: 'sanitize',
        htmlSanitizer: () => {
          throw new Error('boom');
        }
      }
    });
    expect(output).not.toContain('<b>');
    expect(output).toContain('&lt;b&gt;');
  });
});

describe('rawHtml: sanitize — one pass over the assembled output', () => {
  /*
   * A real sanitizer parses its input into a tree and serialises that tree back,
   * so an unbalanced fragment is balanced where it stands: `<div>` comes back as
   * `<div></div>` and a lone `</div>` comes back as nothing. parse5 is what
   * DOMPurify's own parse-and-reserialise step amounts to, so this stands in for
   * it faithfully without taking the dependency.
   */
  const balancing = (html: string): string => serialize(parseFragment(html));

  // marked emits the open and close of a block-level container as two separate
  // html tokens with the markdown between them as its own block.
  const container = '<div class="callout">\n\n**important**\n\n</div>';

  it('keeps markdown content inside the raw-HTML container that wraps it', () => {
    const output = renderMarkdown(container, {
      sanitize: { rawHtml: 'sanitize', htmlSanitizer: balancing }
    });

    expect(output).toMatch(/<div class="callout">\s*<p><strong>important<\/strong><\/p>\s*<\/div>/);
  });

  it('hands the sanitizer one assembled document rather than per-token fragments', () => {
    const seen: string[] = [];
    renderMarkdown(container, {
      sanitize: {
        rawHtml: 'sanitize',
        htmlSanitizer: (html) => {
          seen.push(html);
          return html;
        }
      }
    });

    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain('<div class="callout">');
    expect(seen[0]).toContain('<strong>important</strong>');
  });
});
