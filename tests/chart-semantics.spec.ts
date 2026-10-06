import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * ISSUE-009: LineChart, AreaChart and BarChart drew an unnamed `<svg role="img">`
 * around focusable data points. Naming alone was never the whole defect -- an
 * image's children are presentational, so the points either vanished from
 * assistive technology or were announced differently per browser (axe:
 * `nested-interactive`), and a named *wrapper* (BarChart's `role="region"`) left
 * the image inside it unnamed (axe: `svg-img-alt`).
 *
 * These assert the accessibility contract in a real browser, in light and dark,
 * in whichever engine the project runs: every chart drawing is named, an
 * interactive one is a `group` (never an image holding controls), a static one
 * is a named image, points stay Tab-reachable and named, nothing is announced
 * twice, and every id a chart emits is instance-scoped.
 */

const THEMES = ['light', 'dark'] as const;

const ROUTES = [
  { route: 'line-chart', root: '.line-chart', charts: 18 },
  { route: 'area-chart', root: '.area-chart', charts: 8 },
  { route: 'bar-chart', root: '.bar-chart', charts: 15 }
] as const;

const useTheme = async (page: Page, theme: (typeof THEMES)[number]): Promise<void> => {
  await page.emulateMedia({ colorScheme: theme });
  await page.addInitScript((value) => {
    try {
      localStorage.setItem('theme-preference', value);
    } catch {
      // Storage can be blocked; the emulated colour scheme still applies.
    }
  }, theme);
};

const loadBundle = async (page: Page): Promise<void> => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(
    () => typeof customElements.get('sui-bar-chart') === 'function',
    null,
    {
      timeout: 15_000
    }
  );
};

