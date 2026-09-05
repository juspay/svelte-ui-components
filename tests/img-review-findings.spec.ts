import { expect, test } from '@playwright/test';
import { join } from 'node:path';

/**
 * The two findings the review raised against `Img`'s inline-SVG path, each
 * driven through the built custom element because that is where both are
 * reachable: `sui-img` takes its props from a consumer's JavaScript, so a
 * required prop can be absent at runtime, and the SVG it inlines is remote,
 * untrusted content.
 */

const BUNDLE = join(process.cwd(), 'dist-wc/index.js');

async function loadBundle(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.addScriptTag({ path: BUNDLE, type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-img') === 'function');
}

/** Serves one SVG body at /probe.svg, and a second at /probe-2.svg. */
async function routeSvgs(
  page: import('@playwright/test').Page,
  first: string,
  second = first
): Promise<void> {
  await page.route('**/probe.svg', (route) =>
    route.fulfill({ contentType: 'image/svg+xml', body: first })
  );
  await page.route('**/probe-2.svg', (route) =>
    route.fulfill({ contentType: 'image/svg+xml', body: second })
  );
}

test.describe('Img — a required prop can still be absent at runtime', () => {
  test('an inlining sui-img with no alt renders, and survives a src change', async ({ page }) => {
    // `alt` is typed `string` (required), but a custom element takes its props
    // from JavaScript: `document.createElement('sui-img')` with no alt leaves
    // it undefined, and reading `.length` on it throws where a Svelte consumer
    // would have been caught by the compiler.
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await routeSvgs(
      page,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" fill="red"><rect width="8" height="8" /></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>'
    );
    await loadBundle(page);

    const result = await page.evaluate(async () => {
      const element = document.createElement('sui-img');
      Reflect.set(element, 'src', '/probe.svg');
      Reflect.set(element, 'inlineSvg', true);
      document.body.append(element);
      await new Promise((resolve) => setTimeout(resolve, 250));
      const first = element.shadowRoot?.querySelector('svg')?.getAttribute('fill') ?? null;
      Reflect.set(element, 'src', '/probe-2.svg');
      await new Promise((resolve) => setTimeout(resolve, 250));
      const host = element.shadowRoot?.querySelector('svg');
      return {
        first,
        second: host?.getAttribute('fill') ?? null,
        role: host?.getAttribute('role') ?? null,
        children: host?.innerHTML ?? ''
      };
    });

    expect(errors, 'a missing alt threw at runtime').toEqual([]);
    expect(result.first, 'the first file never inlined').toBe('red');
    expect(result.second, "the first file's fill outlived its src").toBeNull();
    expect(result.role, 'an unnamed image must not claim role=img').toBeNull();
    expect(result.children).toContain('circle');
  });
});

test.describe('Img — fetched SVG cannot script the host page', () => {
  test('SMIL animation elements do not survive adoption', async ({ page }) => {
    // SMIL animates any attribute, including an event handler and an <a>
    // element's href, so it reaches the same place `on*` and `javascript:`
    // hrefs do — stripping those two but keeping <set>/<animate> would leave
    // the vector open one element deeper.
    await routeSvgs(
      page,
      [
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 8 8">',
        '<a><rect width="8" height="8" />',
        '<set attributeName="onclick" to="window.__smil = 1" />',
        '<animate attributeName="xlink:href" values="javascript:window.__smil = 2" dur="1s" />',
        '</a>',
        '<animateTransform attributeName="transform" type="rotate" values="0;360" dur="1s" />',
        '<animateMotion dur="1s"><mpath /></animateMotion>',
        '</svg>'
      ].join('')
    );
    await loadBundle(page);

    const result = await page.evaluate(async () => {
      const element = document.createElement('sui-img');
      Reflect.set(element, 'src', '/probe.svg');
      Reflect.set(element, 'alt', 'probe');
      Reflect.set(element, 'inlineSvg', true);
      document.body.append(element);
      await new Promise((resolve) => setTimeout(resolve, 250));
      const host = element.shadowRoot?.querySelector('svg');
      const anchor = host?.querySelector('a') ?? null;
      anchor?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        smil:
          host?.querySelectorAll('set, animate, animateTransform, animateMotion, mpath').length ??
          -1,
        onclick: anchor?.getAttribute('onclick') ?? null,
        href: anchor?.getAttribute('xlink:href') ?? anchor?.getAttribute('href') ?? null,
        planted: Reflect.get(window, '__smil') ?? null,
        rect: host?.querySelectorAll('rect').length ?? -1
      };
    });

    expect(result.smil, 'a SMIL animation element survived adoption').toBe(0);
    expect(result.onclick, 'SMIL planted an event-handler attribute').toBeNull();
    expect(result.href, 'SMIL planted a javascript: href').toBeNull();
    expect(result.planted, 'SMIL executed in the host page').toBeNull();
    expect(result.rect, 'the artwork itself was thrown away').toBe(1);
  });

  test('a URL reference that leaves the document is dropped, an internal one is kept', async ({
    page
  }) => {
    // `<use href="#gradient">` is how real icon sets reference their own defs,
    // so href cannot be stripped wholesale; what must not survive is a
    // reference that leaves this document (javascript:, data:, or a remote
    // URL that would fetch on adoption).
    await routeSvgs(
      page,
      [
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 8 8">',
        '<defs><rect id="box" width="8" height="8" /></defs>',
        '<use href="#box" />',
        '<use id="external" xlink:href="https://evil.example/x.svg#icon" />',
        '<use id="scripted" href="javascript:window.__use = 1" />',
        '<image id="remote" href="https://evil.example/pixel.png" />',
        '</svg>'
      ].join('')
    );
    await loadBundle(page);

    const result = await page.evaluate(async () => {
      const element = document.createElement('sui-img');
      Reflect.set(element, 'src', '/probe.svg');
      Reflect.set(element, 'alt', 'probe');
      Reflect.set(element, 'inlineSvg', true);
      document.body.append(element);
      await new Promise((resolve) => setTimeout(resolve, 250));
      const host = element.shadowRoot?.querySelector('svg');
      const attribute = (id: string): string | null => {
        const node = host?.querySelector(`#${id}`) ?? null;
        return node === null
          ? null
          : (node.getAttribute('href') ?? node.getAttribute('xlink:href'));
      };
      return {
        internal: host?.querySelector('use:not([id])')?.getAttribute('href') ?? null,
        external: attribute('external'),
        scripted: attribute('scripted'),
        remote: attribute('remote'),
        planted: Reflect.get(window, '__use') ?? null
      };
    });

    expect(result.internal, 'a same-document reference was stripped').toBe('#box');
    expect(result.external, 'a remote xlink:href survived').toBeNull();
    expect(result.scripted, 'a javascript: href survived').toBeNull();
    expect(result.remote, 'a remote image href survived').toBeNull();
    expect(result.planted).toBeNull();
  });
});
