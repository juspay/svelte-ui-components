import { expect, test, type Locator, type Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

// ChatMessageList lets an app hide the list's own scrollbar (`hideScrollbar`) and set
// its overflow-x and overscroll-behavior (`--chat-message-list-overflow-x`,
// `--chat-message-list-overscroll-behavior`). Scrollbars, overflow and wheel chaining
// cannot be proved in jsdom, so every claim here is a computed style, a box or a scroll
// offset in a real browser, on the tests/fixtures/chat-message-list-scroll page.
//
// Two things hold the tokens and the prop to account:
//   - Unset is the old list. `base` and `hide-false` pass nothing, `default` renders the
//     bubbles an app gets out of the box, and each is pinned to the values the list had
//     before these hooks existed (computed overflow and overscroll, exact boxes).
//   - The declarations carry no specificity. `consumer-rule` is a one-class rule of an
//     app's own; if the library's overflow-x or overscroll-behavior were written without
//     :where(), the scoped rule (two classes) would beat it and these tests fail.
//   - An unset token hands the property back. The declarations are unlayered, and an
//     unlayered declaration beats any rule inside a cascade @layer whatever its
//     specificity, so a fixed fallback (`visible`, `auto`) would override a layered rule
//     of an app's own that wins on the old list. `layered-rule` is that rule; the
//     fallback is `revert-layer`, and these tests fail with a fixed one.
//
// Headless Chromium hides scrollbars unless told otherwise, which leaves nothing to
// measure, so the file turns that default off. The Playwright project runs Chromium only,
// so CI only ever runs this file there. The Firefox and WebKit results were measured by
// running this same file through a scratch Playwright config. What they can and cannot
// show differs by engine, and the tests that depend on it say so:
//   - Playwright's Firefox hides every scrollbar itself, so `scrollbar-width` computes to
//     `none` on every element there and the scrollbar tests are skipped in it. In it a
//     synthetic wheel at the end of a list scrolls the container behind it whatever
//     `overscroll-behavior` says (measured on this fixture: the container moved the same
//     100px under `none` and `contain` as when unset), so the three chaining tests are
//     skipped there; the computed values are still checked.
//   - WebKit paints overlay scrollbars that take no layout space, so the geometry tests
//     are skipped in it; its computed `scrollbar-width` and `::-webkit-scrollbar` are not.
test.use({
  viewport: { width: 1280, height: 1000 },
  launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] }
});

const LIST_WIDTH = 280;
const LIST_HEIGHT = 140;
// 1.5rem and 0.75rem, the list's own padding.
const PADDING_X = 24;
const ROW_WIDTH = 460;
const ROW_HEIGHT = 36;
// The padding plus the widest row, and ten rows with a 1rem gap between them.
const SCROLL_WIDTH = 484;
const SCROLL_HEIGHT = 528;

type Box = { x: number; y: number; width: number; height: number };

type ListState = {
  classes: string[];
  overflowX: string;
  overflowY: string;
  overscrollX: string;
  overscrollY: string;
  scrollbarWidth: string;
  scrollbarPseudoDisplay: string;
  offsetWidth: number;
  clientWidth: number;
  offsetHeight: number;
  clientHeight: number;
  scrollWidth: number;
  scrollHeight: number;
};

type Layout = { list: Box; inner: Box; firstRow: Box };

const measure = async (locator: Locator): Promise<Box> => {
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error('boundingBox is null');
  }
  return box;
};

const openFixture = async (page: Page): Promise<void> => {
  await page.goto(`${fixtureBaseURL}/chat-message-list-scroll/`);
  await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
};

const listOf = (page: Page, scenario: string): Locator => page.getByTestId(`cml-${scenario}-list`);

const readState = (list: Locator): Promise<ListState> =>
  list.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      // The scope class carries a hash that changes whenever the stylesheet does.
      classes: Array.from(element.classList).filter((name) => !name.startsWith('svelte-')),
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      overscrollX: style.overscrollBehaviorX,
      overscrollY: style.overscrollBehaviorY,
      scrollbarWidth: style.scrollbarWidth,
      scrollbarPseudoDisplay: getComputedStyle(element, '::-webkit-scrollbar').display,
      offsetWidth: (element as HTMLElement).offsetWidth,
      clientWidth: element.clientWidth,
      offsetHeight: (element as HTMLElement).offsetHeight,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight
    };
  });

