import { expect, test } from '@playwright/test';

test.describe('LoadingDots — pulse min-scale token', () => {
  // The pulse variant previously animated opacity only; consumers replacing
  // hand-rolled "breathing" (scale + opacity) loaders had no token to express
  // the size component. --loading-dots-pulse-min-scale drives the keyframe's
  // resting scale; the default of 1 keeps existing consumers pixel-identical.
  test('the min-scale token reaches the dots and defaults to 1', async ({ page }) => {
    await page.goto('/components/loading-dots');

    const breathing = page.getByTestId('loading-dots-breathing');
    await expect(breathing).toBeVisible();

    const configuredScale = await breathing
      .getByTestId('loading-dots-breathing-dot-0')
      .evaluate((dot) => getComputedStyle(dot).getPropertyValue('--loading-dots-pulse-min-scale'));
    expect(configuredScale.trim()).toBe('0.5');

    // An unconfigured pulse instance resolves no override — the keyframe's
    // scale(var(--loading-dots-pulse-min-scale, 1)) falls back to 1.
    const plainPulse = page.getByTestId('loading-dots-pulse');
    const unsetScale = await plainPulse
      .getByTestId('loading-dots-pulse-dot-0')
      .evaluate((dot) => getComputedStyle(dot).getPropertyValue('--loading-dots-pulse-min-scale'));
    expect(unsetScale.trim()).toBe('');
  });
});
