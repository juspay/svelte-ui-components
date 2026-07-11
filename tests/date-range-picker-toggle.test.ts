import { expect, test } from '@playwright/test';

test.describe('DateRangePicker — trigger toggles the panel', () => {
  // Regression guard: the trigger used to only open the panel, so a second click
  // re-opened it onto itself and the panel could only be dismissed by clicking
  // elsewhere on the page. The trigger must toggle — a second click closes it.
  test('clicking the trigger while open closes the picker, and re-opens on the next click', async ({
    page
  }) => {
    await page.goto('/components/date-range-picker');

    const picker = page.getByTestId('drp-range-demo');
    await expect(picker).toBeVisible();

    // The trigger's accessible name flips to 'Close date picker' while open,
    // so locate it by its stable testId rather than by name.
    const trigger = page.getByTestId('drp-range-demo-trigger');

    await trigger.click();
    await expect(page.getByTestId('drp-range-demo-panel')).toBeVisible();

    // Second click on the same trigger dismisses the picker.
    await trigger.click();
    await expect(page.getByTestId('drp-range-demo-panel')).toBeHidden();

    // Trigger still works as an opener afterwards.
    await trigger.click();
    await expect(page.getByTestId('drp-range-demo-panel')).toBeVisible();
  });
});