// Boxes relative to the list's own corner, so two lists in different places compare equal.
const readLayout = async (list: Locator): Promise<Layout> => {
  const listBox = await measure(list);
  const relativeTo = (box: Box): Box => ({
    x: box.x - listBox.x,
    y: box.y - listBox.y,
    width: box.width,
    height: box.height
  });
  const inner = await measure(list.locator('.inner'));
  const firstRow = await measure(list.locator('.inner > *').first());
  return {
    list: relativeTo(listBox),
    inner: relativeTo(inner),
    firstRow: relativeTo(firstRow)
  };
};

// What a scrollbar takes out of the box. Zero for an overlay scrollbar.
const scrollbarsOf = (state: ListState): { vertical: number; horizontal: number } => ({
  vertical: state.offsetWidth - state.clientWidth,
  horizontal: state.offsetHeight - state.clientHeight
});

const paintsClassicScrollbars = (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:absolute;width:100px;height:100px;overflow:scroll;visibility:hidden';
    document.body.append(probe);
    const thickness = probe.offsetWidth - probe.clientWidth;
    probe.remove();
    return thickness > 0;
  });

const wheelOver = async (
  page: Page,
  locator: Locator,
  deltaX: number,
  deltaY: number
): Promise<void> => {
  const box = await measure(locator);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(deltaX, deltaY);
};

// A negative result has no event to wait for, so it waits for a scroll that would have
// finished by now. The positive twin of every such test polls instead.
const SETTLE_MS = 600;

const scrollLeftOf = (list: Locator): Promise<number> =>
  list.evaluate((element) => element.scrollLeft);
const scrollTopOf = (list: Locator): Promise<number> =>
  list.evaluate((element) => element.scrollTop);

test.describe('unset', () => {
  test('a list given neither the prop nor a token is the list it was before them', async ({
    page
  }) => {
    await openFixture(page);
    const list = listOf(page, 'base');
    const state = await readState(list);

    expect(state.classes).toEqual(['chat-message-list']);
    // overflow-x is never declared; `visible` computes to `auto` beside `overflow-y: auto`.
    expect([state.overflowX, state.overflowY]).toEqual(['auto', 'auto']);
    expect([state.overscrollX, state.overscrollY]).toEqual(['auto', 'auto']);
    expect([state.scrollWidth, state.scrollHeight]).toEqual([SCROLL_WIDTH, SCROLL_HEIGHT]);

    const layout = await readLayout(list);
    expect(layout.list).toMatchObject({ x: 0, y: 0, width: LIST_WIDTH, height: LIST_HEIGHT });
    expect(layout.inner.width).toBe(state.clientWidth - 2 * PADDING_X);
    expect(layout.firstRow).toMatchObject({ width: ROW_WIDTH, height: ROW_HEIGHT });
  });

  test('hideScrollbar={false} measures exactly like passing nothing', async ({ page }) => {
    await openFixture(page);
    const base = listOf(page, 'base');
    const explicit = listOf(page, 'hide-false');

    expect(await readState(explicit)).toEqual(await readState(base));
    expect(await readLayout(explicit)).toEqual(await readLayout(base));
  });

  test('the default rendering keeps its overflow, overscroll and box', async ({ page }) => {
    await openFixture(page);
    const base = await readState(listOf(page, 'base'));
    const plain = await readState(listOf(page, 'default'));

    expect(plain.classes).toEqual(['chat-message-list']);
    expect([plain.overflowX, plain.overflowY]).toEqual([base.overflowX, base.overflowY]);
    expect([plain.overscrollX, plain.overscrollY]).toEqual([base.overscrollX, base.overscrollY]);
    expect(await readLayout(listOf(page, 'default'))).toMatchObject({
      list: { width: LIST_WIDTH, height: LIST_HEIGHT }
    });
  });
});

