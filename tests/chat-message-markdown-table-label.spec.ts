import { expect, test } from '@playwright/test';
import { renderMarkdown } from '../src/lib/MarkdownText/markdown';
import { gotoHydrated } from './support/hydrated';

const table = '| Status | Count |\n| --- | --- |\n| Paid | 11 |';

test('direct markdown names its original table wrapper and keeps real Tab, scroll and fit', async ({
  page
}) => {
  await gotoHydrated(page, '/components/markdown-text');
  const message = page.getByTestId('markdown-text-chat-message');
  const wrapper = message.locator('.markdown-table-wrapper');
  await expect(wrapper).toHaveAccessibleName('Order summary in assistant message');
  await expect(wrapper.getByRole('columnheader', { name: 'Status', exact: true })).toBeVisible();
  await expect(wrapper.getByRole('cell', { name: 'Paid', exact: true })).toBeVisible();
  await expect
    .poll(() => wrapper.evaluate((node) => node.scrollWidth <= node.clientWidth))
    .toBe(true);
  await wrapper.evaluate((node) => {
    const before = document.createElement('button');
    before.id = 'named-table-before';
    before.textContent = 'Before original message table';
    node.before(before);
  });
  await page.locator('#named-table-before').click();
  await page.keyboard.press('Tab');
  await expect(wrapper).toBeFocused();
  // The original short table fits even at a narrow width because its text wraps.
  // Exercise real overflow using a separate consumer of the direct markdown API.
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-chat-message')));
  await page.evaluate(() => {
    const before = document.createElement('button');
    before.id = 'wide-table-before';
    before.textContent = 'Before wide message table';
    const frame = document.createElement('div');
    frame.id = 'wide-table-frame';
    frame.style.width = '100px';
    const host = document.createElement('sui-chat-message');
    host.id = 'wide-named-message';
    host.style.cssText =
      'display:block;width:100%;--chat-message-max-width:100%;--chat-message-min-width:0px';
    Object.assign(host, {
      chatMessageRole: 'responder',
      markdown:
        '| A | B | C | D | E | F | G | H |\n' +
        '| --- | --- | --- | --- | --- | --- | --- | --- |\n' +
        '| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |',
      markdownTableLabel: 'Wide order summary'
    });
    frame.append(host);
    document.querySelector('main')?.prepend(before, frame);
  });
  const wideWrapper = page.locator('#wide-named-message .markdown-table-wrapper');
  await expect(wideWrapper).toHaveAccessibleName('Wide order summary');
  await expect
    .poll(() => wideWrapper.evaluate((node) => node.scrollWidth - node.clientWidth))
    .toBeGreaterThan(20);
  await page.locator('#wide-table-before').click();
  await page.keyboard.press('Tab');
  await expect(wideWrapper).toBeFocused();
  const oldOffset = await wideWrapper.evaluate((node) => node.scrollLeft);
  await page.keyboard.down('ArrowRight');
  await expect
    .poll(() => wideWrapper.evaluate((node) => node.scrollLeft))
    .toBeGreaterThan(oldOffset);
  await page.keyboard.up('ArrowRight');
  await page.locator('#wide-table-frame').evaluate((node) => {
    node.style.width = '600px';
  });
  await expect
    .poll(() => wideWrapper.evaluate((node) => node.scrollWidth <= node.clientWidth))
    .toBe(true);
  await expect(wideWrapper).toHaveAccessibleName('Wide order summary');
});

test('built WC preserves raw defaults and supports escaped, localized, late and empty labels', async ({
  page
}) => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-chat-message')));
  await page.evaluate((markdown) => {
    const host = document.createElement('sui-chat-message');
    host.id = 'named-wc-message';
    Object.assign(host, { chatMessageRole: 'responder', markdown });
    document.querySelector('main')?.prepend(host);
  }, table);
  const host = page.locator('#named-wc-message');
  const wrapper = host.locator('.markdown-table-wrapper');
  await expect(wrapper).toBeVisible();
  await expect(wrapper).not.toHaveAttribute('role');
  expect(await wrapper.evaluate((node) => node.outerHTML)).toBe(renderMarkdown(table).trim());
  const label = 'Orders "<review>" & totals';
  await host.evaluate((node, name) => Reflect.set(node, 'markdownTableLabel', name), label);
  await expect(wrapper).toHaveAccessibleName(label);
  await expect(wrapper).toHaveAttribute('role', 'region');
  await expect(host.locator('script, [onmouseover], img')).toHaveCount(0);
  await host.evaluate((node) => node.setAttribute('markdown-table-label', 'Résumé des commandes'));
  await expect(wrapper).toHaveAccessibleName('Résumé des commandes');
  await host.evaluate((node) => Reflect.set(node, 'markdownTableLabel', ''));
  await expect(wrapper).not.toHaveAttribute('role');
  expect(await wrapper.evaluate((node) => node.outerHTML)).toBe(renderMarkdown(table).trim());
});

test('built WC keeps localized table context through progressive growth and settlement', async ({
  page
}) => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-chat-message')));
  await page.evaluate((markdown) => {
    const host = document.createElement('sui-chat-message');
    host.id = 'streamed-wc-message';
    Object.assign(host, {
      chatMessageRole: 'responder',
      markdown,
      markdownTableLabel: 'Streamed order summary',
      typewriter: true,
      typewriterSpeed: 1,
      streaming: true
    });
    document.querySelector('main')?.prepend(host);
  }, table);
  const host = page.locator('#streamed-wc-message');
  await expect(host.locator('tbody')).toContainText('Paid');
  await expect(host.locator('.markdown-table-wrapper')).toHaveAccessibleName(
    'Streamed order summary'
  );
  await host.evaluate((node, markdown) => {
    Reflect.set(node, 'markdown', markdown);
    Reflect.set(node, 'markdownTableLabel', 'Commandes en direct');
  }, `${table}\n| COD | 1 |`);
  await expect(host.locator('tbody')).toContainText('COD');
  await expect(host.locator('.markdown-table-wrapper')).toHaveAccessibleName('Commandes en direct');
  await expect(host.locator('.body')).toHaveAttribute('aria-busy', 'true');
  await host.evaluate((node) => Reflect.set(node, 'streaming', false));
  await expect(host.locator('.body')).not.toHaveAttribute('aria-busy');
  await expect(host.locator('.markdown-table-wrapper')).toHaveAccessibleName('Commandes en direct');
});

test('built WC message data threads the same context through streamed ChatMessageList', async ({
  page
}) => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-chat-message-list')));
  await page.evaluate((markdown) => {
    const host = document.createElement('sui-chat-message-list');
    host.id = 'named-wc-message-list';
    Object.assign(host, {
      messages: [
        {
          id: 'order-table',
          role: 'assistant',
          content: '',
          markdown,
          markdownTableLabel: 'Conversation order summary',
          streaming: true,
          typewriter: true,
          typewriterSpeed: 1
        }
      ]
    });
    document.querySelector('main')?.prepend(host);
  }, table);
  const wrapper = page.locator('#named-wc-message-list .markdown-table-wrapper');
  await expect(wrapper).toHaveAccessibleName('Conversation order summary');
  await expect(wrapper.locator('tbody')).toContainText('Paid');
});
