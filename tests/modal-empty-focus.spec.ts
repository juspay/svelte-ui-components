import { expect, test } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

for (const semantics of ['generic', 'dialog']) {
  test(`control-free ${semantics} Modal retains real Tab and Shift+Tab focus`, async ({ page }) => {
    await page.goto(
      `${fixtureBaseURL}/modal-viewport/?focus=empty&semantics=${semantics}&transition=off`
    );
    await expect(page.locator('html')).toHaveAttribute('data-fixture-ready', 'true');
    const modal = page.getByTestId('fixture-empty-modal');
    const panel = modal.locator('.modal-content');
    await expect(panel).toBeFocused();
    await expect(modal.locator('.modal-overlay-action')).toHaveAttribute(
      'tabindex',
      semantics === 'dialog' ? '-1' : '0'
    );
    for (const key of ['Tab', 'Tab', 'Shift+Tab', 'Shift+Tab']) {
      await page.keyboard.press(key);
      await expect(panel).toBeFocused();
    }
  });
}
