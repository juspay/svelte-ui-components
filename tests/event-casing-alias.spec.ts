import { expect, test } from '@playwright/test';

/**
 * Every event prop is lowercase (DESIGN_PRINCIPLES §3), and the earlier
 * camelCase spellings stay accepted as deprecated aliases until 4.0.0. The
 * claim worth testing in a real browser is that the lowercase spelling
 * actually reaches the handler — a props type carrying the name proves only
 * that it compiles. The deprecated spelling's path is covered by
 * `wc-event-casing-parity.spec.ts` and `Toggle.svelte.test.ts`.
 */
test('a component fires its handler through the lowercase prop spelling', async ({ page }) => {
  await page.goto('/components/toggle');

  const state = page.locator('[data-pw="toggle-alias-state"]');
  await expect(state).toHaveText('OFF');

  // The real checkbox is visually hidden behind the styled slider, so the
  // label is what a person actually clicks.
  await page.locator('[data-pw="toggle-alias"] label.switch').click();

  await expect(state).toHaveText('ON');
});

test('the first demo row fires through the same spelling', async ({ page }) => {
  await page.goto('/components/toggle');

  const state = page.locator('.demo-row').first().locator('.state-display');
  await expect(state).toHaveText('OFF');

  await page.locator('.demo-row').first().locator('label.switch').click();

  await expect(state).toHaveText('ON');
});
