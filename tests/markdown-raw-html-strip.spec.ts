import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Regression coverage for #573, in a real browser rather than over the pure
// string transform: `renderMarkdown` unit tests can only prove what HTML is
// produced, not what a reader ends up seeing once it is parsed into a document.
// The distinction matters here precisely because the feature is about visible
// text -- `&lt;b&gt;` in the markup is the string "<b>" on the page, so the
// assertions below read the rendered text content rather than the HTML.
test.describe('MarkdownText — raw HTML disposal (sanitize.rawHtml)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, '/components/markdown-text');
    // Reading offscreen text passes assertions but records the wrong section.
    await page.getByTestId('markdown-text-raw-escape').scrollIntoViewIfNeeded();
  });

  test('escaping shows raw tags as visible text', async ({ page }) => {
    const escaped = page.getByTestId('markdown-text-raw-escape');
    await expect(escaped).toBeVisible();

    const text = await escaped.innerText();
    expect(text).toContain('<b>bold</b>');
    expect(text).toContain('<div>A whole block of raw HTML.</div>');
  });

  test('stripping removes inline tags but keeps the text they surrounded', async ({ page }) => {
    const stripped = page.getByTestId('markdown-text-raw-strip');
    await expect(stripped).toBeVisible();

    const text = await stripped.innerText();
    expect(text).not.toContain('<b>');
    expect(text).not.toContain('</b>');
    expect(text).toContain('An inline bold tag, written as HTML.');
  });

  test('stripping removes block tags while retaining their text', async ({ page }) => {
    const text = await page.getByTestId('markdown-text-raw-strip').innerText();
    expect(text).not.toContain('<div>');
    expect(text).toContain('A whole block of raw HTML.');
  });

  test('prose containing angle brackets survives both settings', async ({ page }) => {
    // The failure this guards against is silent deletion: `a < b` is a text
    // token, and a strip that reached it would quietly eat arithmetic out of
    // a sentence with nothing to show that it had.
    const escaped = await page.getByTestId('markdown-text-raw-escape').innerText();
    const stripped = await page.getByTestId('markdown-text-raw-strip').innerText();

    expect(escaped).toContain('a < b and c > d');
    expect(stripped).toContain('a < b and c > d');
  });

  test('neither setting lets raw HTML become real markup', async ({ page }) => {
    // The whole point of escaping is that <b> never becomes an element. If a
    // future change made `strip` work by parsing and re-emitting, this would
    // be the test that noticed.
    for (const id of ['markdown-text-raw-escape', 'markdown-text-raw-strip']) {
      await expect(page.getByTestId(id).locator('b')).toHaveCount(0);
      await expect(page.getByTestId(id).locator('div:has-text("A whole block")')).toHaveCount(0);
    }
  });
});
