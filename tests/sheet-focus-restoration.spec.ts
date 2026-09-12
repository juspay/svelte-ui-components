import { expect, test } from '@playwright/test';

// Sheet moves focus into its panel on open. Until this pass it never gave focus
// back, so closing left a keyboard user at the top of the document with no way
// back to the control they opened it from -- the same contract Modal and
// ChatBubble already honour.
//
// Asserted in a real browser rather than jsdom: the panel closes through
// transition:fly, Svelte drives outros with the Web Animations API, and jsdom
// implements none of it, so the panel is never torn down there and the teardown
// that restores focus never runs.
test.describe('Sheet returns focus to its opener', () => {
  test('closing by Escape puts focus back on the trigger', async ({ page }) => {
    await page.goto('/components/sheet');

    const trigger = page.getByTestId('sheet-right-trigger');
    await trigger.focus();
    await trigger.press('Enter');

    // Asserted through the dialog role rather than the component's test id, which
    // names the overlay; what matters is that focus left the trigger and came back.
    const panel = page.getByRole('dialog');
    await expect(panel).toBeVisible();
    await expect(trigger).not.toBeFocused();

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('the page scrolls again once the sheet has closed', async ({ page }) => {
    await page.goto('/components/sheet');

    const trigger = page.getByTestId('sheet-bottom-trigger');
    await trigger.click();
    await expect(page.getByTestId('sheet-bottom')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('sheet-bottom')).toBeHidden();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
  });
});
