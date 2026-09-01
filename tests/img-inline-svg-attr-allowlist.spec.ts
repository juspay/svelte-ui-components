import { expect, test } from '@playwright/test';

// Img's inlineSvg path fetches remote markup and copies the fetched root's
// attributes onto the live <svg> host — an element in the host document. The
// fetched file is untrusted content: copying every attribute lets it plant
// `onload`/`onclick` handlers (script injection via an image URL), clobber the
// data-pw test hook, or override the component's sizing with an inline style.
// Only an allowlisted presentational/geometry/a11y set may survive; attributes
// the caller's own transformSvg ADDS are caller intent and still pass.
//
// Payloads are served via route interception so the tests are self-contained:
// the demo page's real asset URLs are answered with crafted markup, no network.

const INLINE_DEMO_URL = '**/demo-media/status-success.svg';
const TRANSFORM_DEMO_URL = '**/demo-media/placeholder-square.svg';

const serveSvg = async (
  page: import('@playwright/test').Page,
  url: string,
  body: string
): Promise<void> => {
  await page.route(url, (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body })
  );
};

test.describe('Img — inlineSvg copies only safe root attributes from fetched markup', () => {
  test('fetched event handlers and non-presentational attributes never reach the live host', async ({
    page
  }) => {
    const hostile =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"' +
      " onload=\"document.documentElement.setAttribute('data-svg-onload-ran', '1')\"" +
      " onclick=\"document.documentElement.setAttribute('data-svg-onclick-ran', '1')\"" +
      ' id="evil-root" style="outline: 6px solid red" data-pw="hijacked" tabindex="0">' +
      '<circle cx="12" cy="12" r="8" fill="currentColor" /></svg>';
    await serveSvg(page, INLINE_DEMO_URL, hostile);
    await page.goto('/components/img');

    // Located through the wrapper row, not data-pw on the host itself — a
    // successful data-pw clobber must fail an assertion, not hide the element.
    const host = page.getByTestId('img-inline-svg-row').locator('svg');

    // Anchor: the intercepted payload really was inlined (the real asset on
    // disk has viewBox "0 0 48 48", so a missed interception cannot pass).
    await expect(host).toHaveAttribute('viewBox', '0 0 24 24');
    await expect(host.locator('circle')).toHaveCount(1);

    // A legitimate presentational attribute from the same hostile file lands.
    await expect(host).toHaveAttribute('fill', 'none');

    // The executable / non-presentational attributes do not.
    await expect(host).not.toHaveAttribute('onload');
    await expect(host).not.toHaveAttribute('onclick');
    await expect(host).not.toHaveAttribute('id');
    await expect(host).not.toHaveAttribute('style');
    await expect(host).not.toHaveAttribute('tabindex');

    // The caller's test hook survives hostile content.
    await expect(host).toHaveAttribute('data-pw', 'img-inline-svg');

    // Behavioural proof: interacting with the icon runs nothing.
    await host.click();
    const root = page.locator('html');
    await expect(root).not.toHaveAttribute('data-svg-onload-ran');
    await expect(root).not.toHaveAttribute('data-svg-onclick-ran');
  });

  test('legitimate presentational and accessibility attributes still land on the host', async ({
    page
  }) => {
    const benign =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"' +
      ' preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor"' +
      ' stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"' +
      ' role="img" aria-label="Fetched success" focusable="false">' +
      '<path d="M15 24.5l6.5 6.5L33 19.5" /></svg>';
    await serveSvg(page, INLINE_DEMO_URL, benign);
    await page.goto('/components/img');

    const host = page.getByTestId('img-inline-svg-row').locator('svg');

    await expect(host).toHaveAttribute('viewBox', '0 0 48 48');
    await expect(host).toHaveAttribute('width', '48');
    await expect(host).toHaveAttribute('height', '48');
    await expect(host).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
    await expect(host).toHaveAttribute('fill', 'none');
    await expect(host).toHaveAttribute('stroke', 'currentColor');
    await expect(host).toHaveAttribute('stroke-width', '2.5');
    await expect(host).toHaveAttribute('stroke-linecap', 'round');
    await expect(host).toHaveAttribute('stroke-linejoin', 'round');
    await expect(host).toHaveAttribute('role', 'img');
    await expect(host).toHaveAttribute('aria-label', 'Fetched success');
    await expect(host).toHaveAttribute('focusable', 'false');
    await expect(host.locator('path')).toHaveCount(1);
  });

  test('transformSvg-added attributes pass through while fetched unsafe ones are dropped', async ({
    page
  }) => {
    const hostile =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"' +
      " onload=\"document.documentElement.setAttribute('data-svg-transform-onload-ran', '1')\">" +
      '<rect width="64" height="64" fill="currentColor" /></svg>';
    await serveSvg(page, TRANSFORM_DEMO_URL, hostile);
    await page.goto('/components/img');

    const host = page.getByTestId('img-inline-svg-transform-row').locator('svg');

    await expect(host).toHaveAttribute('viewBox', '0 0 64 64');
    // The demo's transform marks the root — caller intent survives the filter.
    await expect(host).toHaveAttribute('data-demo-transformed', 'true');
    // The fetched handler does not ride along with it.
    await expect(host).not.toHaveAttribute('onload');
    await expect(page.locator('html')).not.toHaveAttribute('data-svg-transform-onload-ran');
    await expect(host.locator('rect')).toHaveCount(1);
  });
});

