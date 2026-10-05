import { expect, test, type Locator, type Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

// A Button is as wide as its label and the label does not wrap, so in a parent
// narrower than the label (a flex row, a grid cell or a plain block) it could
// never give width back: `--button-max-width: 100%` resolved against a container
// that was already label-wide. `shrinkable` caps the container itself. Layout
// cannot be proved in jsdom, so every claim here is a bounding box in a real
// browser, on the tests/fixtures/button-shrinkable page.
//
// The repo's Playwright project runs Chromium only, so this file only ever runs
// there in CI. Chromium shrinks a grid track around a `width: fit-content` item
// that Firefox and WebKit refuse to shrink (they count the item at its content
// width), so the grid cases below cannot fail in Chromium for that reason; what
// the Chromium run does pin is the box itself: the shared-row and centred cases
// fail under a `fit-content` or `width: auto` container. The Firefox and WebKit
// results were measured by running this same spec through a scratch Playwright
// config on Firefox 150.0.2 and WebKit 26.4 (Chromium 148.0.7778.96), not by CI.
//
// Four groups of tests pair a shrinkable Button with a default-button twin that
// must OVERFLOW, so a parent that happened to be wide enough could not pass
// whether the prop did anything or not: the parent kinds, an unbreakable word,
// an iconOnly svg, and <sui-button> in a flex and a grid parent. The all: unset
// cases pair theirs with a default or token-only Button. The remaining shrink
// assertions (the icons, the two-button rows, the --button-max-width cap, the
// children content) rely on the fixed 240px parent, which the long labels exceed
// by far; the rest guard that a Button which does not opt in is unchanged, or pin
// what docs/Button.md says the prop does and does not do.
//
// 240px is the fixture parent's width and the long labels are far wider than that.
const PARENT_WIDTH = 240;
// Sub-pixel layout rounds differently per engine; a pixel is not a shrink.
const TOLERANCE = 0.5;
// The default long-label button is about 471px here (470.6px in Chromium and
// WebKit, 471.3px in Firefox); anything past 100px of overflow is the
// label-sized box and not rounding.
const MIN_OVERFLOW = 100;
// A wrapped label is at least one extra line (about 17px) taller than a single line.
const EXTRA_LINE = 10;

type Box = { x: number; y: number; width: number; height: number };

const measure = async (locator: Locator): Promise<Box> => {
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error('boundingBox is null');
  }
  return box;
};

const isTruncated = (label: Locator): Promise<boolean> =>
  label.evaluate((element) => element.scrollWidth > element.clientWidth);

const openFixture = async (page: Page): Promise<void> => {
  await page.goto(`${fixtureBaseURL}/button-shrinkable/`);
  await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
};

const PARENT_KINDS = ['flex', 'block', 'grid', 'stretch'] as const;
// `grid` is the 1fr track; a grid cell is only as good as its track.
const GRID_TRACKS = ['grid', 'grid-auto', 'grid-minmax', 'grid-fixed'] as const;
const OTHER_GRID_TRACKS = ['grid-auto', 'grid-minmax', 'grid-fixed'] as const;
const ALIGNMENTS = ['normal', 'start', 'center', 'end'] as const;

