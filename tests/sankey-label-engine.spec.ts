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
        a.left < b.right - 1 &&
        b.left < a.right - 1 &&
        a.top < b.bottom - 1 &&
        b.top < a.bottom - 1;

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

  // First-column (source) labels anchor `end` into the left margin. Historically
  // they were budgeted only the bare 40px margin, so any real source label
  // ("SESSIONS (12.2K)") truncated to "SES…" — or, once the room fell below an
  // ellipsis, vanished entirely — at every width. A left gutter, symmetric with
  // the sink gutter, must now give them full room. A clipped label still fits
  // inside the chart box, so the edge test above cannot catch this.
  test('first-column source labels render their full text (not clipped)', async ({ page }) => {
    await page.goto('/components/sankey-chart');

    const chart = page.getByTestId('sankey-crowded-chart');
    await expect(chart.locator('.sankey-label').first()).toBeVisible();

    const sources = await chart.evaluate((root) => {
      // Source labels are the ones anchored `end` (rendered left of their node).
      return Array.from(root.querySelectorAll('.sankey-label'))
        .filter((el) => el.getAttribute('text-anchor') === 'end')
        .map((el) => {
          const visible = Array.from(el.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.nodeValue ?? '')
            .join('')
            .trim();
          const full = el.querySelector('title')?.textContent?.trim() ?? '';
          return { visible, full };
        });
    });

    // The engine must be exercised (the crowded funnel has a "SESSIONS" source).
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      // Not truncated to an ellipsis, and not squeezed away to nothing.
      expect(source.visible).not.toContain('…');
      expect(source.visible.length).toBeGreaterThan(0);
      // The full, untruncated label is what actually renders.
      expect(source.visible).toBe(source.full);
    }
  });
});
