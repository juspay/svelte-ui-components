import { expect, test } from '@playwright/test';

// The existing overtype test passed on macOS and failed on Linux CI, because it
// relied on where Chromium happens to put the caret when you click a filled
// single-character field: after the character on macOS, before it on Linux.
// These tests pin the caret explicitly instead of inheriting the platform's
// choice, so the behaviour is asserted rather than the environment.

const inject = (element: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
};

/** Types a character with the caret forced to a known offset. */
async function typeAtCaret(
  page: import('@playwright/test').Page,
  locator: import('@playwright/test').Locator,
  caret: number,
  character: string
) {
  await locator.evaluate((element, offset) => {
    const field = element as HTMLInputElement;
    field.focus();
    field.setSelectionRange(offset, offset);
  }, caret);
  await page.keyboard.type(character);
}

test.describe('SplitInput — overtyping is independent of caret position', () => {
  for (const caret of [0, 1]) {
    test(`the newly typed digit wins when the caret sits at offset ${caret}`, async ({ page }) => {
      await page.goto('/components/split-input');

      const inputs = page.getByTestId('split-input-default').locator('input');
      await inputs.nth(0).evaluate(inject, '1234');
      await expect(inputs.nth(3)).toHaveValue('4');

      // Field 1 holds "2". Typing 7 must leave "7" whether the browser inserts
      // before the existing digit (offset 0 -> "72") or after it (offset 1 ->
      // "27"). Taking the last character of the raw string picks the old digit
      // in the first case.
      await typeAtCaret(page, inputs.nth(1), caret, '7');

      await expect(inputs.nth(1)).toHaveValue('7');
      await expect(inputs.nth(0)).toHaveValue('1');
      await expect(inputs.nth(2)).toBeFocused();
      await expect(page.getByText('Value: 1734')).toBeVisible();
    });
  }

  test('overtyping a digit with the same digit still clears the extra character', async ({
    page
  }) => {
    await page.goto('/components/split-input');

    const inputs = page.getByTestId('split-input-default').locator('input');
    await inputs.nth(0).evaluate(inject, '1234');

    // The resolved value equals what was already stored, so the assignment is a
    // no-op and Svelte re-renders nothing -- leaving the element showing "22"
    // unless the DOM is explicitly resynced.
    await typeAtCaret(page, inputs.nth(1), 0, '2');

    await expect(inputs.nth(1)).toHaveValue('2');
    await expect(page.getByText('Value: 1234')).toBeVisible();
  });
});
