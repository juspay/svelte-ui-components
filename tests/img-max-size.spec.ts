import { expect, test, type Locator, type Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

// An intrinsically sized image could not be capped to its container without a
// class override of the app's own, so Img reads --image-max-width and
// --image-max-height. Boxes and computed styles cannot be proved in jsdom, so
// every claim here is a measurement in a real browser, on the
// tests/fixtures/img-max-size page. Each host there is 200x100 and each image
// is 400x200 (a 2:1 ratio) unless a token says otherwise.
//
// Two groups matter more than the rest. The "no token set" tests pin that an
// Img with neither token renders exactly as it did before they existed, and the
// "an app's own reset" tests pin how that holds beside the max-width rule an app
// already has: a bare `img` rule ahead of or behind the library stylesheet, a
// universal `*` rule and a `:where()` rule (both of zero specificity, which the
// stylesheet that comes later wins), and a reset in a cascade layer named ahead
// of or behind the library's. The twin elements on the fixture are bare <img> and
// <svg> elements, so a reset's own effect is on the page to compare against.
//
// A third group, "in every kind of box", pins the same thing where the layout algorithm
// is not a plain block: a flex row and column, a grid track, a table cell, a float and an
// absolutely positioned box. A flex or grid item has an automatic minimum size, and the
// other three shrink to their content, so each is a place where a max-width that leaked
// in, or a min-width that came with it, would move the image or the box around it. The
// Img is laid out beside a bare element that carries only the size rules the component
// had before the caps (the fixture's `.base-equivalent`), under every reset placement.
//
// The repo's Playwright project runs Chromium only, so this file only ever runs
// there in CI. The same file was also run through a scratch Playwright config on
// Firefox 150.0.2 and WebKit 26.4 (Chromium 148.0.7778.96), not by CI; every
// number below was measured to be the same in all three. The one group that holds no
// number is "in every kind of box": the engines do not agree there (a table-cell host is
// 28px tall in Chromium and 29.6px in Firefox, and a 100% image in a table cell is 100px
// tall in Chromium and Firefox and 200px in WebKit), so it compares with a bare element.

type Measured = { width: number; height: number; maxWidth: string; maxHeight: string };

const openFixture = async (
  page: Page,
  reset: string | null = null,
  hostKinds = false
): Promise<void> => {
  const params = new URLSearchParams();
  if (reset !== null) {
    params.set('reset', reset);
  }
  if (hostKinds) {
    params.set('hosts', '1');
  }
  const query = params.size === 0 ? '' : `?${params.toString()}`;
  await page.goto(`${fixtureBaseURL}/img-max-size/${query}`);
  await page.waitForFunction(() => 'fixtureReady' in document.documentElement.dataset);
  // A page that never settled holds images that did not load, and two zero-sized boxes
  // compare equal, so a stalled fixture has to fail here rather than pass below.
  expect(
    await page.evaluate(() => document.documentElement.dataset.fixtureReady),
    'every <img> decoded and every inlined <svg> filled'
  ).toBe('true');
};

const measure = (locator: Locator): Promise<Measured> =>
  locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      width: box.width,
      height: box.height,
      maxWidth: style.maxWidth,
      maxHeight: style.maxHeight
    };
  });

const expectMeasured = (actual: Measured, expected: Measured): void => {
  expect(actual.maxWidth, 'computed max-width').toBe(expected.maxWidth);
  expect(actual.maxHeight, 'computed max-height').toBe(expected.maxHeight);
  expect(actual.width, 'box width').toBeCloseTo(expected.width, 1);
  expect(actual.height, 'box height').toBeCloseTo(expected.height, 1);
};

const box = (width: number, height: number, maxWidth = 'none', maxHeight = 'none'): Measured => ({
  width,
  height,
  maxWidth,
  maxHeight
});

// No new token is set on any of these.
const NO_TOKEN: ReadonlyArray<readonly [string, Measured]> = [
  ['unset-img-default', box(24, 24)],
  ['unset-img-intrinsic', box(400, 200)],
  ['unset-img-fill', box(200, 100)],
  ['unset-svg-default', box(24, 24)],
  ['unset-svg-sized', box(300, 150)],
  ['unset-svg-intrinsic', box(400, 200)],
  ['unset-svg-fill', box(200, 100)]
];

