import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

test.describe('Checkbox — controlled mode and box attributes', () => {
  test('a controlled checkbox whose parent adopts the click behaves like an uncontrolled one', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/checkbox');

    const checkbox = page.getByTestId('checkbox-controlled-adopts');
    const box = checkbox.getByRole('checkbox');
    const nativeInput = checkbox.getByTestId('checkbox-controlled-adopts-native-input');

    await expect(box).toHaveAttribute('aria-checked', 'false');
    await checkbox.click();
    await expect(box).toHaveAttribute('aria-checked', 'true');
    await expect(nativeInput).toBeChecked();

    await checkbox.click();
    await expect(box).toHaveAttribute('aria-checked', 'false');
    await expect(nativeInput).not.toBeChecked();
  });

  test('a controlled checkbox whose parent declines the click does not flip', async ({ page }) => {
    await gotoHydrated(page, '/components/checkbox');

    const checkbox = page.getByTestId('checkbox-controlled-declines');
    const box = checkbox.getByRole('checkbox');
    const nativeInput = checkbox.getByTestId('checkbox-controlled-declines-native-input');
    const clicks = page.getByTestId('checkbox-controlled-declines-count');

    await checkbox.click();
    await expect(clicks).toHaveText('1');
    await expect(box).toHaveAttribute('aria-checked', 'false');
    await expect(nativeInput).not.toBeChecked();

    // The keyboard path goes through the same handler.
    await box.focus();
    await page.keyboard.press('Space');
    await expect(clicks).toHaveText('2');
    await expect(box).toHaveAttribute('aria-checked', 'false');
    await expect(nativeInput).not.toBeChecked();
  });

  test('attributes land on the checkbox element and win over the component test id', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/checkbox');

    const box = page.locator('#checkbox-attributes-demo');
    await expect(box).toHaveAttribute('role', 'checkbox');
    await expect(box).toHaveAttribute('data-pw', 'checkbox-attributes-custom');
    // The label still carries the component's own test id; the box's default one is replaced.
    await expect(page.getByTestId('checkbox-attributes')).toHaveCount(1);
    await expect(page.getByTestId('checkbox-attributes-box')).toHaveCount(0);
  });
});
