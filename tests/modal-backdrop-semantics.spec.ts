import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Modal independent backdrop, ${theme}`, () => {
    test.use({ colorScheme: theme });
    for (const name of [
      'Open modal with back button',
      'Open centered modal (slide-up)',
      'Open outer'
    ]) {
      test(`generic ${name} keeps its controls outside the backdrop button`, async ({ page }) => {
        await gotoHydrated(page, '/components/modal');
        const trigger = page.getByRole('button', { name, exact: true });
        await trigger.focus();
        await page.keyboard.press('Enter');
        const panel = page.locator('.modal-content');
        const backdrop = page.locator('button.modal-overlay-action');
        await expect(panel).toBeVisible();
        await expect(backdrop).toHaveAccessibleName('Dismiss modal');
        await expect(backdrop).toHaveAttribute('tabindex', '0');
        expect(
          await panel.evaluate((el) => el.parentElement?.closest('button,[role="button"]') !== null)
        ).toBe(false);
        expect(
          await backdrop.evaluate((el) => el.querySelector('button,[role="button"],input') !== null)
        ).toBe(false);
        const controls = panel.locator('button,[role="button"]');
        expect(await controls.count()).toBeGreaterThan(0);
        await backdrop.focus();
        await page.keyboard.press('Enter');
        await expect(panel).toHaveCount(0);
        await expect(trigger).toBeFocused();
      });
    }

    test('named dialog backdrop stays outside its Tab cycle and still dismisses by pointer', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/modal');
      await page.getByRole('button', { name: 'Open Modal', exact: true }).click();
      const panel = page.getByRole('alertdialog', { name: 'Confirm Action' });
      const backdrop = page.locator('button.modal-overlay-action');
      await expect(panel).toBeVisible();
      await expect(backdrop).toHaveAttribute('tabindex', '-1');
      await backdrop.click({ position: { x: 10, y: 10 } });
      await expect(panel).toHaveCount(0);
    });
  });
}
