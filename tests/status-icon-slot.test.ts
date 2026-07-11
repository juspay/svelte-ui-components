import { expect, test } from '@playwright/test';

// Covers the Status `icon` snippet: a consumer can render custom media (e.g. a
// LottiePlayer) instead of the default statusIcon <Img>, and the default path
// stays unchanged when `icon` isn't provided.
test.describe('Status icon slot', () => {
  test('default statusIcon renders an <img> when no icon snippet is given', async ({ page }) => {
    await page.goto('/components/status');

    const defaultStatus = page.getByTestId('status-default-icon');
    await expect(defaultStatus.getByRole('img')).toBeVisible();
  });

  test('icon snippet replaces the default image with custom content', async ({ page }) => {
    await page.goto('/components/status');

    const slotHost = page.getByTestId('status-icon-slot');
    await expect(slotHost).toBeVisible();

    // No <img> is rendered for this instance — the snippet took over.
    await expect(slotHost.getByRole('img')).toHaveCount(0);

    // The custom content (the LottiePlayer wrapper) is present instead.
    await expect(slotHost.getByTestId('status-icon-slot-lottie')).toBeVisible();
    await expect(slotHost.getByTestId('status-lottie')).toHaveCount(1);
  });
});