test.describe('hideScrollbar', () => {
  test('marks the list without touching its overflow', async ({ page }) => {
    await openFixture(page);
    const base = await readState(listOf(page, 'base'));
    const hidden = await readState(listOf(page, 'hide'));

    expect(hidden.classes).toEqual(['chat-message-list', 'hide-scrollbar']);
    expect([hidden.overflowX, hidden.overflowY]).toEqual([base.overflowX, base.overflowY]);
    expect([hidden.overscrollX, hidden.overscrollY]).toEqual([base.overscrollX, base.overscrollY]);
  });

  test('turns scrollbar-width off and hides the WebKit scrollbar', async ({
    page,
    browserName
  }) => {
    test.skip(
      browserName === 'firefox',
      "Playwright's Firefox hides every scrollbar, so scrollbar-width computes to none on every list"
    );
    await openFixture(page);
    const base = await readState(listOf(page, 'base'));
    const hidden = await readState(listOf(page, 'hide'));

    expect(base.scrollbarWidth).toBe('auto');
    expect(base.scrollbarPseudoDisplay).not.toBe('none');
    expect(hidden.scrollbarWidth).toBe('none');
    expect(hidden.scrollbarPseudoDisplay).toBe('none');
  });

  test('gives the scrollbar back to the layout', async ({ page, browserName }) => {
    await openFixture(page);
    const classic = await paintsClassicScrollbars(page);
    if (browserName === 'chromium') {
      // Without this the geometry below would skip itself and read as a pass.
      expect(classic).toBe(true);
    }
    test.skip(!classic, 'This engine paints overlay scrollbars, which take no layout space');

    const base = await readState(listOf(page, 'base'));
    const hidden = await readState(listOf(page, 'hide'));
    const baseBars = scrollbarsOf(base);
    expect(baseBars.vertical).toBeGreaterThan(0);
    expect(baseBars.horizontal).toBeGreaterThan(0);
    expect(scrollbarsOf(hidden)).toEqual({ vertical: 0, horizontal: 0 });

    const baseLayout = await readLayout(listOf(page, 'base'));
    const hiddenLayout = await readLayout(listOf(page, 'hide'));
    expect(hiddenLayout.inner.width - baseLayout.inner.width).toBe(baseBars.vertical);
  });

  test('keeps the list scrollable in both directions', async ({ page }) => {
    await openFixture(page);
    const list = listOf(page, 'hide');
    const state = await readState(list);
    expect(state.scrollHeight).toBeGreaterThan(state.clientHeight);
    expect(state.scrollWidth).toBeGreaterThan(state.clientWidth);

    await wheelOver(page, list, 0, 100);
    await expect.poll(() => scrollTopOf(list)).toBeGreaterThan(0);
    await wheelOver(page, list, 80, 0);
    await expect.poll(() => scrollLeftOf(list)).toBeGreaterThan(0);
  });
});

test.describe('--chat-message-list-overflow-x', () => {
  test('sets overflow-x and leaves overflow-y alone', async ({ page }) => {
    await openFixture(page);
    const hidden = await readState(listOf(page, 'x-hidden'));
    const auto = await readState(listOf(page, 'x-auto'));
    const base = await readState(listOf(page, 'base'));

    expect([hidden.overflowX, hidden.overflowY]).toEqual(['hidden', 'auto']);
    expect([auto.overflowX, auto.overflowY]).toEqual(['auto', 'auto']);
    expect(auto).toEqual(base);
    // Clipping hides the sideways overflow; it does not make the content narrower.
    expect(hidden.scrollWidth).toBe(SCROLL_WIDTH);
    expect(hidden.scrollWidth).toBeGreaterThan(hidden.clientWidth);
  });

  test('takes the horizontal scrollbar out of the layout and keeps the vertical one', async ({
    page,
    browserName
  }) => {
    await openFixture(page);
    const classic = await paintsClassicScrollbars(page);
    if (browserName === 'chromium') {
      expect(classic).toBe(true);
    }
    test.skip(!classic, 'This engine paints overlay scrollbars, which take no layout space');

    const baseBars = scrollbarsOf(await readState(listOf(page, 'base')));
    const hiddenBars = scrollbarsOf(await readState(listOf(page, 'x-hidden')));
    expect(baseBars.horizontal).toBeGreaterThan(0);
    expect(hiddenBars).toEqual({ vertical: baseBars.vertical, horizontal: 0 });
  });

  test('stops a sideways wheel from scrolling the list', async ({ page }) => {
    await openFixture(page);
    const list = listOf(page, 'x-hidden');
    await wheelOver(page, list, 80, 0);
    await page.waitForTimeout(SETTLE_MS);
    expect(await scrollLeftOf(list)).toBe(0);
  });

  test('lets a sideways wheel scroll the list when it is unset or auto', async ({ page }) => {
    await openFixture(page);
    for (const scenario of ['base', 'x-auto']) {
      const list = listOf(page, scenario);
      await wheelOver(page, list, 80, 0);
      await expect.poll(() => scrollLeftOf(list)).toBeGreaterThan(0);
    }
  });
});

