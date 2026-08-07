import { expect, test } from '@playwright/test';

// Pill hardcoded line-height: 1 with no CSS-variable hook, the only typographic property in the
// component's style block that wasn't hookable (--pill-font-size, --pill-font-weight, and
// --pill-font-family all already were). --pill-line-height closes that gap; the fallback is the
// existing literal, so unset consumers see no change.
test.describe('Pill line-height hook', () => {
  test('defaults to line-height: 1 when --pill-line-height is unset', async ({ page }) => {
    await page.goto('/components/pill');

    const pill = page.getByTestId('pill-line-height-default');
    await expect(pill).toBeVisible();

    // line-height: 1 at the default --pill-font-size: 13px resolves to a 13px used value.
    await expect(pill).toHaveCSS('line-height', '13px');
  });

  test('an explicit --pill-line-height override applies', async ({ page }) => {
    await page.goto('/components/pill');

    const pill = page.getByTestId('pill-line-height-custom');
    await expect(pill).toBeVisible();

    // --pill-line-height: 1.4 at the default 13px font-size resolves to 18.2px.
    await expect(pill).toHaveCSS('line-height', '18.2px');
  });
});
