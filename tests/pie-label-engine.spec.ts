import { expect, test } from '@playwright/test';

// The crowded demo (24 sources, long labels, sliver slices) is the shape that
// used to render every label unconditionally at its mid-angle — stacked
// unreadable text spilling past the chart box. The engine invariant: visible
// labels never overlap each other, never leave the chart box, and slivers
// drop their labels (full text stays on the tooltip / aria-label).
test.describe('PieChart label engine', () => {
  test('crowded pie renders zero overlapping labels, all inside the chart box', async ({
    page
  }) => {
    await page.goto('/components/pie-chart');

    const chart = page.getByTestId('pie-crowded-chart');
    await expect(chart.locator('.slice').first()).toBeVisible();
    await expect(chart.locator('.slice-label').first()).toBeVisible();

    const result = await chart.evaluate((root) => {
      const boxes = Array.from(root.querySelectorAll('.slice-label')).map((el) =>
        el.getBoundingClientRect()
      );
      const chartBox = root.getBoundingClientRect();
      const intersects = (a: DOMRect, b: DOMRect) =>
        a.left < b.right - 1 &&
        b.left < a.right - 1 &&
        a.top < b.bottom - 1 &&
        b.top < a.bottom - 1;

      let overlaps = 0;
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          if (intersects(boxes[i], boxes[j])) {
            overlaps++;
          }
        }
      }
      const outside = boxes.filter(
        (b) => b.left < chartBox.left - 1 || b.right > chartBox.right + 1
      ).length;
      return { labelCount: boxes.length, overlaps, outside };
    });

    // The engine must be selective, not silent: some labels visible, some dropped.
    expect(result.labelCount).toBeGreaterThan(3);
    expect(result.labelCount).toBeLessThan(24);
    expect(result.overlaps).toBe(0);
    expect(result.outside).toBe(0);
  });

  test('all-zero data renders the empty state with no NaN geometry', async ({ page }) => {
    await page.goto('/components/pie-chart');

    const chart = page.getByTestId('pie-all-zero');
    await expect(chart.locator('.chart-empty')).toBeVisible();
    await expect(chart.locator('.chart-empty')).toContainText('No distribution data yet.');
    await expect(chart.locator('path.slice')).toHaveCount(0);

    const nanPaths = await page.evaluate(() => document.querySelectorAll('path[d*="NaN"]').length);
    expect(nanPaths).toBe(0);
  });

  test('sparse pie keeps every label (defaults unchanged)', async ({ page }) => {
    await page.goto('/components/pie-chart');

    // The 5-slice expenses demo has ample room — the engine must not drop or
    // truncate anything there.
    const chart = page.locator('.demo-row', { has: page.locator('.slice-label') }).first();
    const labels = await chart.locator('.slice-label').allTextContents();
    expect(labels.length).toBe(5);
    for (const label of labels) {
      expect(label).not.toContain('…');
    }
  });
});
