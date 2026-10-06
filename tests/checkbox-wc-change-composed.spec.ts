import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/**
 * `<sui-checkbox>` renders with `shadow: 'open'` (Checkbox.wc.svelte). Checkbox.svelte
 * restores the native `change`/`input` events that the role="checkbox" box's synthetic
 * click suppresses (see form-association.test.ts), and dispatches them with
 * `composed: true` so they reach a light-DOM ancestor such as a consumer's own <form>.
 * `src/lib/Checkbox/Checkbox.composed-event.test.ts` covers that against the component
 * mounted into a real open shadow root; these two tests exercise the actual
 * `<sui-checkbox>` custom element from the built `dist-wc` bundle, the same vantage
 * point a consumer has.
 */
const loadCheckboxTag = async (page: import('@playwright/test').Page): Promise<void> => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-checkbox')));
};

test.describe('sui-checkbox — change event crosses the shadow boundary', () => {
  test('a light-DOM form outside the shadow root observes the change event', async ({ page }) => {
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

  test('the native input itself also observes a composed input event', async ({ page }) => {
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
