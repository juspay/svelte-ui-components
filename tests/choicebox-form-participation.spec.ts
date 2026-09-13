import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * In a real browser: jsdom can build `FormData` from a form, but it cannot
 * show that native constraint validation blocks a submission, that the browser
 * leaves focus somewhere reachable when it does, or that a grouped radio set is
 * actually navigable by keyboard under one tab stop.
 *
 * Mirrors `tests/form-control-submission.spec.ts`, which does the same for the
 * four controls that already had form participation before Choicebox did.
 */
test.describe('Choicebox takes part in native form submission', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, '/components/choicebox');
  });

  test('a required radio group blocks submission until one card is chosen', async ({ page }) => {
    const result = page.getByTestId('choicebox-form-result');
    await page.getByTestId('choicebox-form-submit').click();
    await expect(result).toHaveText('');

    await page.getByTestId('choicebox-form-basic').click();
    await page.getByTestId('choicebox-form-submit').click();
    await expect(result).toHaveText('plan=basic');
  });

  test('choosing the other card replaces the entry rather than adding one', async ({ page }) => {
    await page.getByTestId('choicebox-form-pro').click();
    await page.getByTestId('choicebox-form-submit').click();
    await expect(page.getByTestId('choicebox-form-result')).toHaveText('plan=pro');

    // The exclusivity a native radio group gets from the browser: exactly one
    // entry under the name, never two.
    await page.getByTestId('choicebox-form-basic').click();
    await page.getByTestId('choicebox-form-submit').click();
    await expect(page.getByTestId('choicebox-form-result')).toHaveText('plan=basic');
  });

  test('a checkbox-mode card submits alongside the radio group', async ({ page }) => {
    await page.getByTestId('choicebox-form-basic').click();
    await page.getByTestId('choicebox-form-addon').click();
    await page.getByTestId('choicebox-form-submit').click();

    await expect(page.getByTestId('choicebox-form-result')).toHaveText(
      'plan=basic addons=insurance'
    );
  });

  test('the group is one tab stop, and the arrow keys move the choice inside it', async ({
    page
  }) => {
    await page.getByTestId('choicebox-form-basic').click();
    await expect(page.getByTestId('choicebox-form-basic')).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(page.getByTestId('choicebox-form-pro')).toBeFocused();
    await expect(page.getByTestId('choicebox-form-pro')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('choicebox-form-basic')).toHaveAttribute('aria-checked', 'false');

    // Tab leaves the group entirely rather than stepping to the next card,
    // which is what "one tab stop" means.
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('choicebox-form-addon')).toBeFocused();
  });

  test('the hidden control never takes focus away from the card', async ({ page }) => {
    await page.getByTestId('choicebox-form-basic').click();
    const focusedIsTheCard = await page.evaluate(
      () => document.activeElement?.getAttribute('data-pw') ?? null
    );
    expect(focusedIsTheCard).toBe('choicebox-form-basic');
  });
});
