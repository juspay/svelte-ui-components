import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';
import { blockExternalFonts } from './support/offline-fonts';

/**
 * `statusIcon` used to default to `icons/order-success-icon.svg` -- a relative
 * URL resolved against whatever page renders the component, for a file the
 * library has never shipped. It pointed at something real only for an app
 * serving that exact path at its own root, and resolved to
 * `<route>/icons/order-success-icon.svg` anywhere deeper. On this demo, at
 * `/components/status`, every card relying on the default requested
 * `/components/icons/order-success-icon.svg`, got a 404, and only then rendered
 * the built-in checkmark.
 *
 * The default is now the built-in checkmark itself, inlined, so omitting
 * `statusIcon` makes no request at all. A URL the caller passes is still used
 * as given and never replaced; the one exception is the spelled-out former
 * default, which keeps the fallback it had.
 *
 * Every assertion about "no request" is made AFTER the icon has painted. The
 * old failing request happened before the fallback could render, so waiting for
 * the painted icon first is what makes a missing request a real result rather
 * than a race that was won by looking early.
 */
const LEGACY_ICON_FILE = 'order-success-icon.svg';

// Every test here asserts on network traffic, so the page must not depend on a third-party host.
test.beforeEach(async ({ page }) => {
  await blockExternalFonts(page);
});

type Seen = { url: string; status: number };

const watchResponses = (page: Page): Seen[] => {
  const seen: Seen[] = [];
  page.on('response', (response) => seen.push({ url: response.url(), status: response.status() }));
  return seen;
};

const legacyRequests = (seen: readonly Seen[]): readonly Seen[] =>
  seen.filter((entry) => entry.url.includes(LEGACY_ICON_FILE));

// A browser asks for /favicon.ico on its own when a page declares no icon (the
// static demo page does not). That request belongs to the browser, not to Status.
const failedResponses = (seen: readonly Seen[]): readonly Seen[] =>
  seen.filter((entry) => entry.status >= 400 && !entry.url.endsWith('/favicon.ico'));

/** Painted, not merely present: a broken image still occupies the DOM. */
const expectBuiltInCheckmark = async (icon: Locator): Promise<void> => {
  await expect(icon.locator('circle')).toHaveCount(1);
  await expect(icon.locator('path')).toHaveCount(1);
  const box = await icon.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(0);
  expect(box?.height ?? 0).toBeGreaterThan(0);
};

const DEFAULT_ICON_DEMOS = [
  'status-inline',
  'status-alt-named',
  'status-heading-tag',
  'status-children',
  'status-description-html',
  'status-description-snippet'
] as const;

const expectEveryDefaultDemoPainted = async (page: Page): Promise<void> => {
  for (const demo of DEFAULT_ICON_DEMOS) {
    await expectBuiltInCheckmark(page.locator(`[data-pw="${demo}"] .status-image svg`));
  }
};

const loadWcBundle = async (page: Page, path: string): Promise<void> => {
  // A static page is not the SvelteKit app, so it never sets the hydration marker.
  if (path.endsWith('.html')) {
    await page.goto(path);
  } else {
    await gotoHydrated(page, path);
  }
  // Settle the page's own requests first, so a request seen afterwards belongs
  // to the element the test appends and not to the host page.
  await page.waitForLoadState('networkidle');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-status') !== 'undefined', null, {
    timeout: 15_000
  });
};

