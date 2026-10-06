import { expect, test, type Locator, type Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

// The message root had no min-width, so every parent saw the initial value, auto: a
// content-based minimum in a flex row or a grid track, and 0 in a block. An app that
// wanted a floor, or wanted the message to give width back to a narrow parent, had to
// reach into the component from outside with a :global() rule. --chat-message-min-width
// is that hook. Its fallback is auto, not 0, because 0 would have changed the first two
// parents; the declaration sits in :where() so an app rule on the root that already sets
// min-width keeps winning.
//
// Layout cannot be proved in jsdom, so every claim is a box or a computed style in a real
// browser, on the tests/fixtures/chat-message-min-width page. Each parent is 240px wide.
// `wide` holds a 400px child that cannot wrap, so the message's own content is wider than
// the parent; `short` is two letters.
//
// An unset token has to leave the property alone, so the fallback is revert-layer: it gives
// the declaration up and lets a lower cascade layer decide, which keeps an app's rule inside
// an @layer working. A plain auto would win over every layered rule.
//
// <sui-chat-message> is a different case: the token reaches the message inside its shadow
// root, but the flex or grid item is the element itself, which keeps its own content-based
// minimum. The wc tests pin both facts.
//
// The repo's Playwright project runs Chromium only. The same file was also run through a
// scratch Playwright config on Firefox and WebKit; the commit body records the versions.
//
// Twins: a `.twin` element carries the message's root box rules and no min-width rule of
// any kind, so what it resolves to in a parent is what the message resolved to before the
// token existed. Comparing against it keeps the unset cases independent of any engine's
// rounding, and of the one place the engines disagree: WebKit sizes a grid track around a
// percentage max-width differently from Chromium and Firefox (196.8 where they give 328),
// for the message and its twin alike.

const PARENT_WIDTH = 240;
const WIDE_CHILD_WIDTH = 400;
// 82% of the 240px parent, the default --chat-message-max-width.
const MAX_WIDTH_CAP = PARENT_WIDTH * 0.82;

type Context = 'row' | 'column' | 'grid' | 'block';
type Content = 'wide' | 'wide-capped' | 'short' | 'code' | 'code-capped';
type State = 'unset' | 'auto' | 'zero' | 'floor' | 'over';

const CONTEXTS: readonly Context[] = ['row', 'column', 'grid', 'block'];

type Box = { x: number; y: number; width: number; height: number };

const measure = async (locator: Locator): Promise<Box> => {
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error('boundingBox is null');
  }
  return box;
};

const computedMinWidth = (locator: Locator): Promise<string> =>
  locator.evaluate((element) => getComputedStyle(element).minWidth);

const openFixture = async (page: Page, css?: string): Promise<void> => {
  const query = typeof css === 'string' ? `?css=${encodeURIComponent(css)}` : '';
  await page.goto(`${fixtureBaseURL}/chat-message-min-width/${query}`);
  await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
};

const messageAt = (page: Page, context: Context, content: Content, state: State): Locator =>
  page.getByTestId(`mw-message-${context}-${content}-${state}`);

const twinAt = (page: Page, context: Context, content: 'wide' | 'wide-capped'): Locator =>
  page.getByTestId(`mw-twin-${context}-${content}`);

const widthOf = async (
  page: Page,
  context: Context,
  content: Content,
  state: State
): Promise<number> => (await measure(messageAt(page, context, content, state))).width;

// What auto resolves to as a used value: the whole point of the fallback. A flex or grid
// item reports the keyword, a block child reports its resolved 0.
const AUTO_AS_COMPUTED: Readonly<Record<Context, string>> = {
  row: 'auto',
  column: 'auto',
  grid: 'auto',
  block: '0px'
};

