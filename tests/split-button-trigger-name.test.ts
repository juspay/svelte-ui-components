import { expect, test } from '@playwright/test';

// SplitButton's second control renders a chevron and nothing else, inside Menu's
// inert-trigger branch. That branch is the right one here — the snippet holds no real
// control — but Menu names its wrapper from `triggerAriaLabel`, which SplitButton never
// passed. The result was a focusable role="button" with no accessible name at all: not
// a weak name, none, since there is no text to fall back on either.
test.describe('SplitButton — the dropdown trigger has a name', () => {
  test('it defaults to a name derived from the primary text', async ({ page }) => {
    await page.goto('/components/split-button');

    const trigger = page.locator('[data-pw="split-button-default"] .menu-trigger');
    await expect(trigger).toHaveAttribute('role', 'button');
    await expect(trigger).toHaveAccessibleName('More Save options');
  });

  test('triggerAriaLabel overrides the default', async ({ page }) => {
    await page.goto('/components/split-button');

    const trigger = page.locator('[data-pw="split-button-named"] .menu-trigger');
    await expect(trigger).toHaveAccessibleName('Choose an export format');
  });

  test('the primary button keeps its own name, distinct from the trigger', async ({ page }) => {
    await page.goto('/components/split-button');

    // The two controls sit side by side and must not announce identically, which is the
    // reason the default derives from the text rather than being a bare "More options".
    const root = page.locator('[data-pw="split-button-default"]');
    await expect(root.locator('.split-button-primary button')).toHaveAccessibleName('Save');
    await expect(root.locator('.menu-trigger')).toHaveAccessibleName('More Save options');
  });

  test('naming the trigger does not stop it opening the menu', async ({ page }) => {
    await page.goto('/components/split-button');

    const trigger = page.locator('[data-pw="split-button-named"] .menu-trigger');
    await trigger.click();

    await expect(page.getByRole('menuitem', { name: 'XLSX' })).toBeVisible();
  });
});
