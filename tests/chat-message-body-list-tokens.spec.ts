import { expect, test, type Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

// ChatMessage styles the <ul> and <ol> of its body from --chat-message-list-margin and
// --chat-message-list-padding. ChatMessageList reads --chat-message-list-padding for its own padding
// too, so a page that sets it to 0 for the list also removes the indent of every list inside a
// message. --chat-message-body-list-margin and --chat-message-body-list-padding are read first and
// fall back to the older names.
//
// What the spec pins:
//   - Unset, a list in a message is what it always was: 0.4em of margin above and below, 1.4em of
//     indent.
//   - The older names still work, so a page that already sets them is unchanged.
//   - The new tokens win over the older names, and with them a list can have no padding of its own
//     while the lists in its messages keep theirs.
//   - `<sui-chat-message>` takes them from the element, across its shadow root.

type ListState = {
  fontSize: number;
  marginTop: number;
  marginBottom: number;
  paddingLeft: number;
};

const openFixture = async (page: Page): Promise<void> => {
  await page.goto(`${fixtureBaseURL}/chat-message-body-list/`);
  await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
};

// Reads the first <ul> and <ol> under a root, in the light DOM or inside a shadow root.
const readLists = (page: Page, selector: string): Promise<{ ul: ListState; ol: ListState }> =>
  page.locator(selector).evaluate((root) => {
    const read = (tag: 'ul' | 'ol'): ListState => {
      const element = root.querySelector(tag);
      if (element === null) {
        throw new Error(`no <${tag}> under the root`);
      }
      const style = getComputedStyle(element);
      return {
        fontSize: parseFloat(style.fontSize),
        marginTop: parseFloat(style.marginTop),
        marginBottom: parseFloat(style.marginBottom),
        paddingLeft: parseFloat(style.paddingLeft)
      };
    };
    return { ul: read('ul'), ol: read('ol') };
  });

const messageLists = (page: Page, scenario: string): ReturnType<typeof readLists> =>
  readLists(page, `[data-pw="cbl-${scenario}-message"]`);

const paddingOfList = (page: Page, scenario: string): Promise<number> =>
  page
    .getByTestId(`cbl-${scenario}-list`)
    .evaluate((list) => parseFloat(getComputedStyle(list).paddingLeft));

test.describe('unset', () => {
  test('a list in a message has 0.4em of margin and 1.4em of indent', async ({ page }) => {
    await openFixture(page);
    const { ul, ol } = await messageLists(page, 'unset');

    for (const list of [ul, ol]) {
      expect(list.paddingLeft).toBeCloseTo(1.4 * list.fontSize, 1);
      expect(list.marginTop).toBeCloseTo(0.4 * list.fontSize, 1);
      expect(list.marginBottom).toBeCloseTo(0.4 * list.fontSize, 1);
    }
  });
});

test.describe('the older names', () => {
  test('--chat-message-list-padding still sets the indent', async ({ page }) => {
    await openFixture(page);
    const { ul, ol } = await messageLists(page, 'old-padding');

    expect([ul.paddingLeft, ol.paddingLeft]).toEqual([0, 0]);
  });

  test('--chat-message-list-margin still sets the margin', async ({ page }) => {
    await openFixture(page);
    const { ul, ol } = await messageLists(page, 'old-margin');

    for (const list of [ul, ol]) {
      expect(list.marginTop).toBeCloseTo(list.fontSize, 1);
      expect(list.marginBottom).toBeCloseTo(list.fontSize, 1);
    }
  });
});

test.describe('the body-list tokens', () => {
  test('--chat-message-body-list-padding sets the indent', async ({ page }) => {
    await openFixture(page);
    const { ul, ol } = await messageLists(page, 'new-padding');

    for (const list of [ul, ol]) {
      expect(list.paddingLeft).toBeCloseTo(2 * list.fontSize, 1);
    }
  });

  test('--chat-message-body-list-margin sets the margin', async ({ page }) => {
    await openFixture(page);
    const { ul, ol } = await messageLists(page, 'new-margin');

    for (const list of [ul, ol]) {
      expect(list.marginTop).toBeCloseTo(list.fontSize, 1);
      expect(list.marginBottom).toBeCloseTo(list.fontSize, 1);
    }
  });

  test('they win over the older names', async ({ page }) => {
    await openFixture(page);
    const { ul, ol } = await messageLists(page, 'new-wins');

    for (const list of [ul, ol]) {
      expect(list.paddingLeft).toBeCloseTo(1.4 * list.fontSize, 1);
      expect(list.marginTop).toBeCloseTo(0.4 * list.fontSize, 1);
    }
  });
});

test.describe('inside a ChatMessageList', () => {
  test('a list with no padding of its own keeps the indent of the lists in its messages', async ({
    page
  }) => {
    await openFixture(page);
    const { ul, ol } = await readLists(page, '[data-pw="cbl-in-list-list"]');

    expect(await paddingOfList(page, 'in-list')).toBe(0);
    for (const list of [ul, ol]) {
      expect(list.paddingLeft).toBeCloseTo(1.4 * list.fontSize, 1);
    }
  });

  test('with only the older name set, the one value reaches both, as it always did', async ({
    page
  }) => {
    await openFixture(page);
    const { ul, ol } = await readLists(page, '[data-pw="cbl-in-list-old-list"]');

    expect(await paddingOfList(page, 'in-list-old')).toBe(0);
    expect([ul.paddingLeft, ol.paddingLeft]).toEqual([0, 0]);
  });
});

// dist-wc is a self-contained bundle rather than a route of the fixture app, so the spec injects it
// after navigating, as tests/chat-message-list-scroll-tokens.spec.ts does. Run `pnpm run build:wc`
// first; `pnpm run build` does.
test.describe('<sui-chat-message>', () => {
  const loadBundle = async (page: Page): Promise<void> => {
    await openFixture(page);
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(
      () => typeof customElements.get('sui-chat-message') !== 'undefined',
      null,
      { timeout: 15_000 }
    );
  };

  const mountElement = async (page: Page, style: string): Promise<void> => {
    await page.evaluate((hostStyle) => {
      const element = document.createElement('sui-chat-message');
      element.id = 'wc-message';
      element.style.cssText = `display:block;width:360px;${hostStyle}`;
      element.setAttribute('role', 'assistant');
      element.setAttribute('html', '<ul><li>One</li></ul><ol><li>First</li></ol>');
      document.body.append(element);
    }, style);
    await expect(page.locator('#wc-message ul')).toBeVisible();
  };

  test('an unset element keeps the 1.4em indent', async ({ page }) => {
    await loadBundle(page);
    await mountElement(page, '');
    const { ul } = await readLists(page, '#wc-message .body');

    expect(ul.paddingLeft).toBeCloseTo(1.4 * ul.fontSize, 1);
  });

  test('the tokens set on the element reach the lists inside its shadow root', async ({ page }) => {
    await loadBundle(page);
    await mountElement(
      page,
      '--chat-message-list-padding:0;--chat-message-body-list-padding:2em;' +
        '--chat-message-body-list-margin:1em 0'
    );
    const { ul, ol } = await readLists(page, '#wc-message .body');

    for (const list of [ul, ol]) {
      expect(list.paddingLeft).toBeCloseTo(2 * list.fontSize, 1);
      expect(list.marginTop).toBeCloseTo(list.fontSize, 1);
    }
  });
});