test.describe('--chat-message-list-overscroll-behavior', () => {
  test('sets overscroll-behavior on both axes and leaves the overflow alone', async ({ page }) => {
    await openFixture(page);
    const base = await readState(listOf(page, 'base'));
    const none = await readState(listOf(page, 'overscroll-none'));
    const contain = await readState(listOf(page, 'overscroll-contain'));

    expect([none.overscrollX, none.overscrollY]).toEqual(['none', 'none']);
    expect([contain.overscrollX, contain.overscrollY]).toEqual(['contain', 'contain']);
    for (const state of [none, contain]) {
      expect([state.overflowX, state.overflowY]).toEqual([base.overflowX, base.overflowY]);
    }
  });

  // The list sits in a scrolling container and is already at its end, which is when
  // the browser decides whether the next wheel scroll moves the container instead.
  const scrollListToEnd = async (page: Page, scenario: string): Promise<Locator> => {
    const list = listOf(page, scenario);
    await list.evaluate((element) =>
      element.scrollTo({ top: element.scrollHeight, behavior: 'instant' })
    );
    await expect
      .poll(() =>
        list.evaluate((element) => element.scrollHeight - element.clientHeight - element.scrollTop)
      )
      .toBe(0);
    return list;
  };

  const chainedScrollOf = (page: Page, scenario: string): Promise<number> =>
    page.getByTestId(`cml-${scenario}-outer`).evaluate((element) => element.scrollTop);

  test('chains a wheel scroll at the end of the list outward when it is unset', async ({
    page,
    browserName
  }) => {
    test.skip(
      browserName === 'firefox',
      "A synthetic wheel in Playwright's Firefox chains whatever overscroll-behavior says"
    );
    await openFixture(page);
    const list = await scrollListToEnd(page, 'chain-base');
    await wheelOver(page, list, 0, 100);
    await expect.poll(() => chainedScrollOf(page, 'chain-base')).toBeGreaterThan(0);
  });

  for (const value of ['none', 'contain']) {
    test(`stops a wheel scroll at the end of the list when it is ${value}`, async ({
      page,
      browserName
    }) => {
      test.skip(
        browserName === 'firefox',
        "A synthetic wheel in Playwright's Firefox chains whatever overscroll-behavior says"
      );
      await openFixture(page);
      const list = await scrollListToEnd(page, `chain-${value}`);
      await wheelOver(page, list, 0, 100);
      await page.waitForTimeout(SETTLE_MS);
      expect(await chainedScrollOf(page, `chain-${value}`)).toBe(0);
    });
  }
});

test.describe("a rule of the app's own", () => {
  test("beats the tokens' declarations, set or not", async ({ page }) => {
    await openFixture(page);
    const unset = await readState(listOf(page, 'consumer-rule'));
    const tokenSet = await readState(listOf(page, 'consumer-rule-token'));

    expect([unset.overflowX, unset.overflowY]).toEqual(['hidden', 'auto']);
    expect([unset.overscrollX, unset.overscrollY]).toEqual(['none', 'none']);
    expect(tokenSet).toEqual(unset);
    expect(await readLayout(listOf(page, 'consumer-rule-token'))).toEqual(
      await readLayout(listOf(page, 'consumer-rule'))
    );
  });

  test('leaves overflow-x visible when the app makes overflow-y visible', async ({ page }) => {
    await openFixture(page);
    const state = await readState(listOf(page, 'consumer-y-visible'));

    // overflow-x is never declared, so it is `visible`; beside a `visible` overflow-y that stays
    // `visible` rather than computing to `auto`, which is what a fallback of `auto` would give.
    expect([state.overflowX, state.overflowY]).toEqual(['visible', 'visible']);
    expect(state.offsetWidth).toBe(state.clientWidth);
    expect(state.offsetHeight).toBe(state.clientHeight);
  });

  test('keeps its horizontal scrollbar out of the layout', async ({ page, browserName }) => {
    await openFixture(page);
    const classic = await paintsClassicScrollbars(page);
    if (browserName === 'chromium') {
      expect(classic).toBe(true);
    }
    test.skip(!classic, 'This engine paints overlay scrollbars, which take no layout space');

    const bars = scrollbarsOf(await readState(listOf(page, 'consumer-rule')));
    const baseBars = scrollbarsOf(await readState(listOf(page, 'base')));
    expect(bars).toEqual({ vertical: baseBars.vertical, horizontal: 0 });
  });

  test('keeps a sideways wheel from scrolling the list', async ({ page }) => {
    await openFixture(page);
    const list = listOf(page, 'consumer-rule');
    await wheelOver(page, list, 80, 0);
    await page.waitForTimeout(SETTLE_MS);
    expect(await scrollLeftOf(list)).toBe(0);
  });
});