test.describe('Status default icon', () => {
  test('a direct load of a nested route paints the built-in icon and requests no icon file', async ({
    page
  }) => {
    const seen = watchResponses(page);
    await gotoHydrated(page, '/components/status');

    await expectEveryDefaultDemoPainted(page);
    await page.waitForLoadState('networkidle');

    expect(legacyRequests(seen)).toEqual([]);
    // Wider than the one file on purpose: the claim is "no avoidable 404", and a
    // different path with the same defect would otherwise slip past.
    expect(failedResponses(seen)).toEqual([]);
  });

  test('a reload makes no icon request either', async ({ page }) => {
    await gotoHydrated(page, '/components/status');
    await expectEveryDefaultDemoPainted(page);

    const seen = watchResponses(page);
    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    await expectEveryDefaultDemoPainted(page);
    await page.waitForLoadState('networkidle');

    expect(legacyRequests(seen)).toEqual([]);
    expect(failedResponses(seen)).toEqual([]);
  });

  test('client-side navigation to the route paints the built-in icon and requests no icon file', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/card');
    const seen = watchResponses(page);

    await page.locator('a[href$="/components/status"]').first().click();
    await page.waitForURL('**/components/status');

    await expectEveryDefaultDemoPainted(page);
    await page.waitForLoadState('networkidle');

    expect(legacyRequests(seen)).toEqual([]);
    expect(failedResponses(seen)).toEqual([]);
  });

  // The relative URL resolved against the document, so the same component at a
  // different depth asked for a different path. Both depths are covered: the
  // static demo page sits at the origin root, the Status route two levels down.
  for (const [depth, path] of [
    ['at the origin root', '/wc-form-demo.html'],
    ['on a nested route', '/components/status']
  ] as const) {
    test(`<sui-status> with no status-icon paints the built-in icon and requests no icon file ${depth}`, async ({
      page
    }) => {
      await loadWcBundle(page, path);
      const seen = watchResponses(page);

      await page.evaluate(() => {
        const element = document.createElement('sui-status');
        element.id = 'wc-default';
        element.setAttribute('status-text', 'Payment Successful');
        document.body.append(element);
      });

      const icon = page.locator('#wc-default .status-image svg');
      await expectBuiltInCheckmark(icon);
      await expect(icon).toHaveAttribute('aria-label', 'status');
      await page.waitForLoadState('networkidle');

      expect(legacyRequests(seen)).toEqual([]);
      expect(failedResponses(seen)).toEqual([]);
    });
  }

  test('removing status-icon from a <sui-status> returns to the built-in icon', async ({
    page
  }) => {
    // A removed attribute reaches the component as null, not undefined, so a
    // parameter default would hand it straight to Img.
    await page.route('**/consumer-missing.svg', (route) =>
      route.fulfill({ status: 404, contentType: 'text/plain', body: 'missing' })
    );
    await loadWcBundle(page, '/components/status');

    await page.evaluate(() => {
      const element = document.createElement('sui-status');
      element.id = 'wc-toggle';
      element.setAttribute('status-text', 'Toggle');
      element.setAttribute('status-icon', '/demo-media/consumer-missing.svg');
      document.body.append(element);
    });
    const icon = page.locator('#wc-toggle .status-image');
    await expect(icon.locator('img')).toHaveCount(1);

    await page.evaluate(() => document.querySelector('#wc-toggle')?.removeAttribute('status-icon'));

    await expectBuiltInCheckmark(icon.locator('svg'));
    await expect(icon.locator('img')).toHaveCount(0);
  });
});

