import { expect, test, type Locator } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';
import { measurePairedContrast } from './support/pixel-contrast';

test.use({ deviceScaleFactor: 3 });

const layout = async (chart: Locator, expectedNodes: number): Promise<void> => {
  await expect(chart.locator('.sankey-node')).toHaveCount(expectedNodes);
  await expect(chart.locator('.sankey-label')).toHaveCount(expectedNodes);
  const inspect = () =>
    chart.evaluate((root) => {
      const box = (node: Element) => {
        const rect = node.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height
        };
      };
      const labels = Array.from(root.querySelectorAll<SVGTextElement>('.sankey-label')).map(
        (node) => ({
          rect: box(node),
          text: Array.from(node.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => n.textContent)
            .join('')
            .trim(),
          full: node.querySelector('title')?.textContent,
          font: {
            family: getComputedStyle(node).fontFamily,
            size: getComputedStyle(node).fontSize
          },
          plate: node.parentElement?.querySelector('.chart-label-backdrop')
            ? box(node.parentElement.querySelector('.chart-label-backdrop')!)
            : null
        })
      );
      const nodes = Array.from(root.querySelectorAll('.sankey-node')).map(box);
      const intersects = (a: ReturnType<typeof box>, b: ReturnType<typeof box>) =>
        Math.min(a.right, b.right) > Math.max(a.left, b.left) &&
        Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
      const collisions: string[] = [];
      for (let i = 0; i < labels.length; i += 1) {
        for (let j = i + 1; j < labels.length; j += 1) {
          if (intersects(labels[i].rect, labels[j].rect)) {
            collisions.push(`${labels[i].full}/${labels[j].full}`);
          }
        }
        for (const node of nodes) {
          if (intersects(labels[i].rect, node)) {
            collisions.push(`${labels[i].full}/node`);
          }
        }
      }
      return {
        labels,
        collisions,
        emptyLabels: labels.filter((l) => l.text === '' || l.rect.width === 0).length,
        uncovered: labels.filter(
          (l) =>
            l.plate === null ||
            l.plate.left > l.rect.left ||
            l.plate.top > l.rect.top ||
            l.plate.right < l.rect.right ||
            l.plate.bottom < l.rect.bottom
        ).length,
        fontsStatus: document.fonts.status,
        loadedFonts: Array.from(document.fonts)
          .filter((f) => f.status === 'loaded')
          .map((f) => f.family),
        nodeNames: Array.from(root.querySelectorAll('.sankey-node')).map((n) =>
          n.getAttribute('aria-label')
        ),
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth
      };
    });
  let result = await inspect();
  let previousGeometry: string | null = null;
  await expect
    .poll(async () => {
      result = await inspect();
      const geometry = JSON.stringify({ labels: result.labels, nodeNames: result.nodeNames });
      const stable = geometry === previousGeometry;
      previousGeometry = geometry;
      return {
        collisions: result.collisions.length,
        empty: result.emptyLabels,
        uncovered: result.uncovered,
        stable
      };
    })
    .toEqual({ collisions: 0, empty: 0, uncovered: 0, stable: true });
  // Attach the exact validated, settled snapshot. A second DOM read could land
  // between a responsive layout update and the plate's next measurement frame.
  expect(result.collisions).toHaveLength(0);
  expect(result.emptyLabels).toBe(0);
  expect(result.uncovered).toBe(0);
  await test.info().attach('native-loaded-font-layout.json', {
    body: JSON.stringify(result),
    contentType: 'application/json'
  });
  expect(result.fontsStatus).toBe('loaded');
};

