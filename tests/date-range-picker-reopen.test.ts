import { expect, test } from '@playwright/test';

test.describe('DateRangePicker — committed preset persists across the open cycle', () => {
  // Regression guard: after applying a preset, re-opening the picker must
  // re-highlight that preset by label. openPicker() previously reset the session
  // (selectedPresetLabel = null), so a second open fell back to same-day matching
  // and lit up "Today" / "Today morning" / "Today evening" all at once again.
  test('re-opening after applying a same-day preset highlights only the applied preset', async ({
    page
  }) => {
    await page.goto('/components/date-range-picker');

    const picker = page.locator('[data-pw="drp-same-day-presets-demo"]');
    await expect(picker).toBeVisible();

    // Open, pick "Today" (exact), confirm a single highlight, then apply.
    await picker.getByRole('button', { name: 'Open date picker' }).click();
    await expect(picker.locator('.drp-panel')).toBeVisible();
    await picker.getByRole('option', { name: 'Today', exact: true }).click();
    await expect(picker.locator('.drp-preset-item[aria-selected="true"]')).toHaveCount(1);
    await picker.getByRole('button', { name: 'Apply date selection' }).click();
    await expect(picker.locator('.drp-panel')).toBeHidden();

    // Re-open: only "Today" stays highlighted — not all three same-day presets.
    await picker.getByRole('button', { name: 'Open date picker' }).click();
    await expect(picker.locator('.drp-panel')).toBeVisible();
    const active = picker.locator('.drp-preset-item[aria-selected="true"]');
    await expect(active).toHaveCount(1);
    await expect(active).toHaveText('Today');
  });

  // initialPresetLabel must seed the OPEN-state highlight, not just the trigger.
  // Before the fix the open panel date-matched and could highlight more than the
  // seeded preset; now exactly the seeded preset is active on first open.
  test('initialPresetLabel highlights only the seeded preset on first open', async ({ page }) => {
    await page.goto('/components/date-range-picker');

    const picker = page.locator('[data-pw="drp-initial-preset-demo"]');
    await expect(picker).toBeVisible();

    await picker.getByRole('button', { name: 'Open date picker' }).click();
    await expect(picker.locator('.drp-panel')).toBeVisible();

    const active = picker.locator('.drp-preset-item[aria-selected="true"]');
    await expect(active).toHaveCount(1);
    await expect(active).toHaveText('All time');
  });
});
