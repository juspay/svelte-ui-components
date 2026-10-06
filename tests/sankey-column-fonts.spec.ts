import { expect, test, type Locator } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

test.use({ deviceScaleFactor: 3 });

const fullColumnsInside = async (chart: Locator): Promise<void> => {
  await expect(chart.locator('.sankey-label')).toHaveCount(0);
  await expect(chart.locator('.sankey-col-label')).toHaveCount(3);
  const inspect = () =>
    chart.evaluate((root) => {
      const view = root.getBoundingClientRect();
      const columns = Array.from(root.querySelectorAll('.sankey-col-label')).map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          text: Array.from(node.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => n.textContent)
            .join(''),
          full: node.querySelector('title')?.textContent,
          font: {
            size: getComputedStyle(node).fontSize,
            family: getComputedStyle(node).fontFamily
          },
          rect: {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height
          },
          outsideLeft: Math.max(0, view.left - rect.left),
          outsideRight: Math.max(0, rect.right - view.right)
        };
      });
      return {
        columns,
        width: view.width,
        scrollLeft: root.scrollLeft,
        scrollWidth: root.scrollWidth,
        nodeNames: Array.from(root.querySelectorAll('.sankey-node')).map((n) =>
          n.getAttribute('aria-label')
        )
      };
    });
  let result = await inspect();
  let prior: string | null = null;
  await expect
    .poll(async () => {
      result = await inspect();
      const key = JSON.stringify(result);
      const stable = key === prior;
      prior = key;
      return {
        stable,
        full: result.columns.every((c) => c.text === 'initializing_' && c.full === 'initializing_'),
        left: Math.max(...result.columns.map((c) => c.outsideLeft)),
        right: Math.max(...result.columns.map((c) => c.outsideRight))
      };
    })
    .toEqual({ stable: true, full: true, left: 0, right: 0 });
  expect(result.width).toBe(384);
  expect(result.scrollLeft).toBe(0);
  expect(result.scrollWidth).toBe(384);
  expect(result.nodeNames).toEqual(['a: 10', 'b: 10', 'c: 10']);
  await test.info().attach('native-column-only-font-metrics.json', {
    body: JSON.stringify(result),
    contentType: 'application/json'
  });
};

for (const theme of ['light', 'dark'] as const) {
  test(`column-only titles fit 384px through font swaps and teardown: ${theme}`, async ({
    page
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.addInitScript((value) => localStorage.setItem('theme-preference', value), theme);
    await gotoHydrated(page, '/components/sankey-chart');
    await page.evaluate(() => document.fonts.ready);
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => typeof customElements.get('sui-sankey-chart') === 'function');
    await page.evaluate(() => {
      const fonts = document.fonts;
      const add = fonts.addEventListener.bind(fonts);
      const remove = fonts.removeEventListener.bind(fonts);
      const active = new Set<EventListenerOrEventListenerObject>();
      Object.assign(window, {
        columnFontLifecycle: { active, adds: 0, removes: 0 },
        columnFontHost: null
      });
      fonts.addEventListener = ((
        name: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
      ) => {
        if (name === 'loadingdone') {
          active.add(listener);
          (
            window as unknown as { columnFontLifecycle: { adds: number } }
          ).columnFontLifecycle.adds += 1;
        }
        add(name, listener, options);
      }) as typeof fonts.addEventListener;
      fonts.removeEventListener = ((
        name: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions
      ) => {
        if (name === 'loadingdone') {
          active.delete(listener);
          (
            window as unknown as { columnFontLifecycle: { removes: number } }
          ).columnFontLifecycle.removes += 1;
        }
        remove(name, listener, options);
      }) as typeof fonts.removeEventListener;
      const host = document.createElement('sui-sankey-chart');
      host.id = 'column-fonts';
      host.style.cssText =
        'display:block;width:384px;font-family:ui-monospace,monospace;--chart-font-family:ui-monospace,monospace;--sankey-col-label-font-size:16px';
      Object.assign(host, {
        chartAriaLabel: 'Column metrics without node labels',
        showLabels: false,
        nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        links: [
          { source: 'a', target: 'b', value: 10 },
          { source: 'b', target: 'c', value: 10 }
        ],
        columnLabels: ['initializing_', 'initializing_', 'initializing_']
      });
      (window as unknown as { columnFontHost: HTMLElement }).columnFontHost = host;
      document.querySelector('main')?.append(host);
    });
    const host = page.locator('#column-fonts');
    const chart = host.locator('.sankey-chart');
    await page.evaluate(() => document.fonts.ready);
    await fullColumnsInside(chart);
    for (const [family, size] of [
      ['serif', '14px'],
      ['ui-monospace, monospace', '16px']
    ] as const) {
      await host.evaluate(
        (node, font) => {
          node.style.setProperty('--chart-font-family', font.family);
          node.style.setProperty('--sankey-col-label-font-size', font.size);
        },
        { family, size }
      );
      await page.evaluate(() => document.fonts.ready);
      await expect(chart.locator('.sankey-col-label').first()).toHaveCSS('font-size', size);
      await fullColumnsInside(chart);
    }
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { columnFontLifecycle: { active: Set<unknown> } })
              .columnFontLifecycle.active.size
        )
      )
      .toBeGreaterThan(0);
    await host.evaluate((node) => node.remove());
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { columnFontLifecycle: { active: Set<unknown> } })
              .columnFontLifecycle.active.size
        )
      )
      .toBe(0);
    await page.evaluate(() => {
      document.fonts.dispatchEvent(new Event('loadingdone'));
      const node = (window as unknown as { columnFontHost: HTMLElement }).columnFontHost;
      document.querySelector('main')?.append(node);
    });
    await fullColumnsInside(chart);
    await host.evaluate((node) => node.remove());
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { columnFontLifecycle: { active: Set<unknown> } })
              .columnFontLifecycle.active.size
        )
      )
      .toBe(0);
    const lifecycle = await page.evaluate(() => {
      const data = (
        window as unknown as {
          columnFontLifecycle: { active: Set<unknown>; adds: number; removes: number };
        }
      ).columnFontLifecycle;
      return { active: data.active.size, adds: data.adds, removes: data.removes };
    });
    expect(lifecycle.adds).toBe(lifecycle.removes);
    await test.info().attach('font-listener-teardown.json', {
      body: JSON.stringify(lifecycle),
      contentType: 'application/json'
    });
  });
}
