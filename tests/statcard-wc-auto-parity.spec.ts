import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/*
 * The custom element must animate exactly as many values as the Svelte
 * component does, for the same props.
 *
 * `animatePrimary` means "animate ONE value -- the card's largest metric".
 * StatCard resolves `primary: 'auto'` by measuring mounted DOM, so on a card
 * whose SUBTITLE is larger than its value the subtitle is the primary and the
 * value stays still.
 *
 * The wrapper cannot run that measurement from inside a snippet, and an earlier
 * fix papered over it by treating `'auto'` as "the value is primary". On the
 * card below that makes the element roll the subtitle (StatCard's choice) AND
 * the value (the wrapper's), so the custom element animated two values where
 * the component animated one -- the divergence this file exists to catch.
 *
 * dist-wc is a self-contained bundle rather than a route, so it is injected
 * into a same-origin page. `pnpm run build` runs build:wc, so it exists
 * whenever these run.
 */

type ValueSnippetElement = HTMLElement & {
  value: string;
  valueSnippet: unknown;
};

type WcModule = {
  createRawSnippet?: (factory: () => { render: () => string }) => unknown;
};

const loadBundleModule = async (page: import('@playwright/test').Page): Promise<void> => {
  await gotoHydrated(page, '/');
  await page.route('**/__sui-wc.js', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: readFileSync('dist-wc/index.js', 'utf8')
    })
  );
  await page.addScriptTag({
    content: `import('/__sui-wc.js').then((module) => {
      window.__suiWcModule = module;
    });`,
    type: 'module'
  });
  await page.waitForFunction(
    () =>
      typeof customElements.get('sui-stat-card') !== 'undefined' &&
      typeof (window as Window & { __suiWcModule?: WcModule }).__suiWcModule === 'object',
    { timeout: 15_000 }
  );
};

const loadBundle = async (page: import('@playwright/test').Page): Promise<void> => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-stat-card') !== 'undefined', {
    timeout: 15_000
  });
};

/** Counts odometers inside the element's shadow root, plus which slots carry them. */
const animatedSlots = async (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const el = document.querySelector('sui-stat-card');
    const root = el?.shadowRoot;
    if (!root) {
      return { total: -1, slots: [] as Array<{ slot: string | null; size: number }> };
    }
    return {
      total: root.querySelectorAll('.animated-number').length,
      slots: Array.from(root.querySelectorAll('[data-sc-slot]'))
        .filter((slot) => slot.querySelector('.animated-number') !== null)
        .map((slot) => ({
          slot: slot.getAttribute('data-sc-slot'),
          size: Number.parseFloat(getComputedStyle(slot as HTMLElement).fontSize)
        }))
    };
  });

