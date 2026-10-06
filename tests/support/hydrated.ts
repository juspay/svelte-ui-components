import type { Page, Response } from '@playwright/test';

/**
 * Navigates and waits until the app is interactive.
 *
 * `page.goto` resolves on the navigation, not on hydration, and every demo page
 * is server-rendered. A control is therefore present, visible and clickable
 * while its handler does not yet exist -- and Playwright cannot check for a
 * listener, so the click is delivered to inert markup and lost. The assertion
 * that follows fails as an unexplained timeout.
 *
 * The marker is set in `src/routes/+layout.svelte`, whose `onMount` runs after
 * its children have mounted.
 *
 * It does NOT mean custom elements are ready, and must not be used that way. A
 * custom element has a second readiness step -- `customElements.define` runs,
 * then matching elements upgrade -- and the marker is strictly earlier than it:
 * measured on `/`, `data-hydrated` was set at ~755ms while
 * `customElements.get('sui-status')` was still undefined and no element had
 * upgraded. On top of that, `dist-wc` is a self-contained bundle rather than a
 * route of the demo site, so a spec injects it with `addScriptTag` after
 * navigating, and nothing is defined at marker time by construction.
 *
 * A spec driving a custom element therefore has to gate on the element itself,
 * as every one of them already does:
 *
 *   await gotoHydrated(page, '/');
 *   await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
 *   await page.waitForFunction(() => Boolean(customElements.get('sui-status')));
 */
export const gotoHydrated = async (page: Page, path: string): Promise<Response | null> => {
  // Interactivity is independent of unrelated images/styles finishing load.
  // Font/geometry-sensitive callers additionally use waitForIntendedFonts.
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  return response;
};

/** Font-sensitive measurements must not silently measure a fallback face. */
export const waitForIntendedFonts = async (page: Page): Promise<void> => {
  await page.waitForFunction(() =>
    [...document.fonts].some((font) => font.family.replace(/["']/g, '') === 'Nunito Sans')
  );
  await page.evaluate(async () => {
    const intended = await document.fonts.load('16px "Nunito Sans"', 'ABC abc 012345');
    // WebKit can keep FontFaceSet.ready pending while an unrelated image holds
    // the document's load event. FontFace.load proves this intended face itself
    // is loaded without treating image or service readiness as hydration.
    if (intended.length === 0 || intended.some((font) => font.status !== 'loaded')) {
      throw new Error('Intended Nunito font is unavailable; retain the external resource failure');
    }
  });
};
