import { expect, test } from '@playwright/test';

// `sui-slider` renders the native range input inside an open shadow root, and
// ARIA IDREF attributes do not cross a shadow boundary: an `aria-labelledby` on
// the inner input cannot resolve an id that lives in the outer document. So
// forwarding the caller's id string straight through — which is what the
// wrapper did when `aria-labelledby` was first added — produces a slider with
// no accessible name at all, silently. That is the same class of failure the
// wc-parity suite exists to catch: a prop that looks wired and does nothing.
//
// `aria-label` has no such problem, being a string rather than a reference, so
// the wrapper resolves the reference on the host's own root and forwards the
// text. These tests pin both halves: the resolved name, and the fact that a
// plain `aria-label` still wins where both are absent.
const loadBundle = async (page: import('@playwright/test').Page): Promise<void> => {
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-slider') !== 'undefined', null, {
    timeout: 15_000
  });
};

test.describe('sui-slider — accessible name from a light-DOM label', () => {
  test('aria-labelledby pointing at an element outside the shadow root names the slider', async ({
    page
  }) => {
    await loadBundle(page);

    await page.evaluate(() => {
      const label = document.createElement('span');
      label.id = 'volume-label';
      label.textContent = 'Volume level';
      document.body.append(label);

      const element = document.createElement('sui-slider');
      element.setAttribute('aria-labelledby', 'volume-label');
      document.body.append(element);
    });

    await expect(page.getByRole('slider', { name: 'Volume level' })).toBeVisible();
  });

  test('aria-label still names the slider on its own', async ({ page }) => {
    await loadBundle(page);

    await page.evaluate(() => {
      const element = document.createElement('sui-slider');
      element.setAttribute('aria-label', 'Brightness');
      document.body.append(element);
    });

    await expect(page.getByRole('slider', { name: 'Brightness' })).toBeVisible();
  });
});