test.describe('Status explicit icon URLs', () => {
  test('an explicit URL that fails stays a broken image: no fallback, and no request for the legacy file', async ({
    page
  }) => {
    // Fulfilled rather than left to the server so the failure is the one this
    // test chose, whatever the server happens to serve at that path.
    await page.route('**/consumer-missing.svg', (route) =>
      route.fulfill({ status: 404, contentType: 'text/plain', body: 'missing' })
    );
    await loadWcBundle(page, '/components/status');
    await page.waitForLoadState('networkidle');
    const seen = watchResponses(page);

    await page.evaluate(() => {
      const element = document.createElement('sui-status');
      element.id = 'wc-explicit-invalid';
      element.setAttribute('status-text', 'Explicit');
      element.setAttribute('status-icon', '/demo-media/consumer-missing.svg');
      document.body.append(element);
    });

    const icon = page.locator('#wc-explicit-invalid .status-image');
    // A caller's failed icon ends as a plain <img>; the built-in fallback would
    // be an inlined <svg>, whose absence is what proves it was not applied.
    await expect(icon.locator('img')).toHaveCount(1);
    await expect(icon.locator('svg')).toHaveCount(0);
    await page.waitForLoadState('networkidle');

    const image = icon.locator('img');
    const broken = await image.evaluate(
      (node) => node instanceof HTMLImageElement && node.complete && node.naturalWidth === 0
    );
    expect(broken).toBe(true);
    expect(seen.some((entry) => entry.url.includes('consumer-missing.svg'))).toBe(true);
    expect(legacyRequests(seen)).toEqual([]);
  });

  test('an explicit URL that loads is used, and the built-in icon is not substituted', async ({
    page
  }) => {
    await loadWcBundle(page, '/components/status');
    const seen = watchResponses(page);

    await page.evaluate(() => {
      const element = document.createElement('sui-status');
      element.id = 'wc-explicit-valid';
      element.setAttribute('status-text', 'Explicit');
      element.setAttribute('status-icon', '/demo-media/status-success.svg');
      document.body.append(element);
    });

    // The demo file draws the same circle + tick as the built-in icon, so the
    // drawing cannot tell them apart. Its own root label can: the file says
    // "Success", where the built-in icon takes the `statusIconAlt` default.
    const icon = page.locator('#wc-explicit-valid .status-image svg');
    await expect(icon).toHaveAttribute('aria-label', 'Success');
    await page.waitForLoadState('networkidle');

    expect(seen.some((entry) => entry.url.endsWith('/demo-media/status-success.svg'))).toBe(true);
    expect(legacyRequests(seen)).toEqual([]);
  });

  test('spelling out the former default keeps its fallback', async ({ page }) => {
    // Existing callers that pass the old default literally were protected by the
    // fallback before this change; they still are.
    await page.route('**/icons/order-success-icon.svg', (route) =>
      route.fulfill({ status: 404, contentType: 'text/plain', body: 'missing' })
    );
    await loadWcBundle(page, '/components/status');

    await page.evaluate(() => {
      const element = document.createElement('sui-status');
      element.id = 'wc-explicit-legacy';
      element.setAttribute('status-text', 'Explicit legacy');
      element.setAttribute('status-icon', 'icons/order-success-icon.svg');
      document.body.append(element);
    });

    await expectBuiltInCheckmark(page.locator('#wc-explicit-legacy .status-image svg'));
  });
});

test('the fallback does not replace an icon the caller supplied', async ({ page }) => {
  // Forced to fail, because that is the only state where the scoping matters.
  // Asserting merely that the caller's URL was requested would pass even if the
  // built-in icon then replaced it -- both render as an <svg>.
  await page.route('**/status-success.svg', (route) => route.abort());

  await gotoHydrated(page, '/components/status');

  const icon = page.locator('[data-pw="status-default-icon"] .status-image');
  // The built-in fallback is inlined into an <svg>; its absence is what proves
  // it was not applied. A caller's failed icon stays a plain <img>.
  await expect(icon.locator('svg')).toHaveCount(0);
  await expect(icon.locator('img')).toHaveCount(1);
});

test('the icon takes its accessible name from statusIconAlt, not from its own markup', async ({
  page
}) => {
  // `role` and `aria-label` are both in Img's allowlist, so an icon carrying
  // its own would outrank the alt-derived label on every screen that uses it.
  // The fallback is inlined into an <svg> host, where the name lives on
  // `aria-label` rather than on `alt`.
  await gotoHydrated(page, '/components/status');

  const icon = page.locator('[data-pw="status-inline"] .status-image svg');
  await expect(icon).toHaveAttribute('aria-label', 'status');
});

test('statusIconAlt is forwarded, not just defaulted', async ({ page }) => {
  // Asserting only the default would pass even if the prop stopped being
  // forwarded at all.
  await gotoHydrated(page, '/components/status');

  await expect(page.locator('[data-pw="status-alt-named"] .status-image svg')).toHaveAttribute(
    'aria-label',
    'Payment confirmed'
  );
});

test('an empty statusIconAlt marks the icon decorative', async ({ page }) => {
  await gotoHydrated(page, '/components/status');

  const icon = page.locator('[data-pw="status-alt-decorative"] .status-image svg');
  await expect(icon).toHaveAttribute('aria-hidden', 'true');
  await expect(icon).not.toHaveAttribute('aria-label', /.+/);
});
