import { expect, test, type Page } from '@playwright/test';

/**
 * The six chart custom elements registered today, asserted to actually RENDER.
 *
 * Every static gate passed before this existed: prop-parity confirmed each
 * wrapper declares all its props, check-wc-contract confirmed each is imported
 * so `customElements.define` runs, check-docs-contract confirmed every tag in
 * the docs resolves, and each file compiled clean. None of that is evidence
 * that the element draws anything — `check-wc-contract.js` says so in its own
 * passing output: "NOT checked: anything about how the element behaves once it
 * is defined."
 *
 * Registering a wrapper that does not work is worse than not registering one,
 * because the docs now tell a consumer to use it. So this mounts each tag,
 * feeds it the data its Svelte component requires, and asserts an SVG with real
 * geometry appears inside the shadow root. A blank `<svg>` would pass a
 * "did it render" check and fail a consumer, which is why the assertion is on
 * child count rather than presence.
 */
const loadBundle = async (page: Page): Promise<void> => {
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(
    () => typeof customElements.get('sui-sankey-chart') === 'function',
    null,
    { timeout: 15_000 }
  );
};

/** Minimal data each chart needs, keyed by the props its component destructures. */
const CHARTS: ReadonlyArray<{ tag: string; props: Record<string, unknown> }> = [
  {
    tag: 'sui-area-chart',
    props: {
      series: [
        {
          name: 'Revenue',
          data: [
            { x: 1, y: 30 },
            { x: 2, y: 45 },
            { x: 3, y: 38 }
          ]
        }
      ]
    }
  },
  {
    tag: 'sui-bar-chart',
    props: {
      data: [
        { label: 'Jan', value: 42 },
        { label: 'Feb', value: 38 },
        { label: 'Mar', value: 51 }
      ]
    }
  },
  {
    tag: 'sui-dual-axis-bar-chart',
    props: {
      categories: ['Jan', 'Feb', 'Mar'],
      series: [
        { name: 'Revenue', data: [100, 200, 150], yAxisIndex: 0, type: 'column' },
        { name: 'CTR', data: [3.2, 4.1, 3.7], yAxisIndex: 1, type: 'line' }
      ]
    }
  },
  {
    tag: 'sui-funnel-chart',
    props: {
      data: [
        { category: 'Visit', value: 12000 },
        { category: 'Cart', value: 4200 },
        { category: 'Purchase', value: 980 }
      ]
    }
  },
  {
    tag: 'sui-line-chart',
    props: {
      series: [
        {
          name: 'Revenue',
          data: [
            { x: 1, y: 30 },
            { x: 2, y: 45 },
            { x: 3, y: 38 }
          ]
        }
      ]
    }
  },
  {
    tag: 'sui-sankey-chart',
    props: {
      nodes: [
        { id: 'visit', label: 'Visit' },
        { id: 'cart', label: 'Cart' },
        { id: 'buy', label: 'Buy' }
      ],
      links: [
        { source: 'visit', target: 'cart', value: 4200 },
        { source: 'cart', target: 'buy', value: 980 }
      ]
    }
  }
];

test.describe('the chart custom elements render, not merely register', () => {
  for (const { tag, props } of CHARTS) {
    test(`<${tag}> draws geometry inside its shadow root`, async ({ page }) => {
      await loadBundle(page);

      const result = await page.evaluate(
        async ({ tag: hostTag, props: data }) => {
          const host = document.createElement(hostTag);
          // A chart needs a definite width; an unsized host would legitimately
          // draw nothing and the test would blame the wrapper for the fixture.
          host.style.width = '640px';
          host.style.height = '360px';
          document.body.append(host);
          Object.assign(host, data);

          const deadline = Date.now() + 8000;
          while (Date.now() < deadline) {
            const svg = host.shadowRoot?.querySelector('svg') ?? null;
            if (svg !== null && svg.children.length > 0) {
              return { defined: true, shadow: true, svgChildren: svg.children.length };
            }
            await new Promise((r) => requestAnimationFrame(() => r(null)));
          }
          return {
            defined: typeof customElements.get(hostTag) === 'function',
            shadow: host.shadowRoot !== null,
            svgChildren: host.shadowRoot?.querySelector('svg')?.children.length ?? -1
          };
        },
        { tag, props }
      );

      expect(result.defined, `${tag} must be a registered element`).toBe(true);
      expect(result.shadow, `${tag} must open a shadow root`).toBe(true);
      // -1 means no <svg> at all; 0 means an empty one. Both are a consumer
      // seeing a blank box after following the documented example.
      expect(result.svgChildren, `${tag} must draw something`).toBeGreaterThan(0);
    });
  }
});
