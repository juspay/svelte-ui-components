import { expect, test, type Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

// ChatMessageList lays its messages out in an inner column. Five tokens reach that column:
// --chat-message-list-inner-padding-bottom, -padding-inline, -width, -max-width and -margin-inline.
//
// What the spec pins:
//   - Unset, the column is what it always was: no padding, no margin, no maximum width, as wide as
//     the list. The fixture hides every scrollbar, so these are numbers and not scrollbar widths.
//   - Each token reaches its property, and a width of 100% with a maximum width and `auto` inline
//     margins centres the column (an auto margin alone shrinks it to its content).
//   - A rule of an app's own that reaches `.inner` keeps winning over the tokens' declarations,
//     which carry no specificity, with the tokens unset and set.
//   - Inside a cascade layer such a rule wins only while the tokens are unset: the declarations are
//     unlayered, so an unset token has to hand the property back (revert-layer) and a set one
//     beats the layer.
//   - `<sui-chat-message-list>` takes the tokens from the element, across its shadow root.

const HOST_WIDTH = 400;
const ROW_COUNT = 8;
const ROW_HEIGHT = 30;
const GAP = 16;
const CONTENT_HEIGHT = ROW_COUNT * ROW_HEIGHT + (ROW_COUNT - 1) * GAP;

type Box = { x: number; y: number; width: number; height: number };

type InnerState = {
  paddingBottom: string;
  paddingLeft: string;
  paddingRight: string;
  maxWidth: string;
  marginLeft: string;
  marginRight: string;
  inner: Box;
  list: Box;
  firstRow: Box | null;
  scrollHeight: number;
};

const openFixture = async (page: Page): Promise<void> => {
  await page.goto(`${fixtureBaseURL}/chat-message-list-inner/`);
  await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
};

// Reads the list and its inner column, in the light DOM or inside a shadow root.
const readInner = (page: Page, listSelector: string): Promise<InnerState> =>
  page.locator(listSelector).evaluate((list) => {
    const inner = list.querySelector('.inner');
    const row = list.querySelector('[data-pw="cmi-row"]');
    if (inner === null) {
      throw new Error('the list has no .inner column');
    }
    const box = (element: Element): Box => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    };
    const style = getComputedStyle(inner);
    return {
      paddingBottom: style.paddingBottom,
      paddingLeft: style.paddingLeft,
      paddingRight: style.paddingRight,
      maxWidth: style.maxWidth,
      marginLeft: style.marginLeft,
      marginRight: style.marginRight,
      inner: box(inner),
      list: box(list),
      firstRow: row === null ? null : box(row),
      scrollHeight: list.scrollHeight
    };
  });

const scenario = (page: Page, id: string): Promise<InnerState> =>
  readInner(page, `[data-pw="cmi-${id}-list"]`);

const firstRowOf = (state: InnerState): Box => {
  if (state.firstRow === null) {
    throw new Error('The light-DOM fixture did not render its first row');
  }
  return state.firstRow;
};

test.describe('unset', () => {
  test('the column has no padding, margin or maximum width and is as wide as the list', async ({
    page
  }) => {
    await openFixture(page);
    const state = await scenario(page, 'unset');

    expect([state.paddingBottom, state.paddingLeft, state.paddingRight]).toEqual([
      '0px',
      '0px',
      '0px'
    ]);
    expect([state.maxWidth, state.marginLeft, state.marginRight]).toEqual(['none', '0px', '0px']);
    expect(state.inner.width).toBeCloseTo(HOST_WIDTH, 0);
    expect(state.inner.x).toBeCloseTo(state.list.x, 0);
    expect(firstRowOf(state).x).toBeCloseTo(state.list.x, 0);
    expect(state.scrollHeight).toBe(CONTENT_HEIGHT);
  });
});

