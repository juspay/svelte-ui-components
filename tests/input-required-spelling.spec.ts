import { expect, test } from '@playwright/test';

// `Input` called this `mandatory` before the other form controls gained the platform's
// `required`. Both now resolve to the same real field state, so a consumer can migrate
// call sites one at a time without the field silently becoming optional.
//
// `testId` lands on the field element itself, not a wrapper, so each id IS the input and
// the asterisk is reached through the label that names it rather than as a descendant.
test.describe('Input required and the deprecated mandatory alias', () => {
  const asterisk = (page: import('@playwright/test').Page, testId: string) =>
    page
      .locator('.input-container')
      .filter({ has: page.getByTestId(testId) })
      .locator('.input-mandatory-asterisk');

  test('both spellings produce a genuinely required field', async ({ page }) => {
    await page.goto('/components/input');

    for (const testId of ['input-required', 'input-mandatory']) {
      const field = page.getByTestId(testId);
      await expect(field).toHaveAttribute('aria-required', 'true');
      await expect(field).toHaveJSProperty('required', true);
      // The asterisk keeps its original class, which is public styling API.
      await expect(asterisk(page, testId)).toBeVisible();
    }
  });

  test('a field with neither spelling stays optional', async ({ page }) => {
    await page.goto('/components/input');

    const field = page.getByTestId('input-optional');
    await expect(field).toHaveJSProperty('required', false);
    await expect(field).not.toHaveAttribute('aria-required', 'true');
    await expect(asterisk(page, 'input-optional')).toHaveCount(0);
  });

  test('the browser blocks submission of an empty required field', async ({ page }) => {
    await page.goto('/components/input');

    const validity = await page.getByTestId('input-required').evaluate((node) => {
      const input = node instanceof HTMLInputElement ? node : null;
      if (input === null) {
        return null;
      }
      const empty = input.checkValidity();
      input.value = 'a@b.co';
      return { empty, afterTyping: input.checkValidity() };
    });
    expect(validity).toEqual({ empty: false, afterTyping: true });
  });
});
