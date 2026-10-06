import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Real demo shell and real bundled components. The WC-only host is a 640px
// section in main, with no component CSS overrides. Fonts are unrelated to
// naming/interaction and are blocked to avoid a third-party load dependency.
const charts = [
  { route: 'pie-chart', root: '.pie-chart', count: 16, tag: 'sui-pie-chart', event: 'sliceclick' },
  {
    route: 'sankey-chart',
    root: '.sankey-chart',
    count: 11,
    tag: 'sui-sankey-chart',
    event: 'linkclick'
  },
  {
    route: 'dual-axis-bar-chart',
    root: '.dual-axis-bar-chart',
    count: 8,
    tag: 'sui-dual-axis-bar-chart',
    event: 'barclick'
  },
  {
    route: 'funnel-chart',
    root: '.funnel-chart',
    count: 11,
    tag: 'sui-funnel-chart',
    event: 'stageclick'
  }
] as const;

const mountWc = async (page: Page, tag: string, eventName: string): Promise<void> => {
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction((name) => typeof customElements.get(name) === 'function', tag);
  await page.evaluate(
    ({ name, event }) => {
      const host = document.createElement(name);
      host.id = 'wc-chart';
      host.style.width = '640px';
      host.setAttribute('aria-label', 'Native host label');
      host.setAttribute('aria-description', 'Native host description');
      host.setAttribute('chart-aria-label', 'WC payment performance');
      host.setAttribute('chart-aria-description', 'Compare the two payment categories.');
      const data =
        name === 'sui-pie-chart'
          ? {
              data: [
                { label: 'Alpha', value: 10 },
                { label: 'Beta', value: 20 }
              ]
            }
          : name === 'sui-sankey-chart'
            ? {
                nodes: [
                  { id: 'alpha', label: 'Alpha' },
                  { id: 'beta', label: 'Beta' }
                ],
                links: [{ source: 'alpha', target: 'beta', value: 20 }]
              }
            : name === 'sui-dual-axis-bar-chart'
              ? {
                  categories: ['Jan', 'Feb'],
                  series: [{ name: 'Revenue', data: [10, 20], yAxisIndex: 0, type: 'column' }],
                  showLegend: false
                }
              : {
                  data: [
                    { category: 'Alpha', value: 100 },
                    { category: 'Beta', value: 20 }
                  ]
                };
      Object.assign(host, data);
      const events: unknown[] = [];
      host.addEventListener(event, (value) => events.push((value as CustomEvent).detail));
      Object.assign(window, { __chartEvents: events });
      const wrapper = document.createElement('section');
      wrapper.id = 'wc-section';
      const before = document.createElement('button');
      before.id = 'wc-before';
      before.textContent = 'Before chart';
      const after = document.createElement('button');
      after.id = 'wc-after';
      after.textContent = 'After chart';
      wrapper.append(before, host, after);
      document.querySelector('main')?.append(wrapper);
    },
    { name: tag, event: eventName }
  );
};

