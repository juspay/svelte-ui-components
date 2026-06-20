import { expect, test } from '@playwright/test';

test.describe('DateRangePicker — built-in date inputs + time selection', () => {
  // showDateInputs renders read-only start/end date boxes; showTimeSelection adds a
  // clock toggle that reveals start/end time inputs and gates Apply on time validity.
  test('shows date boxes, toggles time inputs, and gates Apply on time validity', async ({
    page
  }) => {
    await page.goto('/components/date-range-picker');

    const picker = page.locator('[data-pw="drp-datetime-demo"]');
    await expect(picker).toBeVisible();

    await picker.getByRole('button', { name: 'Open date picker' }).click();
    await expect(picker.locator('.drp-panel')).toBeVisible();

    // Read-only date boxes are present (seeded from the "Today" preset).
    await expect(page.locator('[data-pw="drp-datetime-demo-start-date"]')).toBeVisible();
    await expect(page.locator('[data-pw="drp-datetime-demo-end-date"]')).toBeVisible();

    // Time inputs are hidden until the clock toggle is clicked.
    await expect(page.locator('[data-pw="drp-datetime-demo-start-time"]')).toHaveCount(0);
    await page.locator('[data-pw="drp-datetime-demo-time-toggle"]').click();

    const startTime = page.locator('[data-pw="drp-datetime-demo-start-time"]');
    await expect(startTime).toBeVisible();

    const applyButton = picker.getByRole('button', { name: 'Apply date selection' });
    await expect(applyButton).toBeEnabled();

    // A malformed time blocks Apply.
    await startTime.fill('99:99 ZZ');
    await expect(applyButton).toBeDisabled();

    // A valid time re-enables Apply.
    await startTime.fill('09:30 AM');
    await expect(applyButton).toBeEnabled();
  });

  test('blocks Apply when start time is after end time on the same day', async ({ page }) => {
    await page.goto('/components/date-range-picker');

    const picker = page.locator('[data-pw="drp-datetime-demo"]');
    await picker.getByRole('button', { name: 'Open date picker' }).click();
    await page.locator('[data-pw="drp-datetime-demo-time-toggle"]').click();

    const startTime = page.locator('[data-pw="drp-datetime-demo-start-time"]');
    const endTime = page.locator('[data-pw="drp-datetime-demo-end-time"]');
    const applyButton = picker.getByRole('button', { name: 'Apply date selection' });

    // The seeded "Today" preset puts start and end on the same calendar day, so a
    // start time later than the end time is an invalid range and blocks Apply.
    await startTime.fill('11:00 PM');
    await endTime.fill('09:00 AM');
    await expect(applyButton).toBeDisabled();

    // Restoring start <= end re-enables Apply.
    await endTime.fill('11:30 PM');
    await expect(applyButton).toBeEnabled();
  });

  // timeSelectionLayout="inline" renders the time inputs beside their date inputs on
  // the same row, always visible (no clock toggle), reusing the same validation.
  test('inline layout: time inputs sit beside the dates with no toggle, and still gate Apply', async ({
    page
  }) => {
    await page.goto('/components/date-range-picker');

    const picker = page.locator('[data-pw="drp-datetime-inline-demo"]');
    await expect(picker).toBeVisible();
    await picker.getByRole('button', { name: 'Open date picker' }).click();
    await expect(picker.locator('.drp-panel')).toBeVisible();

    // No toggle in inline mode; the time inputs are visible immediately.
    await expect(page.locator('[data-pw="drp-datetime-inline-demo-time-toggle"]')).toHaveCount(0);
    const startTime = page.locator('[data-pw="drp-datetime-inline-demo-start-time"]');
    const endTime = page.locator('[data-pw="drp-datetime-inline-demo-end-time"]');
    await expect(startTime).toBeVisible();
    await expect(endTime).toBeVisible();

    // The start time input is on the same row as its date box and to its right.
    const dateBox = await page.locator('[data-pw="drp-datetime-inline-demo-start-date"]').boundingBox();
    const timeBox = await startTime.boundingBox();
    expect(dateBox).not.toBeNull();
    expect(timeBox).not.toBeNull();
    if (dateBox && timeBox) {
      const dateMidY = dateBox.y + dateBox.height / 2;
      const timeMidY = timeBox.y + timeBox.height / 2;
      expect(Math.abs(dateMidY - timeMidY)).toBeLessThan(12);
      expect(timeBox.x).toBeGreaterThan(dateBox.x);
    }

    // Apply still gates on time validity (shared with the toggle layout).
    const applyButton = picker.getByRole('button', { name: 'Apply date selection' });
    await expect(applyButton).toBeEnabled();
    await startTime.fill('99:99 ZZ');
    await expect(applyButton).toBeDisabled();
    await startTime.fill('09:30 AM');
    await expect(applyButton).toBeEnabled();
  });
});
