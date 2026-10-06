import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Gallery's edit and delete actions sit inside .gallery-item-actions-frame, a container for the
// narrow-tile rule. A consumer's editIcon snippet renders inside that frame, so the frame must not
// change where the snippet's own positioned content lands. Measured before this test existed
// (Chromium, Firefox, WebKit): inline-size containment does not make the frame the containing block
// of a position:fixed child, and a fixed child is still contained by the action's default
// backdrop-filter exactly as it was before the frame was added. These tests fail if that changes.

type WcModule = {
  createRawSnippet?: (factory: () => { render: () => string }) => unknown;
};

type Offsets = {
  readonly fixedFromButton: { readonly dx: number; readonly dy: number };
  readonly absoluteFromButton: { readonly dx: number; readonly dy: number };
  readonly fixedInViewport: { readonly x: number; readonly y: number };
};

const mountGalleryWithIconSnippet = async (
  page: Page,
  width: number,
  backdropFilter: string | null
): Promise<Offsets> => {
  await page.setViewportSize({ width, height: 900 });
  await gotoHydrated(page, '/');
  await page.route('**/__sui-wc.js', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: readFileSync('dist-wc/index.js', 'utf8')
    })
  );
  await page.addScriptTag({
    content: `import('/__sui-wc.js').then((module) => { window.__suiWcModule = module; });`,
    type: 'module'
  });
  await page.waitForFunction(
    () =>
      typeof customElements.get('sui-gallery') !== 'undefined' &&
      typeof (window as Window & { __suiWcModule?: WcModule }).__suiWcModule === 'object',
    { timeout: 15_000 }
  );

  return page.evaluate(async (filter) => {
    const module = (window as Window & { __suiWcModule?: WcModule }).__suiWcModule;
    if (typeof module?.createRawSnippet !== 'function') {
      throw new Error('the WC entry must export createRawSnippet');
    }
    const gallery = document.createElement('sui-gallery');
    if (filter !== null) {
      gallery.style.setProperty('--gallery-item-action-backdrop-filter', filter);
    }
    const pixel = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
    Reflect.set(gallery, 'images', [
      { src: pixel, alt: 'one' },
      { src: pixel, alt: 'two' },
      { src: pixel, alt: 'three' }
    ]);
    Reflect.set(gallery, 'oneditclick', () => null);
    Reflect.set(
      gallery,
      'editIcon',
      module.createRawSnippet(() => ({
        render: () =>
          '<span><i id="fixed-child" style="position:fixed;top:11px;left:13px;width:6px;height:6px"></i>' +
          '<i id="absolute-child" style="position:absolute;top:2px;left:3px;width:4px;height:4px"></i></span>'
      }))
    );
    document.body.append(gallery);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const root = gallery.shadowRoot;
    const button = root?.querySelector('.gallery-item-action button');
    const fixedChild = root?.querySelector('#fixed-child');
    const absoluteChild = root?.querySelector('#absolute-child');
    if (!button || !fixedChild || !absoluteChild) {
      throw new Error('the custom edit icon did not render inside the action button');
    }
    const b = button.getBoundingClientRect();
    const f = fixedChild.getBoundingClientRect();
    const a = absoluteChild.getBoundingClientRect();
    return {
      fixedFromButton: { dx: f.x - b.x, dy: f.y - b.y },
      absoluteFromButton: { dx: a.x - b.x, dy: a.y - b.y },
      fixedInViewport: { x: f.x, y: f.y }
    };
  }, backdropFilter);
};

for (const width of [1280, 320]) {
  test(`a custom editIcon keeps its positioned children where they were at ${width}px`, async ({
    page
  }) => {
    // Default styling: the action's backdrop-filter contains the fixed child, so it sits at its
    // authored offset from the button, and the absolute child at its authored offset.
    const offsets = await mountGalleryWithIconSnippet(page, width, null);
    expect(offsets.fixedFromButton.dx).toBeCloseTo(13, 0);
    expect(offsets.fixedFromButton.dy).toBeCloseTo(11, 0);
    expect(offsets.absoluteFromButton.dx).toBeCloseTo(3, 0);
    expect(offsets.absoluteFromButton.dy).toBeCloseTo(2, 0);
  });

  test(`with the backdrop filter off, a fixed icon child still anchors to the viewport at ${width}px`, async ({
    page
  }) => {
    // Nothing else contains it now. If the frame ever became its containing block, this child would
    // land inside the tile instead of at the viewport's top-left.
    const offsets = await mountGalleryWithIconSnippet(page, width, 'none');
    expect(offsets.fixedInViewport.x).toBeCloseTo(13, 0);
    expect(offsets.fixedInViewport.y).toBeCloseTo(11, 0);
  });
}
