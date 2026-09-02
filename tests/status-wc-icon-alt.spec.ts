import { expect, test } from '@playwright/test';

// `statusIconAlt` was added to the Svelte component without being declared in
// `Status.wc.svelte`'s customElement.props. An undeclared prop gets no accessor
// and no observed attribute, so a web-component consumer setting
// `status-icon-alt` would have had it sit inertly on the DOM node while the
// icon kept announcing "status".
//
// This is the same gap `sui-choicebox`'s `show-indicator` had. Adding a prop to
// a component and forgetting its wrapper is a recurring failure here, and it is
// invisible from the Svelte side because every Svelte test still passes.
//
// dist-wc is a self-contained bundle rather than a route of the demo site, so
// it is injected into a same-origin page instead of being navigated to.
// `pnpm run build` (the webServer command) runs build:wc, so the file exists.
const loadBundle = async (page: import('@playwright/test').Page): Promise<void> => {
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-status') !== 'undefined', null, {
    timeout: 15_000
  });
};

test.describe('sui-status — status-icon-alt', () => {
  test('the attribute is observed and names the icon', async ({ page }) => {
    await loadBundle(page);

    await page.evaluate(() => {
      const element = document.createElement('sui-status');
      element.id = 'alt-target';
      element.setAttribute('status-text', 'Payment Successful');
      element.setAttribute('status-icon-alt', 'Payment confirmed');
      document.body.append(element);
    });

    // A locator rather than a bare evaluate: Playwright's CSS engine pierces
    // open shadow roots and auto-waits, where querying straight after append
    // races the custom element's first render.
    const icon = page.locator('#alt-target .status-image svg, #alt-target .status-image img');
    await expect(icon.first()).toHaveAttribute('aria-label', 'Payment confirmed');
  });

  test('an empty attribute still marks the icon decorative', async ({ page }) => {
    await loadBundle(page);

    await page.evaluate(() => {
      const element = document.createElement('sui-status');
      element.id = 'decorative-target';
      element.setAttribute('status-text', 'Done');
      element.setAttribute('status-icon-alt', '');
      document.body.append(element);
    });

    const icon = page.locator(
      '#decorative-target .status-image svg, #decorative-target .status-image img'
    );
    await expect(icon.first()).toHaveAttribute('aria-hidden', 'true');
  });
});