// The same cases once the app's own `max-width: 100%; max-height: 100%` reset is
// on the page, which caps every one of them to its 200x100 host.
const NO_TOKEN_UNDER_RESET: ReadonlyArray<readonly [string, Measured]> = [
  ['unset-img-default', box(24, 24, '100%', '100%')],
  ['unset-img-intrinsic', box(200, 100, '100%', '100%')],
  ['unset-img-fill', box(200, 100, '100%', '100%')],
  ['unset-svg-default', box(24, 24, '100%', '100%')],
  ['unset-svg-sized', box(200, 100, '100%', '100%')],
  ['unset-svg-intrinsic', box(200, 100, '100%', '100%')],
  ['unset-svg-fill', box(200, 100, '100%', '100%')]
];

const APP_WINS: ReadonlyArray<{ readonly name: string; readonly label: string }> = [
  { name: 'before', label: 'img, svg { … } ahead of the library stylesheet' },
  { name: 'after', label: 'img, svg { … } behind the library stylesheet' },
  { name: 'star-before', label: '* { … } ahead of the library stylesheet' },
  { name: 'star-after', label: '* { … } behind the library stylesheet' },
  { name: 'where-before', label: ':where(img, svg) { … } ahead of the library stylesheet' },
  { name: 'where-after', label: ':where(img, svg) { … } behind the library stylesheet' },
  { name: 'layer-after', label: "in a cascade layer named behind the library's" }
];

const expectSameAsBareElements = async (
  page: Page,
  cases: ReadonlyArray<readonly [string, Measured]>
): Promise<void> => {
  const twinImg = await measure(page.getByTestId('twin-img'));
  const twinSvg = await measure(page.getByTestId('twin-svg'));
  for (const [id] of cases) {
    const twin = id.includes('svg') ? twinSvg : twinImg;
    const actual = await measure(page.getByTestId(id));
    expect(actual.maxWidth, `${id} max-width`).toBe(twin.maxWidth);
    expect(actual.maxHeight, `${id} max-height`).toBe(twin.maxHeight);
  }
};

type Layout = {
  x: number;
  y: number;
  width: number;
  height: number;
  hostWidth: number;
  hostHeight: number;
  maxWidth: string;
  maxHeight: string;
  minWidth: string;
  minHeight: string;
  loaded: boolean;
};

const BOX_KINDS = [
  'flex-row',
  'flex-column',
  'grid-track',
  'table-cell',
  'float',
  'absolute'
] as const;
const BOX_PATHS = ['img', 'svg'] as const;
const BOX_SIZES = ['default', 'intrinsic', 'fill'] as const;

// Where the page's own reset sits relative to the library: none at all, then each placement
// the groups above use. `capped` is what a bare element computes there.
const BOX_PLACEMENTS: ReadonlyArray<{
  readonly name: string | null;
  readonly label: string;
  readonly capped: boolean;
}> = [
  { name: null, label: 'no reset on the page', capped: false },
  ...APP_WINS.map(({ name, label }) => ({ name, label, capped: true })),
  { name: 'layer', label: "in a cascade layer named ahead of the library's", capped: true }
];

const readLayout = (page: Page, scenario: string, role: 'component' | 'twin'): Promise<Layout> =>
  page.evaluate(
    ({ scenario: id, role: kind }) => {
      const find = (prefix: string): Element => {
        const found = document.querySelector(`[data-pw="${prefix}${id}-${kind}"]`);
        if (found === null) {
          throw new Error(`The fixture has no ${prefix}${id}-${kind}`);
        }
        return found;
      };
      const image = find('');
      const host = find('host-').getBoundingClientRect();
      const arena = find('arena-').getBoundingClientRect();
      const rect = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      return {
        x: rect.x - arena.x,
        y: rect.y - arena.y,
        width: rect.width,
        height: rect.height,
        hostWidth: host.width,
        hostHeight: host.height,
        maxWidth: style.maxWidth,
        maxHeight: style.maxHeight,
        minWidth: style.minWidth,
        minHeight: style.minHeight,
        loaded:
          image instanceof HTMLImageElement
            ? image.complete && image.naturalWidth === 400 && image.naturalHeight === 200
            : image.childElementCount > 0
      };
    },
    { scenario, role }
  );

