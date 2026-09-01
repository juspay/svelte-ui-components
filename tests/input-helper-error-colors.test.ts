import { expect, test } from '@playwright/test';

test.describe('Input / InputButton — error text and helper text are no longer the same color', () => {
  // Regression guard for both defects filed in #481: .info-message defaulted to the exact
  // same red as .error-message, so neutral helper text visually read as a validation failure
  // (color-alone signalling, WCAG 1.4.1); and that shared red was only 4.06:1 on white, below
  // the 4.5:1 AA floor for 12px text, so the error message itself wasn't reliably legible.

  test('Input: error and helper text render in different, AA-compliant colors', async ({
    page
  }) => {
    await page.goto('/components/input');

    const errorMessage = page.getByTestId('input-announced-error-error-message');
    const infoMessage = page.getByTestId('input-announced-error-info-message');

    await expect(errorMessage).toBeVisible();
    await expect(infoMessage).toBeVisible();
    await expect(errorMessage).toHaveText('Enter a valid email address');
    await expect(infoMessage).toHaveText('Use your company address, not a personal one.');

    // #c5120a -- 6.06:1 on white.
    await expect(errorMessage).toHaveCSS('color', 'rgb(197, 18, 10)');
    // #52525b -- 7.73:1 on white; the same muted tone this library already uses for
    // ChatToolStatus/ThinkingIndicator's status text.
    await expect(infoMessage).toHaveCSS('color', 'rgb(82, 82, 91)');

    const [errorColor, infoColor] = await Promise.all([
      errorMessage.evaluate((el) => getComputedStyle(el).color),
      infoMessage.evaluate((el) => getComputedStyle(el).color)
    ]);
    expect(errorColor).not.toBe(infoColor);
  });

  test("InputButton: external error and helper text share Input's color tokens, not the same value", async ({
    page
  }) => {
    await page.goto('/components/input-button');

    const demo = page.getByTestId('input-button-messages-demo');
    const externalError = demo.locator('.external-error-message');
    const infoMessage = demo.locator('.info-message');

    await expect(externalError).toBeVisible();
    await expect(infoMessage).toBeVisible();
    await expect(externalError).toHaveText('This code has already been used');
    await expect(infoMessage).toHaveText('Case-sensitive — check for extra spaces.');

    await expect(externalError).toHaveCSS('color', 'rgb(197, 18, 10)');
    await expect(infoMessage).toHaveCSS('color', 'rgb(82, 82, 91)');
  });
});
