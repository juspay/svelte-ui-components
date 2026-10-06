import { expect, test, type Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

// Chat wraps ChatMessageList and forwards pinHold, scrollPolicy and the jump controls to it. Its
// hideScrollbar prop (the `hide-scrollbar` attribute of <sui-chat>) is forwarded the same way, so an
// app that renders Chat can hide the message list's scrollbar without a rule that reaches into it.
//
// What the spec pins:
//   - Chat without the prop renders the list as it did, with no `hide-scrollbar` class.
//   - With it, the list carries the class and its scrollbar is hidden.
//   - <sui-chat> takes it as an attribute and as a property, and both can be turned off again.

const openFixture = async (page: Page): Promise<void> => {
  await page.goto(`${fixtureBaseURL}/chat-hide-scrollbar/`);
  await page.waitForFunction(() => document.documentElement.dataset.fixtureReady === 'true');
};

const scrollbarWidthOf = (page: Page, selector: string): Promise<string> =>
  page.locator(selector).evaluate((list) => getComputedStyle(list).scrollbarWidth);

test.describe('Chat', () => {
  test('without the prop the message list keeps its scrollbar', async ({ page, browserName }) => {
    await openFixture(page);
    const list = page.locator('[data-pw="chs-default"] .chat-message-list');

    await expect(list).toBeVisible();
    await expect(list).not.toHaveClass(/hide-scrollbar/);
    if (browserName !== 'firefox') {
      expect(await scrollbarWidthOf(page, '[data-pw="chs-default"] .chat-message-list')).not.toBe(
        'none'
      );
    }
  });

  test('with hideScrollbar the message list carries the class and hides its scrollbar', async ({
    page,
    browserName
  }) => {
    await openFixture(page);
    const list = page.locator('[data-pw="chs-hidden"] .chat-message-list');

    await expect(list).toHaveClass(/hide-scrollbar/);
    if (browserName !== 'firefox') {
      expect(await scrollbarWidthOf(page, '[data-pw="chs-hidden"] .chat-message-list')).toBe(
        'none'
      );
    }
    // Hiding the scrollbar must not stop the list from scrolling.
    await expect
      .poll(() => list.evaluate((element) => element.scrollHeight > element.clientHeight))
      .toBe(true);
  });
});

// dist-wc is a self-contained bundle rather than a route of the fixture app, so the spec injects it
// after navigating, as tests/chat-message-list-scroll-tokens.spec.ts does. Run `pnpm run build:wc`
// first; `pnpm run build` does.
test.describe('<sui-chat>', () => {
  const loadBundle = async (page: Page): Promise<void> => {
    await openFixture(page);
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.waitForFunction(() => typeof customElements.get('sui-chat') !== 'undefined', null, {
      timeout: 15_000
    });
  };

  const mountElement = async (page: Page, attributes: Record<string, string>): Promise<void> => {
    await page.evaluate((attributeMap) => {
      const element = document.createElement('sui-chat');
      element.id = 'wc-chat';
      element.style.cssText = 'display:block;width:360px;height:360px';
      for (const [name, value] of Object.entries(attributeMap)) {
        element.setAttribute(name, value);
      }
      Object.assign(element, {
        messages: Array.from({ length: 12 }, (_, index) => ({
          id: `wc-${index}`,
          role: index % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${index}`
        }))
      });
      document.body.append(element);
    }, attributes);
    await expect(page.locator('#wc-chat .chat-message-list')).toBeVisible();
  };

  test('an element without the attribute keeps the scrollbar', async ({ page }) => {
    await loadBundle(page);
    await mountElement(page, {});

    await expect(page.locator('#wc-chat .chat-message-list')).not.toHaveClass(/hide-scrollbar/);
  });

  test('the hide-scrollbar attribute and the hideScrollbar property reach the message list', async ({
    page
  }) => {
    await loadBundle(page);
    await mountElement(page, { 'hide-scrollbar': '' });
    const list = page.locator('#wc-chat .chat-message-list');

    await expect(list).toHaveClass(/hide-scrollbar/);

    await page.evaluate(() => {
      Object.assign(document.getElementById('wc-chat') ?? {}, { hideScrollbar: false });
    });
    await expect(list).not.toHaveClass(/hide-scrollbar/);

    await page.evaluate(() => {
      Object.assign(document.getElementById('wc-chat') ?? {}, { hideScrollbar: true });
    });
    await expect(list).toHaveClass(/hide-scrollbar/);
  });
});