const readable = async (label: Locator): Promise<void> => {
  await label.scrollIntoViewIfNeeded();
  // Use native scroll geometry for SVG labels inside the responsive viewport;
  // WebKit's locator box can be stale during a font-driven horizontal resize.
  await label.evaluate(async (node) => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
    const chart = node.closest('.sankey-chart');
    if (chart instanceof HTMLElement) {
      const viewport = chart.getBoundingClientRect();
      const box = node.getBoundingClientRect();
      if (box.right > viewport.right) {
        chart.scrollLeft += box.right - viewport.right + 8;
      } else if (box.left < viewport.left) {
        chart.scrollLeft -= viewport.left - box.left + 8;
      }
    }
  });
  const result = await measurePairedContrast(label);
  await test.info().attach('paired-sankey-label-contrast.json', {
    body: JSON.stringify(result),
    contentType: 'application/json'
  });
  expect(result.interiorPixels).toBeGreaterThan(10);
  expect(result.interiorMin).toBeGreaterThanOrEqual(4.5);
  expect(result.interiorP5).toBeGreaterThanOrEqual(4.5);
  expect(result.boxMin).toBeGreaterThanOrEqual(4.5);
};

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Sankey loaded fonts and contrast: ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((value) => localStorage.setItem('theme-preference', value), theme);
    });

    test('all twelve crowded labels survive font readiness, resize and font swaps', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/sankey-chart');
      await page.evaluate(() => document.fonts.ready);
      const chart = page.getByTestId('sankey-crowded-chart');
      await layout(chart, 12);
      const fonts = await page.evaluate(() =>
        Array.from(document.fonts)
          .filter((f) => f.status === 'loaded')
          .map((f) => f.family)
      );
      expect(fonts.some((family) => family.includes('Nunito Sans'))).toBe(true);
      const authentication = chart
        .locator('.sankey-label')
        .filter({ has: page.locator('title', { hasText: 'AUTHENTICATION_FAILED (380)' }) });
      const authorization = chart
        .locator('.sankey-label')
        .filter({ has: page.locator('title', { hasText: 'AUTHORIZATION_FAILED (340)' }) });
      await readable(authentication);
      await readable(authorization);
      await chart.evaluate((root) => {
        root.style.width = '384px';
      });
      await layout(chart, 12);
      await expect
        .poll(() => chart.evaluate((root) => root.scrollWidth > root.clientWidth))
        .toBe(true);
      for (const family of ['serif', 'ui-monospace, monospace']) {
        await chart.evaluate((root, font) => {
          root.style.setProperty('--chart-font-family', font);
          root.style.setProperty('--sankey-label-font-size', '18px');
        }, family);
        await page.evaluate(() => document.fonts.ready);
        await expect(authentication).toHaveCSS('font-size', '18px');
        await layout(chart, 12);
        await readable(authentication);
        await readable(authorization);
        await expect(
          chart.locator('.sankey-node[aria-label="AUTHENTICATION_FAILED: 380"]')
        ).toHaveCount(1);
        await expect(
          chart.locator('.sankey-node[aria-label="AUTHORIZATION_FAILED: 340"]')
        ).toHaveCount(1);
      }
      await chart.evaluate((root) => {
        root.style.width = '900px';
        root.style.removeProperty('--chart-font-family');
        root.style.removeProperty('--sankey-label-font-size');
      });
      await page.evaluate(() => document.fonts.ready);
      await layout(chart, 12);
    });

    test('node and column text retain real contrast through hover, keyboard focus and dimming', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/sankey-chart');
      await page.evaluate(() => document.fonts.ready);
      const chart = page.locator('.sankey-chart').first();
      await layout(chart, 5);
      const labels = chart.locator('.sankey-label');
      for (let i = 0; i < (await labels.count()); i += 1) {
        await readable(labels.nth(i));
      }
      const node = chart.locator('.sankey-node').first();
      await node.hover();
      await expect(chart.locator('[data-pw="chart-tooltip"]')).toBeVisible();
      await expect(chart.locator('.sankey-node.node-dimmed').first()).toHaveCSS('opacity', '0.15');
      for (let i = 0; i < (await labels.count()); i += 1) {
        await readable(labels.nth(i));
      }
      await node.focus();
      await expect(node).toBeFocused();
      await expect(chart.locator('[data-pw="chart-tooltip"]')).toBeVisible();
      for (let i = 0; i < (await labels.count()); i += 1) {
        await readable(labels.nth(i));
      }
      const crowded = page.getByTestId('sankey-crowded-chart');
      for (let i = 0; i < (await crowded.locator('.sankey-col-label').count()); i += 1) {
        await readable(crowded.locator('.sankey-col-label').nth(i));
      }
    });

    test('WC labels stay legible over light, dark, alpha and CSS-variable flow palettes', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/sankey-chart');
      await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
      await page.waitForFunction(
        () => typeof customElements.get('sui-sankey-chart') === 'function'
      );
      await page.evaluate(() => {
        const host = document.createElement('sui-sankey-chart');
        host.id = 'palette-sankey';
        host.style.width = '640px';
        host.style.setProperty('--test-flow', '#e15759');
        Object.assign(host, {
          chartAriaLabel: 'Supported Sankey flow palettes',
          showValues: true,
          firstColumnLabelSide: 'right',
          lastColumnLabelSide: 'left',
          nodes: [
            { id: 'a', label: 'Bright', color: '#ffff00' },
            { id: 'b', label: 'Dark', color: '#003366' },
            { id: 'c', label: 'Alpha', color: 'rgba(245, 110, 10, 0.4)' },
            { id: 'd', label: 'Variable', color: 'var(--test-flow)' },
            { id: 'e', label: 'Outcome' }
          ],
          links: ['a', 'b', 'c', 'd'].map((source) => ({ source, target: 'e', value: 25 }))
        });
        document.querySelector('main')?.append(host);
      });
      const host = page.locator('#palette-sankey');
      const chart = host.locator('.sankey-chart');
      await page.evaluate(() => document.fonts.ready);
      await layout(chart, 5);
      const labels = chart.locator('.sankey-label');
      for (let i = 0; i < 5; i += 1) {
        await readable(labels.nth(i));
      }
      await chart.locator('.sankey-node').first().focus();
      for (let i = 0; i < 5; i += 1) {
        await readable(labels.nth(i));
      }
      const fills = await chart
        .locator('.sankey-node')
        .evaluateAll((nodes) => nodes.slice(0, 4).map((n) => n.getAttribute('fill')));
      expect(fills).toEqual(['#ffff00', '#003366', 'rgba(245, 110, 10, 0.4)', 'var(--test-flow)']);
    });
  });
}
