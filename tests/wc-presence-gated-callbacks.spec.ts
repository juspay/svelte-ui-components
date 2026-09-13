import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * The callback-dispatch rule passes a dispatcher for every declared, non-colliding
 * callback prop so a consumer who only calls `addEventListener` is served. For most
 * props the component cannot tell the difference. For 31 of them it can: they appear
 * inside the component as `typeof <prop> === 'function'` and decide whether a control
 * renders at all.
 *
 * An unconditional dispatcher made every one of those checks true, so `<sui-gallery>`
 * rendered edit and delete for a consumer who wired neither, and `<sui-pie-chart>`'s
 * legend stopped expanding because PieChart read a supplied `onlegendmore` as "the
 * consumer owns this control". Exactly one test caught any of it, indirectly, through
 * the legend. Thirty of the thirty-one had nothing asserting their presence semantics,
 * which is why this file exists.
 *
 * scripts/wc-parity/presence-gated-callbacks.test.ts keeps the registry itself honest
 * by re-deriving it from source. This asserts the behaviour that registry buys, in a
 * real browser, on the real custom elements -- the two check different things and a
 * pass in one says nothing about the other.
 */

const loadTag = async (page: Page, tag: string): Promise<void> => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction((name) => Boolean(customElements.get(name)), tag);
};

test.describe('a presence-gated callback is absent until the consumer assigns it', () => {
  test('sui-gallery renders no edit or delete control for a consumer who wired neither', async ({
    page
  }) => {
    await loadTag(page, 'sui-gallery');
    await page.evaluate(() => {
      const el = document.createElement('sui-gallery');
      el.id = 'g';
      Reflect.set(el, 'images', [
        { src: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', alt: 'one' }
      ]);
      document.body.append(el);
    });

    const gallery = page.locator('#g');
    await expect(gallery.locator('.gallery-item-action')).toHaveCount(0);
    await expect(gallery.getByRole('button', { name: /^Edit image/ })).toHaveCount(0);
    await expect(gallery.getByRole('button', { name: /^Delete image/ })).toHaveCount(0);

    // Assigned AFTER mount: the wrapper reads props through $derived, so the control
    // appears. Without that the dispatcher set is frozen at first render and a
    // consumer who wires up asynchronously never gets the affordance at all.
    await page.evaluate(() => {
      Reflect.set(document.querySelector('#g') as Element, 'oneditclick', () => null);
    });
    await expect(gallery.getByRole('button', { name: /^Edit image/ })).toHaveCount(1);
    await expect(gallery.getByRole('button', { name: /^Delete image/ })).toHaveCount(0);
  });

  test('sui-chat-composer shows neither voice nor attach until one is wired', async ({ page }) => {
    await loadTag(page, 'sui-chat-composer');
    await page.evaluate(() => {
      const el = document.createElement('sui-chat-composer');
      el.id = 'c';
      document.body.append(el);
    });

    const composer = page.locator('#c');
    await expect(composer.locator('.control.voice')).toHaveCount(0);
    await expect(composer.locator('.control.attach')).toHaveCount(0);

    await page.evaluate(() => {
      Reflect.set(document.querySelector('#c') as Element, 'onvoice', () => null);
    });
    await expect(composer.locator('.control.voice')).toHaveCount(1);
    await expect(composer.locator('.control.attach')).toHaveCount(0);
  });

  test('the DOM event still fires once the callback is assigned', async ({ page }) => {
    // The cost of this rule, stated as a test rather than only in a comment: on a
    // presence-gated prop the event follows the callback. A consumer who assigns one
    // gets both; a listener-only consumer gets neither, because there is no way to
    // serve them without also telling the component a callback exists.
    await loadTag(page, 'sui-gallery');
    const fired = await page.evaluate(async () => {
      const el = document.createElement('sui-gallery');
      Reflect.set(el, 'images', [
        { src: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', alt: 'one' }
      ]);
      document.body.append(el);

      let events = 0;
      el.addEventListener('editclick', () => {
        events += 1;
      });
      // Wait for the first render before measuring. Reading straight after append
      // returns 0 whether the control is gated or not, which made this assertion pass
      // with the guard removed -- caught by running the negative control, not by
      // reading the test.
      const settle = (): Promise<void> =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        );
      await settle();
      // Listener only: no dispatcher, so no control to click and nothing to fire.
      const before = el.shadowRoot?.querySelectorAll('.gallery-item-action').length ?? -1;

      Reflect.set(el, 'oneditclick', () => null);
      await settle();
      const after = el.shadowRoot?.querySelectorAll('.gallery-item-action').length ?? -1;
      el.shadowRoot?.querySelector<HTMLButtonElement>('.gallery-item-action button')?.click();
      await settle();
      return { before, after, events };
    });

    expect(fired.before).toBe(0);
    expect(fired.after).toBeGreaterThan(0);
    expect(fired.events).toBe(1);
  });
});
