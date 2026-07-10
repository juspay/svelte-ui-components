import { expect, test } from '@playwright/test';

// The crowded-funnel demo reproduces the two historical label failures:
// uppercase-heavy middle-column labels sliding under the next column's bars
// (flat per-char width estimate ran short), and small stacked sink nodes
// rendering their labels on top of each other (no vertical de-collision).
// The engine invariant: no label box ever intersects another label box or any
// node bar — dropped labels stay reachable via the node's hover <title>.
test.describe('SankeyChart label engine', () => {
  test('crowded funnel renders zero label/label and label/node overlaps', async ({ page }) => {
    await page.goto('/components/sankey-chart');

    const chart = page.getByTestId('sankey-crowded-chart');
    await expect(chart.locator('.sankey-node').first()).toBeVisible();
    await expect(chart.locator('.sankey-label').first()).toBeVisible();

    const result = await chart.evaluate((root) => {
      const boxesOf = (selector: string) =>
        Array.from(root.querySelectorAll(selector)).map((el) => el.getBoundingClientRect());
      // Shrink each box by 1px per side so antialiasing/rounding can never
      // count touching neighbours as an overlap.
      const intersects = (a: DOMRect, b: DOMRect) =>
        a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;

      const labels = boxesOf('.sankey-label');
      const nodes = boxesOf('.sankey-node');

      let labelLabelOverlaps = 0;
      for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
          if (intersects(labels[i], labels[j])) {
            labelLabelOverlaps++;
          }
        }
      }

      let labelNodeOverlaps = 0;
      for (const label of labels) {
        for (const node of nodes) {
          if (intersects(label, node)) {
            labelNodeOverlaps++;
          }
        }
      }

      return { labelCount: labels.length, labelLabelOverlaps, labelNodeOverlaps };
    });

    // The chart must actually be exercising the engine, not empty.
    expect(result.labelCount).toBeGreaterThan(3);
    expect(result.labelLabelOverlaps).toBe(0);
    expect(result.labelNodeOverlaps).toBe(0);
  });

  test('labels stay inside the chart box on both edges', async ({ page }) => {
    await page.goto('/components/sankey-chart');

    const chart = page.getByTestId('sankey-crowded-chart');
    await expect(chart.locator('.sankey-label').first()).toBeVisible();

    const overflowing = await chart.evaluate((root) => {
      const box = root.getBoundingClientRect();
      return Array.from(root.querySelectorAll('.sankey-label')).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.right > box.right + 1 || rect.left < box.left - 1;
      }).length;
    });

    expect(overflowing).toBe(0);
  });
});