test.describe("a rule of the app's own inside a cascade layer", () => {
  test('wins over the list with the tokens unset, as it does over the old list', async ({
    page
  }) => {
    await openFixture(page);
    const layered = await readState(listOf(page, 'layered-rule'));
    const unlayered = await readState(listOf(page, 'consumer-rule'));

    expect(layered.classes).toEqual(['chat-message-list', 'cml-layered-rule']);
    expect([layered.overflowX, layered.overflowY]).toEqual(['hidden', 'auto']);
    expect([layered.overscrollX, layered.overscrollY]).toEqual(['none', 'none']);
    // The same rule written outside a layer is the reference: same computed values, same boxes.
    expect({ ...layered, classes: [] }).toEqual({ ...unlayered, classes: [] });
    expect(await readLayout(listOf(page, 'layered-rule'))).toEqual(
      await readLayout(listOf(page, 'consumer-rule'))
    );
  });

  test('keeps a sideways wheel from scrolling the list', async ({ page }) => {
    await openFixture(page);
    const list = listOf(page, 'layered-rule');
    await wheelOver(page, list, 80, 0);
    await page.waitForTimeout(SETTLE_MS);
    expect(await scrollLeftOf(list)).toBe(0);
  });

  test('loses to a token that is set', async ({ page }) => {
    await openFixture(page);
    const base = await readState(listOf(page, 'base'));
    const tokenSet = await readState(listOf(page, 'layered-rule-token'));

    expect([tokenSet.overflowX, tokenSet.overflowY]).toEqual(['auto', 'auto']);
    expect([tokenSet.overscrollX, tokenSet.overscrollY]).toEqual(['auto', 'auto']);
    expect({ ...tokenSet, classes: [] }).toEqual({ ...base, classes: [] });

    const list = listOf(page, 'layered-rule-token');
    await wheelOver(page, list, 80, 0);
    await expect.poll(() => scrollLeftOf(list)).toBeGreaterThan(0);
  });
});

test.describe('adopting the hooks', () => {
  test('the prop and both tokens replace the rules an app wrote without them', async ({ page }) => {
    await openFixture(page);
    const workaround = await readState(listOf(page, 'workaround'));
    const adopted = await readState(listOf(page, 'adopted'));

    expect([adopted.overflowX, adopted.overflowY]).toEqual(['hidden', 'auto']);
    expect([adopted.overscrollX, adopted.overscrollY]).toEqual(['none', 'none']);
    for (const key of [
      'overflowX',
      'overflowY',
      'overscrollX',
      'overscrollY',
      'offsetWidth',
      'clientWidth',
      'offsetHeight',
      'clientHeight',
      'scrollWidth',
      'scrollHeight'
    ] as const) {
      expect(adopted[key], key).toEqual(workaround[key]);
    }
    expect(await readLayout(listOf(page, 'adopted'))).toEqual(
      await readLayout(listOf(page, 'workaround'))
    );
  });

  test('with classic scrollbars neither list has a scrollbar left', async ({
    page,
    browserName
  }) => {
    await openFixture(page);
    const classic = await paintsClassicScrollbars(page);
    if (browserName === 'chromium') {
      expect(classic).toBe(true);
    }
    test.skip(!classic, 'This engine paints overlay scrollbars, which take no layout space');

    for (const scenario of ['workaround', 'adopted']) {
      expect(scrollbarsOf(await readState(listOf(page, scenario)))).toEqual({
        vertical: 0,
        horizontal: 0
      });
    }
  });
});

