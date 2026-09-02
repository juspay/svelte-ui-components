import { expect, test } from '@playwright/test';

// The Svelte component gained `showIndicator`, but the web-component wrapper
// never declared it in customElement.props. An undeclared prop gets no
// accessor and no observed attribute, so web-component consumers had no way
// to turn the indicator off — the attribute sat inertly on the DOM node.
//
// dist-wc is a self-contained bundle rather than a route of the demo site, so
// it is injected into a same-origin page instead of being navigated to.
// `pnpm run build` (the webServer command) runs build:wc, so the file exists.
const loadBundle = async (page: import('@playwright/test').Page): Promise<void> => {
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(
    () => typeof customElements.get('sui-choicebox') !== 'undefined',
    null,
    {
      timeout: 15_000
    }
  );
};

test.describe('sui-choicebox — show-indicator', () => {
  test('the show-indicator attribute is observed and toggles the indicator', async ({ page }) => {
    await loadBundle(page);
    await page.evaluate(() => {
      const el = document.createElement('sui-choicebox');
      el.id = 'attr-target';
      el.setAttribute('show-indicator', '');
      el.innerHTML = '<span>Option A</span>';
      document.body.append(el);
    });

    // Boolean attributes are presence-based: present -> true (the default).
    const indicator = page.locator('#attr-target .indicator');
    await expect(indicator).toHaveCount(1);

    // Removing an OBSERVED attribute converts null -> false and re-renders.
    // Before the fix 'show-indicator' was not observed, so nothing happened.
    await page.evaluate(() =>
      document.querySelector('#attr-target')?.removeAttribute('show-indicator')
    );
    await expect(indicator).toHaveCount(0);
  });

  test('the showIndicator property has an accessor that reaches the component', async ({
    page
  }) => {
    await loadBundle(page);
    await page.evaluate(() => {
      const el = document.createElement('sui-choicebox');
      el.id = 'prop-target';
      el.innerHTML = '<span>Option B</span>';
      document.body.append(el);
    });

    // No attribute set: the component's own default (true) renders it.
    const indicator = page.locator('#prop-target .indicator');
    await expect(indicator).toHaveCount(1);

    // A declared prop gets a real accessor; an undeclared one lands on the DOM
    // node as an expando and never reaches the component.
    await page.evaluate(() => {
      const el = document.querySelector('#prop-target');
      if (el !== null) {
        (el as HTMLElement & { showIndicator?: boolean }).showIndicator = false;
      }
    });
    await expect(indicator).toHaveCount(0);
  });
});
