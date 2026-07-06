import { expect, test } from '@playwright/test';

test.describe('SplitInput — autoComplete / inputMode field passthrough', () => {
  // OTP consumers need `autocomplete="one-time-code"` (WebOTP / SMS autofill
  // suggestions) and `inputmode="numeric"` (numeric keypad on mobile web).
  // FieldConfig previously had no way to express either, forcing hand-rolled
  // segmented inputs for exactly the use case SplitInput exists for.
  test('per-field autoComplete and inputMode render on the native inputs', async ({ page }) => {
    await page.goto('/components/split-input');

    const group = page.locator('[data-pw="split-input-sms-otp"]');
    await expect(group).toBeVisible();

    const fields = group.locator('input');
    await expect(fields).toHaveCount(4);

    for (let index = 0; index < 4; index++) {
      await expect(fields.nth(index)).toHaveAttribute('autocomplete', 'one-time-code');
      await expect(fields.nth(index)).toHaveAttribute('inputmode', 'numeric');
      await expect(fields.nth(index)).toHaveAttribute('type', 'tel');
    }
  });

  test('fields without the new config keep the previous defaults', async ({ page }) => {
    await page.goto('/components/split-input');

    // The plain OTP demo (length-based default fields) is unchanged: default
    // autocomplete stays 'on' and no inputmode attribute is rendered.
    const defaultGroup = page.locator('.field-group').first();
    const firstField = defaultGroup.locator('input').first();
    await expect(firstField).toHaveAttribute('autocomplete', 'on');
    await expect(firstField).not.toHaveAttribute('inputmode', /.+/);
  });
});