test.describe('ChatMessage min-width: unset is what the message always was', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page);
  });

  for (const context of CONTEXTS) {
    for (const content of ['wide', 'wide-capped'] as const) {
      test(`${context} parent, ${content}: unset has the width and the min-width of a root with no min-width rule`, async ({
        page
      }) => {
        const message = messageAt(page, context, content, 'unset');
        const twin = twinAt(page, context, content);

        expect((await measure(message)).width).toBeCloseTo((await measure(twin)).width, 0);
        expect(await computedMinWidth(message)).toBe(await computedMinWidth(twin));
        expect(await computedMinWidth(message)).toBe(AUTO_AS_COMPUTED[context]);
      });
    }
  }

  // Pin the numbers the twin comparison stands on, so a twin that drifted along with the
  // message could not hide a change. A row and a grid track hold the 400px child at 400px
  // because that is the content-based minimum; a column does not stretch the message, so it
  // is as wide as its content; a block is as wide as the parent.
  test('the content-based minimum holds a flex row and a grid track at the content width', async ({
    page
  }) => {
    expect(await widthOf(page, 'row', 'wide', 'unset')).toBeCloseTo(WIDE_CHILD_WIDTH, 0);
    expect(await widthOf(page, 'grid', 'wide', 'unset')).toBeCloseTo(WIDE_CHILD_WIDTH, 0);
    expect(await widthOf(page, 'column', 'wide', 'unset')).toBeCloseTo(WIDE_CHILD_WIDTH, 0);
    expect(await widthOf(page, 'block', 'wide', 'unset')).toBeCloseTo(PARENT_WIDTH, 0);
  });

  test('the default 82% cap still applies where the content is wider than the parent', async ({
    page
  }) => {
    for (const context of ['row', 'column', 'block'] as const) {
      expect(await widthOf(page, context, 'wide-capped', 'unset')).toBeCloseTo(MAX_WIDTH_CAP, 0);
    }
  });

  for (const context of CONTEXTS) {
    for (const content of ['wide', 'short'] as const) {
      test(`${context} parent, ${content}: a token set to auto is the same as an unset one`, async ({
        page
      }) => {
        const unset = messageAt(page, context, content, 'unset');
        const auto = messageAt(page, context, content, 'auto');

        expect((await measure(auto)).width).toBeCloseTo((await measure(unset)).width, 0);
        expect((await measure(auto)).height).toBeCloseTo((await measure(unset)).height, 0);
        expect(await computedMinWidth(auto)).toBe(await computedMinWidth(unset));
        expect(await computedMinWidth(auto)).toBe(AUTO_AS_COMPUTED[context]);
      });
    }
  }
});

test.describe('ChatMessage min-width: 0 lets the message shrink', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page);
  });

  for (const context of ['row', 'grid'] as const) {
    test(`${context} parent: 0 shrinks the message from its content width to the parent`, async ({
      page
    }) => {
      expect(await widthOf(page, context, 'wide', 'unset')).toBeCloseTo(WIDE_CHILD_WIDTH, 0);

      const message = messageAt(page, context, 'wide', 'zero');
      expect((await measure(message)).width).toBeCloseTo(PARENT_WIDTH, 0);
      expect(await computedMinWidth(message)).toBe('0px');
    });
  }

  // The real case behind the token: a code block is a scroll container, yet its text still
  // sets the message's content-based minimum, so in a row or a track the message stretches to
  // the length of the longest line instead of scrolling the block.
  for (const context of ['row', 'grid'] as const) {
    test(`${context} parent: 0 turns a long code line from a stretched message into a scrolling block`, async ({
      page
    }) => {
      const stretched = messageAt(page, context, 'code', 'unset');
      expect((await measure(stretched)).width).toBeGreaterThan(PARENT_WIDTH * 5);
      expect(await stretched.locator('pre').evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
        false
      );

      const shrunk = messageAt(page, context, 'code', 'zero');
      expect((await measure(shrunk)).width).toBeCloseTo(PARENT_WIDTH, 0);
      expect((await measure(shrunk.locator('pre'))).width).toBeCloseTo(PARENT_WIDTH, 0);
      expect(await shrunk.locator('pre').evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
        true
      );
    });
  }

  // The 82% cap resolves against the track, and the track is as wide as the content's
  // minimum unless the message gives it back.
  test('grid parent: 0 also narrows the track the percentage max-width resolves against', async ({
    page
  }) => {
    expect(await widthOf(page, 'grid', 'wide-capped', 'zero')).toBeCloseTo(MAX_WIDTH_CAP, 0);
  });

  // A column flex parent does not use the content as a minimum on the cross axis, and the
  // message is as wide as its content there, so 0 has nothing to give back. A block parent
  // already resolves auto to 0.
  for (const context of ['column', 'block'] as const) {
    test(`${context} parent: 0 reaches the message and changes nothing`, async ({ page }) => {
      const unset = await widthOf(page, context, 'wide', 'unset');
      const zero = messageAt(page, context, 'wide', 'zero');

      expect(await computedMinWidth(zero)).toBe('0px');
      expect((await measure(zero)).width).toBeCloseTo(unset, 0);
    });
  }

  test('a capped message in a row parent is the same with or without 0', async ({ page }) => {
    const zero = messageAt(page, 'row', 'wide-capped', 'zero');

    expect(await computedMinWidth(zero)).toBe('0px');
    expect((await measure(zero)).width).toBeCloseTo(MAX_WIDTH_CAP, 0);
    expect(await widthOf(page, 'row', 'wide-capped', 'unset')).toBeCloseTo(MAX_WIDTH_CAP, 0);
  });

  // The long-code-line example only shows a 0 effect once --chat-message-max-width is lifted.
  // With the default 82% a row holds the message at the cap already, so 0 changes the computed
  // value and no box.
  test('row parent with the default cap: a long code line is already held at the cap, 0 changes no box', async ({
    page
  }) => {
    const unset = messageAt(page, 'row', 'code-capped', 'unset');
    const zero = messageAt(page, 'row', 'code-capped', 'zero');

    expect((await measure(unset)).width).toBeCloseTo(MAX_WIDTH_CAP, 0);
    expect((await measure(zero)).width).toBeCloseTo(MAX_WIDTH_CAP, 0);
    expect(await computedMinWidth(unset)).toBe('auto');
    expect(await computedMinWidth(zero)).toBe('0px');
  });

  // A grid track is sized from the content, and the percentage cap resolves against it, so the
  // cap does not reliably bring the message back; 0 does. WebKit holds the message at the cap
  // either way, so the unset width is only bounded from below.
  test('grid parent with the default cap: 0 brings a long code line back to the cap', async ({
    page
  }) => {
    const unset = messageAt(page, 'grid', 'code-capped', 'unset');
    const zero = messageAt(page, 'grid', 'code-capped', 'zero');

    expect((await measure(unset)).width).toBeGreaterThanOrEqual(MAX_WIDTH_CAP - 0.5);
    expect((await measure(zero)).width).toBeCloseTo(MAX_WIDTH_CAP, 0);
    expect(await zero.locator('pre').evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  });
});