// dist-wc is a self-contained bundle rather than a route of the fixture app, so the
// spec injects it after navigating, as tests/button-shrinkable.spec.ts does. Run
// `pnpm run build:wc` first; `pnpm run build` does.
test.describe('<sui-chat-message-list>', () => {
  const loadBundle = async (page: Page): Promise<void> => {
    await openFixture(page);
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(
      () => typeof customElements.get('sui-chat-message-list') !== 'undefined',
      null,
      { timeout: 15_000 }
    );
  };

  // Tokens go on the host element, outside the shadow root, as a page's stylesheet would.
  // `shadowCss` is a stylesheet of the app's own adopted into the shadow root, the one place a
  // rule of the app's can reach the list inside it.
  const mountElement = async (
    page: Page,
    options: { attributes: Record<string, string>; style: string; shadowCss?: string }
  ): Promise<Locator> => {
    await page.evaluate(({ attributes, style, shadowCss }) => {
      const element = document.createElement('sui-chat-message-list');
      element.id = 'wc-list';
      element.style.cssText = `display:block;width:280px;height:140px;${style}`;
      for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
      }
      if (typeof shadowCss === 'string' && element.shadowRoot !== null) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(shadowCss);
        element.shadowRoot.adoptedStyleSheets = [sheet];
      }
      Object.assign(element, {
        messages: Array.from({ length: 10 }, (_, index) => ({
          id: `wc-${index}`,
          role: index % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${index}`
        }))
      });
      document.body.append(element);
    }, options);
    const list = page.locator('#wc-list .chat-message-list');
    await expect(list).toBeVisible();
    return list;
  };

  test('an unset element is the old list', async ({ page }) => {
    await loadBundle(page);
    const list = await mountElement(page, { attributes: {}, style: '' });
    const state = await readState(list);

    expect(state.classes).toEqual(['chat-message-list']);
    expect([state.overflowX, state.overflowY]).toEqual(['auto', 'auto']);
    expect([state.overscrollX, state.overscrollY]).toEqual(['auto', 'auto']);
  });

  test('the hide-scrollbar attribute and the hideScrollbar property both hide the scrollbar', async ({
    page,
    browserName
  }) => {
    await loadBundle(page);
    const fromAttribute = await mountElement(page, {
      attributes: { 'hide-scrollbar': '' },
      style: ''
    });
    await expect(fromAttribute).toHaveClass(/hide-scrollbar/);
    if (browserName !== 'firefox') {
      expect((await readState(fromAttribute)).scrollbarWidth).toBe('none');
    }

    await page.evaluate(() => document.getElementById('wc-list')?.remove());
    const fromProperty = await mountElement(page, { attributes: {}, style: '' });
    await expect(fromProperty).not.toHaveClass(/hide-scrollbar/);
    await page.evaluate(() => {
      Object.assign(document.getElementById('wc-list') ?? {}, { hideScrollbar: true });
    });
    await expect(fromProperty).toHaveClass(/hide-scrollbar/);
  });

  test('tokens set on the element reach the list inside its shadow root', async ({ page }) => {
    await loadBundle(page);
    const list = await mountElement(page, {
      attributes: {},
      style:
        '--chat-message-list-overflow-x:hidden;--chat-message-list-overscroll-behavior:contain;'
    });
    const state = await readState(list);

    expect([state.overflowX, state.overflowY]).toEqual(['hidden', 'auto']);
    expect([state.overscrollX, state.overscrollY]).toEqual(['contain', 'contain']);
  });

  const LAYERED_RULE =
    '@layer app { .chat-message-list { overflow-x: hidden; overscroll-behavior: none; } }';

  test('a rule of the app inside a cascade layer in the shadow root wins with the tokens unset', async ({
    page
  }) => {
    await loadBundle(page);
    const list = await mountElement(page, { attributes: {}, style: '', shadowCss: LAYERED_RULE });
    const state = await readState(list);

    expect([state.overflowX, state.overflowY]).toEqual(['hidden', 'auto']);
    expect([state.overscrollX, state.overscrollY]).toEqual(['none', 'none']);
  });

  test('a rule of the app inside a cascade layer in the shadow root loses to a token set on the element', async ({
    page
  }) => {
    await loadBundle(page);
    const list = await mountElement(page, {
      attributes: {},
      style: '--chat-message-list-overflow-x:auto;--chat-message-list-overscroll-behavior:auto;',
      shadowCss: LAYERED_RULE
    });
    const state = await readState(list);

    expect([state.overflowX, state.overflowY]).toEqual(['auto', 'auto']);
    expect([state.overscrollX, state.overscrollY]).toEqual(['auto', 'auto']);
  });
});
