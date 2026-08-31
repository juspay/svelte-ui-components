import { expect, test } from '@playwright/test';

test.describe('ThinkingIndicator chip variant', () => {
  test('defaults to a static label, no shimmer animation', async ({ page }) => {
    await page.goto('/components/thinking-indicator');

    const chip = page.getByTestId('thinking-indicator-chip-static-demo');
    await expect(chip).toBeVisible();
    await expect(chip.locator('.chip-label')).toHaveClass(/static-label/);
  });

  test('busy shimmers the label (no static-label class)', async ({ page }) => {
    await page.goto('/components/thinking-indicator');

    const chip = page.getByTestId('thinking-indicator-chip-busy-demo');
    await expect(chip).toBeVisible();
    await expect(chip.locator('.chip-label')).not.toHaveClass(/static-label/);
  });

  test('the chip root is a polite live region, so a screen reader announces status changes', async ({
    page
  }) => {
    await page.goto('/components/thinking-indicator');

    await expect(page.getByTestId('thinking-indicator-chip-static-demo')).toHaveAttribute(
      'aria-live',
      'polite'
    );
    await expect(page.getByTestId('thinking-indicator-chip-busy-demo')).toHaveAttribute(
      'aria-live',
      'polite'
    );
  });
});
