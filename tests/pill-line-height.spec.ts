import { expect, test } from '@playwright/test';

// Regression test: --pill-line-height is documented and implemented in Pill.svelte (it shipped in
// 5b7dc9d, before this spec). This spec guards against the hook being removed or falling out of
// sync with the default (line-height: 1 at --pill-font-size: 13px).
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
