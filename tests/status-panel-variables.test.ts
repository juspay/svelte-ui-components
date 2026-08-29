import { expect, test } from '@playwright/test';

// Covers the Status panel CSS variables. Status is styled as a standalone
// full-screen result page: 100vh tall, with a translucent white backdrop-filter
// panel. Embedded in an existing page that is wrong on both counts, and the
// panel was previously hardcoded with no way to reach it.
//
// `--status-min-height` was already variable-backed; `--status-panel-background`
// and `--status-panel-backdrop-filter` are new. Defaults are the previous literal
// values, so an existing consumer sees no change.
test.describe('Status panel variables', () => {
  test('defaults keep the full-screen panel exactly as it was', async ({ page }) => {
    await page.goto('/components/status');

    const panel = page.getByTestId('status-default-icon').locator('.order-status');
    await expect(panel).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.6)');
    await expect(panel).toHaveCSS('backdrop-filter', 'blur(60px)');

    const root = page.getByTestId('status-default-icon').locator('.background');
    // 100vh against the configured viewport height.
    const minHeight = await root.evaluate((el) => getComputedStyle(el).minHeight);
    expect(parseFloat(minHeight)).toBeGreaterThan(100);
  });

  test('the variables neutralise the panel for inline embedding', async ({ page }) => {
    await page.goto('/components/status');

    const host = page.getByTestId('status-inline');
    await expect(host).toBeVisible();

    const panel = host.locator('.order-status');
    await expect(panel).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(panel).toHaveCSS('backdrop-filter', 'none');

    // min-height: auto resolves to 0px, so the component no longer claims a screen.
    const root = host.locator('.background');
    await expect(root).toHaveCSS('min-height', '0px');
  });
});
