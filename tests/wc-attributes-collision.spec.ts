import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * `<sui-checkbox>` declared a custom-element prop named `attributes`, which
 * replaced `Element.prototype.attributes` -- the live `NamedNodeMap` that
 * Svelte's OWN generated `connectedCallback` iterates:
 *
 *   for (const attr of this.attributes) { ... }
 *
 * With the accessor shadowed by a plain object, every instance threw
 * `TypeError: this.attributes is not iterable` on connect and never
 * initialised. The element appended fine -- `appendChild` does not surface an
 * error thrown inside `connectedCallback` -- so it failed silently, which is
 * why it survived to a published release.
 *
 * This is the same class as `children`, already reserved in
 * `HOST_RESERVED_PROPS` for the same reason, and the fix follows the same
 * precedent as `ariaLabel` -> `checkboxAriaLabel`: forward it under a name the
 * platform does not own.
 */
test.describe('sui-checkbox does not shadow Element.attributes', () => {
  test('connects, initialises its shadow root, and throws nothing', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    // dist-wc is a self-contained bundle, not a route of the demo site, so it is
    // injected the same way tests/wc-custom-elements.spec.ts does it. Without this
    // the element is simply undefined and every assertion below passes vacuously --
    // which is exactly how the first version of this test passed against the bug.
    //
    // MAINTAINERS: this asserts against the BUILT bundle, so `dist-wc/index.js`
    // has to be current or the result describes an old build rather than your
    // change. `npm run build` (which runs build:wc) before running this locally.
    // CI is safe -- playwright.config.ts builds as part of webServer -- but a
    // local run reusing a server does not rebuild. That is not hypothetical: a
    // stale bundle is how this very test was first observed passing against the
    // defect it exists to catch.
    await gotoHydrated(page, '/');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => typeof customElements.get('sui-checkbox') === 'function');

    const state = await page.evaluate(async () => {
      const element = document.createElement('sui-checkbox');
      element.setAttribute('text', 'Agree');
      document.body.appendChild(element);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return {
        defined: typeof customElements.get('sui-checkbox') === 'function',
        // The native accessor must still be the NamedNodeMap, not a plain object.
        attributesIsIterable: typeof element.attributes?.[Symbol.iterator] === 'function',
        // `?? false` matters: an element that never upgraded has a null shadowRoot,
        // and an optional-chained comparison would read as "initialised".
        shadowInitialised: (element.shadowRoot?.childNodes.length ?? 0) > 0
      };
    });

    expect(state.defined).toBe(true);
    expect(state.attributesIsIterable).toBe(true);
    expect(state.shadowInitialised).toBe(true);
    expect(errors).toEqual([]);
  });
});