test.describe('the tokens', () => {
  test('--chat-message-list-inner-padding-bottom adds clearance below the last message', async ({
    page
  }) => {
    await openFixture(page);
    const state = await scenario(page, 'padding-bottom');

    expect(state.paddingBottom).toBe('36px');
    expect(state.scrollHeight).toBe(CONTENT_HEIGHT + 36);
    expect(firstRowOf(state).y).toBeCloseTo(firstRowOf(await scenario(page, 'unset')).y, 0);
  });

  test('--chat-message-list-inner-padding-inline pads both sides of the column', async ({
    page
  }) => {
    await openFixture(page);
    const state = await scenario(page, 'padding-inline');

    expect([state.paddingLeft, state.paddingRight]).toEqual(['20px', '20px']);
    expect(state.inner.width).toBeCloseTo(HOST_WIDTH, 0);
    expect(firstRowOf(state).x).toBeCloseTo(state.list.x + 20, 0);
    expect(firstRowOf(state).width).toBeCloseTo(HOST_WIDTH - 40, 0);
  });

  test('--chat-message-list-inner-max-width caps the column and leaves it at the start', async ({
    page
  }) => {
    await openFixture(page);
    const state = await scenario(page, 'max-width');

    expect(state.maxWidth).toBe('240px');
    expect(state.inner.width).toBeCloseTo(240, 0);
    expect(state.inner.x).toBeCloseTo(state.list.x, 0);
  });

  test('an auto inline margin without a width shrinks the column to its content', async ({
    page
  }) => {
    await openFixture(page);
    const state = await scenario(page, 'no-width');

    expect(state.inner.width).toBeLessThan(240);
    expect(state.inner.width).toBeGreaterThan(0);
  });

  test('a width of 100% with a maximum width and auto inline margins centres the column', async ({
    page
  }) => {
    await openFixture(page);
    const state = await scenario(page, 'centred');

    expect(state.inner.width).toBeCloseTo(240, 0);
    expect(state.inner.x).toBeCloseTo(state.list.x + (HOST_WIDTH - 240) / 2, 0);
    expect([state.marginLeft, state.marginRight]).toEqual(['80px', '80px']);
  });

  test('all five together', async ({ page }) => {
    await openFixture(page);
    const state = await scenario(page, 'all');

    expect(state.inner.width).toBeCloseTo(240, 0);
    expect(state.inner.x).toBeCloseTo(state.list.x + 80, 0);
    expect(firstRowOf(state).x).toBeCloseTo(state.list.x + 80 + 20, 0);
    expect(firstRowOf(state).width).toBeCloseTo(240 - 40, 0);
    expect(state.scrollHeight).toBe(CONTENT_HEIGHT + 36);
  });
});

// The fixture's rule is `.cmi-consumer-rule .inner`, two classes: a library declaration written
// with any specificity of its own would tie or beat it.
test.describe("a rule of the app's own", () => {
  const RULE = ['12px', '5px', '5px', '300px', '10px', '10px'];
  const valuesOf = (state: InnerState): string[] => [
    state.paddingBottom,
    state.paddingLeft,
    state.paddingRight,
    state.maxWidth,
    state.marginLeft,
    state.marginRight
  ];

  test('wins with the tokens unset', async ({ page }) => {
    await openFixture(page);
    const state = await scenario(page, 'consumer-rule');

    expect(valuesOf(state)).toEqual(RULE);
    expect(state.inner.width).toBeCloseTo(300, 0);
    expect(state.inner.x).toBeCloseTo(state.list.x + 10, 0);
  });

  test('keeps winning with the tokens set', async ({ page }) => {
    await openFixture(page);

    expect(valuesOf(await scenario(page, 'consumer-rule-token'))).toEqual(RULE);
  });
});

