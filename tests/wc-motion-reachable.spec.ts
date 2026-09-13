import { expect, test, type Page } from '@playwright/test';

/**
 * Motion must be silenceable from a consumer stylesheet; this is asserted against
 * the CUSTOM-ELEMENT build specifically.
 *
 * The acceptance is explicit that this must not be tested on the Svelte build:
 * the two have different escape hatches and only one of them was ever
 * exercised. A Svelte consumer has an unsupported way out — reaching past the
 * token API into the scoped class names. A `<sui-*>` consumer has none. A
 * stylesheet cannot reach a rule inside a shadow root and cannot add one, so
 * "can a consumer turn this off" reduces entirely to "does a token reach it".
 *
 * Every assertion here therefore sets a value OUTSIDE the element and reads the
 * computed result from INSIDE its shadow root. Reading it from outside would
 * prove nothing — that is just CSS working on the host.
 *
 * `--motion-duration` is the documented root token (23 components fall back
 * through it, and each names it in its own CSS-variable table), which is what
 * the acceptance means by "the documented root motion token".
 */
const loadBundle = async (page: Page): Promise<void> => {
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-loader') === 'function', null, {
    timeout: 15_000
  });
};

const mount = async (page: Page, tag: string): Promise<void> => {
  await page.evaluate((hostTag) => {
    document.body.append(document.createElement(hostTag));
  }, tag);
  await page.waitForFunction(
    (hostTag) => document.querySelector(hostTag)?.shadowRoot != null,
    tag,
    { timeout: 10_000 }
  );
};

/** Computed value of `property` on the first `inner` match inside the host's shadow root. */
const insideShadow = (page: Page, tag: string, inner: string, property: string) =>
  page.evaluate(
    ({ tag: hostTag, inner: selector, property: prop }) => {
      const target = document.querySelector(hostTag)?.shadowRoot?.querySelector(selector) ?? null;
      return target === null ? null : getComputedStyle(target).getPropertyValue(prop);
    },
    { tag, inner, property }
  );

test.describe('a custom-element consumer can silence motion', () => {
  test('the root motion token reaches an animation inside a shadow root', async ({ page }) => {
    await loadBundle(page);
    await mount(page, 'sui-loader');

    const before = await insideShadow(page, 'sui-loader', '.loader', 'animation-duration');
    expect(before, '.loader must exist inside the shadow root').not.toBeNull();
    expect(before, 'the loader spins by default').not.toBe('0s');

    await page.evaluate(() => {
      document.documentElement.style.setProperty('--motion-duration', '0s');
    });

    const after = await insideShadow(page, 'sui-loader', '.loader', 'animation-duration');
    expect(after, 'a root token must cross the shadow boundary and stop the spin').toBe('0s');
  });

  test('a document stylesheet cannot reach inside, which is why the token is the contract', async ({
    page
  }) => {
    await loadBundle(page);
    await mount(page, 'sui-loader');

    // Written exactly as a consumer would reach an ordinary descendant. This is
    // the control: if it ever works, the premise of the token contract has
    // changed and the whole argument above needs revisiting.
    await page.evaluate(() => {
      const sheet = document.createElement('style');
      sheet.textContent = 'sui-loader .loader { animation-duration: 0s !important; }';
      document.head.append(sheet);
    });

    const name = await insideShadow(page, 'sui-loader', '.loader', 'animation-duration');
    expect(name, '.loader must exist inside the shadow root').not.toBeNull();
    expect(name, 'a descendant rule must NOT be able to style across the boundary').not.toBe('0s');
  });

  test("HITL's countdown sweep is reachable, having been sealed behind a literal", async ({
    page
  }) => {
    await loadBundle(page);
    await mount(page, 'sui-hitl');

    // HITL sets the nested Progress bar's transition token directly, and a rule
    // on the element beats anything a consumer declares at :root — so until it
    // gained a named hook there was no way to reach the sweep at all.
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--hitl-countdown-transition', 'none 0s ease 0s');
    });

    const transition = await insideShadow(page, 'sui-hitl', '.bar', 'transition');
    expect(transition, '.bar must exist inside the shadow root').not.toBeNull();
    expect(transition, "the consumer's token must win over HITL's own default").not.toContain(
      '0.1s'
    );
  });
});
