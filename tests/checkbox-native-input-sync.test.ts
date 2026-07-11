import { expect, test } from '@playwright/test';

test.describe('Checkbox — native input stays in sync with the rendered state', () => {
  // Regression guard: clicking the label used to fire handleClick (flipping the
  // Svelte state) AND the label's default activation, whose synthesized click
  // re-toggled the hidden native input afterwards. The visual box then showed
  // checked while input.checked was false — breaking form submission values,
  // :checked-based CSS, and state probes. The label now prevents the default
  // activation so handleClick is the single owner of the state.
  test('clicking the label toggles the box, aria-checked, and the native input together', async ({
    page
  }) => {
    await page.goto('/components/checkbox');

    const checkbox = page.getByTestId('checkbox-default');
    await expect(checkbox).toBeVisible();

    const nativeInput = checkbox.getByTestId('checkbox-default-native-input');
    const box = checkbox.getByRole('checkbox');

    await expect(box).toHaveAttribute('aria-checked', 'false');
    await expect(nativeInput).not.toBeChecked();

    await checkbox.click();
    await expect(box).toHaveAttribute('aria-checked', 'true');
    await expect(nativeInput).toBeChecked();

    await checkbox.click();
    await expect(box).toHaveAttribute('aria-checked', 'false');
    await expect(nativeInput).not.toBeChecked();
  });

  test('keyboard toggling via the box keeps the native input in sync', async ({ page }) => {
    await page.goto('/components/checkbox');

    const checkbox = page.getByTestId('checkbox-default');
    const nativeInput = checkbox.getByTestId('checkbox-default-native-input');
    const box = checkbox.getByRole('checkbox');

    await box.focus();
    await page.keyboard.press('Space');
    await expect(box).toHaveAttribute('aria-checked', 'true');
    await expect(nativeInput).toBeChecked();

    await page.keyboard.press('Enter');
    await expect(box).toHaveAttribute('aria-checked', 'false');
    await expect(nativeInput).not.toBeChecked();
  });
});