test.describe('Button shrinkable', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page);
  });

  for (const kind of [...PARENT_KINDS, ...OTHER_GRID_TRACKS]) {
    test(`${kind} parent: a long label truncates inside the parent, the default overflows it`, async ({
      page
    }) => {
      const shrinkableParent = page.getByTestId(`shrink-parent-${kind}-on`);
      const parentBox = await measure(shrinkableParent);
      expect(parentBox.width).toBe(PARENT_WIDTH);
      const containerBox = await measure(shrinkableParent.locator('.button-container'));
      expect(containerBox.width).toBeLessThanOrEqual(parentBox.width + TOLERANCE);
      expect(await isTruncated(shrinkableParent.locator('.button-text'))).toBe(true);

      const defaultParent = page.getByTestId(`shrink-parent-${kind}-off`);
      const defaultBox = await measure(defaultParent.locator('.button-container'));
      expect(defaultBox.width).toBeGreaterThan(PARENT_WIDTH + MIN_OVERFLOW);
      expect(await isTruncated(defaultParent.locator('.button-text'))).toBe(false);
    });
  }

  test('a label that fits keeps the width and height it has without the prop', async ({ page }) => {
    const shrinkableBox = await measure(page.getByTestId('shrink-short-on').locator('.button-el'));
    const defaultBox = await measure(page.getByTestId('shrink-short-off').locator('.button-el'));
    expect(shrinkableBox.width).toBeLessThan(PARENT_WIDTH / 2);
    expect(shrinkableBox.width).toBeCloseTo(defaultBox.width, 2);
    expect(shrinkableBox.height).toBeCloseTo(defaultBox.height, 2);
  });

  test('an svg icon keeps its size and only the label gives way', async ({ page }) => {
    const parent = page.getByTestId('shrink-icon-svg');
    const parentBox = await measure(parent);
    const containerBox = await measure(parent.locator('.button-container'));
    expect(containerBox.width).toBeLessThanOrEqual(parentBox.width + TOLERANCE);
    expect((await measure(parent.locator('.button-icon'))).width).toBe(16);
    expect(await isTruncated(parent.locator('.button-text'))).toBe(true);
  });

  test('an img icon under img { max-width: 100% } keeps its size too', async ({ page }) => {
    const parent = page.getByTestId('shrink-icon-img');
    const parentBox = await measure(parent);
    const containerBox = await measure(parent.locator('.button-container'));
    expect(containerBox.width).toBeLessThanOrEqual(parentBox.width + TOLERANCE);
    expect((await measure(parent.locator('.button-icon img'))).width).toBe(24);
    expect(await isTruncated(parent.locator('.button-text'))).toBe(true);
  });

  test('two shrinkable buttons share one row and both truncate', async ({ page }) => {
    const parent = page.getByTestId('shrink-pair');
    const parentBox = await measure(parent);
    const containers = parent.locator('.button-container');
    const firstBox = await measure(containers.nth(0));
    const secondBox = await measure(containers.nth(1));
    expect(secondBox.x + secondBox.width).toBeLessThanOrEqual(
      parentBox.x + parentBox.width + TOLERANCE
    );
    expect(firstBox.width).toBeGreaterThan(60);
    expect(secondBox.width).toBeGreaterThan(60);
    expect(await isTruncated(parent.locator('.button-text').nth(0))).toBe(true);
    expect(await isTruncated(parent.locator('.button-text').nth(1))).toBe(true);
  });

  test.describe('a grid cell', () => {
    // The label that fits is positioned exactly as the default Button is, whatever
    // the parent's justify-items says; the label that does not fit fills the cell.
    for (const track of GRID_TRACKS) {
      for (const alignment of ALIGNMENTS) {
        test(`${track}, justify-items: ${alignment}: a label that fits keeps its width and its place`, async ({
          page
        }) => {
          const naturalWidth = (
            await measure(page.getByTestId('shrink-short-off').locator('.button-container'))
          ).width;
          const parent = page.getByTestId(`shrink-aligned-${track}-${alignment}-short`);
          const parentBox = await measure(parent);
          const containerBox = await measure(parent.locator('.button-container'));
          const offset = { normal: 0, start: 0, center: 0.5, end: 1 }[alignment];
          expect(containerBox.width).toBeCloseTo(naturalWidth, 1);
          expect(containerBox.x - parentBox.x).toBeCloseTo(
            offset * (parentBox.width - containerBox.width),
            1
          );
          expect(await isTruncated(parent.locator('.button-text'))).toBe(false);
        });

        test(`${track}, justify-items: ${alignment}: a label that does not fit fills the cell and truncates`, async ({
          page
        }) => {
          const parent = page.getByTestId(`shrink-aligned-${track}-${alignment}-long`);
          const parentBox = await measure(parent);
          const containerBox = await measure(parent.locator('.button-container'));
          expect(parentBox.width).toBe(PARENT_WIDTH);
          expect(containerBox.width).toBeCloseTo(parentBox.width, 0);
          expect(containerBox.x).toBeCloseTo(parentBox.x, 0);
          expect(await isTruncated(parent.locator('.button-text'))).toBe(true);
        });
      }
    }

    for (const alignment of ['start', 'center', 'end'] as const) {
      test(`justify-self: ${alignment} on the root: the label that fits keeps its place, the other fills the cell`, async ({
        page
      }) => {
        const naturalWidth = (
          await measure(page.getByTestId('shrink-short-off').locator('.button-container'))
        ).width;
        const shortParent = page.getByTestId(`shrink-self-${alignment}-short`);
        const shortParentBox = await measure(shortParent);
        const shortBox = await measure(shortParent.locator('.button-container'));
        const offset = { start: 0, center: 0.5, end: 1 }[alignment];
        expect(shortBox.width).toBeCloseTo(naturalWidth, 1);
        expect(shortBox.x - shortParentBox.x).toBeCloseTo(
          offset * (shortParentBox.width - shortBox.width),
          1
        );

        const longParent = page.getByTestId(`shrink-self-${alignment}-long`);
        const longParentBox = await measure(longParent);
        const longBox = await measure(longParent.locator('.button-container'));
        expect(longBox.width).toBeCloseTo(longParentBox.width, 0);
        expect(await isTruncated(longParent.locator('.button-text'))).toBe(true);
      });
    }
  });

  test('auto margins on the root still centre a label that fits', async ({ page }) => {
    const parent = page.getByTestId('shrink-centered');
    const parentBox = await measure(parent);
    const containerBox = await measure(parent.locator('.button-container'));
    expect(containerBox.width).toBeLessThan(parentBox.width / 2);
    expect(containerBox.x - parentBox.x).toBeCloseTo((parentBox.width - containerBox.width) / 2, 1);
  });

  test.describe('a flex row shared with other buttons', () => {
    test('a short label beside a long one keeps its natural width and the long one truncates', async ({
      page
    }) => {
      const naturalWidth = (
        await measure(page.getByTestId('shrink-short-off').locator('.button-container'))
      ).width;
      const parent = page.getByTestId('shrink-mixed');
      const parentBox = await measure(parent);
      const containers = parent.locator('.button-container');
      expect((await measure(containers.nth(0))).width).toBeCloseTo(naturalWidth, 1);
      expect(await isTruncated(parent.locator('.button-text').nth(0))).toBe(false);
      const longBox = await measure(containers.nth(1));
      expect(longBox.x + longBox.width).toBeLessThanOrEqual(
        parentBox.x + parentBox.width + TOLERANCE
      );
      expect(await isTruncated(parent.locator('.button-text').nth(1))).toBe(true);
    });

    test('a row too narrow for every label squeezes them all unless one has flex-shrink: 0', async ({
      page
    }) => {
      const naturalWidth = (
        await measure(page.getByTestId('shrink-short-off').locator('.button-container'))
      ).width;

      const squeezedParent = page.getByTestId('shrink-tight');
      const squeezedBox = await measure(squeezedParent.locator('.button-container').nth(0));
      expect(squeezedBox.width).toBeLessThan(naturalWidth - TOLERANCE);
      expect(await isTruncated(squeezedParent.locator('.button-text').nth(0))).toBe(true);
      expect(await isTruncated(squeezedParent.locator('.button-text').nth(1))).toBe(true);

      const keptParent = page.getByTestId('shrink-tight-kept');
      const keptBox = await measure(keptParent.locator('.button-container').nth(0));
      expect(keptBox.width).toBeCloseTo(naturalWidth, 1);
      expect(await isTruncated(keptParent.locator('.button-text').nth(0))).toBe(false);
      expect(await isTruncated(keptParent.locator('.button-text').nth(1))).toBe(true);
    });
  });

  test.describe('flex-grow on the root', () => {
    test('does not widen a shrinkable button past its label, as it does a default one', async ({
      page
    }) => {
      const naturalWidth = (
        await measure(page.getByTestId('shrink-short-off').locator('.button-container'))
      ).width;
      const shrinkableBox = await measure(
        page.getByTestId('shrink-grow-on').locator('.button-container')
      );
      expect(shrinkableBox.width).toBeCloseTo(naturalWidth, 1);
      const defaultBox = await measure(
        page.getByTestId('shrink-grow-off').locator('.button-container')
      );
      expect(defaultBox.width).toBeCloseTo(PARENT_WIDTH, 0);
    });

    test('fullWidth still fills the row, for a label that fits and one that does not', async ({
      page
    }) => {
      const shortBox = await measure(page.getByTestId('shrink-fullwidth-short-button'));
      expect(shortBox.width).toBeCloseTo(PARENT_WIDTH, 0);
      const longParent = page.getByTestId('shrink-fullwidth-long');
      const longBox = await measure(page.getByTestId('shrink-fullwidth-long-button'));
      expect(longBox.width).toBeCloseTo(PARENT_WIDTH, 0);
      expect(await isTruncated(longParent.locator('.button-text'))).toBe(true);
    });
  });

  test('--button-max-width still caps the button below the width the parent offers', async ({
    page
  }) => {
    const buttonBox = await measure(page.getByTestId('shrink-capped-button'));
    expect(buttonBox.width).toBeCloseTo(120, 0);
  });

  test.describe('white-space: normal', () => {
    test('wraps a label with break opportunities with or without the prop', async ({ page }) => {
      const singleLineHeight = (await measure(page.getByTestId('shrink-short-button-off'))).height;

      const wrapped: number[] = [];
      for (const mode of ['on', 'off']) {
        const parent = page.getByTestId(`shrink-wrap-${mode}`);
        const containerBox = await measure(parent.locator('.button-container'));
        expect(containerBox.width).toBeLessThanOrEqual(PARENT_WIDTH + TOLERANCE);
        expect(await isTruncated(parent.locator('.button-text'))).toBe(false);
        const buttonHeight = (await measure(page.getByTestId(`shrink-wrap-button-${mode}`))).height;
        expect(buttonHeight).toBeGreaterThan(singleLineHeight + EXTRA_LINE);
        wrapped.push(buttonHeight);
      }
      expect(wrapped[0]).toBeCloseTo(wrapped[1], 1);
    });

    test('contains a single word wider than the parent, which the default button does not', async ({
      page
    }) => {
      const shrinkableParent = page.getByTestId('shrink-unbreakable-on');
      const containerBox = await measure(shrinkableParent.locator('.button-container'));
      expect(containerBox.width).toBeLessThanOrEqual(PARENT_WIDTH + TOLERANCE);
      expect(await isTruncated(shrinkableParent.locator('.button-text'))).toBe(true);

      const defaultParent = page.getByTestId('shrink-unbreakable-off');
      const defaultBox = await measure(defaultParent.locator('.button-container'));
      expect(defaultBox.width).toBeGreaterThan(PARENT_WIDTH + MIN_OVERFLOW);
      expect(await isTruncated(defaultParent.locator('.button-text'))).toBe(false);
    });

    test('an ancestor overflow-wrap: anywhere breaks that word instead of truncating it', async ({
      page
    }) => {
      const singleLineHeight = (await measure(page.getByTestId('shrink-short-button-off'))).height;
      const parent = page.getByTestId('shrink-unbreakable-anywhere');
      const containerBox = await measure(parent.locator('.button-container'));
      expect(containerBox.width).toBeLessThanOrEqual(PARENT_WIDTH + TOLERANCE);
      expect(await isTruncated(parent.locator('.button-text'))).toBe(false);
      expect(
        (await measure(page.getByTestId('shrink-unbreakable-anywhere-button'))).height
      ).toBeGreaterThan(singleLineHeight + EXTRA_LINE);
    });
  });

  test.describe('with iconOnly', () => {
    test('the glyph keeps its size and stays inside a button squeezed below its square', async ({
      page
    }) => {
      const parent = page.getByTestId('shrink-icon-only-on');
      const parentBox = await measure(parent);
      const containerBox = await measure(parent.locator('.button-container'));
      expect(parentBox.width).toBe(24);
      expect(containerBox.width).toBeLessThanOrEqual(parentBox.width + TOLERANCE);

      const buttonBox = await measure(parent.locator('.button-el'));
      const glyphBox = await measure(parent.locator('svg'));
      expect(glyphBox.width).toBe(16);
      expect(glyphBox.x).toBeGreaterThanOrEqual(buttonBox.x - TOLERANCE);
      expect(glyphBox.x + glyphBox.width).toBeLessThanOrEqual(
        buttonBox.x + buttonBox.width + TOLERANCE
      );

      const defaultBox = await measure(
        page.getByTestId('shrink-icon-only-off').locator('.button-container')
      );
      expect(defaultBox.width).toBeGreaterThan(parentBox.width + TOLERANCE);
    });

    test('an img icon keeps its size too, and the button never gets narrower than its padding', async ({
      page
    }) => {
      const parent = page.getByTestId('shrink-icon-only-img');
      const glyph = parent.locator('img');
      const button = parent.locator('.button-el');
      expect((await measure(parent)).width).toBe(24);
      expect((await measure(glyph)).width).toBe(24);
      expect((await measure(button)).width).toBeLessThanOrEqual(24 + TOLERANCE);

      await parent.evaluate((element) => {
        element.style.width = '4px';
      });
      expect((await measure(glyph)).width).toBe(24);
      expect((await measure(button)).width).toBe(16);
    });

    test('while the square fits it is exactly the default button', async ({ page }) => {
      await page.evaluate(() => {
        for (const parent of document.querySelectorAll<HTMLElement>(
          '[data-pw^="shrink-icon-only-"]'
        )) {
          parent.style.width = '200px';
        }
      });
      const shrinkableBox = await measure(
        page.getByTestId('shrink-icon-only-on').locator('.button-el')
      );
      const defaultBox = await measure(
        page.getByTestId('shrink-icon-only-off').locator('.button-el')
      );
      expect(shrinkableBox.width).toBeCloseTo(defaultBox.width, 2);
      expect(shrinkableBox.height).toBeCloseTo(defaultBox.height, 2);
    });
  });

  test('custom children content has to manage its own overflow', async ({ page }) => {
    const unmanagedParent = page.getByTestId('shrink-children-unmanaged');
    const unmanagedParentBox = await measure(unmanagedParent);
    const unmanagedButtonBox = await measure(unmanagedParent.locator('.button-el'));
    const unmanagedChildBox = await measure(unmanagedParent.locator('.child-label'));
    expect(unmanagedButtonBox.width).toBeLessThanOrEqual(unmanagedParentBox.width + TOLERANCE);
    expect(unmanagedChildBox.width).toBeGreaterThan(unmanagedButtonBox.width + MIN_OVERFLOW);

    const managedParent = page.getByTestId('shrink-children-managed');
    const managedButtonBox = await measure(managedParent.locator('.button-el'));
    const managedChildBox = await measure(managedParent.locator('.child-label'));
    expect(managedChildBox.x + managedChildBox.width).toBeLessThanOrEqual(
      managedButtonBox.x + managedButtonBox.width + TOLERANCE
    );
    expect(await isTruncated(managedParent.locator('.child-label'))).toBe(true);
  });

  test.describe('a width cap without the prop', () => {
    for (const kind of PARENT_KINDS) {
      test(`${kind} parent: --button-max-width: 100% alone does not fit a content-sized button`, async ({
        page
      }) => {
        const parent = page.getByTestId(`shrink-token-only-${kind}`);
        const containerBox = await measure(parent.locator('.button-container'));
        expect(containerBox.width).toBeGreaterThan(PARENT_WIDTH + MIN_OVERFLOW);
        const buttonBox = await measure(page.getByTestId(`shrink-token-only-button-${kind}`));
        expect(buttonBox.width).toBeGreaterThan(PARENT_WIDTH + MIN_OVERFLOW);
      });
    }

    test('a percentage resolves against the container, which fullWidth makes as wide as the parent', async ({
      page
    }) => {
      const parentBox = await measure(page.getByTestId('shrink-fullwidth-capped'));
      const buttonBox = await measure(page.getByTestId('shrink-fullwidth-capped-button'));
      expect(buttonBox.width).toBeCloseTo(parentBox.width / 2, 0);
    });

    test('a percentage resolves against the container, which --button-width sizes', async ({
      page
    }) => {
      const containerBox = await measure(
        page.getByTestId('shrink-width-token-capped').locator('.button-container')
      );
      expect(containerBox.width).toBeCloseTo(200, 0);
      const buttonBox = await measure(page.getByTestId('shrink-width-token-capped-button'));
      expect(buttonBox.width).toBeCloseTo(100, 0);
    });
  });

  test.describe('a root reset to display: inline with all: unset', () => {
    test('the default button overflows a block parent', async ({ page }) => {
      const buttonBox = await measure(page.getByTestId('shrink-reset-default-button'));
      expect(buttonBox.width).toBeGreaterThan(PARENT_WIDTH + MIN_OVERFLOW);
    });

    test('--button-max-width: 100% alone already caps it, against the parent', async ({ page }) => {
      const parent = page.getByTestId('shrink-reset-token');
      const buttonBox = await measure(page.getByTestId('shrink-reset-token-button'));
      expect(buttonBox.width).toBeLessThanOrEqual(PARENT_WIDTH + TOLERANCE);
      expect(await isTruncated(parent.locator('.button-text'))).toBe(true);
    });

    test('shrinkable caps it too, through the inner button and against the parent', async ({
      page
    }) => {
      const parent = page.getByTestId('shrink-reset-shrinkable');
      const buttonBox = await measure(page.getByTestId('shrink-reset-shrinkable-button'));
      expect(buttonBox.width).toBeLessThanOrEqual(PARENT_WIDTH + TOLERANCE);
      expect(await isTruncated(parent.locator('.button-text'))).toBe(true);
    });
  });

  test.describe('a root reset with all: unset in a flex parent', () => {
    test('the root is blockified, so --button-max-width: 100% alone no longer caps it but shrinkable does', async ({
      page
    }) => {
      const tokenBox = await measure(page.getByTestId('shrink-reset-flex-token-button'));
      expect(tokenBox.width).toBeGreaterThan(PARENT_WIDTH + MIN_OVERFLOW);

      const parent = page.getByTestId('shrink-reset-flex-shrinkable');
      const shrinkableBox = await measure(page.getByTestId('shrink-reset-flex-shrinkable-button'));
      expect(shrinkableBox.width).toBeLessThanOrEqual(PARENT_WIDTH + TOLERANCE);
      expect(await isTruncated(parent.locator('.button-text'))).toBe(true);
    });
  });

  test.describe('buttons that do not opt in', () => {
    test('the container and the inner button carry no width rule of their own', async ({
      page
    }) => {
      const parent = page.getByTestId('shrink-parent-flex-off');
      const widthRules = (locator: Locator): Promise<string[]> =>
        locator.evaluate((element) => {
          const style = getComputedStyle(element);
          return [style.minWidth, style.maxWidth];
        });
      expect(await widthRules(parent.locator('.button-container'))).toEqual(['auto', 'none']);
      expect((await widthRules(parent.locator('.button-el')))[1]).toBe('none');
    });

    test('an icon is not given flex-shrink: 0', async ({ page }) => {
      const icon = page.getByTestId('shrink-icon-img-off').locator('.button-icon');
      expect(await icon.evaluate((element) => getComputedStyle(element).flexShrink)).toBe('1');
    });

    test('a consumer class named shrinkable does not opt a button in', async ({ page }) => {
      const container = page.getByTestId('shrink-parent-flex-off').locator('.button-container');
      const widthBefore = (await measure(container)).width;
      await container.evaluate((element) => element.classList.add('shrinkable'));
      expect((await measure(container)).width).toBeCloseTo(widthBefore, 2);
      expect(widthBefore).toBeGreaterThan(PARENT_WIDTH + MIN_OVERFLOW);
    });
  });

  test.describe('a max-width class a consumer puts on the root', () => {
    test('caps a default button but is overridden once the button is shrinkable', async ({
      page
    }) => {
      const defaultBox = await measure(
        page.getByTestId('shrink-root-cap-off').locator('.button-container')
      );
      expect(defaultBox.width).toBeCloseTo(120, 0);

      const shrinkableParent = page.getByTestId('shrink-root-cap-on');
      const shrinkableBox = await measure(shrinkableParent.locator('.button-container'));
      expect(shrinkableBox.width).toBeCloseTo(PARENT_WIDTH, 0);
      expect(await isTruncated(shrinkableParent.locator('.button-text'))).toBe(true);
    });
  });
});

