import { expect, test } from '@playwright/test';

test.describe('CheckListItem — disabled control styling', () => {
  test('keeps supplied label content opaque while dimming and disabling the checkbox control', async ({
    page
  }) => {
    await page.goto('/components/check-list-item');

    const disabledItem = page.getByTestId('check-list-item-disabled');
    const labelContent = page.getByTestId('check-list-item-disabled-content');
    const checkboxControl = disabledItem.getByTestId('check-list-item-disabled-checkbox');
    const checkboxBox = checkboxControl.getByRole('checkbox');

    await expect(disabledItem).toBeVisible();
    await expect(labelContent).toBeVisible();
    await expect(checkboxBox).toHaveAttribute('aria-disabled', 'true');
    await expect(checkboxBox).toHaveAttribute('tabindex', '-1');
    await expect(checkboxBox).toHaveAttribute('aria-checked', 'false');
    await expect(
      checkboxControl.getByTestId('check-list-item-disabled-checkbox-native-input')
    ).toBeDisabled();

    const [labelOpacity, controlOpacity] = await Promise.all([
      labelContent.evaluate((labelElement) => getComputedStyle(labelElement).opacity),
      checkboxControl.evaluate((controlElement) => getComputedStyle(controlElement).opacity)
    ]);

    expect(labelOpacity).toBe('1');
    expect(controlOpacity).toBe('0.4');
  });
});