const expectLaidOutLike = (component: Layout, twin: Layout, label: string): void => {
  expect(twin.loaded, `${label}: the bare element has its image`).toBe(true);
  expect(component.loaded, `${label}: the component has its image`).toBe(true);
  expect(twin.width, `${label}: the bare element has a width`).toBeGreaterThan(0);
  expect(twin.height, `${label}: the bare element has a height`).toBeGreaterThan(0);
  for (const key of ['maxWidth', 'maxHeight', 'minWidth', 'minHeight'] as const) {
    expect(component[key], `${label}: computed ${key}`).toBe(twin[key]);
  }
  for (const key of ['x', 'y', 'width', 'height', 'hostWidth', 'hostHeight'] as const) {
    expect(component[key], `${label}: ${key}`).toBeCloseTo(twin[key], 1);
  }
};

const CAPS: ReadonlyArray<readonly [string, string, Measured]> = [
  [
    'img-max-width-percent',
    'a percentage max-width caps the width and the height follows the ratio',
    box(200, 100, '100%')
  ],
  [
    'img-max-height-length',
    'a length max-height caps the height and the width follows the ratio',
    box(100, 50, 'none', '50px')
  ],
  [
    'img-max-both',
    'two caps leave the image inside both, keeping the ratio',
    box(100, 50, '100px', '100px')
  ],
  ['img-max-width-length', 'a length max-width caps the width', box(120, 60, '120px')],
  [
    'img-max-height-percent',
    'a percentage max-height resolves against a host with a definite height',
    box(200, 100, 'none', '100%')
  ],
  [
    'img-max-larger-than-image',
    'a cap larger than the image changes nothing',
    box(400, 200, '1000px', '1000px')
  ],
  ['img-max-none', 'none is the same as leaving the token unset', box(400, 200)],
  [
    'img-default-size-max-width',
    'beside the 24px default, only the capped axis changes',
    box(12, 24, '12px')
  ],
  [
    'img-default-size-max-height',
    'beside the 24px default, only the capped axis changes',
    box(24, 10, 'none', '10px')
  ],
  ['img-max-width-beats-width-token', 'a max-width wins over a width token', box(120, 24, '120px')],
  [
    'img-max-width-contain',
    'object-fit does not change the box the cap leaves',
    box(100, 150, '100px')
  ],
  ['svg-max-width', 'the inlined svg host is capped too', box(100, 150, '100px')],
  ['svg-max-height', 'the inlined svg host is capped on its height', box(300, 60, 'none', '60px')],
  ['svg-max-both', 'the inlined svg host takes both caps', box(100, 60, '100px', '60px')],
  [
    'svg-max-width-percent',
    'a percentage max-width on the svg host resolves against its parent',
    box(100, 150, '50%')
  ],
  ['svg-max-none', 'none on the svg host is the same as unset', box(300, 150)]
];

