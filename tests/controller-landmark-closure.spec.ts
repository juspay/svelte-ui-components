import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

for (const route of ['pagination', 'table', 'breadcrumb', 'attachment-chip-row', 'scroller']) {
  test(`${route} examples expose distinct contextual landmark names`, async ({ page }) => {
    await gotoHydrated(page, `/components/${route}`);
    const main = page.locator('main');
    const landmarks = main.getByRole('navigation').or(main.getByRole('region'));
    expect(await landmarks.count()).toBeGreaterThan(0);
    const names: string[] = [];
    for (const landmark of await landmarks.all()) {
      const label = await landmark.getAttribute('aria-label');
      expect(label?.trim()).toBeTruthy();
      await expect(landmark).toHaveAccessibleName(label ?? '');
      const role = await landmark.evaluate((element) =>
        element.tagName === 'NAV' ? 'navigation' : element.getAttribute('role')
      );
      names.push(`${role}:${label}`);
    }
    expect(new Set(names).size).toBe(names.length);
  });
}

test('named pagination remains independently operable', async ({ page }) => {
  await gotoHydrated(page, '/components/pagination');
  const pages = page.getByRole('navigation', { name: 'Numbered pages', exact: true });
  await pages.getByRole('button', { name: 'Page 2', exact: true }).click();
  await expect(pages.getByRole('button', { name: 'Page 2', exact: true })).toHaveAttribute(
    'aria-current',
    'page'
  );
  await expect(page.getByRole('navigation', { name: 'Cursor pages', exact: true })).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`overflowing read-only transcript can be reached and scrolled by real keyboard (${theme})`, async ({
    page
  }) => {
    await gotoHydrated(page, '/components/chat');
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, theme);
    const log = page
      .getByTestId('chat-scroll-policy-pin')
      .getByRole('log', { name: 'Pinned conversation transcript', exact: true });
    await log.evaluate((element) => {
      const before = document.createElement('input');
      before.id = 'transcript-before';
      before.placeholder = 'Before transcript';
      const after = document.createElement('input');
      after.id = 'transcript-after';
      after.placeholder = 'After transcript';
      element.before(before);
      element.after(after);
    });
    await page.locator('#transcript-before').click();
    await page.keyboard.press('Tab');
    await expect(log).toBeFocused();
    const oldOffset = await log.evaluate((element) => element.scrollTop);
    expect(await log.evaluate((element) => element.scrollHeight)).toBeGreaterThan(
      await log.evaluate((element) => element.clientHeight)
    );
    await page.keyboard.press('PageDown');
    await expect
      .poll(() => log.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(oldOffset);
    const style = await log.evaluate((element) => ({
      style: getComputedStyle(element).outlineStyle,
      width: parseFloat(getComputedStyle(element).outlineWidth)
    }));
    expect(style.style).toBe('solid');
    expect(style.width).toBeGreaterThanOrEqual(2);
    await page.keyboard.press('Tab');
    await expect(page.locator('#transcript-after')).toBeFocused();
  });
}

test('WC transcript enters and leaves Tab order with actual overflow and honors its name', async ({
  page
}) => {
  await gotoHydrated(page, '/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => Boolean(customElements.get('sui-chat-message-list')));
  await page.evaluate(() => {
    const host = document.createElement('sui-chat-message-list');
    host.id = 'transcript-wc';
    host.style.cssText = 'display:flex;flex-direction:column;height:180px;max-height:180px';
    host.setAttribute('aria-label', 'Order discussion');
    Object.assign(host, { messages: [], jump: false, autoscroll: false });
    const before = document.createElement('input');
    before.id = 'transcript-wc-before';
    const after = document.createElement('input');
    after.id = 'transcript-wc-after';
    document.querySelector('main')?.prepend(before, host, after);
  });
  const host = page.locator('#transcript-wc');
  const log = host.getByRole('log', { name: 'Order discussion', exact: true });
  await expect(log).not.toHaveAttribute('tabindex');
  await page.locator('#transcript-wc-before').click();
  await page.keyboard.press('Tab');
  await expect(page.locator('#transcript-wc-after')).toBeFocused();
  await host.evaluate((element) =>
    Object.assign(element, {
      messages: Array.from({ length: 20 }, (_, index) => ({
        id: `message-${index}`,
        role: 'responder',
        content: `Order discussion message ${index + 1}. `.repeat(10)
      }))
    })
  );
  expect(await log.evaluate((element) => element.scrollHeight)).toBeGreaterThan(
    await log.evaluate((element) => element.clientHeight)
  );
  await expect(log).toHaveAttribute('tabindex', '0');
  await page.locator('#transcript-wc-before').click();
  await page.keyboard.press('Tab');
  await expect(log).toBeFocused();
  const fitHeight = await log.evaluate((element) => element.scrollHeight + 80);
  await host.evaluate((element, height) => {
    element.style.height = `${height}px`;
    element.style.maxHeight = `${height}px`;
  }, fitHeight);
  await expect
    .poll(() => log.evaluate((element) => element.scrollHeight <= element.clientHeight + 1))
    .toBe(true);
  await expect(log).not.toHaveAttribute('tabindex');
  await page.locator('#transcript-wc-before').click();
  await page.keyboard.press('Tab');
  await expect(page.locator('#transcript-wc-after')).toBeFocused();
  await host.evaluate((element) => {
    element.style.height = '180px';
    element.style.maxHeight = '180px';
  });
  await expect
    .poll(() => log.evaluate((element) => element.scrollHeight > element.clientHeight + 1))
    .toBe(true);
  await expect(log).toHaveAttribute('tabindex', '0');
  await page.locator('#transcript-wc-before').click();
  await page.keyboard.press('Tab');
  await expect(log).toBeFocused();
  await page.keyboard.press('PageDown');
  await expect.poll(() => log.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await host.evaluate((element) => Object.assign(element, { messages: [] }));
  await expect(log).not.toHaveAttribute('tabindex');
});