test.describe('sui-stat-card animatePrimary parity', () => {
  test("primary='auto' animates ONE value when the subtitle is the largest metric", async ({
    page
  }) => {
    await loadBundle(page);

    await page.evaluate(() => {
      const el = document.createElement('sui-stat-card');
      el.setAttribute('title', 'Total sales');
      el.setAttribute('subtitle', '60000');
      el.setAttribute('value', '194');
      el.setAttribute('animate-primary', '');
      el.setAttribute('primary', 'auto');
      // Make the subtitle unambiguously the largest rendered metric, which is
      // what sends StatCard's measurement to the subtitle rather than the value.
      el.setAttribute(
        'style',
        '--statcard-subtitle-font-size: 44px; --statcard-value-font-size: 14px;'
      );
      document.body.appendChild(el);
    });

    // Waits for the element to render, NOT for an odometer to exist: gating on
    // "at least one animated" would turn a zero-animation regression into a
    // generic wait timeout instead of a count assertion that says what happened.
    await page.waitForFunction(
      () =>
        document.querySelector('sui-stat-card')?.shadowRoot?.querySelector('[data-sc-slot]') !==
        null,
      { timeout: 10_000 }
    );
    // Let the measurement attachment settle before counting.
    await page.waitForTimeout(800);

    const result = await animatedSlots(page);
    expect(result.total, `exactly one value should animate, got ${JSON.stringify(result)}`).toBe(1);
  });

  /*
   * The counterpart, and the reason the fix is a host guard rather than a
   * tightened condition: with the VALUE the largest metric, `auto` must pick the
   * value. It could not before, at all -- the wrapper's unconditional snippet
   * sent StatCard down the branch that omits `data-sc-slot="value"`, so the
   * value was never even a candidate and `auto` could only ever land on the
   * subtitle. Suppressing the wrapper's animation would have passed the test
   * above while leaving this one broken.
   */
  test("primary='auto' animates the VALUE when the value is the largest metric", async ({
    page
  }) => {
    await loadBundle(page);

    await page.evaluate(() => {
      const el = document.createElement('sui-stat-card');
      el.setAttribute('title', 'Total sales');
      el.setAttribute('subtitle', '12');
      el.setAttribute('value', '60000');
      el.setAttribute('animate-primary', '');
      el.setAttribute('primary', 'auto');
      el.setAttribute(
        'style',
        '--statcard-value-font-size: 44px; --statcard-subtitle-font-size: 12px;'
      );
      document.body.appendChild(el);
    });

    // Same reason as above: wait for the card to render, not for an odometer.
    await page.waitForFunction(
      () =>
        document.querySelector('sui-stat-card')?.shadowRoot?.querySelector('[data-sc-slot]') !==
        null,
      { timeout: 10_000 }
    );
    await page.waitForTimeout(800);

    const result = await animatedSlots(page);
    expect(result.total, `exactly one value should animate, got ${JSON.stringify(result)}`).toBe(1);
    expect(
      result.slots[0]?.slot,
      `the value should be the animated slot, got ${JSON.stringify(result)}`
    ).toBe('value');
  });

  /*
   * Regression guard for what the removed wrapper branch was originally for: an
   * earlier comment claimed the element "could never animate its value however
   * the attribute was set" without it. That was only true BECAUSE the snippet
   * was unconditional. With the guard, StatCard's own value branch runs and
   * honours `animate-value` directly.
   */
  test('animate-value still animates the value through the custom element', async ({ page }) => {
    await loadBundle(page);

    await page.evaluate(() => {
      const el = document.createElement('sui-stat-card');
      el.setAttribute('title', 'Total sales');
      el.setAttribute('value', '60000');
      el.setAttribute('animate-value', '');
      document.body.appendChild(el);
    });

    await page.waitForTimeout(800);
    const result = await animatedSlots(page);
    expect(result.total, `the value should animate, got ${JSON.stringify(result)}`).toBe(1);
    expect(result.slots[0]?.slot).toBe('value');
  });

  /* The guard must not break the slot it guards: slotted content still wins. */
  test('slotted value-snippet content still replaces the built-in value', async ({ page }) => {
    await loadBundle(page);

    await page.evaluate(() => {
      const el = document.createElement('sui-stat-card');
      el.setAttribute('title', 'Total sales');
      el.setAttribute('value', '60000');
      el.setAttribute('animate-value', '');
      const custom = document.createElement('span');
      custom.setAttribute('slot', 'value-snippet');
      custom.id = 'slotted-value';
      custom.textContent = 'CUSTOM';
      el.appendChild(custom);
      document.body.appendChild(el);
    });

    await page.waitForTimeout(800);

    const slotted = await page.evaluate(() => {
      const el = document.querySelector('sui-stat-card');
      const assigned = el?.shadowRoot?.querySelector(
        'slot[name="value-snippet"]'
      ) as HTMLSlotElement | null;
      return {
        assignedIds: (assigned?.assignedNodes() ?? []).map((n) => (n as HTMLElement).id),
        odometers: el?.shadowRoot?.querySelectorAll('.animated-number').length ?? -1
      };
    });

    expect(slotted.assignedIds).toContain('slotted-value');
    // The consumer replaced the value rendering, so nothing of ours animates it.
    expect(slotted.odometers).toBe(0);
  });

  test('a pre-connect valueSnippet made by the WC bundle renders', async ({ page }) => {
    await loadBundleModule(page);

    const rendered = await page.evaluate(async () => {
      const module = (window as Window & { __suiWcModule?: WcModule }).__suiWcModule;
      if (typeof module?.createRawSnippet !== 'function') {
        return { hasFactory: false, text: null };
      }

      const el = document.createElement('sui-stat-card') as ValueSnippetElement;
      el.value = '60000';
      el.valueSnippet = module.createRawSnippet(() => ({
        render: () => '<span data-pw="pre-connect-snippet">FROM-JS</span>'
      }));
      document.body.appendChild(el);
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        hasFactory: true,
        text: el.shadowRoot?.querySelector('[data-pw="pre-connect-snippet"]')?.textContent ?? null
      };
    });

    expect(rendered.hasFactory, 'the WC entry must export its matching snippet factory').toBe(true);
    expect(rendered.text).toBe('FROM-JS');
  });

  test('a post-connect valueSnippet made by the WC bundle replaces the value', async ({ page }) => {
    await loadBundleModule(page);

    const rendered = await page.evaluate(async () => {
      const module = (window as Window & { __suiWcModule?: WcModule }).__suiWcModule;
      if (typeof module?.createRawSnippet !== 'function') {
        return { hasFactory: false, text: null };
      }

      const el = document.createElement('sui-stat-card') as ValueSnippetElement;
      el.value = '60000';
      document.body.appendChild(el);
      await new Promise((resolve) => setTimeout(resolve, 100));

      el.valueSnippet = module.createRawSnippet(() => ({
        render: () => '<span data-pw="post-connect-snippet">UPDATED-FROM-JS</span>'
      }));
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        hasFactory: true,
        text: el.shadowRoot?.querySelector('[data-pw="post-connect-snippet"]')?.textContent ?? null
      };
    });

    expect(rendered.hasFactory, 'the WC entry must export its matching snippet factory').toBe(true);
    expect(rendered.text).toBe('UPDATED-FROM-JS');
  });
});
