import { expect, test } from '@playwright/test';

// Covers the Status `children` snippet: an action area rendered BELOW the
// description, outside `.status-description`.
//
// The distinction is the whole point. `.status-description` carries the
// component's own horizontal padding and bottom margin, so content placed in
// `descriptionSnippet` inherits a text box's geometry. A button or link is not
// description text and should not; `children` renders where `buttonProperties`
// already does. Asserting only "it appears" would pass with the content nested
// in the wrong parent, so the containment check is the assertion that matters.
test.describe('Status children slot', () => {
  test('children renders outside the description box', async ({ page }) => {
    await page.goto('/components/status');

    const host = page.getByTestId('status-children');
    await expect(host).toBeVisible();

    const content = host.getByTestId('status-children-content');
    await expect(content).toBeVisible();

    const nesting = await content.evaluate((el) => ({
      insideDescription: el.closest('.status-description') !== null,
      insidePanel: el.closest('.order-status') !== null
    }));
    expect(nesting.insideDescription).toBe(false);
    expect(nesting.insidePanel).toBe(true);
  });

  test('omitting children renders nothing extra', async ({ page }) => {
    await page.goto('/components/status');

    const host = page.getByTestId('status-default-icon');
    await expect(host.getByTestId('status-children-content')).toHaveCount(0);
  });
});
