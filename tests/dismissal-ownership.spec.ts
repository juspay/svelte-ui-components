import { expect, test } from '@playwright/test';

// The point of the shared dismissal stack: when two surfaces are open, Escape
// belongs to the one that opened last. Before it, Modal listened on the window and
// Menu on the document, so a single Escape reached both and closed the modal the
// user had not asked to close along with the menu they had.
test.describe('Escape belongs to the surface that opened last', () => {
  test('closes the menu inside a modal without closing the modal', async ({ page }) => {
    await page.goto('/components/modal');

    await page.getByTestId('nested-menu-modal-trigger').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.getByTestId('nested-menu').getByRole('button', { name: 'Row actions' }).click();
    const menuItem = page.getByRole('menuitem', { name: 'Edit' });
    await expect(menuItem).toBeVisible();

    // First Escape: the menu is on top, so only the menu goes.
    await page.keyboard.press('Escape');
    await expect(menuItem).toBeHidden();
    await expect(dialog).toBeVisible();

    // Second Escape: the modal is topmost again, so now it closes.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('a modal on its own still closes on the first Escape', async ({ page }) => {
    await page.goto('/components/modal');

    await page.getByTestId('nested-menu-modal-trigger').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
