import { expect, test } from '@playwright/test';

// <input type="radio"> gets grouping, single-tab-stop, and arrow-key roving selection
// entirely from the browser once radios share a name — Radio.svelte adds no custom
// keydown handling. These tests pin that native contract so a future rewrite (e.g.
// swapping the native input for a custom div) cannot lose it silently.
test.describe('Radio keyboard interaction (native radio group)', () => {
  test('the checked radio is the only member reachable by Tab (single-tab-stop group)', async ({
    page
  }) => {
    await page.goto('/components/radio');

    const upi = page.getByRole('radio', { name: 'UPI' });
    const card = page.getByRole('radio', { name: 'Card' });
    const netbanking = page.getByRole('radio', { name: 'Net Banking' });

    await upi.focus();
    await expect(upi).toBeFocused();

    // Leave the group and re-enter from just outside it — only the checked radio is
    // a tab stop, so forward Tab must land straight back on it, never on a sibling.
    await page.keyboard.press('Shift+Tab');
    await expect(upi).not.toBeFocused();
    await page.keyboard.press('Tab');
    await expect(upi).toBeFocused();
    await expect(card).not.toBeFocused();
    await expect(netbanking).not.toBeFocused();
  });

  test('ArrowDown/ArrowUp move focus and selection together across the group', async ({ page }) => {
    await page.goto('/components/radio');

    const upi = page.getByRole('radio', { name: 'UPI' });
    const card = page.getByRole('radio', { name: 'Card' });
    const netbanking = page.getByRole('radio', { name: 'Net Banking' });

    await upi.focus();
    await page.keyboard.press('ArrowDown');
    await expect(card).toBeFocused();
    await expect(card).toBeChecked();
    await expect(upi).not.toBeChecked();

    await page.keyboard.press('ArrowDown');
    await expect(netbanking).toBeFocused();
    await expect(netbanking).toBeChecked();

    await page.keyboard.press('ArrowUp');
    await expect(card).toBeFocused();
    await expect(card).toBeChecked();
  });

  test('each radio carries its accessible name from the associated label text', async ({
    page
  }) => {
    await page.goto('/components/radio');

    // The native input is visually replaced by a custom .radio-indicator sibling
    // (width/height 0, opacity 0 — a standard accessible custom-control pattern, not
    // display:none/visibility:hidden/aria-hidden), so it never has a paintable box for
    // toBeVisible(). getByRole resolving each of these by name already proves the
    // accessible name comes from the label; toBeAttached() confirms that resolution
    // found a real element rather than timing out.
    await expect(page.getByRole('radio', { name: 'UPI' })).toBeAttached();
    await expect(page.getByRole('radio', { name: 'Card' })).toBeAttached();
    await expect(page.getByRole('radio', { name: 'Net Banking' })).toBeAttached();
  });

  test('selecting via the keyboard is reflected in the page state', async ({ page }) => {
    await page.goto('/components/radio');

    await page.getByRole('radio', { name: 'UPI' }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.state-display')).toHaveText('Selected: card');
  });
});