// The root allowlist above guards only the root. Descendants are adopted into
// the live document wholesale, and an event-handler content attribute becomes a
// live handler the moment its element is adopted -- so a handler one element
// deeper runs exactly like one on the root. Guarding only the root would look
// like a fix while leaving the same vector open.
test.describe('Img — inlineSvg strips executable content from fetched descendants', () => {
  test('a child event handler does not survive adoption, and actually does not fire', async ({
    page
  }) => {
    // <image> with a bad href fires onerror by itself, so this proves the
    // handler cannot run rather than only that the attribute is absent.
    const hostile =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      '<image href="data:," onerror="document.documentElement.setAttribute(\'data-child-onerror-ran\', \'1\')" />' +
      "<a href=\"javascript:document.documentElement.setAttribute('data-child-js-href', '1')\">" +
      '<circle cx="12" cy="12" r="8" onclick="document.documentElement.setAttribute(\'data-child-onclick-ran\', \'1\')" fill="currentColor" />' +
      '</a>' +
      '<script>document.documentElement.setAttribute("data-child-script-ran", "1")<\/script>' +
      '</svg>';
    await serveSvg(page, INLINE_DEMO_URL, hostile);
    await page.goto('/components/img');

    const host = page.getByTestId('img-inline-svg-row').locator('svg');
    // Anchor: the intercepted payload really was inlined.
    await expect(host).toHaveAttribute('viewBox', '0 0 24 24');

    const circle = host.locator('circle');
    await expect(circle).toHaveCount(1);
    await expect(circle).not.toHaveAttribute('onclick');
    await expect(host.locator('script')).toHaveCount(0);
    await expect(host.locator('image')).not.toHaveAttribute('onerror');

    // Clicking must not run anything the payload planted.
    await circle.click({ force: true });

    const root = page.locator('html');
    await expect(root).not.toHaveAttribute('data-child-onerror-ran');
    await expect(root).not.toHaveAttribute('data-child-onclick-ran');
    await expect(root).not.toHaveAttribute('data-child-script-ran');
    await expect(root).not.toHaveAttribute('data-child-js-href');
  });

  test('legitimate descendant geometry and paint attributes are preserved', async ({ page }) => {
    const legitimate =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      '<path d="M4 12l6 6 10-14" stroke="currentColor" stroke-width="2" fill="none" transform="translate(1,1)" />' +
      '</svg>';
    await serveSvg(page, INLINE_DEMO_URL, legitimate);
    await page.goto('/components/img');

    const path = page.getByTestId('img-inline-svg-row').locator('svg path');
    await expect(path).toHaveAttribute('d', 'M4 12l6 6 10-14');
    await expect(path).toHaveAttribute('stroke-width', '2');
    await expect(path).toHaveAttribute('transform', 'translate(1,1)');
  });
});
