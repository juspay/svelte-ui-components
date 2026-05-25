import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/components/progress');
});

test('segmented mode renders one div per segment with the first `value` filled', async ({
  page
}) => {
  const segmented = page.locator('[data-pw="progress-segmented"]');
  await expect(segmented.locator('.segment')).toHaveCount(12);
  await expect(segmented.locator('.segment.filled')).toHaveCount(3);
});

test('omitting segments falls back to the continuous bar', async ({ page }) => {
  const continuous = page.locator('[data-pw="progress-continuous"]');
  await expect(continuous.locator('.track .bar')).toHaveCount(1);
  await expect(continuous.locator('.segment')).toHaveCount(0);
});

test('segmented mode ignores the indeterminate animation for negative values', async ({ page }) => {
  const segmented = page.locator('[data-pw="progress-segmented-indeterminate"]');
  await expect(segmented.locator('.segment')).toHaveCount(6);
  await expect(segmented.locator('.segment.filled')).toHaveCount(0);
  await expect(segmented.locator('.bar.indeterminate')).toHaveCount(0);
});