for (const theme of ['light', 'dark'] as const) {
  test.describe(`remaining chart semantics: ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((value) => localStorage.setItem('theme-preference', value), theme);
      await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
    });

    for (const chart of charts) {
      test(`${chart.route}: every example has a distinct name and exposed controls`, async ({
        page
      }) => {
        await gotoHydrated(page, `/components/${chart.route}`);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const svgs = page.locator(`${chart.root} .chart-container > svg`);
        await expect(svgs).toHaveCount(chart.count);
        const inventory = await svgs.evaluateAll((drawings) =>
          drawings.map((svg) => ({
            name: svg.getAttribute('aria-label'),
            role: svg.getAttribute('role'),
            controls: [...svg.querySelectorAll('[tabindex="0"]')].map((node) => ({
              name: node.getAttribute('aria-label'),
              role: node.getAttribute('role'),
              describedBy: node.getAttribute('aria-describedby')
            })),
            description: svg.getAttribute('aria-describedby'),
            resolved:
              svg.getAttribute('aria-describedby') === null ||
              svg.querySelector(`[id="${svg.getAttribute('aria-describedby')}"]`) !== null
          }))
        );
        expect(new Set(inventory.map((value) => value.name)).size).toBe(chart.count);
        for (const drawing of inventory) {
          expect(drawing.name).toBeTruthy();
          expect(drawing.name).not.toMatch(
            /^(Pie chart|Flow diagram|Dual-axis chart|Funnel chart)$/
          );
          expect(drawing.role).toBe(drawing.controls.length > 0 ? 'group' : 'img');
          expect(drawing.resolved).toBe(true);
          for (const control of drawing.controls) {
            expect(control.name?.trim()).toBeTruthy();
            expect(control.role).toBe('button');
            expect(control.describedBy).toBeNull();
          }
        }
        await expect(svgs.first()).toHaveAccessibleDescription(/./);
        const snapshot = await svgs.first().ariaSnapshot();
        expect(snapshot).toContain(`group "${inventory[0].name}"`);
        for (const control of inventory[0].controls) {
          // Accessible names normalize whitespace; the formatter's raw visual
          // label deliberately puts two spaces around its separator.
          expect(snapshot).toContain(`button "${control.name?.replace(/\s+/g, ' ').trim()}"`);
        }
        await test.info().attach('example-drawings.json', {
          body: JSON.stringify(inventory, null, 2),
          contentType: 'application/json'
        });
        await test.info().attach('representative-aria-tree.txt', {
          body: snapshot,
          contentType: 'text/plain'
        });
        const ids = await page
          .locator(`${chart.root} [id]`)
          .evaluateAll((nodes) => nodes.map((node) => node.id));
        expect(new Set(ids).size).toBe(ids.length);
      });

      test(`${chart.route}: real Tab reaches points once with keyboard tooltips`, async ({
        page
      }) => {
        await gotoHydrated(page, `/components/${chart.route}`);
        const first = page.locator(chart.root).first();
        const controls = first.locator('svg [role="button"][tabindex="0"]');
        const names = await controls.evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute('aria-label'))
        );
        expect(names.length).toBeGreaterThan(1);
        await first.scrollIntoViewIfNeeded();
        await page.mouse.move(0, 0);
        await first.evaluate((node) => {
          const sentinel = document.createElement('button');
          sentinel.textContent = 'Before drawing';
          node.before(sentinel);
          sentinel.focus();
        });
        for (const name of names.slice(0, 3)) {
          await page.keyboard.press('Tab');
          await expect(page.locator(':focus')).toHaveAttribute('aria-label', name ?? '');
          await expect(first.getByTestId('chart-tooltip')).toBeVisible();
        }
        await expect(first.locator('svg')).not.toBeFocused();
        if (chart.tag === 'sui-pie-chart') {
          await expect(first.getByTestId('pie-status')).toHaveText('');
          await expect(first.locator('.slice[aria-describedby]')).toHaveCount(0);
        }
      });

      test(`${chart.tag}: naming attributes update only the drawing, resolve locally, and survive empty data`, async ({
        page
      }) => {
        await gotoHydrated(page, `/components/${chart.route}`);
        await mountWc(page, chart.tag, chart.event);
        const host = page.locator('#wc-chart');
        const drawing = host.locator('.chart-container > svg, .chart-empty[role="img"]');
        await expect(drawing).toHaveAttribute('role', 'group');
        await expect(drawing).toHaveAccessibleName('WC payment performance');
        await expect(drawing).toHaveAccessibleDescription('Compare the two payment categories.');
        const local = await drawing.evaluate((node) => {
          const id = node.getAttribute('aria-describedby');
          const tree = node.getRootNode() as ShadowRoot;
          return {
            shadow: tree instanceof ShadowRoot,
            text: tree.querySelector(`[id="${id}"]`)?.textContent
          };
        });
        expect(local).toEqual({ shadow: true, text: 'Compare the two payment categories.' });
        expect(
          await host.evaluate((node) => ({
            label: node.ariaLabel,
            description: node.ariaDescription
          }))
        ).toEqual({
          label: 'Native host label',
          description: 'Native host description'
        });
        await host.evaluate((node) => {
          node.setAttribute('chart-aria-label', 'Updated payment performance');
          node.setAttribute('chart-aria-description', 'Updated reading instructions.');
        });
        await expect(drawing).toHaveAccessibleName('Updated payment performance');
        await expect(drawing).toHaveAccessibleDescription('Updated reading instructions.');
        await host.evaluate((node) =>
          Object.assign(node, { chartAriaLabel: 'Property-set performance' })
        );
        await expect(drawing).toHaveAccessibleName('Property-set performance');
        expect(await host.evaluate((node) => node.ariaLabel)).toBe('Native host label');
        await host.evaluate((node) => {
          node.removeAttribute('chart-aria-label');
          node.removeAttribute('chart-aria-description');
        });
        await expect(drawing).toHaveAttribute('aria-label', /Alpha|Revenue/);
        await expect(drawing).not.toHaveAttribute('aria-describedby', /./);
        await host.evaluate((node) => {
          node.setAttribute('chart-aria-label', 'Empty payment performance');
          node.setAttribute('chart-aria-description', 'No payments available.');
          Object.assign(
            node,
            node.tagName === 'SUI-SANKEY-CHART'
              ? { nodes: [], links: [] }
              : node.tagName === 'SUI-DUAL-AXIS-BAR-CHART'
                ? { categories: [], series: [] }
                : { data: [] }
          );
        });
        await expect(drawing).toHaveAttribute('role', 'img');
        await expect(drawing).toHaveAccessibleName('Empty payment performance');
        await expect(drawing).toHaveAccessibleDescription('No payments available.');
        await expect(drawing.locator('[tabindex],button')).toHaveCount(0);
      });

      test(`${chart.tag}: real Tab, Enter, Space and pointer retain public callback payloads`, async ({
        page
      }) => {
        await gotoHydrated(page, `/components/${chart.route}`);
        await mountWc(page, chart.tag, chart.event);
        const host = page.locator('#wc-chart');
        const control = host.locator('svg [role="button"][tabindex="0"]').first();
        await host.scrollIntoViewIfNeeded();
        await page.mouse.move(0, 0);
        await page.locator('#wc-before').focus();
        await page.keyboard.press('Tab');
        await expect(control).toBeFocused();
        await expect(host.getByTestId('chart-tooltip')).toBeVisible();
        if (chart.tag === 'sui-pie-chart') {
          await expect(control).toHaveClass(/hovered/);
          await expect(host.getByTestId('pie-status')).toHaveText('');
        } else if (chart.tag === 'sui-sankey-chart') {
          await expect(control).toHaveAttribute('stroke-opacity', '0.7');
        } else if (chart.tag === 'sui-dual-axis-bar-chart') {
          await expect(host.locator('.bar-hovered')).toHaveCount(1);
        } else {
          await expect(control).toHaveClass(/funnel-bar-hovered/);
        }
        await page.keyboard.press('Enter');
        await page.keyboard.press('Space');
        if (chart.tag === 'sui-sankey-chart') {
          // A horizontal SVG path has a zero-height geometric box in Chromium
          // and WebKit even though its stroke is painted and clickable. Use
          // its native curve/transform and prove the painted recipient before
          // sending a real pointer click; no force or synthetic dispatch.
          const point = await control.evaluate((node) => {
            if (!(node instanceof SVGPathElement)) {
              throw new Error('expected a Sankey path');
            }
            const local = node.getPointAtLength(node.getTotalLength() / 2);
            const matrix = node.getScreenCTM();
            if (matrix === null) {
              throw new Error('Sankey path has no screen transform');
            }
            const screen = new DOMPoint(local.x, local.y).matrixTransform(matrix);
            const tree = node.getRootNode() as Document | ShadowRoot;
            return {
              x: screen.x,
              y: screen.y,
              recipient: tree.elementFromPoint(screen.x, screen.y) === node
            };
          });
          expect(point.recipient).toBe(true);
          await test.info().attach('native-stroke-hit-test.json', {
            body: JSON.stringify(point),
            contentType: 'application/json'
          });
          await page.mouse.click(point.x, point.y);
        } else {
          await control.click();
        }
        const events = await page.evaluate(
          () => (window as unknown as { __chartEvents: unknown[] }).__chartEvents
        );
        expect(events).toHaveLength(3);
        for (const payload of events) {
          expect(payload).toEqual(
            chart.tag === 'sui-pie-chart'
              ? { index: 0, slice: { label: 'Alpha', value: 10 } }
              : chart.tag === 'sui-sankey-chart'
                ? { link: { source: 'alpha', target: 'beta', value: 20 } }
                : chart.tag === 'sui-funnel-chart'
                  ? { index: 0, stage: { category: 'Alpha', value: 100 } }
                  : {
                      categoryIndex: 0,
                      context: {
                        categoryIndex: 0,
                        category: 'Jan',
                        points: [
                          {
                            name: 'Revenue',
                            value: 10,
                            color: expect.any(String),
                            yAxisIndex: 0,
                            type: 'column'
                          }
                        ]
                      }
                    }
          );
        }
      });
    }

    test('an empty WC pie preserves a center action and its real keyboard route', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/pie-chart');
      await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
      await page.waitForFunction(() => typeof customElements.get('sui-pie-chart') === 'function');
      await page.evaluate(() => {
        const before = document.createElement('button');
        before.id = 'center-before';
        before.textContent = 'Before empty allocation';
        const host = document.createElement('sui-pie-chart');
        host.id = 'empty-center-chart';
        host.style.width = '400px';
        host.setAttribute('chart-aria-label', 'Empty allocation with reset');
        Object.assign(host, { data: [], innerRadius: 0.6 });
        const action = document.createElement('button');
        action.slot = 'center';
        action.textContent = 'Reset empty allocation';
        Object.assign(window, { __centerActivations: 0 });
        action.addEventListener('click', () => {
          const state = window as unknown as { __centerActivations: number };
          state.__centerActivations += 1;
        });
        host.append(action);
        document.querySelector('main')?.append(before, host);
      });
      const host = page.locator('#empty-center-chart');
      await expect(host.locator('.chart-container > svg')).toHaveAttribute('role', 'group');
      await expect(host.locator('.slice[tabindex]')).toHaveCount(0);
      await page.locator('#center-before').focus();
      await page.keyboard.press('Tab');
      await expect(
        page.getByRole('button', { name: 'Reset empty allocation', exact: true })
      ).toBeFocused();
      await page.keyboard.press('Enter');
      expect(
        await page.evaluate(
          () => (window as unknown as { __centerActivations: number }).__centerActivations
        )
      ).toBe(1);
      expect(await host.locator('svg').ariaSnapshot()).toContain('button "Reset empty allocation"');
    });

    test('Pie focus speaks one complete slice name; declarative and imperative UI highlights still narrate', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/pie-chart');
      const basic = page.locator('.pie-chart').first();
      const slice = basic.locator('.slice').first();
      await slice.focus();
      await expect(slice).toHaveAttribute('aria-label', /: .+ \(.+%\)$/);
      await expect(basic.getByTestId('pie-status')).toHaveText('');
      await expect(basic.locator('.slice[aria-describedby]')).toHaveCount(0);
      for (const name of [
        'Browser share with declarative highlight',
        'Browser share with narrated highlight'
      ]) {
        const demo = page
          .locator('.demo-row')
          .filter({ has: page.getByRole('group', { name, exact: true }) });
        await expect(demo).toHaveCount(1);
        await demo.getByRole('button', { name: 'Chrome', exact: true }).click();
        await expect(demo.getByTestId('pie-status')).toHaveText(
          (await demo.locator('.slice').first().getAttribute('aria-label')) ?? ''
        );
        await expect(demo.locator('.slice').first()).toHaveClass(/hovered/);
        await demo.getByRole('button', { name: 'Clear', exact: true }).click();
        await expect(demo.getByTestId('pie-status')).toHaveText('');
      }
    });
  });
}
