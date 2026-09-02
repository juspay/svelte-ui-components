import { expect, test } from '@playwright/test';

/**
 * Phase 1 of the event-casing migration adds each prop's correct spelling
 * alongside the old one, both wired to the same handler. The claim worth
 * testing is that the new spelling actually reaches the handler — a props type
 * carrying the name proves only that it compiles.
 */
test('a component fires its handler through the corrected prop spelling', async ({ page }) => {
  await page.goto('/components/toggle');

  const state = page.locator('[data-pw="toggle-alias-state"]');
  await expect(state).toHaveText('OFF');

  // The real checkbox is visually hidden behind the styled slider, so the
  // label is what a person actually clicks.
  await page.locator('[data-pw="toggle-alias"] label.switch').click();

  await expect(state).toHaveText('ON');
});

test('the original spelling still fires, untouched', async ({ page }) => {
  await page.goto('/components/toggle');

  const state = page.locator('.demo-row').first().locator('.state-display');
  await expect(state).toHaveText('OFF');

  await page.locator('.demo-row').first().locator('label.switch').click();

  await expect(state).toHaveText('ON');
});
