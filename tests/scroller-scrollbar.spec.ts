import { expect, test, type Locator, type Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

// A visible Scroller scrollbar could not be themed: nothing on .scroll-container read a
// scrollbar-width or scrollbar-color, so an app reached into the library's markup. The scroll
// container now reads --scroller-scrollbar-width and --scroller-scrollbar-color while the
// scrollbar is shown.
//
// Most of the work is making the two tokens inert when unset. scrollbar-color is inherited, so
// a declaration of `auto` cuts off a colour an ancestor hands down today; and any declaration
// that resolves to nothing still displaces an earlier rule, such as `* { scrollbar-width: thin }`.
// Both would show up as a changed scrollbar in an app that never heard of the tokens. The
// declarations therefore sit in an anonymous cascade layer, where every unlayered rule of an app
// beats them, and fall back to `revert-layer`, which hands the property back to the layers before
// them. Each "unset" test below compares the component with a hand-written twin (`-ref`) that
// computes what the base .scroll-container did, in the same cascade, and each one first checks
// that the twin carries the value the app set, so a comparison of two defaults cannot pass.
//
// Layout and scrollbars cannot be proved in jsdom, so every claim is a computed style or a box in
// a real browser, on tests/fixtures/scroller-scrollbar. The repo's Playwright project runs
// Chromium only; the Firefox and WebKit results were measured by running this same spec through
// a scratch Playwright config, not by CI. Two engine facts shape the spec: WebKit 26.4 does not
// implement scrollbar-color, and headless Firefox forces scrollbar-width: none on every element,
// so the assertions that need those values skip themselves there rather than pass on nothing.

// Headless Chromium launches with --hide-scrollbars, which would make every thickness below zero.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

type Probe = {
  width: string;
  color: string;
  thickness: number;
  boxWidth: number;
  boxHeight: number;
};

type Engine = {
  supportsColor: boolean;
  supportsWidth: boolean;
  // A harness that hides scrollbars reports `none` on a bare overflow:auto element.
  scrollbarsHiddenByHarness: boolean;
};

const ANCESTOR_COLOR = 'rgb(1, 2, 3) rgb(4, 5, 6)';
const TOKEN_COLOR = 'rgb(255, 0, 0) rgb(0, 0, 255)';
const RESET_COLOR = 'rgb(7, 8, 9) rgb(10, 11, 12)';
const CONSUMER_COLOR = 'rgb(0, 128, 0) rgb(0, 0, 0)';
// The fixture's ::-webkit-scrollbar rule sets this thickness on the scroll container.
const WEBKIT_RULE_THICKNESS = 9;

const probe = (container: Locator): Promise<Probe> =>
  container.evaluate((element) => {
    if (!(element instanceof HTMLElement)) {
      throw new Error('the scroll container is not an HTML element');
    }
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return {
      width: style.getPropertyValue('scrollbar-width'),
      color: style.getPropertyValue('scrollbar-color'),
      thickness: element.offsetHeight - element.clientHeight,
      boxWidth: box.width,
      boxHeight: box.height
    };
  });

const scrollContainer = (page: Page, name: string): Locator =>
  page.getByTestId(`sb-${name}-scroller`).locator('.scroll-container');

const twin = (page: Page, name: string): Locator => page.getByTestId(`sb-${name}-ref`);

const detectEngine = (page: Page): Promise<Engine> =>
  page.evaluate(() => {
    const bare = document.createElement('div');
    bare.style.cssText = 'overflow:auto;width:50px;height:50px';
    document.body.append(bare);
    const bareWidth = getComputedStyle(bare).getPropertyValue('scrollbar-width');
    bare.remove();
    return {
      supportsColor: CSS.supports('scrollbar-color', 'auto'),
      supportsWidth: CSS.supports('scrollbar-width', 'thin'),
      scrollbarsHiddenByHarness: bareWidth === 'none'
    };
  });

const openFixture = async (page: Page): Promise<Engine> => {
  await page.goto(`${fixtureBaseURL}/scroller-scrollbar/`);
  await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
  return detectEngine(page);
};

// The component and its twin, measured in their own scenario.
const measurePair = async (
  page: Page,
  name: string
): Promise<{ component: Probe; reference: Probe }> => ({
  component: await probe(scrollContainer(page, name)),
  reference: await probe(twin(page, name))
});

// The widths and heights of the box must match too: a changed scrollbar is a changed box.
const expectSameAsTwin = ({ component, reference }: { component: Probe; reference: Probe }) => {
  expect(component).toEqual(reference);
};

// Position, in document order, of the app's rule and of the library's token declaration (the
// rule that reads var(--scroller-scrollbar-*), not the fixture rules that set them), as the
// browser loaded them. Both the zero-specificity tie and the earlier-layer case only exist
// when the app's rule comes first, so a fixture that stopped delivering that order would pass
// the tests below for the wrong reason.
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
          if (rule.cssText.includes('var(--scroller-scrollbar')) {
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

const LAYER_COLOR = 'rgb(13, 14, 15) rgb(16, 17, 18)';

test.describe('Scroller scrollbar tokens, unset', () => {
  test('a plain scroll container is unchanged', async ({ page }) => {
    const engine = await openFixture(page);
    const pair = await measurePair(page, 'plain');
    expectSameAsTwin(pair);
    expect(pair.reference.boxWidth).toBe(200);
    if (engine.supportsWidth && !engine.scrollbarsHiddenByHarness) {
      expect(pair.component.width).toBe('auto');
    }
  });

  test('a scrollbar-color an ancestor hands down is not cut off', async ({ page }) => {
    const engine = await openFixture(page);
    const pair = await measurePair(page, 'ancestor-color');
    expectSameAsTwin(pair);
    test.skip(!engine.supportsColor, 'this engine does not implement scrollbar-color');
    expect(pair.reference.color).toBe(ANCESTOR_COLOR);
    expect(pair.component.color).toBe(ANCESTOR_COLOR);
  });

  test('a scrollbar-color set on the Scroller root, as an app does, is not cut off', async ({
    page
  }) => {
    const engine = await openFixture(page);
    const pair = await measurePair(page, 'root-color');
    expectSameAsTwin(pair);
    test.skip(!engine.supportsColor, 'this engine does not implement scrollbar-color');
    expect(pair.component.color).toBe(ANCESTOR_COLOR);
  });

  test('the app ::-webkit-scrollbar rule keeps its thickness', async ({ page, browserName }) => {
    await openFixture(page);
    const pair = await measurePair(page, 'webkit-rule');
    expectSameAsTwin(pair);
    // Firefox does not implement the pseudo-element, so there is nothing to keep there.
    if (browserName !== 'firefox') {
      expect(pair.reference.thickness).toBe(WEBKIT_RULE_THICKNESS);
      expect(pair.component.thickness).toBe(WEBKIT_RULE_THICKNESS);
    }
  });

  test('a zero-specificity universal rule of the app, loaded first, is not displaced', async ({
    page
  }) => {
    const engine = await openFixture(page);
    const order = await sourceOrder(page, 'sb-global-reset');
    expect(order.app).toBeGreaterThan(-1);
    expect(order.library).toBeGreaterThan(-1);
    expect(order.app).toBeLessThan(order.library);

    const pair = await measurePair(page, 'global-reset');
    expectSameAsTwin(pair);
    if (engine.supportsWidth && !engine.scrollbarsHiddenByHarness) {
      expect(pair.component.width).toBe('thin');
    }
    if (engine.supportsColor) {
      expect(pair.component.color).toBe(RESET_COLOR);
    }
  });

  test('a rule of the app in a cascade layer ahead of the library is not displaced', async ({
    page
  }) => {
    const engine = await openFixture(page);
    const order = await sourceOrder(page, 'sb-app-layer');
    expect(order.app).toBeGreaterThan(-1);
    expect(order.library).toBeGreaterThan(-1);
    expect(order.app).toBeLessThan(order.library);

    const pair = await measurePair(page, 'app-layer');
    expectSameAsTwin(pair);
    if (engine.supportsWidth && !engine.scrollbarsHiddenByHarness) {
      expect(pair.component.width).toBe('thin');
    }
    if (engine.supportsColor) {
      expect(pair.component.color).toBe(LAYER_COLOR);
    }
  });

  test('a hidden scrollbar is unchanged', async ({ page }) => {
    await openFixture(page);
    const pair = await measurePair(page, 'hidden');
    expectSameAsTwin(pair);
    expect(pair.component.thickness).toBe(0);
  });
});

test.describe('Scroller scrollbar tokens, set', () => {
  test('both tokens reach a shown scrollbar', async ({ page }) => {
    const engine = await openFixture(page);
    test.skip(
      !engine.supportsWidth || engine.scrollbarsHiddenByHarness,
      'this engine cannot report scrollbar-width here'
    );
    const { component, reference } = await measurePair(page, 'tokens');
    expect(reference.width).toBe('auto');
    expect(component.width).toBe('thin');
    if (engine.supportsColor) {
      expect(reference.color).toBe('auto');
      expect(component.color).toBe(TOKEN_COLOR);
    }
    // Only the scrollbar changes: the scroll container keeps its width.
    expect(component.boxWidth).toBe(reference.boxWidth);
    if (reference.thickness > 0) {
      expect(component.thickness).toBeLessThan(reference.thickness);
    }
  });

  test('a width token alone leaves an inherited colour in place', async ({ page }) => {
    const engine = await openFixture(page);
    test.skip(
      !engine.supportsWidth || engine.scrollbarsHiddenByHarness,
      'this engine cannot report scrollbar-width here'
    );
    const { component, reference } = await measurePair(page, 'width-only');
    expect(component.width).toBe('thin');
    expect(reference.width).toBe('auto');
    expect(component.color).toBe(reference.color);
    if (engine.supportsColor) {
      expect(component.color).toBe(ANCESTOR_COLOR);
    }
  });

  test('a colour token alone leaves the width at the browser default', async ({ page }) => {
    const engine = await openFixture(page);
    test.skip(!engine.supportsColor, 'this engine does not implement scrollbar-color');
    const { component, reference } = await measurePair(page, 'color-only');
    expect(component.color).toBe(TOKEN_COLOR);
    expect(reference.color).toBe('auto');
    expect(component.width).toBe(reference.width);
    expect(component.thickness).toBe(reference.thickness);
  });

  test('setting a token replaces the app ::-webkit-scrollbar rule', async ({
    page,
    browserName
  }) => {
    const engine = await openFixture(page);
    test.skip(browserName === 'firefox', 'Firefox does not implement ::-webkit-scrollbar');
    test.skip(
      !engine.supportsWidth || engine.scrollbarsHiddenByHarness,
      'this engine cannot report scrollbar-width here'
    );
    const { component, reference } = await measurePair(page, 'tokens-webkit-rule');
    expect(reference.thickness).toBe(WEBKIT_RULE_THICKNESS);
    expect(component.width).toBe('thin');
    expect(component.thickness).not.toBe(WEBKIT_RULE_THICKNESS);
  });

  test('an app rule on the scroll container wins over the tokens', async ({ page }) => {
    const engine = await openFixture(page);
    const pair = await measurePair(page, 'tokens-consumer-rule');
    expectSameAsTwin(pair);
    if (engine.supportsColor) {
      expect(pair.component.color).toBe(CONSUMER_COLOR);
    }
    if (engine.supportsWidth && !engine.scrollbarsHiddenByHarness) {
      expect(pair.component.width).toBe('auto');
    }
  });

  test('a zero-specificity universal rule of the app wins over the tokens', async ({ page }) => {
    const engine = await openFixture(page);
    const pair = await measurePair(page, 'tokens-global-reset');
    expectSameAsTwin(pair);
    if (engine.supportsColor) {
      expect(pair.component.color).toBe(RESET_COLOR);
    }
    if (engine.supportsWidth && !engine.scrollbarsHiddenByHarness) {
      expect(pair.component.width).toBe('thin');
    }
  });

  test('a set token wins over a rule of the app that sits in an earlier cascade layer', async ({
    page
  }) => {
    const engine = await openFixture(page);
    test.skip(!engine.supportsColor, 'this engine does not implement scrollbar-color');
    const { component, reference } = await measurePair(page, 'tokens-app-layer');
    expect(reference.color).toBe(LAYER_COLOR);
    expect(component.color).toBe(TOKEN_COLOR);
  });

  test('the tokens do nothing while the scrollbar is hidden', async ({ page }) => {
    await openFixture(page);
    const withTokens = await measurePair(page, 'hidden-tokens');
    const withoutTokens = await measurePair(page, 'hidden');
    expectSameAsTwin(withTokens);
    expect(withTokens.component).toEqual(withoutTokens.component);
    expect(withTokens.component.thickness).toBe(0);
    expect(withTokens.component.color).not.toBe(TOKEN_COLOR);
  });
});

// dist-wc is a self-contained bundle rather than a route of the demo site, so it is injected
// into a same-origin page. `pnpm run build` (the docs webServer command) runs build:wc, so the
// file exists. The tokens are custom properties, which are inherited across a shadow root, so
// they must reach the scroll container inside <sui-scroller>.
const mountScroller = async (
  page: Page,
  options: { hostStyle: string; parentStyle: string }
): Promise<Locator> => {
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(
    () => typeof customElements.get('sui-scroller') !== 'undefined',
    null,
    {
      timeout: 15_000
    }
  );
  await page.evaluate((mount) => {
    const parent = document.createElement('div');
    parent.style.cssText = `width:200px;${mount.parentStyle}`;
    const element = document.createElement('sui-scroller');
    element.id = 'wc-scroller';
    element.style.cssText = mount.hostStyle;
    Object.assign(element, { hideScrollbar: false, showArrows: false, showGradient: false });
    for (let count = 0; count < 3; count += 1) {
      const item = document.createElement('div');
      item.style.cssText = 'flex:0 0 150px;height:20px;background:#ccc';
      element.append(item);
    }
    parent.append(element);
    document.body.append(parent);
  }, options);
  const container = page.locator('#wc-scroller .scroll-container');
  await expect(container).toBeVisible();
  return container;
};

test.describe('sui-scroller scrollbar tokens', () => {
  test('tokens set on the host element reach the scroll container in the shadow root', async ({
    page
  }) => {
    const engine = await openFixture(page);
    test.skip(
      !engine.supportsWidth || engine.scrollbarsHiddenByHarness,
      'this engine cannot report scrollbar-width here'
    );
    const container = await mountScroller(page, {
      hostStyle: `--scroller-scrollbar-width: thin; --scroller-scrollbar-color: ${TOKEN_COLOR};`,
      parentStyle: ''
    });
    const measured = await probe(container);
    expect(measured.width).toBe('thin');
    if (engine.supportsColor) {
      expect(measured.color).toBe(TOKEN_COLOR);
    }
  });

  test('unset, a scrollbar-color an ancestor of the host hands down still arrives', async ({
    page
  }) => {
    const engine = await openFixture(page);
    test.skip(!engine.supportsColor, 'this engine does not implement scrollbar-color');
    const container = await mountScroller(page, {
      hostStyle: '',
      parentStyle: `scrollbar-color: ${ANCESTOR_COLOR};`
    });
    expect((await probe(container)).color).toBe(ANCESTOR_COLOR);
  });
});
