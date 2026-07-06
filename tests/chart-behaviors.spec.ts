import { test, expect } from '@playwright/test';

test.describe('interactive legend', () => {
  test('clicking a legend item hides that series and rescales', async ({ page }) => {
    await page.goto('/components/bar-chart');
    const chart = page.locator('[data-pw="bar-legend-toggle-chart"]');
    await expect(chart.locator('.bar')).toHaveCount(12); // 3 series × 4 categories
    const firstToggle = chart.locator('.legend-toggle').first();
    await firstToggle.click();
    await expect(chart.locator('.bar')).toHaveCount(8);
    await expect(firstToggle).toHaveAttribute('aria-pressed', 'false');
    await firstToggle.click();
    await expect(chart.locator('.bar')).toHaveCount(12);
  });
});

test.describe('bar value labels', () => {
  test('bars at the axis max flip their label inside', async ({ page }) => {
    await page.goto('/components/bar-chart');
    const chart = page.locator('[data-pw="bar-inside-flip-chart"]');
    await expect(chart.locator('.bar-value-inside')).not.toHaveCount(0);
    // Short bars keep outside labels.
    await expect(chart.locator('.bar-value:not(.bar-value-inside)')).not.toHaveCount(0);
  });
});

test.describe('tooltip clamping', () => {
  test('anchored tooltip never overflows the chart box', async ({ page }) => {
    await page.goto('/components/bar-chart');
    const chart = page.locator('[data-pw="bar-inside-flip-chart"]');
    await chart.locator('.bar').last().hover();
    const tooltip = chart.locator('.chart-tooltip');
    await expect(tooltip).toBeVisible();
    const tb = await tooltip.boundingBox();
    const cb = await chart.boundingBox();
    expect(tb).not.toBeNull();
    expect(cb).not.toBeNull();
    expect(tb!.x).toBeGreaterThanOrEqual(cb!.x - 1);
    expect(tb!.x + tb!.width).toBeLessThanOrEqual(cb!.x + cb!.width + 1);
  });
});

test.describe('axis crowding', () => {
  test('crowded category labels rotate and thin instead of overlapping', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto('/components/bar-chart');
    // The docs layout has no mobile breakpoint: wide <pre> blocks pin the
    // content column near 800px, so the chart never actually narrows. Collapse
    // the chrome (same override as the visual mobile project) so the chart
    // genuinely renders at viewport width, where thinning must engage.
    await page.addStyleTag({
      content: [
        '.app-layout { grid-template-columns: 1fr !important; }',
        '.sidebar { display: none !important; }',
        'main, .content { min-width: 0 !important; max-width: 100vw !important; }',
        'pre, table { max-width: 100% !important; overflow-x: auto !important; }'
      ].join(' ')
    });
    const chart = page.locator('[data-pw="bar-crowded-chart"]');
    // 18 bars always render; the axis rotates labels and shows a thinned subset.
    await expect(chart.locator('.bar')).toHaveCount(18);
    await expect
      .poll(async () => chart.locator('.axis-bottom .tick-label').count())
      .toBeLessThan(18);
    expect(await chart.locator('.axis-bottom .tick-label').count()).toBeGreaterThan(0);
    const transform = await chart
      .locator('.axis-bottom .tick-label')
      .first()
      .getAttribute('transform');
    expect(transform).toContain('rotate(-45)');
  });
});

test.describe('line hover', () => {
  test('hover shows a halo and a shared tooltip listing all series', async ({ page }) => {
    await page.goto('/components/line-chart');
    const chart = page.locator('[data-pw="line-shared-tooltip-chart"]');
    await chart.locator('.hover-overlay').hover({ position: { x: 200, y: 100 } });
    await expect(chart.locator('.dot-halo')).toHaveCount(3);
    await expect(chart.locator('.chart-tooltip .tooltip-item')).toHaveCount(3);
  });
});

test.describe('keyboard', () => {
  test('Enter on a focused category fires onbarclick', async ({ page }) => {
    await page.goto('/components/dual-axis-bar-chart');
    const chart = page.locator('[data-pw="demo-custom-tooltip"]');
    const target = chart.locator('.hover-target').first();
    await target.focus();
    await page.keyboard.press('Enter');
    const feedback = page.locator('.click-feedback');
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText('Last clicked:');
  });
});

test.describe('touch', () => {
  test.use({ hasTouch: true });

  test('tapping a funnel stage shows the tooltip; tapping outside dismisses', async ({ page }) => {
    await page.goto('/components/funnel-chart');
    const chart = page.locator('[data-pw="funnel-many-stages-chart"]');
    await chart.locator('.funnel-bar').first().tap();
    await expect(chart.locator('.chart-tooltip')).toBeVisible();
    await page.locator('h1').first().tap();
    await expect(chart.locator('.chart-tooltip')).toHaveCount(0);
  });

  test('keyboard focus on a bar shows its tooltip', async ({ page }) => {
    await page.goto('/components/bar-chart');
    const chart = page.locator('[data-pw="bar-inside-flip-chart"]');
    await chart.locator('.bar').first().focus();
    await expect(chart.locator('.chart-tooltip')).toBeVisible();
  });
});
