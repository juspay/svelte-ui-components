import { expect, test } from '@playwright/test';

test.describe('DateRangePicker — preset highlight', () => {
  // Regression guard: when several presets fall on the same calendar day,
  // selecting one preset must highlight only that preset. isPresetActive()
  // previously matched by same-day instead of the chosen preset's label, so
  // "Today", "Today morning" and "Today evening" all highlighted at once.
  test('selecting one same-day preset highlights only that preset', async ({ page }) => {
    await page.goto('/components/date-range-picker');

    const picker = page.getByTestId('drp-same-day-presets-demo');
    await expect(picker).toBeVisible();

    // Open the dropdown.
    await picker.getByRole('button', { name: 'Open date picker' }).click();
    await expect(page.getByTestId('drp-same-day-presets-demo-panel')).toBeVisible();

    // All three same-day presets render; none is selected before a pick.
    await expect(picker.getByRole('option')).toHaveCount(3);
    await expect(picker.getByRole('option', { selected: true })).toHaveCount(0);

    // Pick "Today" (exact, so it does not also match "Today morning"/"Today evening").
    await picker.getByRole('option', { name: 'Today', exact: true }).click();

    // Exactly one preset is highlighted, and it is the one we picked.
    const active = picker.getByRole('option', { selected: true });
    await expect(active).toHaveCount(1);
    await expect(active).toHaveText('Today');
  });
});