test.describe('Img --image-max-width and --image-max-height', () => {
  test.describe('with neither token set', () => {
    test.beforeEach(async ({ page }) => {
      await openFixture(page);
    });

    for (const [id, expected] of NO_TOKEN) {
      test(`${id}: no cap and the box it had before`, async ({ page }) => {
        expectMeasured(await measure(page.getByTestId(id)), expected);
      });
    }

    test('an unset image computes the same max-width and max-height as a bare element', async ({
      page
    }) => {
      await expectSameAsBareElements(page, NO_TOKEN);
    });
  });

  test.describe('a cap', () => {
    test.beforeEach(async ({ page }) => {
      await openFixture(page);
    });

    for (const [id, claim, expected] of CAPS) {
      test(`${id}: ${claim}`, async ({ page }) => {
        expectMeasured(await measure(page.getByTestId(id)), expected);
      });
    }

    test('the tokens give the box an app got from its own max-width and max-height rule', async ({
      page
    }) => {
      const withTokens = await measure(page.getByTestId('preview-tokens-img'));
      const withClass = await measure(page.getByTestId('preview-class-img'));
      expectMeasured(withTokens, box(200, 100, '100%', '100%'));
      expectMeasured(withClass, box(200, 100, '100%', '100%'));
    });
  });

  // Every reset here is outside a cascade layer, or in one the library's layer does
  // not outrank, so the app's rule decides and a token cannot move it. Without
  // that, an app that wrote its reset before the tokens existed would see its
  // images change on upgrade.
  for (const reset of APP_WINS) {
    test.describe(`an app's own reset: ${reset.label}`, () => {
      test.beforeEach(async ({ page }) => {
        await openFixture(page, reset.name);
      });

      for (const [id, expected] of NO_TOKEN_UNDER_RESET) {
        test(`${id}: no token set, the reset still decides`, async ({ page }) => {
          expectMeasured(await measure(page.getByTestId(id)), expected);
        });
      }

      test('an unset image computes what a bare element computes under the same reset', async ({
        page
      }) => {
        await expectSameAsBareElements(page, NO_TOKEN_UNDER_RESET);
      });

      test('a token does not outrank the reset, on an <img>', async ({ page }) => {
        expectMeasured(
          await measure(page.getByTestId('img-token-50')),
          box(200, 100, '100%', '100%')
        );
      });

      test('a token does not outrank the reset, on the inlined <svg>', async ({ page }) => {
        expectMeasured(
          await measure(page.getByTestId('svg-token-50')),
          box(200, 100, '100%', '100%')
        );
      });

      test('none does not outrank the reset either', async ({ page }) => {
        expectMeasured(
          await measure(page.getByTestId('img-max-none')),
          box(200, 100, '100%', '100%')
        );
        expectMeasured(
          await measure(page.getByTestId('svg-max-none')),
          box(200, 100, '100%', '100%')
        );
      });
    });
  }

  // A reset in a cascade layer named ahead of the library's, which is where Tailwind 4
  // keeps its own. A rule outside any layer outranks it, so a declaration of `none`
  // would have replaced the reset; the fallback hands the property back to it instead.
  test.describe("an app's own reset: in a cascade layer named ahead of the library's", () => {
    test.beforeEach(async ({ page }) => {
      await openFixture(page, 'layer');
    });

    for (const [id, expected] of NO_TOKEN_UNDER_RESET) {
      test(`${id}: no token set, the layered reset still decides`, async ({ page }) => {
        expectMeasured(await measure(page.getByTestId(id)), expected);
      });
    }

    test('an unset image computes what a bare element computes under the same reset', async ({
      page
    }) => {
      await expectSameAsBareElements(page, NO_TOKEN_UNDER_RESET);
    });

    test('a token outranks the layered reset on the axis it sets, on an <img>', async ({
      page
    }) => {
      expectMeasured(await measure(page.getByTestId('img-token-50')), box(50, 25, '50px', '100%'));
    });

    test('a token outranks the layered reset on the axis it sets, on the inlined <svg>', async ({
      page
    }) => {
      expectMeasured(await measure(page.getByTestId('svg-token-50')), box(50, 100, '50px', '100%'));
    });

    test('none opts an <img> out of the layered reset', async ({ page }) => {
      expectMeasured(await measure(page.getByTestId('img-max-none')), box(400, 200));
    });

    test('none opts the inlined <svg> out of the layered reset', async ({ page }) => {
      expectMeasured(await measure(page.getByTestId('svg-max-none')), box(300, 150));
    });

    test('a cap on one axis leaves the reset in charge of the other', async ({ page }) => {
      expectMeasured(
        await measure(page.getByTestId('img-max-height-length')),
        box(100, 50, '100%', '50px')
      );
    });
  });

  // No token is set anywhere below. Each component sits in a 200px box of the named kind,
  // beside a bare element in an identical box, at the three sizes the groups above use:
  // the 24px default, its own size (a 400x200 image, wider than the box) and 100%.
  for (const placement of BOX_PLACEMENTS) {
    test.describe(`in every kind of box, with neither token set: ${placement.label}`, () => {
      for (const kind of BOX_KINDS) {
        for (const path of BOX_PATHS) {
          test(`${kind}: an unset ${path} is laid out as a bare element is`, async ({ page }) => {
            await openFixture(page, placement.name, true);
            for (const size of BOX_SIZES) {
              const scenario = `${kind}-${path}-${size}`;
              const component = await readLayout(page, scenario, 'component');
              const twin = await readLayout(page, scenario, 'twin');
              expect(twin.maxWidth, `${scenario}: the reset is as placed`).toBe(
                placement.capped ? '100%' : 'none'
              );
              expect(twin.maxHeight, `${scenario}: the reset is as placed`).toBe(
                placement.capped ? '100%' : 'none'
              );
              expectLaidOutLike(component, twin, scenario);
            }
          });
        }
      }
    });
  }
});

