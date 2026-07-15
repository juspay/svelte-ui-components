import { test, expect } from '@playwright/test';

test.describe('interactive legend', () => {
  test('clicking a legend item hides that series and rescales', async ({ page }) => {
    await page.goto('/components/bar-chart');
    const chart = page.getByTestId('bar-legend-toggle-chart');
    await expect(chart.getByTestId(/^bar-\d+$/)).toHaveCount(12); // 3 series × 4 categories
    const firstToggle = chart.getByTestId('legend-toggle-0');
    await firstToggle.click();
    await expect(chart.getByTestId(/^bar-\d+$/)).toHaveCount(8);
    await expect(firstToggle).toHaveAttribute('aria-pressed', 'false');
    await firstToggle.click();
    await expect(chart.getByTestId(/^bar-\d+$/)).toHaveCount(12);
  });
});

test.describe('bar value labels', () => {
  test('bars at the axis max flip their label inside', async ({ page }) => {
    await page.goto('/components/bar-chart');
    const chart = page.getByTestId('bar-inside-flip-chart');
    // Bars at the axis max flip their label inside
    await expect
      .poll(async () =>
        chart
          .getByTestId(/^bar-value-\d+$/)
          .evaluateAll(
            (els) => els.filter((el) => el.getAttribute('data-inside') === 'true').length
          )
      )
      .toBeGreaterThan(0);
    // Short bars keep outside labels.
    await expect
      .poll(async () =>
        chart
          .getByTestId(/^bar-value-\d+$/)
          .evaluateAll(
            (els) => els.filter((el) => el.getAttribute('data-inside') === 'false').length
          )
      )
      .toBeGreaterThan(0);
  });
});

test.describe('tooltip clamping', () => {
  test('anchored tooltip never overflows the chart box', async ({ page }) => {
    await page.goto('/components/bar-chart');
    const chart = page.getByTestId('bar-inside-flip-chart');
    await chart
      .getByTestId(/^bar-\d+$/)
      .last()
      .hover();
    const tooltip = chart.getByTestId('chart-tooltip');
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
    const chart = page.getByTestId('bar-crowded-chart');
    // 18 bars always render; the axis rotates labels and shows a thinned subset.
    await expect(chart.getByTestId(/^bar-\d+$/)).toHaveCount(18);
    const bottomTickLabels = chart.getByTestId('axis-bottom').getByTestId(/^tick-label-\d+$/);
    await expect.poll(async () => bottomTickLabels.count()).toBeLessThan(18);
    expect(await bottomTickLabels.count()).toBeGreaterThan(0);
    const transform = await bottomTickLabels.first().getAttribute('transform');
    expect(transform).toContain('rotate(-45)');
  });
});

test.describe('bar value label override', () => {
  test('a data point with valueLabel renders that exact text; others keep the default valueFormat', async ({
    page
  }) => {
    await page.goto('/components/bar-chart');
    const chart = page.getByTestId('bar-value-label-chart');
    // valueLabel is set: rendered verbatim instead of the formatted value.
    await expect(chart.getByTestId('bar-value-0')).toHaveText('5,000 visits');
    // valueLabel is absent: falls through to the default valueFormat(value) path.
    await expect(chart.getByTestId('bar-value-1')).toHaveText('1.2K');
    await expect(chart.getByTestId('bar-value-2')).toHaveText('340');
  });

  test('an empty valueLabel is treated as absent, not as a blank label', async ({ page }) => {
    await page.goto('/components/bar-chart');
    const chart = page.getByTestId('bar-value-label-chart');
    // Pins the non-empty-only contract: `valueLabel: ''` falls back to the
    // formatter rather than rendering an empty value label. If that contract is
    // ever deliberately changed, this test makes the change visible.
    await expect(chart.getByTestId('bar-value-3')).toHaveText('28');
  });
});

test.describe('line hover', () => {
  test('hover shows a halo and a shared tooltip listing all series', async ({ page }) => {
    await page.goto('/components/line-chart');
    const chart = page.getByTestId('line-shared-tooltip-chart');
    await chart.getByTestId('hover-overlay').hover({ position: { x: 200, y: 100 } });
    await expect(chart.getByTestId(/^dot-halo-\d+$/)).toHaveCount(3);
    await expect(chart.getByTestId('chart-tooltip').getByTestId(/^tooltip-item-\d+$/)).toHaveCount(
      3
    );
  });
});

test.describe('keyboard', () => {
  test('Enter on a focused category fires onbarclick', async ({ page }) => {
    await page.goto('/components/dual-axis-bar-chart');
    const chart = page.getByTestId('demo-custom-tooltip');
    const target = chart.getByTestId('hover-target-0');
    await target.focus();
    await page.keyboard.press('Enter');
    const feedback = page.getByText(/Last clicked:/);
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText('Last clicked:');
  });
});

test.describe('touch', () => {
  test.use({ hasTouch: true });

  test('tapping a funnel stage shows the tooltip; tapping outside dismisses', async ({ page }) => {
    await page.goto('/components/funnel-chart');
    const chart = page.getByTestId('funnel-many-stages-chart');
    await chart.getByTestId('funnel-bar-0').tap();
    await expect(chart.getByTestId('chart-tooltip')).toBeVisible();
    await page.getByRole('heading').first().tap();
    await expect(chart.getByTestId('chart-tooltip')).toHaveCount(0);
  });

  test('keyboard focus on a bar shows its tooltip', async ({ page }) => {
    await page.goto('/components/bar-chart');
    const chart = page.getByTestId('bar-inside-flip-chart');
    await chart
      .getByTestId(/^bar-\d+$/)
      .first()
      .focus();
    await expect(chart.getByTestId('chart-tooltip')).toBeVisible();
  });
});
