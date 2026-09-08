import { expect, test } from '@playwright/test';

// Img's inlineSvg sanitizer strips every descendant URL attribute whose value
// does not point inside this document. Brand marks do not encode their art as
// strokes or paths: a <rect> fills with "url(#pattern…)", and the pattern's
// <image xlink:href="data:image/png;base64,…"> IS the artwork. Treating that
// value as a remote URL and deleting it renders a valid, safe, invisible SVG.
// A data:image/* payload cannot fetch (it carries its bytes) and inside
// <image>/<use> never gets a script context, so it is allowed alongside
// fragments — while javascript: and remote URLs stay stripped.
//
// Payloads are served via route interception: see img-inline-svg-attr-allowlist.

const INLINE_DEMO_URL = '**/demo-media/status-success.svg';

const serveSvg = async (
  page: import('@playwright/test').Page,
  url: string,
  body: string
): Promise<void> => {
  await page.route(url, (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body })
  );
};

test.describe('Img — inlineSvg preserves data-URI artwork in pattern fills', () => {
  test('pattern-filled brand marks keep their base64 art and kill only true remote vectors', async ({
    page
  }) => {
    const brandMark =
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 48 48">' +
      '<rect width="48" height="48" fill="url(#pattern0)"/>' +
      '<defs>' +
      '<pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1">' +
      '<use xlink:href="#art0" transform="scale(0.01)"/>' +
      '</pattern>' +
      '<image id="art0" width="48" height="48" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="/>' +
      '<image id="art0Upper" width="48" height="48" xlink:href="data:image/PNG;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="/>' +
      '<use id="hostileDataUse" xlink:href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cscript%3Ealert(1)%3C/script%3E%3C/svg%3E"/>' +
      '<a id="hostileDataLink" href="data:image/png;base64,AAAA"><circle cx="24" cy="24" r="4"/></a>' +
      '<image id="hostileRemote" href="https://evil.example/payload.svg"/>' +
      '<image id="hostileJs" href="javascript:alert(1)"/>' +
      '</defs>' +
      '</svg>';
    await serveSvg(page, INLINE_DEMO_URL, brandMark);
    await page.goto('/components/img');

    const host = page.getByTestId('img-inline-svg-row').locator('svg');
    // Anchor: the intercepted payload really was inlined (the on-disk asset
    // has viewBox "0 0 48 48" but no <pattern>).
    await expect(host).toHaveAttribute('viewBox', '0 0 48 48');
    await expect(host.locator('pattern')).toHaveCount(1);

    // The artwork path survives: pattern's <use> fragment reference and the
    // image's data-URI href both remain. Media types are case-insensitive,
    // so an uppercase image/PNG survives as well.
    await expect(host.locator('pattern use')).toHaveAttribute('xlink:href', '#art0');
    const artHref = await host.locator('image#art0').getAttribute('xlink:href');
    expect(artHref ?? 'pattern art xlink:href was stripped').toMatch(/^data:image\/png;/);
    const artUpperHref = await host.locator('image#art0Upper').getAttribute('xlink:href');
    expect(artUpperHref ?? 'uppercase-media-type art xlink:href was stripped').toMatch(
      /^data:image\/PNG/
    );

    // data: payloads are allowed only on image-rendering elements: <use> and
    // <a> degrade to fragment-only — the elements stay, their data: hrefs go.
    await expect(host.locator('use#hostileDataUse')).toHaveCount(1);
    await expect(host.locator('use#hostileDataUse')).not.toHaveAttribute('xlink:href');
    await expect(host.locator('a#hostileDataLink')).not.toHaveAttribute('href');

    // True remote vectors on OTHER descendants stay stripped.
    await expect(host.locator('image#hostileRemote')).not.toHaveAttribute('href');
    await expect(host.locator('image#hostileJs')).not.toHaveAttribute('href');
  });
});
