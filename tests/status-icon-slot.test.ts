import { expect, test } from '@playwright/test';

// Covers the Status `icon` snippet: a consumer can render custom media (e.g. a
// LottiePlayer) instead of the default statusIcon <Img>, and the default path
// stays unchanged when `icon` isn't provided.
test.describe('Status icon slot', () => {
  test('default statusIcon renders an <img> when no icon snippet is given', async ({ page }) => {
    await page.goto('/components/status');

    const defaultStatus = page.locator('[data-pw="status-default-icon"]');
    await expect(defaultStatus.locator('img')).toBeVisible();
  });

  test('icon snippet replaces the default image with custom content', async ({ page }) => {
    await page.goto('/components/status');

    const slotHost = page.locator('[data-pw="status-icon-slot"]');
    await expect(slotHost).toBeVisible();

    // No <img> is rendered for this instance — the snippet took over.
    await expect(slotHost.locator('img')).toHaveCount(0);

    // The custom content (the LottiePlayer wrapper) is present instead.
    await expect(slotHost.locator('[data-pw="status-icon-slot-lottie"]')).toBeVisible();
    await expect(slotHost.locator('.lottie-player')).toHaveCount(1);
  });
});
