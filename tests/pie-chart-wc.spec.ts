import { expect, test, type Page } from '@playwright/test';

// `docs/PieChart.md` described `<sui-pie-chart>` for several releases while no
// wrapper existed, so the element never upgraded and the documented snippets
// rendered nothing at all. These tests are the difference between the docs
// describing a component and the component existing: each one fails outright
// against a missing registration.
//
// dist-wc is a self-contained bundle rather than a route of the demo site, so
// it is injected into a same-origin page instead of being navigated to.
// `pnpm run build` (the webServer command) runs build:wc, so the file exists.
const loadBundle = async (page: Page): Promise<void> => {
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(
    () => typeof customElements.get('sui-pie-chart') !== 'undefined',
    null,
    {
      timeout: 15_000
    }
  );
  // The demo app's own markup is cleared so the element under test is the only
  // thing on the page. Appending below a full-length demo route leaves it far
  // outside the viewport, which makes `toBeVisible` meaningless and leaves the
  // recorded video showing an unrelated page instead of the element it proves.
  await page.evaluate(() => {
    document.body.replaceChildren();
    document.body.style.padding = '24px';
  });
};

const SLICES = [
  { label: 'UPI', value: 62 },
  { label: 'Cards', value: 21 },
  { label: 'Netbanking', value: 9 },
  { label: 'Wallet', value: 5 },
  { label: 'EMI', value: 2 },
  { label: 'BNPL', value: 1 }
];

/** Mounts the element with `data` assigned as a JS property, as documented. */
const mount = async (page: Page, attributes: Record<string, string> = {}): Promise<void> => {
  await page.evaluate(
    ({ slices, attrs }) => {
      const el = document.createElement('sui-pie-chart');
      el.id = 'chart';
      for (const [name, value] of Object.entries(attrs)) {
        el.setAttribute(name, value);
      }
      Object.assign(el, { data: slices });
      document.body.append(el);
    },
    { slices: SLICES, attrs: attributes }
  );
};

test.describe('sui-pie-chart', () => {
  test('registers as a custom element', async ({ page }) => {
    await loadBundle(page);
    const upgraded = await page.evaluate(() => {
      const el = document.createElement('sui-pie-chart');
      document.body.append(el);
      return el.shadowRoot !== null;
    });
    expect(upgraded).toBe(true);
  });

  test('renders one arc per slice from a JS-assigned data array', async ({ page }) => {
    await loadBundle(page);
    await mount(page);
    await expect(page.locator('#chart path.slice')).toHaveCount(SLICES.length);
    await expect(page.locator('#chart svg')).toBeVisible();
  });

  test('coerces kebab-case number attributes into typed props', async ({ page }) => {
    await loadBundle(page);
    await mount(page, {
      'show-legend': '',
      'legend-show-values': '',
      'legend-position': 'right',
      'legend-max-items': '3'
    });

    // '3' arrives as the string "3" unless the declared type coerces it; the
    // component floors a non-integer cap and ignores a non-finite one, so a
    // string would surface as either every row or none.
    await expect(page.locator('#chart .pie-legend-row')).toHaveCount(3);
    await expect(page.locator('#chart .pie-legend-more')).toBeVisible();
    await expect(page.locator('#chart .pie-legend-more')).toHaveText('+3 more');
  });

  test('observes a boolean attribute being removed', async ({ page }) => {
    await loadBundle(page);
    await mount(page, { 'show-legend': '', 'legend-show-values': '' });
    await expect(page.locator('#chart .pie-legend-row')).toHaveCount(SLICES.length);

    await page.evaluate(() => document.querySelector('#chart')?.removeAttribute('show-legend'));
    await expect(page.locator('#chart .pie-legend-row')).toHaveCount(0);
  });

  test('expands in place when the built-in control is activated', async ({ page }) => {
    await loadBundle(page);
    await mount(page, {
      'show-legend': '',
      'legend-show-values': '',
      'legend-max-items': '2'
    });
    await page.locator('#chart .pie-legend-more').click();
    await expect(page.locator('#chart .pie-legend-row')).toHaveCount(SLICES.length);
  });

  test('keeps the built-in empty state when nothing is slotted into it', async ({ page }) => {
    // The wrapper declares `empty` as a snippet. Defining it unconditionally
    // would satisfy PieChart's `typeof empty === 'function'` guard on every
    // mount and replace the default rendering with a blank slot, so this pins
    // that an unslotted element still takes the component's own path.
    await loadBundle(page);
    await page.evaluate(() => {
      const el = document.createElement('sui-pie-chart');
      el.id = 'empty-default';
      Object.assign(el, { data: [] });
      document.body.append(el);
    });
    // Asserting only the absence of `.chart-empty` would also pass if the
    // element rendered nothing at all, so the chart itself is asserted present.
    await expect(page.locator('#empty-default svg')).toHaveCount(1);
    await expect(page.locator('#empty-default .chart-empty')).toHaveCount(0);
  });

  test('uses slotted empty content when it is provided', async ({ page }) => {
    await loadBundle(page);
    await page.evaluate(() => {
      const el = document.createElement('sui-pie-chart');
      el.id = 'empty-slotted';
      el.innerHTML = '<span slot="empty">Nothing to chart</span>';
      Object.assign(el, { data: [] });
      document.body.append(el);
    });
    await expect(page.locator('#empty-slotted .chart-empty')).toHaveCount(1);
    await expect(page.locator('#empty-slotted [slot="empty"]')).toBeVisible();
    await expect(page.locator('#empty-slotted [slot="empty"]')).toHaveText('Nothing to chart');
  });

  test('renders slotted center content inside a donut', async ({ page }) => {
    await loadBundle(page);
    await page.evaluate(
      ({ slices }) => {
        const el = document.createElement('sui-pie-chart');
        el.id = 'donut';
        el.setAttribute('inner-radius', '0.6');
        el.innerHTML = '<strong slot="center">62%</strong>';
        Object.assign(el, { data: slices });
        document.body.append(el);
      },
      { slices: SLICES }
    );
    await expect(page.locator('#donut .pie-center-content')).toHaveCount(1);
    await expect(page.locator('#donut [slot="center"]')).toBeVisible();
    await expect(page.locator('#donut [slot="center"]')).toHaveText('62%');
  });

  test('forwards the slice-click handler assigned as a property', async ({ page }) => {
    await loadBundle(page);
    await mount(page);
    const attached = await page.evaluate(() => {
      const el = document.querySelector('#chart');
      if (el === null) {
        return false;
      }
      Object.assign(el, {
        onsliceclick: (event: { index: number; slice: { label: string } }) => {
          document.body.dataset.clicked = `${event.index}:${event.slice.label}`;
        }
      });
      return true;
    });
    expect(attached).toBe(true);

    await page.locator('#chart path.slice').first().click();
    await expect(page.locator('body')).toHaveAttribute('data-clicked', '0:UPI');
  });
});
