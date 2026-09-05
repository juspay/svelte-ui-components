import { expect, test } from '@playwright/test';

// Img's inlineSvg path copies the fetched root's allowlisted attributes onto
// the live <svg> host. Before this test existed, a `src` change cleared the
// old children but not the old root attributes, so a `fill` (or `width`,
// `stroke`, `role`…) supplied by the first file survived onto a second file
// that never asked for it — two icons blended into one. The gap was recorded
// as a follow-up on the sanitisation PR and then dropped; this pins it.
//
// Driven through the custom element rather than a demo page: `sui-img`
// exposes `src` as a reflected attribute, so the same action `update` path a
// Svelte consumer hits on re-render runs here without a bespoke demo route.

const FIRST_URL = '**/inline-first.svg';
const SECOND_URL = '**/inline-second.svg';

const FIRST =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="tomato" stroke="navy"' +
  ' width="24" height="24" role="img" aria-label="first icon">' +
  '<circle cx="12" cy="12" r="8" /></svg>';

// Deliberately omits fill, stroke, width and height, and carries no role or
// aria-label of its own.
const SECOND =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">' +
  '<rect x="8" y="8" width="32" height="32" /></svg>';

test('a src change removes the root attributes the previous file supplied', async ({ page }) => {
  await page.route(FIRST_URL, (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: FIRST })
  );
  await page.route(SECOND_URL, (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: SECOND })
  );
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-img') !== 'undefined', null, {
    timeout: 15_000
  });

  await page.evaluate(() => {
    const element = document.createElement('sui-img');
    element.setAttribute('id', 'probe');
    element.setAttribute('inline-svg', '');
    element.setAttribute('alt', 'probe icon');
    element.setAttribute('src', '/inline-first.svg');
    document.body.append(element);
  });
  const host = page.locator('#probe svg');

  // The first file lands, root attributes included.
  await expect(host.locator('circle')).toHaveCount(1);
  await expect(host).toHaveAttribute('fill', 'tomato');
  await expect(host).toHaveAttribute('stroke', 'navy');
  await expect(host).toHaveAttribute('width', '24');

  await page.evaluate(() => {
    document.getElementById('probe')?.setAttribute('src', '/inline-second.svg');
  });

  // The second file's own content and attributes replace the first's.
  await expect(host.locator('rect')).toHaveCount(1);
  await expect(host.locator('circle')).toHaveCount(0);
  await expect(host).toHaveAttribute('viewBox', '0 0 48 48');

  // And nothing the first file supplied lingers on the host.
  await expect(host).not.toHaveAttribute('fill');
  await expect(host).not.toHaveAttribute('stroke');
  await expect(host).not.toHaveAttribute('width');
  await expect(host).not.toHaveAttribute('height');

  // The first file had overwritten the component's own role/aria-label with
  // its own; the cleanup puts the component's values back rather than leaving
  // the host nameless or still carrying the previous file's label.
  await expect(host).toHaveAttribute('role', 'img');
  await expect(host).toHaveAttribute('aria-label', 'probe icon');
});
