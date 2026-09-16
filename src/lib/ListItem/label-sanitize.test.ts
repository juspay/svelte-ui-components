import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ListItem from './ListItem.svelte';
import { resolveLabelHtml } from './label';

/**
 * Regression coverage for docs/BITS_UI_COMPARISON.md's "Still open" finding:
 * ListItem rendered `label` through `{@html}` unconditionally, with no way to
 * opt out. That made every `label` a live injection surface -- a consumer
 * passing user- or feed-sourced text into `label` got it rendered as markup,
 * whether they wanted that or not.
 *
 * The fix mirrors the position MarkdownText's `htmlSanitizer` already takes
 * (PR 608): this library does not implement HTML sanitization itself.
 * `label` now escapes by default -- a provably safe default -- and a consumer
 * who genuinely wants markup opts in with `sanitize.rawHtml: 'sanitize'` plus
 * a `sanitize.htmlSanitizer` they supply.
 */
describe('resolveLabelHtml', () => {
  it('escapes markup by default', () => {
    expect(resolveLabelHtml('<b>bold</b>')).toBe('&lt;b&gt;bold&lt;/b&gt;');
  });

  it('escapes ampersands and quotes too, not only angle brackets', () => {
    expect(resolveLabelHtml(`Tom & "Jerry" <script>`)).toBe(
      'Tom &amp; &quot;Jerry&quot; &lt;script&gt;'
    );
  });

  it('sanitize mode with no htmlSanitizer behaves exactly like escape -- unreachable by omission, not by discipline', () => {
    const label = '<img src=x onerror="fire()">';
    expect(resolveLabelHtml(label, { rawHtml: 'sanitize' })).toBe(resolveLabelHtml(label));
  });

  it('sanitize mode renders exactly what the supplied sanitizer returns', () => {
    const htmlSanitizer = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, '');
    expect(
      resolveLabelHtml('<b>ok</b><script>evil()</script>', { rawHtml: 'sanitize', htmlSanitizer })
    ).toBe('<b>ok</b>');
  });

  it('falls back to escaping when the sanitizer throws', () => {
    const htmlSanitizer = (): string => {
      throw new Error('boom');
    };
    const label = '<b>x</b>';
    expect(resolveLabelHtml(label, { rawHtml: 'sanitize', htmlSanitizer })).toBe(
      resolveLabelHtml(label)
    );
  });

  it('falls back to escaping when the sanitizer returns a non-string', () => {
    const htmlSanitizer = () => null as unknown as string;
    const label = '<b>x</b>';
    expect(resolveLabelHtml(label, { rawHtml: 'sanitize', htmlSanitizer })).toBe(
      resolveLabelHtml(label)
    );
  });

  it("'escape' is a no-op even when explicitly requested alongside a sanitizer that is never consulted", () => {
    const htmlSanitizer = () => '<div>should not appear</div>';
    expect(resolveLabelHtml('<b>x</b>', { rawHtml: 'escape', htmlSanitizer })).toBe(
      resolveLabelHtml('<b>x</b>')
    );
  });
});

describe('ListItem label rendering -- injection risk closed (docs/BITS_UI_COMPARISON.md "Still open")', () => {
  it('renders a markup-bearing label as escaped plain text by default, creating no element from it', () => {
    const { container } = render(ListItem, {
      label: '<img src="x" onerror="window.__xss_fired = true">'
    });

    // The label never became a real <img> -- it stayed inert text.
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.center-text')?.textContent).toBe(
      '<img src="x" onerror="window.__xss_fired = true">'
    );
  });

  it('renders label as markup when a consumer opts in with sanitize.rawHtml + htmlSanitizer', () => {
    const { container } = render(ListItem, {
      label: '<b>Loud</b><script>window.__xss_fired = true</script>',
      sanitize: {
        rawHtml: 'sanitize',
        htmlSanitizer: (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, '')
      }
    });

    const bold = container.querySelector('.center-text b');
    expect(bold?.textContent).toBe('Loud');
    expect(container.querySelector('script')).toBeNull();
  });

  it('a consumer who wants the previous unconditional passthrough back must say so explicitly, with an identity sanitizer', () => {
    const { container } = render(ListItem, {
      label: '<b>legacy markup</b>',
      sanitize: { rawHtml: 'sanitize', htmlSanitizer: (html: string) => html }
    });

    expect(container.querySelector('.center-text b')?.textContent).toBe('legacy markup');
  });

  it('sanitize with no htmlSanitizer still escapes -- a half-configured consumer does not leak markup', () => {
    const { container } = render(ListItem, {
      label: '<b>x</b>',
      sanitize: { rawHtml: 'sanitize' }
    });

    expect(container.querySelector('.center-text b')).toBeNull();
    expect(container.querySelector('.center-text')?.textContent).toBe('<b>x</b>');
  });
});
