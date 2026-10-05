import { expect, test, type Locator, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// ListItem gained no props for narrow rows -- only three CSS variables. These tests pin both
// halves of that contract: an unconfigured item is untouched, and the tokens do the work. The
// fixtures live in the "Narrow fit" section of the /components/list-item demo; every geometry
// assertion runs in a real browser because jsdom does no layout.
//
// Each fixture sits in a frame whose width this spec sets, so "at 320 wide" means the row is
// 320px wide, not that the window is.
const FRAME_WIDTHS = [320, 375, 767] as const;
const LABEL_FLOOR = 72;
const EDGE_TOLERANCE = 0.5;
const CELL_NAMES = ['left-content', 'center-content', 'right-content'];

type Rect = { left: number; right: number; top: number; bottom: number; width: number };

const rectOf = (locator: Locator): Promise<Rect> =>
  locator.evaluate((element) => {
    const { left, right, top, bottom, width } = element.getBoundingClientRect();
    return { left, right, top, bottom, width };
  });

const setFrameWidth = (page: Page, width: number): Promise<void> =>
  page.getByTestId('list-item-fit-frame').evaluate((frame, frameWidth) => {
    frame.style.setProperty('--fit-frame-width', `${frameWidth}px`);
  }, width);

const fixtureCells = (page: Page, fixtureId: string) => {
  const topSection = page.getByTestId(`${fixtureId}-top`);
  return {
    topSection,
    left: topSection.locator('.left-content'),
    center: topSection.locator('.center-content'),
    right: topSection.locator('.right-content')
  };
};

test.describe('ListItem narrow-fit tokens', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, '/components/list-item');
  });

  test('with no tokens set every cell keeps the value it had before the tokens existed', async ({
    page
  }) => {
    const unconfiguredRows = [
      page.locator('.demo-row').first().locator('.top-section').first(),
      page.getByTestId('list-item-fit-default-top')
    ];

    for (const topSection of unconfiguredRows) {
      await expect(topSection).toHaveCSS('flex-direction', 'row');

      const center = topSection.locator('.center-content');
      await expect(center).toHaveCSS('min-width', '0px');
      await expect(center).toHaveCSS('flex', '1 1 0%');

      const right = topSection.locator('.right-content');
      await expect(right).toHaveCSS('min-width', 'auto');
      await expect(right).toHaveCSS('max-width', 'none');
    }
  });

  test('without tokens a long value overflows the row and squeezes the label (the defect)', async ({
    page
  }) => {
    await setFrameWidth(page, 320);
    const { topSection, center, right } = fixtureCells(page, 'list-item-fit-default');

    const topRect = await rectOf(topSection);
    const rightRect = await rectOf(right);
    const centerRect = await rectOf(center);

    // If either stops holding, the fixture no longer measures the problem and every "fit"
    // assertion below would pass for the wrong reason.
    expect(rightRect.right).toBeGreaterThan(topRect.right + 1);
    expect(centerRect.width).toBeLessThan(LABEL_FLOOR);
  });

  for (const width of [320, 375]) {
    test(`at ${width} wide the label floor and shrinkable right cell keep a long value inside the row`, async ({
      page
    }) => {
      await setFrameWidth(page, width);
      const { topSection, center, right } = fixtureCells(page, 'list-item-fit-row');
      const label = center.locator('.center-text');
      const value = page.getByTestId('list-item-fit-row').locator('.fit-value');

      const topRect = await rectOf(topSection);
      const centerRect = await rectOf(center);
      const rightRect = await rectOf(right);
      const labelRect = await rectOf(label);

      expect(centerRect.width).toBeGreaterThanOrEqual(LABEL_FLOOR - EDGE_TOLERANCE);
      expect(labelRect.right).toBeLessThanOrEqual(centerRect.right + EDGE_TOLERANCE);
      expect(rightRect.right).toBeLessThanOrEqual(topRect.right + EDGE_TOLERANCE);
      expect(await label.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
        true
      );
      expect(await value.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
        true
      );
    });
  }

  for (const width of [320, 375]) {
    test(`at ${width} wide a short value still sits flush right because the center cell keeps growing`, async ({
      page
    }) => {
      await setFrameWidth(page, width);
      const { topSection, center, right } = fixtureCells(page, 'list-item-fit-row-short');

      const topRect = await rectOf(topSection);
      const centerRect = await rectOf(center);
      const rightRect = await rectOf(right);

      expect(centerRect.width).toBeGreaterThan(LABEL_FLOOR + 1);
      expect(Math.abs(rightRect.right - topRect.right)).toBeLessThanOrEqual(EDGE_TOLERANCE);
    });
  }

  for (const width of FRAME_WIDTHS) {
    test(`at ${width} wide the cells stack in DOM order at the full row width`, async ({
      page
    }) => {
      await setFrameWidth(page, width);
      const fixture = page.getByTestId('list-item-fit-stack');
      const { topSection, left, center, right } = fixtureCells(page, 'list-item-fit-stack');

      await expect(topSection).toHaveCSS('flex-direction', 'column');

      const topRect = await rectOf(topSection);
      const leftRect = await rectOf(left);
      const centerRect = await rectOf(center);
      const rightRect = await rectOf(right);
      const gap = Number.parseFloat(
        await topSection.evaluate((element) => getComputedStyle(element).rowGap)
      );

      for (const cellRect of [leftRect, centerRect, rightRect]) {
        expect(Math.abs(cellRect.width - topRect.width)).toBeLessThanOrEqual(EDGE_TOLERANCE);
        expect(Math.abs(cellRect.left - topRect.left)).toBeLessThanOrEqual(EDGE_TOLERANCE);
      }

      expect(gap).toBe(16);
      expect(centerRect.top).toBeGreaterThan(leftRect.top);
      expect(rightRect.top).toBeGreaterThan(centerRect.top);
      expect(Math.abs(centerRect.top - leftRect.bottom - gap)).toBeLessThanOrEqual(EDGE_TOLERANCE);
      expect(Math.abs(rightRect.top - centerRect.bottom - gap)).toBeLessThanOrEqual(EDGE_TOLERANCE);

      const domOrder = await topSection.evaluate(
        (element, cellNames) =>
          Array.from(element.children).map((cell) =>
            cellNames.find((name) => cell.classList.contains(name))
          ),
        CELL_NAMES
      );
      expect(domOrder).toEqual(CELL_NAMES);

      expect(await fixture.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
        true
      );
    });
  }

  test('an expanded accordion stays below the stacked top row at the item width', async ({
    page
  }) => {
    await setFrameWidth(page, 375);
    const { topSection } = fixtureCells(page, 'list-item-fit-stack-accordion');
    const fixture = page.getByTestId('list-item-fit-stack-accordion');
    const body = page.getByTestId('list-item-fit-stack-accordion-body');

    await expect(topSection).toHaveCSS('flex-direction', 'column');
    await expect.poll(async () => (await rectOf(body)).width).toBeGreaterThan(0);

    const topRect = await rectOf(topSection);
    const bottomRect = await rectOf(fixture.locator('.bottom-section'));
    const bodyRect = await rectOf(body);

    expect(bodyRect.top).toBeGreaterThanOrEqual(topRect.bottom - EDGE_TOLERANCE);
    expect(bottomRect.top).toBeGreaterThanOrEqual(topRect.bottom - EDGE_TOLERANCE);
    expect(Math.abs(bottomRect.width - topRect.width)).toBeLessThanOrEqual(EDGE_TOLERANCE);
    expect(Math.abs(bottomRect.left - topRect.left)).toBeLessThanOrEqual(EDGE_TOLERANCE);
  });

  test('the loading overlay and spinner are unaffected by stacking', async ({ page }) => {
    await setFrameWidth(page, 375);
    const fixture = page.getByTestId('list-item-fit-stack-loading');
    const { topSection, right } = fixtureCells(page, 'list-item-fit-stack-loading');
    const loader = fixture.locator('.item-loader');

    await expect(topSection).toHaveCSS('flex-direction', 'column');
    // The fill runs for 8s by default, so end it rather than wait it out; the overlay then rests
    // at the item size.
    await loader.evaluate((element) => {
      element.getAnimations().forEach((animation) => animation.finish());
    });
    await expect.poll(() => loader.evaluate((element) => element.getAnimations().length)).toBe(0);

    const containerRect = await rectOf(fixture.locator('.item-container'));
    const loaderRect = await rectOf(loader);
    const rightRect = await rectOf(right);
    const spinnerRect = await rectOf(right.locator('.right-content-loader'));

    expect(Math.abs(loaderRect.width - containerRect.width)).toBeLessThanOrEqual(EDGE_TOLERANCE);
    expect(Math.abs(loaderRect.top - containerRect.top)).toBeLessThanOrEqual(EDGE_TOLERANCE);
    expect(Math.abs(loaderRect.bottom - containerRect.bottom)).toBeLessThanOrEqual(EDGE_TOLERANCE);
    expect(spinnerRect.top).toBeGreaterThanOrEqual(rightRect.top - EDGE_TOLERANCE);
    expect(spinnerRect.bottom).toBeLessThanOrEqual(rightRect.bottom + EDGE_TOLERANCE);
  });

  test('a stack with only left and right content still spends one gap on the empty center cell', async ({
    page
  }) => {
    await setFrameWidth(page, 375);
    const { topSection, left, center, right } = fixtureCells(page, 'list-item-fit-stack-empty');

    const gap = Number.parseFloat(
      await topSection.evaluate((element) => getComputedStyle(element).rowGap)
    );
    const leftRect = await rectOf(left);
    const centerRect = await rectOf(center);
    const rightRect = await rectOf(right);

    expect(centerRect.bottom - centerRect.top).toBe(0);
    expect(Math.abs(rightRect.top - leftRect.bottom - 2 * gap)).toBeLessThanOrEqual(EDGE_TOLERANCE);
  });

  test('a nested item inherits the tokens and a per-instance reset opts it out', async ({
    page
  }) => {
    await setFrameWidth(page, 375);

    await expect(page.getByTestId('list-item-fit-stack-nested-outer-top')).toHaveCSS(
      'flex-direction',
      'column'
    );
    await expect(page.getByTestId('list-item-fit-stack-nested-inherit-top')).toHaveCSS(
      'flex-direction',
      'column'
    );
    await expect(page.getByTestId('list-item-fit-stack-nested-reset-top')).toHaveCSS(
      'flex-direction',
      'row'
    );
  });
});

