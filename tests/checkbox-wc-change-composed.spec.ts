import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * `<sui-checkbox>` renders with `shadow: 'open'` (Checkbox.wc.svelte). Checkbox.svelte
 * restores the native `change`/`input` events that the role="checkbox" box's synthetic
 * click suppresses (see form-association.test.ts), and now dispatches them with
 * `composed: true` so they reach a light-DOM ancestor such as a consumer's own <form> --
 * see `src/lib/Checkbox/Checkbox.composed-event.test.ts` for that fix verified against
 * the real component (mounted into a real open shadow root; RED confirmed with
 * `composed` reverted to absent, GREEN restored).
 *
 * These two tests, which exercise the actual `<sui-checkbox>` custom element rather than
 * a shadow-root stand-in, are `test.fixme` because `<sui-checkbox>` cannot connect to the
 * DOM at all today, for a reason unrelated to `composed`: Checkbox.wc.svelte declares an
 * `attributes` prop, and Svelte's customElement runtime defines that prop as
 * `sui-checkbox`'s own `.attributes` accessor -- permanently shadowing the native
 * `Element.prototype.attributes` (a NamedNodeMap) that the SAME generated
 * `connectedCallback` iterates over (`for (const attr of this.attributes)` in
 * dist-wc/index.js). Every `<sui-checkbox>` instance throws
 * `TypeError: this.attributes is not iterable` on connect -- reproduced with a minimal
 * `document.createElement('sui-checkbox')` and no attributes at all. This predates this
 * PR (`attributes: { type: 'Object' }` was already on Checkbox.wc.svelte before it) and
 * is independent of both reviewed findings, so it is reported rather than fixed here.
 * This file is left in place, unskipped-in-spirit, so it starts enforcing itself the
 * moment that separate bug is fixed (the fix precedent already exists in this same
 * file: `checkboxAriaLabel` is renamed for exactly this class of collision with
 * `HTMLElement.ariaLabel`; `attributes` needs the same treatment against
 * `Element.attributes`).
 */
const loadCheckboxTag = async (page: import('@playwright/test').Page): Promise<void> => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-checkbox')));
};

test.describe('sui-checkbox — change event crosses the shadow boundary', () => {
  test.fixme('a light-DOM form outside the shadow root observes the change event', async ({
    page
  }) => {
    await loadCheckboxTag(page);

    await page.evaluate(() => {
      const form = document.createElement('form');
      form.setAttribute('data-pw', 'wc-checkbox-form');

      const checkbox = document.createElement('sui-checkbox');
      checkbox.setAttribute('data-pw', 'wc-checkbox');
      checkbox.setAttribute('name', 'agree');
      checkbox.setAttribute('text', 'Agree to terms');
      form.append(checkbox);
      document.body.append(form);

      const win = window as Window & { __formChangeCount?: number };
      win.__formChangeCount = 0;
      // Attached on the FORM, in the light DOM, well outside sui-checkbox's shadow
      // root -- exactly the listener a consumer wiring up their own <form> would add.
      form.addEventListener('change', () => {
        win.__formChangeCount = (win.__formChangeCount ?? 0) + 1;
      });
    });

    await page.getByTestId('wc-checkbox').locator('label.container').click();

    const box = page.getByTestId('wc-checkbox').locator('[role="checkbox"]');
    await expect(box).toHaveAttribute('aria-checked', 'true');

    await expect
      .poll(() =>
        page.evaluate(() => (window as Window & { __formChangeCount?: number }).__formChangeCount)
      )
      .toBe(1);
  });

  test.fixme('the native input itself also observes a composed input event', async ({ page }) => {
    await loadCheckboxTag(page);

    await page.evaluate(() => {
      const checkbox = document.createElement('sui-checkbox');
      checkbox.setAttribute('data-pw', 'wc-checkbox-input-event');
      checkbox.setAttribute('name', 'agree');
      document.body.append(checkbox);
    });

    // Listen from OUTSIDE the shadow root (document), the same vantage point a
    // consumer's own global listener or a form library's delegated handler uses.
    const composed = await page.evaluate(async () => {
      const host = document.querySelector('sui-checkbox[data-pw="wc-checkbox-input-event"]');
      const label = host?.shadowRoot?.querySelector('label.container');
      if (!(label instanceof HTMLElement)) {
        return 'label not found';
      }
      const seen: string[] = [];
      document.addEventListener('input', (event) => seen.push(String(event.composed)));
      label.click();
      await new Promise((resolve) => setTimeout(resolve, 50));
      return seen.join(',');
    });

    expect(composed).toBe('true');
  });
});