// dist-wc is a self-contained bundle rather than a route of the demo site, so it
// is injected into a same-origin page instead of being navigated to. The
// fixture page is that page. `pnpm run build` (the docs webServer command) runs
// build:wc, so the file exists.
const loadBundle = async (page: Page): Promise<void> => {
  await openFixture(page);
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-button') !== 'undefined', null, {
    timeout: 15_000
  });
};

const WC_LABEL = 'A very long button label that is far wider than the 240px column it is placed in';

// In a custom-element consumer the host, not the inner container, is the flex or
// grid item. The host is `display: block` with an automatic minimum width, so the
// inner container's own rule cannot make the host shrink: only
// :host([shrinkable]) can, which the Svelte cases above never exercise.
const mountButton = async (
  page: Page,
  options: { display: 'flex' | 'block' | 'grid'; shrinkable: 'attribute' | 'property' | 'none' }
): Promise<void> => {
  await page.evaluate(
    ({ display, shrinkable, label, width }) => {
      const parent = document.createElement('div');
      parent.id = 'wc-parent';
      parent.style.cssText = `display:${display};width:${width}px;${
        display === 'grid' ? 'grid-template-columns:1fr;' : ''
      }`;
      const element = document.createElement('sui-button');
      element.id = 'wc-button';
      element.setAttribute('text', label);
      if (shrinkable === 'attribute') {
        element.setAttribute('shrinkable', '');
      }
      parent.append(element);
      document.body.append(parent);
      if (shrinkable === 'property') {
        Object.assign(element, { shrinkable: true });
      }
    },
    { ...options, label: WC_LABEL, width: PARENT_WIDTH }
  );
  await expect(page.locator('#wc-button .button-text')).toBeVisible();
};

