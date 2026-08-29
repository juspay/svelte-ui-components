import { expect, test } from '@playwright/test';

// Covers the Status `descriptionSnippet`: a consumer can render a description it
// does not control as escaped text, instead of the {@html} interpolation that the
// `statusDescription` string prop uses.
//
// Both instances on the demo page are handed the SAME string. The pair is the
// point — one asserts the {@html} path still parses markup (so the existing
// behaviour is intact), the other asserts the snippet path does not (so the
// escape is real). Either test alone would pass against a broken implementation.
test.describe('Status descriptionSnippet', () => {
  test('statusDescription still interpolates markup as markup', async ({ page }) => {
    await page.goto('/components/status');

    const host = page.getByTestId('status-description-html');
    await expect(host).toBeVisible();

    // The string prop goes through {@html}, so the span became a real element.
    await expect(host.getByTestId('injected-markup')).toBeVisible();
  });

  test('descriptionSnippet renders the same string as escaped text', async ({ page }) => {
    await page.goto('/components/status');

    const host = page.getByTestId('status-description-snippet');
    await expect(host).toBeVisible();

    // No element was created from the string — the snippet escaped it.
    await expect(host.getByTestId('injected-markup')).toHaveCount(0);
    await expect(host).toContainText('<span data-pw="injected-markup">injected</span>');
  });

  test('omitting the snippet leaves the default description path unchanged', async ({ page }) => {
    await page.goto('/components/status');

    await expect(page.getByTestId('status-default-icon')).toContainText(
      'Your order has been confirmed'
    );
  });
});
