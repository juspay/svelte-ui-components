import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// A real submit, in a real browser: jsdom can build FormData from a form, but it
// cannot show that constraint validation blocks a submission, nor that the browser
// leaves focus somewhere reachable when it does.
//
// Basic FormData participation (unchecked -> absent, checked -> value) is covered
// for Checkbox, Toggle and Select in tests/form-association.test.ts against their
// own demo forms; this file covers only what constraint validation adds.
test.describe('Form controls take part in native form submission', () => {
  test('a required checkbox blocks submission and keeps focus on the visible box', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/checkbox');

    const result = page.getByTestId('checkbox-required-result');
    await page.getByTestId('checkbox-required-submit').click();
    await expect(result).toHaveText('');

    // The control carrying `required` is deliberately not a tab stop, so the
    // browser's own "focus the invalid field" step is redirected to the box.
    const box = page.getByTestId('checkbox-required-terms').getByRole('checkbox');
    await expect(box).toBeFocused();

    await box.click();
    await page.getByTestId('checkbox-required-submit').click();
    await expect(result).toHaveText('terms=accepted');

    await page.getByTestId('checkbox-required-updates').click();
    await page.getByTestId('checkbox-required-submit').click();
    await expect(result).toHaveText('terms=accepted updates=on');
  });

  test('a required radio group blocks submission until one member is chosen', async ({ page }) => {
    await gotoHydrated(page, '/components/radio');

    const result = page.getByTestId('radio-form-result');
    await page.getByTestId('radio-form-submit').click();
    await expect(result).toHaveText('');

    await page.getByTestId('radio-form-cod').click();
    await page.getByTestId('radio-form-submit').click();
    await expect(result).toHaveText('checkout-method=cod');
  });

  test('a slider submits the value the keyboard leaves it on, and speaks it', async ({ page }) => {
    await gotoHydrated(page, '/components/slider');

    const slider = page.getByTestId('slider-form-volume');
    await expect(slider).toHaveAttribute('aria-valuetext', '40%');

    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveAttribute('aria-valuetext', '41%');

    await page.getByTestId('slider-form-submit').click();
    await expect(page.getByTestId('slider-form-result')).toHaveText('volume=41');
  });
});