test.describe('ChatMessage min-width: a length is a floor', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page);
  });

  for (const context of ['row', 'column'] as const) {
    test(`${context} parent: 120px raises a short message from its content width to 120px`, async ({
      page
    }) => {
      const unset = await widthOf(page, context, 'short', 'unset');
      expect(unset).toBeLessThan(120 - 20);

      const floor = messageAt(page, context, 'short', 'floor');
      expect((await measure(floor)).width).toBeCloseTo(120, 0);
      expect(await computedMinWidth(floor)).toBe('120px');
    });
  }

  for (const context of ['grid', 'block'] as const) {
    test(`${context} parent: 120px does nothing to a message that already fills the parent`, async ({
      page
    }) => {
      const unset = await widthOf(page, context, 'short', 'unset');
      expect(unset).toBeCloseTo(MAX_WIDTH_CAP, 0);
      expect(await widthOf(page, context, 'short', 'floor')).toBeCloseTo(unset, 0);
    });
  }

  for (const context of CONTEXTS) {
    test(`${context} parent: 320px wins over both the parent width and the 82% cap`, async ({
      page
    }) => {
      const over = messageAt(page, context, 'short', 'over');
      const box = await measure(over);

      expect(box.width).toBeCloseTo(320, 0);
      expect(box.width).toBeGreaterThan(PARENT_WIDTH);
      expect(await computedMinWidth(over)).toBe('320px');
    });
  }

  // A length replaces the automatic minimum as well as raising short messages: the content
  // can no longer hold the message wider than its parent.
  for (const context of ['row', 'grid'] as const) {
    test(`${context} parent: a floor also lets a message wider than the parent shrink to it`, async ({
      page
    }) => {
      expect(await widthOf(page, context, 'wide', 'unset')).toBeCloseTo(WIDE_CHILD_WIDTH, 0);

      const floor = messageAt(page, context, 'wide', 'floor');
      expect((await measure(floor)).width).toBeCloseTo(PARENT_WIDTH, 0);
      expect(await computedMinWidth(floor)).toBe('120px');
    });
  }

  test('the floor widens the message and leaves its height alone', async ({ page }) => {
    const unset = await measure(messageAt(page, 'row', 'short', 'unset'));
    const floor = await measure(messageAt(page, 'row', 'short', 'floor'));

    expect(floor.width).toBeGreaterThan(unset.width + 50);
    expect(floor.height).toBeCloseTo(unset.height, 0);
  });
});

