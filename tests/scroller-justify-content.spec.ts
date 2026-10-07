import { expect, test, type Locator, type Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

// A Scroller (and so an AttachmentChipRow, which renders one) could not be right-justified: its
// scroll container is a flex row and nothing on it read a justify-content, so an app reached into
// the library's markup with a :global() rule. The scroll container now reads
// --scroller-justify-content, which an app sets on the Scroller's root class.
//
// Most of the work is making the token inert when unset. A declaration that falls back to
// `normal` would outrank every app rule of lower specificity (`.scroll-container { ... }`, `*`)
// and every rule in an earlier cascade layer, all of which win today because the library
// declares nothing. The declaration therefore sits in an anonymous layer, where every unlayered
// rule of an app beats it, and falls back to `revert-layer`. Each "unset" test below compares the
// component with a hand-written twin (`-ref`) that computes what the base .scroll-container did,
// in the same cascade.
//
// Layout cannot be proved in jsdom, so every claim is a computed style or a box in a real
// browser, on tests/fixtures/scroller-justify-content. The repo's Playwright project runs
// Chromium only; the Firefox and WebKit results were measured by running this same spec through a
// scratch Playwright config, not by CI. `safe flex-end` is skipped in an engine that does not
// implement the `safe` keyword.

// Headless Chromium launches with --hide-scrollbars, which would hide the scrollbar a chip row
// shows while it overflows.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

type Axis = 'horizontal' | 'vertical';

type Probe = {
  justifyContent: string;
  // Leading edge of the first item to the container's leading edge, along the main axis.
  startGap: number;
  // Trailing edge of the last item to the container's trailing edge, along the main axis.
  endGap: number;
  // How far the container can scroll along the main axis: the part of the row a user can reach.
  reachable: number;
  boxWidth: number;
  boxHeight: number;
};

type Engine = {
  supportsSafe: boolean;
};

const HOST_WIDTH = 400;
const ITEM_SIZE = 80;
const ITEM_COUNT = 3;
const FREE_SPACE = HOST_WIDTH - ITEM_SIZE * ITEM_COUNT;
const OVERFLOW_ITEM_COUNT = 8;
const OVERFLOW_SIZE = ITEM_SIZE * OVERFLOW_ITEM_COUNT - HOST_WIDTH;
// A chip is a 72px thumbnail and 4px of padding for the remove button; chips are 8px apart.
const CHIP_SIZE = 76;
const CHIP_GAP = 8;
const CHIP_FREE_SPACE = HOST_WIDTH - (CHIP_SIZE * 2 + CHIP_GAP);
const CHIP_OVERFLOW_SIZE = CHIP_SIZE * 8 + CHIP_GAP * 7 - HOST_WIDTH;
const VERTICAL_HOST = 300;
const VERTICAL_FREE_SPACE = VERTICAL_HOST - ITEM_SIZE * ITEM_COUNT;

const probe = (container: Locator, axis: Axis): Promise<Probe> =>
  container.evaluate((element, direction) => {
    if (!(element instanceof HTMLElement)) {
      throw new Error('the scroll container is not an HTML element');
    }
    // <sui-scroller> renders its items through a slot, which has no box of its own.
    const slot = element.firstElementChild;
    const children =
      slot instanceof HTMLSlotElement
        ? slot.assignedElements({ flatten: true })
        : Array.from(element.children);
    const first = children.at(0);
    const last = children.at(-1);
    if (!first || !last) {
      throw new Error('the scroll container has no items');
    }
    const box = element.getBoundingClientRect();
    const firstBox = first.getBoundingClientRect();
    const lastBox = last.getBoundingClientRect();
    const horizontal = direction === 'horizontal';
    return {
      justifyContent: getComputedStyle(element).getPropertyValue('justify-content'),
      startGap: horizontal ? firstBox.left - box.left : firstBox.top - box.top,
      endGap: horizontal ? box.right - lastBox.right : box.bottom - lastBox.bottom,
      reachable: horizontal
        ? element.scrollWidth - element.clientWidth
        : element.scrollHeight - element.clientHeight,
      boxWidth: box.width,
      boxHeight: box.height
    };
  }, axis);

// The leading edge of the first item at the scroll position that shows the most of it. A row
// justified past its start edge keeps its first item cut off at every position, because a scroll
// container has no scrollable range before its start. WebKit counts that overflow in scrollWidth
// and Chromium and Firefox do not, so the reachable length alone cannot say it.
const bestStartGap = (container: Locator): Promise<number> =>
  container.evaluate((element) => {
    if (!(element instanceof HTMLElement)) {
      throw new Error('the scroll container is not an HTML element');
    }
    const first = element.firstElementChild;
    if (first === null) {
      throw new Error('the scroll container has no items');
    }
    element.style.scrollBehavior = 'auto';
    const gapAt = (offset: number): number => {
      element.scrollLeft = offset;
      return first.getBoundingClientRect().left - element.getBoundingClientRect().left;
    };
    const gaps = [gapAt(0), gapAt(element.scrollWidth)];
    element.scrollLeft = 0;
    return Math.max(...gaps);
  });

const scrollContainer = (page: Page, testId: string): Locator =>
  page.getByTestId(testId).locator('.scroll-container');

const scrollerContainer = (page: Page, name: string): Locator =>
  scrollContainer(page, `jc-${name}-scroller`);

const twin = (page: Page, name: string): Locator => page.getByTestId(`jc-${name}-ref`);

const chipContainer = (page: Page, name: string): Locator =>
  scrollContainer(page, `jc-${name}-row`);

const openFixture = async (page: Page): Promise<Engine> => {
  await page.goto(`${fixtureBaseURL}/scroller-justify-content/`);
  await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
  return page.evaluate(() => ({
    supportsSafe: CSS.supports('justify-content', 'safe flex-end')
  }));
};

// The component and its twin, measured in their own scenario.
const measurePair = async (
  page: Page,
  name: string
): Promise<{ component: Probe; reference: Probe }> => ({
  component: await probe(scrollerContainer(page, name), 'horizontal'),
  reference: await probe(twin(page, name), 'horizontal')
});

// The box must match too: a moved item is not a changed box, but a changed box is a changed layout.
const expectSameAsTwin = ({ component, reference }: { component: Probe; reference: Probe }) => {
  expect(component).toEqual(reference);
};

// Position, in document order, of the app's rule and of the library's token declaration (the rule
// that reads var(--scroller-justify-content, not the fixture rules that set it), as the browser
// loaded them. The earlier-layer case only exists when the app's layer comes first, so a fixture
// that stopped delivering that order would pass for the wrong reason.
const sourceOrder = (page: Page, appSelector: string): Promise<{ app: number; library: number }> =>
  page.evaluate((selector) => {
    let position = 0;
    let app = -1;
    let library = -1;
    const visit = (rules: CSSRuleList) => {
      for (const rule of Array.from(rules)) {
        position += 1;
        if (rule instanceof CSSStyleRule) {
          if (rule.selectorText.includes(selector)) {
            app = position;
          }
          if (rule.cssText.includes('var(--scroller-justify-content')) {
            library = position;
          }
        }
        if ('cssRules' in rule && rule.cssRules instanceof CSSRuleList) {
          visit(rule.cssRules);
        }
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      visit(sheet.cssRules);
    }
    return { app, library };
  }, appSelector);

test.describe('Scroller justify-content token, unset', () => {
  test('a plain scroll container is unchanged', async ({ page }) => {
    await openFixture(page);
    const pair = await measurePair(page, 'plain');
    expectSameAsTwin(pair);
    expect(pair.reference.justifyContent).toBe('normal');
    expect(pair.component.justifyContent).toBe('normal');
    expect(pair.component.boxWidth).toBe(HOST_WIDTH);
    expect(pair.component.startGap).toBe(0);
    expect(pair.component.endGap).toBe(FREE_SPACE);
  });

  test('an app rule on the scroll container with one class of specificity keeps winning', async ({
    page
  }) => {
    await openFixture(page);
    const pair = await measurePair(page, 'low-rule');
    expectSameAsTwin(pair);
    expect(pair.reference.justifyContent).toBe('center');
    expect(pair.component.justifyContent).toBe('center');
    expect(pair.component.startGap).toBe(FREE_SPACE / 2);
  });

  test('a zero-specificity universal rule of the app is not displaced', async ({ page }) => {
    await openFixture(page);
    const pair = await measurePair(page, 'global-reset');
    expectSameAsTwin(pair);
    expect(pair.reference.justifyContent).toBe('space-between');
    expect(pair.component.justifyContent).toBe('space-between');
    expect(pair.component.startGap).toBe(0);
    expect(pair.component.endGap).toBe(0);
  });

  test('a rule of the app in a cascade layer ahead of the library is not displaced', async ({
    page
  }) => {
    await openFixture(page);
    const order = await sourceOrder(page, 'jc-app-layer');
    expect(order.app).toBeGreaterThan(-1);
    expect(order.library).toBeGreaterThan(-1);
    expect(order.app).toBeLessThan(order.library);

    const pair = await measurePair(page, 'app-layer');
    expectSameAsTwin(pair);
    expect(pair.reference.justifyContent).toBe('space-around');
    expect(pair.component.justifyContent).toBe('space-around');
  });

  test('an overflowing row is unchanged and reaches its whole length', async ({ page }) => {
    await openFixture(page);
    const pair = await measurePair(page, 'overflow');
    expectSameAsTwin(pair);
    expect(pair.component.justifyContent).toBe('normal');
    expect(pair.component.startGap).toBe(0);
    expect(pair.component.reachable).toBe(OVERFLOW_SIZE);
  });

  test('an AttachmentChipRow is unchanged', async ({ page }) => {
    await openFixture(page);
    const row = await probe(chipContainer(page, 'chips-plain'), 'horizontal');
    expect(row.justifyContent).toBe('normal');
    expect(row.boxWidth).toBe(HOST_WIDTH);
    expect(row.startGap).toBe(0);
    expect(row.endGap).toBe(CHIP_FREE_SPACE);
  });

  test('an overflowing AttachmentChipRow is unchanged and reaches its whole length', async ({
    page
  }) => {
    await openFixture(page);
    const row = await probe(chipContainer(page, 'chips-overflow'), 'horizontal');
    expect(row.justifyContent).toBe('normal');
    expect(row.startGap).toBe(0);
    expect(row.reachable).toBe(CHIP_OVERFLOW_SIZE);
  });
});

test.describe('Scroller justify-content token, set', () => {
  test('flex-end on the root class right-justifies a short row', async ({ page }) => {
    await openFixture(page);
    const { component, reference } = await measurePair(page, 'end');
    expect(reference.justifyContent).toBe('normal');
    expect(reference.startGap).toBe(0);
    expect(component.justifyContent).toBe('flex-end');
    expect(component.endGap).toBe(0);
    expect(component.startGap).toBe(FREE_SPACE);
    // Only the items move: the scroll container keeps its box.
    expect(component.boxWidth).toBe(reference.boxWidth);
    expect(component.boxHeight).toBe(reference.boxHeight);
  });

  test('any justify-content value passes through', async ({ page }) => {
    await openFixture(page);
    const { component } = await measurePair(page, 'center');
    expect(component.justifyContent).toBe('center');
    expect(component.startGap).toBe(FREE_SPACE / 2);
    expect(component.endGap).toBe(FREE_SPACE / 2);
  });

  test('an app rule with one class of specificity wins over the token', async ({ page }) => {
    await openFixture(page);
    const pair = await measurePair(page, 'end-low-rule');
    expectSameAsTwin(pair);
    expect(pair.component.justifyContent).toBe('center');
  });

  test('a zero-specificity universal rule of the app wins over the token', async ({ page }) => {
    await openFixture(page);
    const pair = await measurePair(page, 'end-global-reset');
    expectSameAsTwin(pair);
    expect(pair.component.justifyContent).toBe('space-between');
  });

  test('a set token wins over a rule of the app that sits in an earlier cascade layer', async ({
    page
  }) => {
    await openFixture(page);
    const { component, reference } = await measurePair(page, 'end-app-layer');
    expect(reference.justifyContent).toBe('space-around');
    expect(component.justifyContent).toBe('flex-end');
    expect(component.endGap).toBe(0);
  });

  test('a vertical scroller aligns along its own main axis', async ({ page }) => {
    await openFixture(page);
    const plain = await probe(scrollerContainer(page, 'vertical'), 'vertical');
    const end = await probe(scrollerContainer(page, 'vertical-end'), 'vertical');
    expect(plain.justifyContent).toBe('normal');
    expect(plain.startGap).toBe(0);
    expect(plain.endGap).toBe(VERTICAL_FREE_SPACE);
    expect(end.justifyContent).toBe('flex-end');
    expect(end.endGap).toBe(0);
    expect(end.startGap).toBe(VERTICAL_FREE_SPACE);
  });
});

test.describe('AttachmentChipRow with the token on its classes', () => {
  test('flex-end right-justifies a short chip row', async ({ page }) => {
    await openFixture(page);
    const plain = await probe(chipContainer(page, 'chips-plain'), 'horizontal');
    const end = await probe(chipContainer(page, 'chips-end'), 'horizontal');
    expect(plain.startGap).toBe(0);
    expect(end.justifyContent).toBe('flex-end');
    expect(end.endGap).toBe(0);
    expect(end.startGap).toBe(CHIP_FREE_SPACE);
    expect(end.boxWidth).toBe(plain.boxWidth);
  });
});

// A flex container that justifies to the end cannot scroll back to its start: the overflow goes
// out of the start edge, where a scroll container has no scrollable range. The docs say so and
// recommend `safe flex-end`, which falls back to the start edge once the row overflows.
test.describe('an overflowing row justified to the end', () => {
  test('plain flex-end leaves the start of a Scroller row unreachable', async ({ page }) => {
    await openFixture(page);
    const container = scrollerContainer(page, 'overflow-end');
    const row = await probe(container, 'horizontal');
    expect(row.justifyContent).toBe('flex-end');
    expect(row.endGap).toBe(0);
    expect(row.startGap).toBe(-OVERFLOW_SIZE);
    expect(await bestStartGap(container)).toBe(-OVERFLOW_SIZE);
  });

  test('safe flex-end keeps the whole Scroller row reachable', async ({ page }) => {
    const engine = await openFixture(page);
    test.skip(!engine.supportsSafe, 'this engine does not implement the safe keyword');
    const row = await probe(scrollerContainer(page, 'overflow-safe-end'), 'horizontal');
    expect(row.justifyContent).toBe('safe flex-end');
    expect(row.startGap).toBe(0);
    expect(row.reachable).toBe(OVERFLOW_SIZE);
  });

  test('plain flex-end leaves the first chips of an overflowing chip row unreachable', async ({
    page
  }) => {
    await openFixture(page);
    const container = chipContainer(page, 'chips-overflow-end');
    const row = await probe(container, 'horizontal');
    expect(row.justifyContent).toBe('flex-end');
    expect(row.startGap).toBe(-CHIP_OVERFLOW_SIZE);
    expect(await bestStartGap(container)).toBe(-CHIP_OVERFLOW_SIZE);
  });

  test('safe flex-end keeps every chip of an overflowing row reachable', async ({ page }) => {
    const engine = await openFixture(page);
    test.skip(!engine.supportsSafe, 'this engine does not implement the safe keyword');
    const row = await probe(chipContainer(page, 'chips-overflow-safe-end'), 'horizontal');
    expect(row.justifyContent).toBe('safe flex-end');
    expect(row.startGap).toBe(0);
    expect(row.reachable).toBe(CHIP_OVERFLOW_SIZE);
  });
});

// dist-wc is a self-contained bundle rather than a route of the demo site, so it is injected
// into a same-origin page. `pnpm run build` (the docs webServer command) runs build:wc, so the
// file exists. The token is a custom property, which is inherited across a shadow root, so it
// must reach the scroll container inside the element when set on the host element.
const loadWebComponents = async (page: Page): Promise<void> => {
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(
    () =>
      typeof customElements.get('sui-scroller') !== 'undefined' &&
      typeof customElements.get('sui-attachment-chip-row') !== 'undefined',
    null,
    { timeout: 15_000 }
  );
};

test.describe('web components with the token on the host element', () => {
  test('sui-scroller', async ({ page }) => {
    await openFixture(page);
    await loadWebComponents(page);
    await page.evaluate((hostWidth) => {
      for (const [id, hostStyle] of [
        ['wc-scroller-end', '--scroller-justify-content: flex-end;'],
        ['wc-scroller-plain', '']
      ] as const) {
        const parent = document.createElement('div');
        parent.style.cssText = `width:${hostWidth}px`;
        const element = document.createElement('sui-scroller');
        element.id = id;
        element.style.cssText = hostStyle;
        Object.assign(element, { showArrows: false, showGradient: false });
        for (let count = 0; count < 3; count += 1) {
          const item = document.createElement('div');
          item.style.cssText = 'flex:0 0 80px;height:20px;background:#ccc';
          element.append(item);
        }
        parent.append(element);
        document.body.append(parent);
      }
    }, HOST_WIDTH);
    const plain = await probe(page.locator('#wc-scroller-plain .scroll-container'), 'horizontal');
    const end = await probe(page.locator('#wc-scroller-end .scroll-container'), 'horizontal');
    expect(plain.justifyContent).toBe('normal');
    expect(plain.startGap).toBe(0);
    expect(end.justifyContent).toBe('flex-end');
    expect(end.endGap).toBe(0);
    expect(end.startGap).toBe(FREE_SPACE);
  });

  test('sui-attachment-chip-row', async ({ page }) => {
    await openFixture(page);
    await loadWebComponents(page);
    await page.evaluate((hostWidth) => {
      for (const [id, hostStyle] of [
        ['wc-chips-end', '--scroller-justify-content: flex-end;'],
        ['wc-chips-plain', '']
      ] as const) {
        const parent = document.createElement('div');
        parent.style.cssText = `width:${hostWidth}px`;
        const element = document.createElement('sui-attachment-chip-row');
        element.id = id;
        element.style.cssText = hostStyle;
        Object.assign(element, {
          images: [0, 1].map((index) => ({
            id: `image-${index}`,
            thumbnailData:
              'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
          }))
        });
        parent.append(element);
        document.body.append(parent);
      }
    }, HOST_WIDTH);
    const plain = await probe(page.locator('#wc-chips-plain .scroll-container'), 'horizontal');
    const end = await probe(page.locator('#wc-chips-end .scroll-container'), 'horizontal');
    expect(plain.justifyContent).toBe('normal');
    expect(plain.startGap).toBe(0);
    expect(end.justifyContent).toBe('flex-end');
    expect(end.endGap).toBe(0);
    expect(end.startGap).toBe(CHIP_FREE_SPACE);
  });
});
