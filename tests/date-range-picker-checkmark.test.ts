import { expect, test } from '@playwright/test';

test.describe('DateRangePicker — active-preset checkmark', () => {
  // With presetCheckmark enabled, the active preset shows a trailing checkmark;
  // inactive presets show none, and no checkmark renders before a preset is picked.
  test('shows a checkmark only on the active preset', async ({ page }) => {
    await page.goto('/components/date-range-picker');

    const picker = page.getByTestId('drp-preset-checkmark-demo');
    await expect(picker).toBeVisible();

    // Open the dropdown.
    await picker.getByRole('button', { name: 'Open date picker' }).click();
    await expect(page.getByTestId('drp-preset-checkmark-demo-panel')).toBeVisible();

    // No checkmark before any preset is picked.
    await expect(page.getByTestId('drp-preset-checkmark-demo-preset-check')).toHaveCount(0);

    // Pick the "Today" preset.
    await picker.getByRole('option', { name: 'Today', exact: true }).click();

    // Exactly one checkmark, and it sits on the active "Today" preset.
    await expect(page.getByTestId('drp-preset-checkmark-demo-preset-check')).toHaveCount(1);
    const active = picker.getByRole('option', { selected: true });
    await expect(active).toContainText('Today');
    await expect(active.getByTestId('drp-preset-checkmark-demo-preset-check')).toHaveCount(1);
  });
});