// An app that already sets min-width on the message wrote its rule before the token
// existed, and its stylesheet is linked ahead of the library's. The declaration is in
// :where() so it has no specificity; were it to carry Svelte's scope class it would
// beat the app's rule whichever sheet comes first. The fixture places each rule first
// in the head to match.
test.describe('ChatMessage min-width: rules an app already has', () => {
  test('a class rule on the root wins over an unset token', async ({ page }) => {
    await openFixture(page, '.chat-message { min-width: 77px; }');

    const message = messageAt(page, 'row', 'short', 'unset');
    expect((await measure(message)).width).toBeCloseTo(77, 0);
    expect(await computedMinWidth(message)).toBe('77px');
  });

  test('a class rule on the root wins over a set token', async ({ page }) => {
    await openFixture(page, '.chat-message { min-width: 77px; }');

    const message = messageAt(page, 'row', 'short', 'floor');
    expect((await measure(message)).width).toBeCloseTo(77, 0);
    expect(await computedMinWidth(message)).toBe('77px');
  });

  test('a class rule of 0 keeps the shrink an app had, with the token unset', async ({ page }) => {
    await openFixture(page, '.chat-message { min-width: 0; }');

    for (const context of ['row', 'grid'] as const) {
      expect(await widthOf(page, context, 'wide', 'unset')).toBeCloseTo(PARENT_WIDTH, 0);
    }
  });

  // A rule inside a cascade layer loses to every unlayered declaration whatever its
  // specificity, so a library fallback of auto would have overridden it. revert-layer gives
  // the declaration up when the token is unset, and the layered rule decides.
  test('a class rule of 0 inside an @layer keeps the shrink an app had, with the token unset', async ({
    page
  }) => {
    await openFixture(page, '@layer app { .chat-message { min-width: 0; } }');

    for (const context of ['row', 'grid'] as const) {
      const message = messageAt(page, context, 'wide', 'unset');
      expect((await measure(message)).width).toBeCloseTo(PARENT_WIDTH, 0);
      expect(await computedMinWidth(message)).toBe('0px');
    }
  });

  test('a floor inside an @layer keeps winning over an unset token', async ({ page }) => {
    await openFixture(page, '@layer app { .chat-message { min-width: 77px; } }');

    const message = messageAt(page, 'row', 'short', 'unset');
    expect((await measure(message)).width).toBeCloseTo(77, 0);
    expect(await computedMinWidth(message)).toBe('77px');
  });

  test('a token that is set wins over a rule inside an @layer', async ({ page }) => {
    await openFixture(page, '@layer app { .chat-message { min-width: 77px; } }');

    const message = messageAt(page, 'row', 'short', 'floor');
    expect((await measure(message)).width).toBeCloseTo(120, 0);
    expect(await computedMinWidth(message)).toBe('120px');
  });

  test('a universal rule of 0 inside an @layer does not tie with the library, so it keeps the shrink', async ({
    page
  }) => {
    await openFixture(page, '@layer app { * { min-width: 0; } }');

    for (const context of ['row', 'grid'] as const) {
      expect(await widthOf(page, context, 'wide', 'unset')).toBeCloseTo(PARENT_WIDTH, 0);
    }
  });

  // The limit of :where(). A rule with no specificity of its own ties the library's, and
  // the library's is later, so it wins: an unset token is not a way to leave such a rule
  // alone. docs/ChatMessage.md says so and names the token as the way out.
  test('a universal rule of 0 ahead of the library is overridden by an unset token', async ({
    page
  }) => {
    await openFixture(page, '* { min-width: 0; }');

    expect(await widthOf(page, 'row', 'wide', 'unset')).toBeCloseTo(WIDE_CHILD_WIDTH, 0);
    expect(await widthOf(page, 'row', 'wide', 'zero')).toBeCloseTo(PARENT_WIDTH, 0);
  });
});