test.describe('ListItem narrow-fit tokens on the web component', () => {
  test('tokens set on the sui-list-item host reach the cells inside its shadow root', async ({
    page
  }) => {
    await gotoHydrated(page, '/');
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => typeof customElements.get('sui-list-item') !== 'undefined');

    await page.evaluate(() => {
      const build = (id: string, styleText: string): void => {
        const item = document.createElement('sui-list-item');
        item.id = id;
        item.setAttribute('label', 'Email ID');
        item.setAttribute('style', styleText);
        item.innerHTML =
          '<span slot="left-content" style="display:block;width:24px;height:24px"></span>' +
          '<span slot="right-content">Verified</span>';
        document.body.append(item);
      };
      build('wc-item-plain', 'display:block;width:320px');
      build(
        'wc-item-stacked',
        'display:block;width:320px;' +
          '--list-item-top-section-flex-direction:column;' +
          '--list-item-top-section-align-items:stretch;' +
          '--list-item-top-section-gap:16px;' +
          '--list-item-center-content-min-width:72px;' +
          '--list-item-right-content-min-width:0'
      );
    });
    await page.waitForFunction(() =>
      ['wc-item-plain', 'wc-item-stacked'].every(
        (id) => document.getElementById(id)?.shadowRoot?.querySelector('.top-section') !== null
      )
    );

    const measure = (id: string) =>
      page.evaluate((itemId) => {
        const root = document.getElementById(itemId)?.shadowRoot;
        const topSection = root?.querySelector('.top-section');
        const left = root?.querySelector('.left-content');
        const center = root?.querySelector('.center-content');
        const right = root?.querySelector('.right-content');
        if (!topSection || !left || !center || !right) {
          throw new Error(`cells missing inside ${itemId}`);
        }
        return {
          direction: getComputedStyle(topSection).flexDirection,
          centerMinWidth: getComputedStyle(center).minWidth,
          rightMinWidth: getComputedStyle(right).minWidth,
          leftBottom: left.getBoundingClientRect().bottom,
          centerTop: center.getBoundingClientRect().top,
          centerBottom: center.getBoundingClientRect().bottom,
          rightTop: right.getBoundingClientRect().top
        };
      }, id);

    const plain = await measure('wc-item-plain');
    expect(plain.direction).toBe('row');
    expect(plain.centerMinWidth).toBe('0px');
    expect(plain.rightMinWidth).toBe('auto');

    const stacked = await measure('wc-item-stacked');
    expect(stacked.direction).toBe('column');
    expect(stacked.centerMinWidth).toBe('72px');
    expect(stacked.rightMinWidth).toBe('0px');
    expect(stacked.centerTop).toBeGreaterThan(stacked.leftBottom);
    expect(stacked.rightTop).toBeGreaterThan(stacked.centerBottom);
    expect(Math.abs(stacked.centerTop - stacked.leftBottom - 16)).toBeLessThanOrEqual(
      EDGE_TOLERANCE
    );
  });
});
