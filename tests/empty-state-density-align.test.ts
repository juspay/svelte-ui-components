import { expect, test } from '@playwright/test';

// Closes #523. EmptyState hardcoded `align-items: center` with no CSS variable
// to reach it, and had no page-vs-panel density concept at all — consumers
// needing either had to hand-roll a wrapper class (see the .tara-ui-empty-page /
// .tara-ui-empty-panel / .tara-ui-activity-rail-empty recipes this issue was
// filed against). Both are additive: omitting `density` and never setting
// `--empty-state-align-items` must reproduce today's exact output.
test.describe('EmptyState density and align-items (#523)', () => {
  test("default (no density prop) keeps today's padding, gap and centered alignment", async ({
    page
  }) => {
    await page.goto('/components/empty-state');

    const root = page.getByTestId('empty-state-density-default');
    await expect(root).toHaveCSS('padding', '32px 16px');
    await expect(root).toHaveCSS('gap', '0px');
    await expect(root).toHaveCSS('align-items', 'center');
    await expect(root).not.toHaveAttribute('data-density', /.*/);
  });

  test('density="page" applies its own padding/gap defaults', async ({ page }) => {
    await page.goto('/components/empty-state');

    const root = page.getByTestId('empty-state-density-page');
    await expect(root).toHaveAttribute('data-density', 'page');
    await expect(root).toHaveCSS('padding', '48px 24px');
    await expect(root).toHaveCSS('gap', '12px');
  });

  test('density="panel" applies its own, tighter padding/gap defaults', async ({ page }) => {
    await page.goto('/components/empty-state');

    const root = page.getByTestId('empty-state-density-panel');
    await expect(root).toHaveAttribute('data-density', 'panel');
    await expect(root).toHaveCSS('padding', '16px 12px');
    await expect(root).toHaveCSS('gap', '4px');
  });

  test('--empty-state-align-items overrides the hardcoded center, no wrapper class needed', async ({
    page
  }) => {
    await page.goto('/components/empty-state');

    const root = page.getByTestId('empty-state-align-override');
    await expect(root).toHaveCSS('align-items', 'flex-start');
  });
});
