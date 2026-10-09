import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

for (const theme of ['light', 'dark'] as const) {
  test.describe(`example documentation, ${theme}`, () => {
    test.use({ colorScheme: theme });

    test('the spaced Color Picker route shows its actual documentation', async ({ page }) => {
      await gotoHydrated(page, '/components/color-picker');
      const documentation = page.locator('main .docs-section');
      await expect(
        documentation.getByRole('heading', { name: 'Documentation', exact: true })
      ).toBeVisible();
      await expect(documentation).toContainText('ariaLabel');
      await expect(documentation.locator('table')).not.toHaveCount(0);
      await expect(page).toHaveTitle('Color Picker — Svelte UI');
    });

    test('exact-name documentation still renders after client navigation', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await gotoHydrated(page, '/components/color-picker');
      await page
        .getByRole('navigation', { name: 'Components' })
        .getByRole('link', { name: 'Select', exact: true })
        .click();
      await expect(page).toHaveURL(/\/components\/select$/);
      await expect(
        page
          .locator('main .docs-section')
          .getByRole('heading', { name: 'Documentation', exact: true })
      ).toBeVisible();
      await expect(page.locator('main .docs-section')).toContainText('ariaLabelledby');
    });
  });
}