// <sui-img> carries the same tokens across its shadow root, and the app's reset in
// the page does not reach the <img> inside it. dist-wc is a self-contained bundle
// rather than a route of the fixture, so it is injected into the same page.
const mountElement = async (
  page: Page,
  hostWidth: number,
  style: string
): Promise<{ host: Measured; image: Measured }> => {
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-img') === 'function');
  return page.evaluate(
    async ({ hostWidth: width, style: tokens }) => {
      const source = document.querySelector<HTMLImageElement>('[data-pw="twin-img"]')?.src ?? '';
      const parent = document.createElement('div');
      parent.style.cssText = `width: ${width}px; height: 100px;`;
      const element = document.createElement('sui-img');
      element.style.cssText = tokens;
      element.setAttribute('alt', '');
      element.setAttribute('src', source);
      parent.append(element);
      document.body.append(parent);
      const inner = await new Promise<HTMLImageElement>((resolve, reject) => {
        const startedAt = Date.now();
        const timer = window.setInterval(() => {
          const candidate = element.shadowRoot?.querySelector('img') ?? null;
          if (candidate !== null && candidate.complete && candidate.naturalWidth > 0) {
            window.clearInterval(timer);
            resolve(candidate);
          } else if (Date.now() - startedAt > 5000) {
            window.clearInterval(timer);
            reject(new Error('sui-img never rendered its image'));
          }
        }, 20);
      });
      const read = (target: Element): Measured => {
        const rect = target.getBoundingClientRect();
        const computed = getComputedStyle(target);
        return {
          width: rect.width,
          height: rect.height,
          maxWidth: computed.maxWidth,
          maxHeight: computed.maxHeight
        };
      };
      return { host: read(element), image: read(inner) };
    },
    { hostWidth, style }
  );
};

test.describe('<sui-img>', () => {
  const INTRINSIC = '--image-width: auto; --image-height: auto;';

  test('with neither token set the image has no cap', async ({ page }) => {
    await openFixture(page);
    const { image } = await mountElement(page, 200, INTRINSIC);
    expectMeasured(image, box(400, 200));
  });

  test('--image-max-width set on the element caps the image inside its shadow root', async ({
    page
  }) => {
    await openFixture(page);
    const { host, image } = await mountElement(page, 200, `${INTRINSIC} --image-max-width: 100px;`);
    expectMeasured(image, box(100, 50, '100px'));
    expect(host.width).toBeCloseTo(100, 1);
  });

  test('a percentage max-width resolves against the width the element is given', async ({
    page
  }) => {
    await openFixture(page);
    const { image } = await mountElement(page, 200, `${INTRINSIC} --image-max-width: 100%;`);
    expectMeasured(image, box(200, 100, '100%'));
  });

  test('--image-max-height set on the element caps the image inside its shadow root', async ({
    page
  }) => {
    await openFixture(page);
    const { image } = await mountElement(page, 200, `${INTRINSIC} --image-max-height: 40px;`);
    expectMeasured(image, box(80, 40, 'none', '40px'));
  });

  test("the page's own img reset does not reach the image, so the token alone decides", async ({
    page
  }) => {
    await openFixture(page, 'before');
    const { image } = await mountElement(page, 200, `${INTRINSIC} --image-max-width: 50px;`);
    expectMeasured(image, box(50, 25, '50px'));
  });

  test("the page's own img reset leaves an unset element uncapped", async ({ page }) => {
    await openFixture(page, 'before');
    const { image } = await mountElement(page, 200, INTRINSIC);
    expectMeasured(image, box(400, 200));
  });
});
