import { expect, test } from '@playwright/test';

// WebOTP / Android-SMS autofill drops the WHOLE code into the first field as a
// single input event (no keyboard, no clipboard paste). With the default
// single-char tel fields, the inner Input's dataType='tel' sanitizer used to
// truncate that value to its LAST digit before SplitInput's onInput fired, so
// the distribute branch never ran and a 4-digit code landed as one wrong digit.
// These tests pin the fixed contract: single-char autoAdvance fields widen the
// inner maxLength to the code length, handleFieldInput distributes the full
// (digit-sanitized) code from field 0, and one-char-per-field semantics are
// enforced by SplitInput itself — including overtype-replaces on filled fields.
test.describe('SplitInput autofill/multi-char distribution', () => {
  // Serialized into the browser by evaluate() — the injected code must arrive
  // as the evaluate argument, never via closure.
  const inject = (el: HTMLInputElement, code: string) => {
    el.value = code;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };

  test('whole code injected into field 0 distributes across all fields', async ({ page }) => {
    await page.goto('/components/split-input');

    const group = page.getByTestId('split-input-default');
    const inputs = group.locator('input');

    await inputs.nth(0).evaluate(inject, '1234');

    await expect(inputs.nth(0)).toHaveValue('1');
    await expect(inputs.nth(1)).toHaveValue('2');
    await expect(inputs.nth(2)).toHaveValue('3');
    await expect(inputs.nth(3)).toHaveValue('4');
    // bind:values reached the consumer (the demo renders the joined value).
    await expect(page.getByText('Value: 1234')).toBeVisible();
    // Focus advanced to the last filled field so Backspace/typing continues there.
    await expect(inputs.nth(3)).toBeFocused();
  });

  test('injected code with separators is digit-sanitized before distribution', async ({ page }) => {
    await page.goto('/components/split-input');

    const inputs = page.getByTestId('split-input-sms-otp').locator('input');

    await inputs.nth(0).evaluate(inject, '56-78');

    await expect(inputs.nth(0)).toHaveValue('5');
    await expect(inputs.nth(1)).toHaveValue('6');
    await expect(inputs.nth(2)).toHaveValue('7');
    await expect(inputs.nth(3)).toHaveValue('8');
  });

  test('single-character typing still auto-advances field by field', async ({ page }) => {
    await page.goto('/components/split-input');

    const inputs = page.getByTestId('split-input-default').locator('input');

    await inputs.nth(0).click();
    await page.keyboard.type('9');
    await expect(inputs.nth(0)).toHaveValue('9');
    await expect(inputs.nth(1)).toBeFocused();

    await page.keyboard.type('8');
    await expect(inputs.nth(1)).toHaveValue('8');
    await expect(inputs.nth(2)).toBeFocused();
  });

  test('typing into an already-filled middle field keeps the newest digit and advances', async ({
    page
  }) => {
    await page.goto('/components/split-input');

    const inputs = page.getByTestId('split-input-default').locator('input');

    await inputs.nth(0).evaluate(inject, '1234');
    await expect(inputs.nth(3)).toHaveValue('4');

    await inputs.nth(1).click();
    await page.keyboard.type('7');

    await expect(inputs.nth(1)).toHaveValue('7');
    await expect(inputs.nth(0)).toHaveValue('1');
    await expect(inputs.nth(2)).toBeFocused();
    await expect(page.getByText('Value: 1734')).toBeVisible();
  });
});