// Content in the default slot, with and without the overflow handling the docs
// ask the consumer to give it.
const mountSlotted = async (page: Page, handling: 'managed' | 'unmanaged'): Promise<void> => {
  await page.evaluate(
    ({ handling, label, width }) => {
      const parent = document.createElement('div');
      parent.style.cssText = `display:flex;width:${width}px;margin-bottom:16px;`;
      const element = document.createElement('sui-button');
      element.id = `wc-slotted-button-${handling}`;
      element.setAttribute('shrinkable', '');
      const content = document.createElement('span');
      content.id = `wc-slotted-content-${handling}`;
      content.textContent = label;
      if (handling === 'managed') {
        content.style.cssText = 'min-width:0;overflow:hidden;text-overflow:ellipsis;';
      }
      element.append(content);
      parent.append(element);
      document.body.append(parent);
    },
    { handling, label: WC_LABEL, width: PARENT_WIDTH }
  );
  await expect(page.locator(`#wc-slotted-button-${handling} .button-el`)).toBeVisible();
};

test.describe('sui-button shrinkable', () => {
  for (const display of ['flex', 'block', 'grid'] as const) {
    test(`${display} parent: the shrinkable attribute keeps the host inside the parent`, async ({
      page
    }) => {
      await loadBundle(page);
      await mountButton(page, { display, shrinkable: 'attribute' });

      const hostBox = await measure(page.locator('#wc-button'));
      const containerBox = await measure(page.locator('#wc-button .button-container'));
      expect(hostBox.width).toBeLessThanOrEqual(PARENT_WIDTH + TOLERANCE);
      expect(containerBox.width).toBeLessThanOrEqual(PARENT_WIDTH + TOLERANCE);
      expect(await isTruncated(page.locator('#wc-button .button-text'))).toBe(true);
    });
  }

  for (const display of ['flex', 'grid'] as const) {
    test(`${display} parent: without the attribute the host overflows`, async ({ page }) => {
      await loadBundle(page);
      await mountButton(page, { display, shrinkable: 'none' });

      const hostBox = await measure(page.locator('#wc-button'));
      expect(hostBox.width).toBeGreaterThan(PARENT_WIDTH + MIN_OVERFLOW);
      expect(await isTruncated(page.locator('#wc-button .button-text'))).toBe(false);
    });
  }

  test('assigning the property shrinks the host and clearing it restores the default', async ({
    page
  }) => {
    await loadBundle(page);
    await mountButton(page, { display: 'flex', shrinkable: 'property' });

    const host = page.locator('#wc-button');
    await expect(host).toHaveAttribute('shrinkable', '');
    expect((await measure(host)).width).toBeLessThanOrEqual(PARENT_WIDTH + TOLERANCE);

    await host.evaluate((element) => Object.assign(element, { shrinkable: false }));
    await expect(host).not.toHaveAttribute('shrinkable');
    await expect
      .poll(async () => (await measure(host)).width)
      .toBeGreaterThan(PARENT_WIDTH + MIN_OVERFLOW);
  });

  test('slotted content is not truncated by the prop and has to manage its own overflow', async ({
    page
  }) => {
    await loadBundle(page);
    await mountSlotted(page, 'unmanaged');
    await mountSlotted(page, 'managed');

    const unmanagedHost = await measure(page.locator('#wc-slotted-button-unmanaged'));
    const unmanagedContent = await measure(page.locator('#wc-slotted-content-unmanaged'));
    expect(unmanagedHost.width).toBeLessThanOrEqual(PARENT_WIDTH + TOLERANCE);
    expect(unmanagedContent.width).toBeGreaterThan(unmanagedHost.width + MIN_OVERFLOW);

    const managedHost = await measure(page.locator('#wc-slotted-button-managed'));
    const managedContent = await measure(page.locator('#wc-slotted-content-managed'));
    expect(managedContent.x).toBeGreaterThanOrEqual(managedHost.x - TOLERANCE);
    expect(managedContent.x + managedContent.width).toBeLessThanOrEqual(
      managedHost.x + managedHost.width + TOLERANCE
    );
    expect(await isTruncated(page.locator('#wc-slotted-content-managed'))).toBe(true);
  });
});