for (const theme of THEMES) {
  test.describe(`chart semantics (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await useTheme(page, theme);
    });

    for (const { route, root, charts } of ROUTES) {
      test(`${route}: every example drawing is named, and interactive ones are groups`, async ({
        page
      }) => {
        await gotoHydrated(page, `/components/${route}`);
        await expect(page.locator(`${root} svg`)).toHaveCount(charts);

        const drawings = await page.locator(`${root} svg`).evaluateAll((svgs) =>
          svgs.map((svg) => ({
            role: svg.getAttribute('role'),
            name: svg.getAttribute('aria-label'),
            interactive: svg.querySelectorAll('[tabindex]').length
          }))
        );

        for (const drawing of drawings) {
          expect(drawing.name, 'every chart svg carries its own accessible name').toBeTruthy();
          // The generic fallback is for consumers who pass nothing; an example
          // that still relies on it is not "meaningfully named".
          expect(drawing.name).not.toMatch(/^(Line|Area|Bar) chart$/);
          expect(drawing.interactive).toBeGreaterThanOrEqual(0);
          if (drawing.interactive > 0) {
            expect(drawing.role, 'a drawing holding controls is not an image').toBe('group');
          } else {
            expect(drawing.role).toBe('img');
          }
        }
        // Distinct names: two examples must be tellable apart by name alone.
        const names = drawings.map((d) => d.name);
        expect(new Set(names).size).toBe(names.length);
      });

      test(`${route}: nothing exposed as an image holds a focusable control`, async ({ page }) => {
        await gotoHydrated(page, `/components/${route}`);
        const nested = await page
          .locator(`${root} svg[role="img"]`)
          .evaluateAll(
            (svgs) =>
              svgs.filter((svg) => svg.querySelector('[tabindex],button,a[href]') !== null).length
          );
        expect(nested).toBe(0);
      });

      test(`${route}: every id a chart emits is unique in the document and resolves in its own svg`, async ({
        page
      }) => {
        await gotoHydrated(page, `/components/${route}`);
        const report = await page.evaluate((rootSelector) => {
          const svgs = [...document.querySelectorAll(`${rootSelector} svg`)];
          const counts = new Map<string, number>();
          for (const el of document.querySelectorAll('[id]')) {
            counts.set(el.id, (counts.get(el.id) ?? 0) + 1);
          }
          const chartIds = svgs.flatMap((svg) =>
            [...svg.querySelectorAll('[id]')].map((e) => e.id)
          );
          const duplicated = [...new Set(chartIds)].filter((id) => (counts.get(id) ?? 0) > 1);
          const dangling: string[] = [];
          for (const svg of svgs) {
            const referenced = [
              ...[...svg.querySelectorAll('[fill],[stroke]')].flatMap((el) =>
                ['fill', 'stroke'].map((attr) => el.getAttribute(attr) ?? '')
              ),
              svg.getAttribute('aria-describedby') ?? ''
            ];
            for (const value of referenced) {
              const match = /^url\(#(.+)\)$/.exec(value);
              const id = match ? match[1] : value.startsWith('chart-desc-') ? value : null;
              if (id !== null && svg.querySelector(`[id="${id}"]`) === null) {
                dangling.push(id);
              }
            }
          }
          return { chartIds: chartIds.length, duplicated, dangling };
        }, root);
        expect(report.duplicated).toEqual([]);
        expect(report.dangling).toEqual([]);
      });
    }

    test('bar-chart: no region landmark is added to charts that do not scroll', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/bar-chart');
      // Every chart used to be wrapped in `role="region" aria-label="Bar chart"`:
      // fifteen identically named landmarks (axe: landmark-unique) that named the
      // wrapper while the image inside stayed unnamed.
      await expect(page.locator('.bar-chart [role="region"]')).toHaveCount(0);
    });

    test('bar-chart: the basic example exposes one named group of named, Tab-reachable bars', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/bar-chart');
      const chart = page.locator('.bar-chart').first();
      const group = chart.getByRole('group', { name: 'Monthly revenue, January to June' });
      await expect(group).toBeVisible();
      await expect(group).toHaveAccessibleDescription(/Revenue ranges from 3,800 in February/);

      // Tick labels and value labels repeat what the bars' own names say.
      await expect(chart.locator('.tick-label:not([aria-hidden="true"])')).toHaveCount(0);

      await expect(chart).toMatchAriaSnapshot(`
        - group "Monthly revenue, January to June":
          - 'button "Jan: 4.2K"'
          - 'button "Feb: 3.8K"'
          - 'button "Mar: 5.1K"'
          - 'button "Apr: 4.6K"'
          - 'button "May: 5.8K"'
          - 'button "Jun: 6.2K"'
      `);
    });

    test('bar-chart: values drawn on the bars are hidden from assistive technology', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/bar-chart');
      const chart = page.locator('.bar-chart').nth(1);
      await expect(chart.locator('text.bar-value').first()).toBeAttached();
      await expect(chart.locator('text.bar-value:not([aria-hidden="true"])')).toHaveCount(0);
    });

    test('bar-chart: a real Tab walk visits each bar once, in order, with its tooltip', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/bar-chart');
      const chart = page.locator('.bar-chart').first();
      await chart.scrollIntoViewIfNeeded();
      await page.evaluate(() => {
        const sentinel = document.createElement('button');
        sentinel.id = 'tab-sentinel';
        sentinel.textContent = 'sentinel';
        document.querySelector('.bar-chart')?.before(sentinel);
        sentinel.focus();
      });

      const expected = [
        'Jan: 4.2K',
        'Feb: 3.8K',
        'Mar: 5.1K',
        'Apr: 4.6K',
        'May: 5.8K',
        'Jun: 6.2K'
      ];
      for (const name of expected) {
        await page.keyboard.press('Tab');
        const focused = page.locator(':focus');
        await expect(focused).toHaveAttribute('role', 'button');
        await expect(focused).toHaveAttribute('aria-label', name);
        // The svg group itself is never a Tab stop.
        await expect(chart.locator('svg')).not.toBeFocused();
        await expect(chart.getByTestId('chart-tooltip')).toBeVisible();
      }
      // One more Tab leaves the first chart's bars for the next chart's.
      await page.keyboard.press('Tab');
      const after = await page.evaluate(
        () => document.activeElement?.closest('.bar-chart') === document.querySelector('.bar-chart')
      );
      expect(after).toBe(false);
    });

    test('line-chart: a real Tab walk visits each point with its series-qualified name', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/line-chart');
      const chart = page.locator('.line-chart').nth(1);
      await expect(
        chart.getByRole('group', {
          name: 'Product A, Product B and Product C compared over six periods'
        })
      ).toBeVisible();
      await chart.scrollIntoViewIfNeeded();
      await page.evaluate(() => {
        const sentinel = document.createElement('button');
        sentinel.id = 'tab-sentinel';
        sentinel.textContent = 'sentinel';
        document.querySelectorAll('.line-chart')[1]?.before(sentinel);
        sentinel.focus();
      });
      const expectedFirst = ['1 — Product A: 20', '2 — Product A: 35', '3 — Product A: 28'];
      for (const name of expectedFirst) {
        await page.keyboard.press('Tab');
        await expect(page.locator(':focus')).toHaveAttribute('aria-label', name);
      }
    });

    test('line-chart: a focused point is announced by its name and the status region once, never also as a description', async ({
      page,
      browserName
    }) => {
      await gotoHydrated(page, '/components/line-chart');
      const chart = page.locator('.line-chart').nth(1);
      await chart.scrollIntoViewIfNeeded();
      const points = chart.locator('svg [role="button"]');
      expect(await points.count()).toBeGreaterThan(3);
      const status = chart.locator('[role="status"]');
      await expect(status).toHaveCount(1);

      await points.nth(1).focus();
      await expect(status).toHaveText('2 — Product A: 35, Product B: 25, Product C: 15');

      // The region is shared, so describing a point by it spoke the same text a
      // second time and gave every UNFOCUSED point the last-announced point's
      // text as its description.
      await expect(chart.locator('svg [aria-describedby]')).toHaveCount(0);
      for (const index of [0, 1, 2]) {
        await expect(points.nth(index)).toHaveAccessibleDescription('');
      }

      // Playwright computes descriptions itself; Chromium alone also exposes the
      // browser's own computation, which is what a native screen reader reads.
      if (browserName === 'chromium') {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Accessibility.enable');
        const { nodes } = await cdp.send('Accessibility.getFullAXTree');
        const described = nodes
          .filter(
            (node) =>
              node.role?.value === 'button' && /^\d+ — Product [ABC]: \d+$/.test(node.name?.value)
          )
          .map((node) => ({ name: node.name?.value, description: node.description?.value ?? '' }));
        expect(described.length).toBeGreaterThan(3);
        expect(described.filter((node) => node.description !== '')).toEqual([]);
      }
    });

    test('line-chart: a single-series point is spoken as its own name only, not repeated by the status region', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/line-chart');
      const chart = page.locator('.line-chart').first();
      await chart.scrollIntoViewIfNeeded();
      const point = chart.locator('svg [role="button"]').nth(1);
      const status = chart.locator('[role="status"]');
      await point.focus();
      await expect(point).toHaveAccessibleName('2: 45');
      await expect(status).toHaveText('');

      // Pointer hover has no focus announcement of its own, so the region does speak.
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      const box = await chart.locator('svg [role="button"]').nth(2).boundingBox();
      expect(box).not.toBeNull();
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await expect(status).toHaveText('3: 38');
    });

    test('line-chart: leaving the chart empties the status region instead of leaving a stale announcement', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/line-chart');
      const chart = page.locator('.line-chart').nth(1);
      await chart.scrollIntoViewIfNeeded();
      const status = chart.locator('[role="status"]');
      await chart.locator('svg [role="button"]').nth(2).focus();
      await expect(status).toHaveText('3 — Product A: 28, Product B: 40, Product C: 12');
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await expect(status).toHaveText('');
    });

    test('line-chart: hiding every series through the legend turns the group back into a named image', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/line-chart');
      const chart = page.getByTestId('line-shared-tooltip-chart');
      const svg = chart.locator('svg');
      await expect(svg).toHaveAttribute('role', 'group');
      await expect(chart.locator('[tabindex]').first()).toBeAttached();

      for (const index of [0, 1, 2]) {
        await chart.getByTestId(`legend-toggle-${index}`).click();
      }
      // Nothing left to operate: a static, named image -- and no stranded control.
      await expect(svg).toHaveAttribute('role', 'img');
      await expect(svg).toHaveAttribute(
        'aria-label',
        'Desktop, Mobile and Tablet over eight periods, with legend toggles to show or hide each series'
      );
      await expect(chart.locator('svg [tabindex]')).toHaveCount(0);

      await chart.getByTestId('legend-toggle-1').click();
      await expect(svg).toHaveAttribute('role', 'group');
      await expect(chart.locator('svg [tabindex]').first()).toBeAttached();
    });

    test('bar-chart: a chart that draws no bars is a named image, not an empty group', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/bar-chart');
      const svg = page
        .locator(
          '.bar-chart svg[aria-label="Scores for Alpha, Beta and Gamma, axes only (bars hidden)"]'
        )
        .first();
      await expect(svg).toHaveAttribute('role', 'img');
      await expect(svg.locator('[tabindex]')).toHaveCount(0);
    });

    test('area-chart: stacked series keep their names and per-series point labels', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/area-chart');
      const chart = page.locator('.area-chart').nth(2);
      await expect(
        chart.getByRole('group', {
          name: 'Website traffic by source (Direct, Organic, Referral), stacked over six periods'
        })
      ).toBeVisible();
      await expect(
        chart.getByRole('button', { name: '1 — Direct: 40', exact: true })
      ).toBeAttached();
    });

    test.describe('web components', () => {
      test('chart-aria-label / chart-aria-description name and describe the drawing in the shadow root', async ({
        page
      }) => {
        await loadBundle(page);
        await page.evaluate(() => {
          const bar = document.createElement('sui-bar-chart');
          bar.setAttribute('data-pw', 'wc-bar');
          bar.setAttribute('chart-aria-label', 'WC revenue by month');
          bar.setAttribute('chart-aria-description', 'Revenue is higher in February than January.');
          Object.assign(bar, {
            data: [
              { label: 'Jan', value: 42 },
              { label: 'Feb', value: 51 }
            ]
          });
          document.body.append(bar);

          const line = document.createElement('sui-line-chart');
          line.setAttribute('data-pw', 'wc-line');
          Object.assign(line, {
            chartAriaLabel: 'WC sessions',
            chartAriaDescription: 'Sessions grow across three days.',
            series: [
              {
                name: 'Sessions',
                data: [
                  { x: 1, y: 3 },
                  { x: 2, y: 5 },
                  { x: 3, y: 8 }
                ]
              }
            ]
          });
          document.body.append(line);

          const area = document.createElement('sui-area-chart');
          area.setAttribute('data-pw', 'wc-area');
          area.setAttribute('chart-aria-label', 'WC traffic');
          Object.assign(area, {
            series: [
              {
                name: 'Traffic',
                data: [
                  { x: 1, y: 3 },
                  { x: 2, y: 5 }
                ]
              }
            ]
          });
          document.body.append(area);
        });

        const bar = page.getByRole('group', { name: 'WC revenue by month' });
        await expect(bar).toBeVisible();
        await expect(bar).toHaveAccessibleDescription(
          'Revenue is higher in February than January.'
        );
        await expect(bar.getByRole('button', { name: 'Feb: 51' })).toBeVisible();

        // The property spelling reaches the same place as the attribute.
        const line = page.getByRole('group', { name: 'WC sessions' });
        await expect(line).toBeVisible();
        await expect(line).toHaveAccessibleDescription('Sessions grow across three days.');

        await expect(page.getByRole('group', { name: 'WC traffic' })).toBeVisible();

        // The description id resolves inside the same shadow root.
        const resolves = await page.evaluate(() => {
          const svg = document
            .querySelector('[data-pw="wc-bar"]')
            ?.shadowRoot?.querySelector('svg');
          const id = svg?.getAttribute('aria-describedby') ?? '';
          const root = svg?.getRootNode();
          const target = root instanceof ShadowRoot ? root.getElementById(id) : null;
          return {
            id,
            text: target?.textContent ?? null,
            ownsNothingOutside: document.getElementById(id) === null
          };
        });
        expect(resolves.id).toMatch(/^chart-desc-/);
        expect(resolves.text).toBe('Revenue is higher in February than January.');
        expect(resolves.ownsNothingOutside).toBe(true);
      });

      test('sui-line-chart points are named buttons that no shared status region also describes', async ({
        page
      }) => {
        await loadBundle(page);
        await page.evaluate(() => {
          const line = document.createElement('sui-line-chart');
          line.setAttribute('data-pw', 'wc-line-points');
          line.setAttribute('chart-aria-label', 'WC sessions per day');
          Object.assign(line, {
            series: [
              {
                name: 'Sessions',
                data: [
                  { x: 1, y: 3 },
                  { x: 2, y: 5 },
                  { x: 3, y: 8 }
                ]
              }
            ]
          });
          document.body.append(line);
        });
        const host = page.getByTestId('wc-line-points');
        const points = host.locator('svg [role="button"]');
        await expect(points).toHaveCount(3);
        await points.nth(1).focus();
        await expect(points.nth(1)).toHaveAccessibleName('2: 5');
        // The focused point's own name is the announcement; the region does not
        // say "2: 5" a second time.
        await expect(host.locator('[role="status"]')).toHaveText('');
        await expect(host.locator('svg [aria-describedby]')).toHaveCount(0);
        for (const index of [0, 1, 2]) {
          await expect(points.nth(index)).toHaveAccessibleDescription('');
        }
      });

      test("the host's own aria-label is not the chart's name and is left alone", async ({
        page
      }) => {
        await loadBundle(page);
        await page.evaluate(() => {
          const bar = document.createElement('sui-bar-chart');
          bar.setAttribute('data-pw', 'wc-host-label');
          bar.setAttribute('aria-label', 'Host label');
          bar.setAttribute('chart-aria-label', 'Inner chart name');
          Object.assign(bar, { data: [{ label: 'Jan', value: 42 }] });
          document.body.append(bar);
        });
        const host = page.getByTestId('wc-host-label');
        await expect(host).toHaveAttribute('aria-label', 'Host label');
        const svg = host.locator('svg');
        await expect(svg).toHaveAttribute('aria-label', 'Inner chart name');
        await expect(host.evaluate((el) => (el as HTMLElement).ariaLabel)).resolves.toBe(
          'Host label'
        );
      });

      test('an unlabelled chart is still identifiable by what it plots', async ({ page }) => {
        await loadBundle(page);
        await page.evaluate(() => {
          const line = document.createElement('sui-line-chart');
          line.setAttribute('data-pw', 'wc-fallback-line');
          Object.assign(line, {
            series: [
              { name: 'Revenue', data: [{ x: 1, y: 3 }] },
              { name: 'Cost', data: [{ x: 1, y: 2 }] }
            ]
          });
          document.body.append(line);

          const bar = document.createElement('sui-bar-chart');
          bar.setAttribute('data-pw', 'wc-fallback-bar');
          bar.setAttribute('y-axis-label', 'Revenue ($)');
          Object.assign(bar, { data: [{ label: 'Jan', value: 42 }] });
          document.body.append(bar);
        });
        await expect(page.getByRole('group', { name: 'Line chart: Revenue, Cost' })).toBeVisible();
        await expect(page.getByRole('group', { name: 'Revenue ($) bar chart' })).toBeVisible();
      });

      test('a scrollable bar chart is a named focusable region whose name differs from the chart inside', async ({
        page
      }) => {
        await loadBundle(page);
        await page.evaluate(() => {
          const bar = document.createElement('sui-bar-chart');
          bar.setAttribute('data-pw', 'wc-scroll');
          bar.setAttribute('scrollable', '');
          bar.setAttribute('chart-aria-label', 'Revenue by month');
          Object.assign(bar, {
            data: Array.from({ length: 24 }, (_, i) => ({ label: `M${i + 1}`, value: 10 + i }))
          });
          bar.style.display = 'block';
          bar.style.width = '320px';
          document.body.append(bar);
        });
        const host = page.getByTestId('wc-scroll');
        const region = host.getByRole('region', { name: 'Revenue by month, scrollable' });
        await expect(region).toBeVisible();
        await expect(region).toHaveAttribute('tabindex', '0');
        await expect(
          host.getByRole('group', { name: 'Revenue by month', exact: true })
        ).toBeVisible();
      });
    });
  });
}