// A rule inside a cascade layer loses to any unlayered declaration whatever its specificity, so the
// column must not declare these properties unlayered while a token is unset. A set token is a
// declaration of the library's own and beats the layer.
test.describe("a rule of the app's own inside a cascade layer", () => {
  test('wins while the tokens are unset', async ({ page }) => {
    await openFixture(page);
    const state = await scenario(page, 'layered-rule');

    expect([state.paddingBottom, state.paddingLeft, state.maxWidth, state.marginLeft]).toEqual([
      '12px',
      '5px',
      '300px',
      '10px'
    ]);
    expect(state.inner.width).toBeCloseTo(300, 0);
  });

  test('loses to a token that is set', async ({ page }) => {
    await openFixture(page);
    const state = await scenario(page, 'layered-rule-token');

    expect([state.paddingBottom, state.paddingLeft, state.maxWidth]).toEqual([
      '36px',
      '20px',
      '240px'
    ]);
    expect(state.inner.x).toBeCloseTo(state.list.x + 80, 0);
  });
});

// dist-wc is a self-contained bundle rather than a route of the fixture app, so the spec injects it
// after navigating, as tests/chat-message-list-scroll-tokens.spec.ts does. Run `pnpm run build:wc`
// first; `pnpm run build` does.
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
  // `shadowCss` is a stylesheet of the app's own adopted into the shadow root.
  const mountElement = async (
    page: Page,
    options: { style: string; shadowCss?: string }
  ): Promise<void> => {
    await page.evaluate(({ style, shadowCss }) => {
      const element = document.createElement('sui-chat-message-list');
      element.id = 'wc-list';
      element.style.cssText = `display:block;width:400px;height:200px;--chat-message-list-padding:0;${style}`;
      if (typeof shadowCss === 'string' && element.shadowRoot !== null) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(shadowCss);
        element.shadowRoot.adoptedStyleSheets = [sheet];
      }
      Object.assign(element, {
        messages: Array.from({ length: 8 }, (_, index) => ({
          id: `wc-${index}`,
          role: index % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${index}`
        }))
      });
      element.setAttribute('hide-scrollbar', '');
      document.body.append(element);
    }, options);
    await expect(page.locator('#wc-list .inner')).toBeVisible();
  };

  test('an unset element has the plain column', async ({ page }) => {
    await loadBundle(page);
    await mountElement(page, { style: '' });
    const state = await readInner(page, '#wc-list .chat-message-list');
    expect(state.firstRow, 'the default web-component message has no fixture row').toBeNull();

    expect([state.paddingBottom, state.paddingLeft, state.maxWidth, state.marginLeft]).toEqual([
      '0px',
      '0px',
      'none',
      '0px'
    ]);
  });

  test('tokens set on the element reach the column inside its shadow root', async ({ page }) => {
    await loadBundle(page);
    await mountElement(page, {
      style:
        '--chat-message-list-inner-padding-bottom:36px;--chat-message-list-inner-width:100%;' +
        '--chat-message-list-inner-max-width:240px;--chat-message-list-inner-margin-inline:auto'
    });
    const state = await readInner(page, '#wc-list .chat-message-list');
    expect(state.firstRow, 'the default web-component message has no fixture row').toBeNull();

    expect([state.paddingBottom, state.maxWidth]).toEqual(['36px', '240px']);
    expect(state.inner.width).toBeCloseTo(240, 0);
    expect(state.inner.x).toBeCloseTo(state.list.x + 80, 0);
  });

  test('a layered rule adopted into the shadow root wins while unset and loses to a set token', async ({
    page
  }) => {
    await loadBundle(page);
    await mountElement(page, {
      style: '',
      shadowCss: '@layer app { .inner { padding-bottom: 12px; } }'
    });
    expect((await readInner(page, '#wc-list .chat-message-list')).paddingBottom).toBe('12px');

    await page.evaluate(() => {
      document
        .getElementById('wc-list')
        ?.style.setProperty('--chat-message-list-inner-padding-bottom', '36px');
    });
    await expect
      .poll(async () => (await readInner(page, '#wc-list .chat-message-list')).paddingBottom)
      .toBe('36px');
  });
});
