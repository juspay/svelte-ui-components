import { expect, test, type Locator } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';
import { blockExternalFonts } from './support/offline-fonts';
import { measurePairedContrast } from './support/pixel-contrast';

test.use({ deviceScaleFactor: 3 });
const legible = async (label: Locator): Promise<void> => {
  await label.scrollIntoViewIfNeeded();
  const result = await measurePairedContrast(label);
  const geometry = await label.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const chart = node.closest('.pie-chart,.line-chart,.dual-axis-bar-chart');
    const tooltip = chart?.querySelector('[data-pw="chart-tooltip"]');
    const overlay = tooltip?.getBoundingClientRect() ?? null;
    const plate = node.parentElement?.querySelector('rect.chart-label-backdrop');
    const surface = plate?.getBoundingClientRect() ?? null;
    return {
      tooltipOverlaps:
        overlay !== null &&
        overlay.width > 0 &&
        overlay.height > 0 &&
        Math.min(box.right, overlay.right) > Math.max(box.left, overlay.left) &&
        Math.min(box.bottom, overlay.bottom) > Math.max(box.top, overlay.top),
      hasPlate: surface !== null,
      plateCoversLabel:
        surface === null ||
        (surface.left <= box.left &&
          surface.top <= box.top &&
          surface.right >= box.right &&
          surface.bottom >= box.bottom)
    };
  });
  await test.info().attach('paired-label-measurement.json', {
    body: JSON.stringify({ ...result, geometry }),
    contentType: 'application/json'
  });
  expect(result.interiorPixels).toBeGreaterThan(10);
  expect(result.interiorMin).toBeGreaterThanOrEqual(4.5);
  expect(result.interiorP5).toBeGreaterThanOrEqual(4.5);
  expect(geometry.plateCoversLabel).toBe(true);
  expect(geometry.tooltipOverlaps).toBe(false);
  expect(result.boxMin).toBeGreaterThanOrEqual(4.5);
};

for (const theme of ['light', 'dark'] as const) {
  test.describe(`chart labels ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((value) => localStorage.setItem('theme-preference', value), theme);
      await blockExternalFonts(page);
    });

    for (const [route, selector] of [
      ['pie-chart', '.slice-label'],
      ['line-chart', '.point-value']
    ] as const) {
      test(`${route} retains opaque backgrounds at rest, hover and focus/dimming`, async ({
        page
      }) => {
        await gotoHydrated(page, `/components/${route}`);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const chart = page
          .locator(route === 'pie-chart' ? '.pie-chart' : '.line-chart')
          .filter({ has: page.locator(selector) })
          .first();
        const labels = chart.locator(selector);
        expect(await labels.count()).toBeGreaterThan(1);
        await expect(chart.locator('.chart-label-backdrop')).toHaveCount(await labels.count());
        await page.mouse.move(0, 0);
        await legible(labels.first());
        await chart.scrollIntoViewIfNeeded();
        if (route === 'pie-chart') {
          await chart.locator('.slice').first().hover();
        } else {
          await chart.getByTestId('hover-overlay').hover();
        }
        await legible(labels.first());
        const mark = chart.locator('svg [role="button"]').first();
        await mark.focus();
        // The text survives dimming on neighbouring data graphics.
        await legible(labels.first());
        await legible(labels.last());
        await expect(mark).toBeFocused();
      });
    }

    test('series-colored axis titles keep their hues with adequate theme contrast', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/dual-axis-bar-chart');
      const chart = page.getByTestId('demo-revenue-ctr');
      const titles = chart.locator('.axis-title');
      await expect(titles).toHaveCount(2);
      await legible(titles.nth(0));
      await legible(titles.nth(1));
      await chart.getByTestId('hover-target-0').focus();
      await legible(titles.nth(0));
      await legible(titles.nth(1));
      await expect(chart.locator('.bar-shape').first()).toHaveAttribute('fill', '#4e79a7');
      await expect(chart.locator('.line-dot').first()).toHaveAttribute('fill', '#f28e2b');
    });

    test('inside labels remain legible over light, dark, translucent and CSS-variable palettes', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/pie-chart');
      await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
      await page.waitForFunction(() => typeof customElements.get('sui-pie-chart') === 'function');
      await page.evaluate(() => {
        const host = document.createElement('sui-pie-chart');
        host.id = 'palette-pie';
        host.style.width = '640px';
        host.style.setProperty('--test-slice', '#e15759');
        Object.assign(host, {
          chartAriaLabel: 'Supported label palettes',
          showLabels: true,
          showValues: true,
          labelPosition: 'inside',
          data: [
            { label: 'Bright', value: 25, color: '#ffff00' },
            { label: 'Dark', value: 25, color: '#003366' },
            { label: 'Translucent', value: 25, color: 'rgba(245, 110, 10, 0.4)' },
            { label: 'Variable', value: 25, color: 'var(--test-slice)' }
          ]
        });
        document.querySelector('main')?.append(host);
      });
      const host = page.locator('#palette-pie');
      const labels = host.locator('.slice-label');
      await expect(labels).toHaveCount(4);
      await expect(host.locator('.chart-label-backdrop')).toHaveCount(4);
      for (let index = 0; index < 4; index += 1) {
        await legible(labels.nth(index));
      }
      await host.locator('.slice').nth(1).focus();
      for (let index = 0; index < 4; index += 1) {
        await legible(labels.nth(index));
      }
    });

    test('plates update to actual rendered glyph bounds after font size and family changes', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/pie-chart');
      const chart = page
        .locator('.pie-chart')
        .filter({ has: page.locator('.slice-label') })
        .first();
      const label = chart.locator('.slice-label').first();
      const width = await label.evaluate((node) => (node as SVGGraphicsElement).getBBox().width);
      await chart.evaluate((node) => {
        node.style.setProperty('--piechart-label-font-size', '18px');
        node.style.setProperty('--chart-font-family', 'monospace');
      });
      await page.evaluate(() => document.fonts.ready);
      await expect
        .poll(() => label.evaluate((node) => (node as SVGGraphicsElement).getBBox().width))
        .toBeGreaterThan(width);
      await expect
        .poll(() =>
          label.evaluate((node) => {
            const glyph = (node as SVGGraphicsElement).getBBox();
            const plate = node.parentElement?.querySelector('rect');
            if (plate === null || typeof plate === 'undefined') {
              return false;
            }
            const x = Number(plate.getAttribute('x'));
            const y = Number(plate.getAttribute('y'));
            return (
              x <= glyph.x &&
              y <= glyph.y &&
              x + Number(plate.getAttribute('width')) >= glyph.x + glyph.width &&
              y + Number(plate.getAttribute('height')) >= glyph.y + glyph.height
            );
          })
        )
        .toBe(true);
      await legible(label);
    });
  });
}