// <sui-chat-message> renders the same ChatMessage.svelte inside a shadow root, and the flex or
// grid item is the element itself, whose display is block and whose min-width is auto. The token
// is a custom property, so it crosses the root and sets the min-width of the message inside:
// that is what makes a floor work. It does not touch the element, so 0 on a parent leaves the
// element's own content-based minimum alone, and the way to let the element shrink is
// min-width: 0 on the element. dist-wc is a self-contained bundle rather than a route of the
// docs site, so it is injected into the fixture page. `pnpm run build` runs build:wc, so the
// file exists.
test.describe('<sui-chat-message> min-width', () => {
  const NO_CAP = '--chat-message-max-width: none;';
  const LONG_LINE = '0123456789'.repeat(40);

  const WC_PARENTS = {
    row: 'display:flex',
    grid: 'display:grid;grid-template-columns:1fr'
  } as const;

  type WcParent = keyof typeof WC_PARENTS;
  type WcOptions = {
    parent: WcParent;
    tokens: string;
    elementStyle?: string;
    codeLine?: boolean;
  };

  const openWc = async (page: Page): Promise<void> => {
    await openFixture(page);
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(
      () => typeof customElements.get('sui-chat-message') !== 'undefined',
      null,
      { timeout: 15_000 }
    );
  };

  const addElement = async (page: Page, id: string, options: WcOptions): Promise<void> => {
    await page.evaluate(
      ({ id, options, parentStyle, width, codeHtml }) => {
        const parent = document.createElement('div');
        parent.style.cssText = `${parentStyle};width:${width}px;${options.tokens}`;
        const element = document.createElement('sui-chat-message');
        if (options.codeLine === true) {
          element.setAttribute('role', 'responder');
          element.setAttribute('html', codeHtml);
        } else {
          element.setAttribute('role', 'sender');
          element.setAttribute('content', 'Ok');
        }
        element.setAttribute('data-pw', `wc-${id}`);
        if (typeof options.elementStyle === 'string') {
          element.style.cssText = options.elementStyle;
        }
        parent.append(element);
        document.body.append(parent);
      },
      {
        id,
        options,
        parentStyle: WC_PARENTS[options.parent],
        width: PARENT_WIDTH,
        codeHtml: `<pre>${LONG_LINE}</pre>`
      }
    );
    await expect(page.getByTestId(`wc-${id}`).locator('.chat-message')).toBeVisible();
  };

  const hostOf = (page: Page, id: string): Locator => page.getByTestId(`wc-${id}`);
  const innerOf = (page: Page, id: string): Locator => hostOf(page, id).locator('.chat-message');

  test('a length set on an ancestor raises the message inside the shadow root', async ({
    page
  }) => {
    await openWc(page);
    await addElement(page, 'floor', { parent: 'row', tokens: '--chat-message-min-width: 120px;' });

    expect(await computedMinWidth(innerOf(page, 'floor'))).toBe('120px');
    expect((await measure(innerOf(page, 'floor'))).width).toBeCloseTo(120, 0);
    expect((await measure(hostOf(page, 'floor'))).width).toBeCloseTo(120, 0);
  });

  test('with no token the message inside is as wide as its text', async ({ page }) => {
    await openWc(page);
    await addElement(page, 'plain', { parent: 'row', tokens: '' });

    expect(await computedMinWidth(innerOf(page, 'plain'))).toBe(AUTO_AS_COMPUTED.block);
    expect((await measure(innerOf(page, 'plain'))).width).toBeLessThan(100);
  });

  for (const parent of ['row', 'grid'] as const) {
    test(`${parent} parent: 0 on the parent reaches the message inside but does not shrink the element`, async ({
      page
    }) => {
      await openWc(page);
      await addElement(page, 'unset', { parent, tokens: NO_CAP, codeLine: true });
      await addElement(page, 'zero', {
        parent,
        tokens: `${NO_CAP} --chat-message-min-width: 0;`,
        codeLine: true
      });

      const unset = await measure(hostOf(page, 'unset'));
      expect(unset.width).toBeGreaterThan(PARENT_WIDTH * 5);

      expect(await computedMinWidth(innerOf(page, 'zero'))).toBe('0px');
      expect(await computedMinWidth(hostOf(page, 'zero'))).toBe('auto');
      expect((await measure(hostOf(page, 'zero'))).width).toBeCloseTo(unset.width, 0);
      expect((await measure(innerOf(page, 'zero'))).width).toBeCloseTo(unset.width, 0);
    });

    test(`${parent} parent: min-width: 0 on the element itself lets the message shrink to the parent`, async ({
      page
    }) => {
      await openWc(page);
      await addElement(page, 'shrunk', {
        parent,
        tokens: NO_CAP,
        elementStyle: 'min-width: 0',
        codeLine: true
      });

      expect((await measure(hostOf(page, 'shrunk'))).width).toBeCloseTo(PARENT_WIDTH, 0);
      expect((await measure(innerOf(page, 'shrunk'))).width).toBeCloseTo(PARENT_WIDTH, 0);
      expect(
        await hostOf(page, 'shrunk')
          .locator('pre')
          .evaluate((el) => el.scrollWidth > el.clientWidth)
      ).toBe(true);
    });
  }

  test('a floor still applies when min-width: 0 is on the element', async ({ page }) => {
    await openWc(page);
    await addElement(page, 'both', {
      parent: 'row',
      tokens: '--chat-message-min-width: 120px;',
      elementStyle: 'min-width: 0'
    });

    expect((await measure(innerOf(page, 'both'))).width).toBeCloseTo(120, 0);
    expect((await measure(hostOf(page, 'both'))).width).toBeCloseTo(120, 0);
  });
});
