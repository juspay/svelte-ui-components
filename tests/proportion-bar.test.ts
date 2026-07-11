import { expect, test } from '@playwright/test';

// Covers the ProportionBar: one rect + one legend item per segment, widths that
// sum to the full track, the accessible SVG summary when the legend is hidden,
// and sanitization of negative / non-finite segment values.
test.describe('ProportionBar', () => {
  test('renders one rect and one legend item per segment', async ({ page }) => {
    await page.goto('/components/proportion-bar');

    const bar = page.getByTestId('payment-methods-bar');
    await expect(bar).toBeVisible();
    await expect
      .poll(async () =>
        bar
          .getByTestId('payment-methods-bar-svg')
          .evaluate((svg) => svg.querySelectorAll('rect').length)
      )
      .toBe(5);
    await expect(bar.getByTestId(/^payment-methods-bar-legend-item-\d+$/)).toHaveCount(5);
  });

  test('segment widths fill the whole track (~100%)', async ({ page }) => {
    await page.goto('/components/proportion-bar');

    const bar = page.getByTestId('payment-methods-bar');
    const widths = await bar.getByTestId('payment-methods-bar-svg').evaluate((svg) => {
      const rects = svg.querySelectorAll('rect');
      return Array.from(rects).map((rect) => Number(rect.getAttribute('width')));
    });
    const total = widths.reduce((sum, width) => sum + width, 0);
    expect(Math.round(total)).toBe(100);
  });

  test('exposes an accessible SVG summary when the legend is hidden', async ({ page }) => {
    await page.goto('/components/proportion-bar');

    const bar = page.getByTestId('no-legend-bar');
    await expect(bar.getByTestId('no-legend-bar-legend')).toHaveCount(0);

    const svg = bar.getByTestId('no-legend-bar-svg');
    await expect(svg).toHaveAttribute('role', 'img');
    await expect(svg).toHaveAttribute('aria-label', /UPI/);
  });

  test('ignores negative and non-finite values (widths stay within 0–100)', async ({ page }) => {
    await page.goto('/components/proportion-bar');

    const bar = page.getByTestId('robust-bar');
    const rectCount = await bar
      .getByTestId('robust-bar-svg')
      .evaluate((svg) => svg.querySelectorAll('rect').length);
    expect(rectCount).toBe(4);

    const widths = await bar
      .getByTestId('robust-bar-svg')
      .evaluate((svg) =>
        Array.from(svg.querySelectorAll('rect')).map((rect) => Number(rect.getAttribute('width')))
      );
    for (const width of widths) {
      expect(width).toBeGreaterThanOrEqual(0);
      expect(width).toBeLessThanOrEqual(100);
    }
    // Only 600 and 400 are valid -> 60% and 40%; the negative and NaN bands are 0.
    expect(Math.round(widths.reduce((sum, width) => sum + width, 0))).toBe(100);
  });
});
