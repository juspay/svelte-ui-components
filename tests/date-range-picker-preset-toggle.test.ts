import { expect, test } from '@playwright/test';

test.describe('DateRangePicker — preset toggle-off', () => {
  // With presetToggle, re-clicking the currently-active preset deselects it and
  // reverts the highlight to the committed selection (seeded via initialPresetLabel),
  // so a toggle-style preset can be switched back off without picking a calendar date.
  test('re-clicking the active preset reverts to the committed preset', async ({ page }) => {
    await page.goto('/components/date-range-picker');

    const picker = page.getByTestId('drp-preset-toggle-demo');
    await expect(picker).toBeVisible();

    // Open the dropdown — the committed preset ("Today", seeded via initialPresetLabel) is active.
    await picker.getByRole('button', { name: 'Open date picker' }).click();
    await expect(page.getByTestId('drp-preset-toggle-demo-panel')).toBeVisible();
    await expect(picker.getByRole('option', { selected: true })).toContainText('Today');

    // Pick a different preset — it becomes the active one.
    await picker.getByRole('option', { name: 'Yesterday', exact: true }).click();
    await expect(picker.getByRole('option', { selected: true })).toContainText('Yesterday');

    // Re-click the now-active preset — it toggles off, reverting to the committed "Today".
    await picker.getByRole('option', { name: 'Yesterday', exact: true }).click();
    await expect(picker.getByRole('option', { selected: true })).toContainText('Today');
    await expect(picker.getByRole('option', { selected: true })).toHaveCount(1);
  });
});
