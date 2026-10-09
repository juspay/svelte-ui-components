import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';
import { gotoHydrated } from './support/hydrated';

type Direction = 'ltr' | 'rtl';
const metrics = (bar: Locator) =>
  bar.evaluate((node) => ({
    left: node.scrollLeft,
    range: node.scrollWidth - node.clientWidth,
    direction: getComputedStyle(node).direction
  }));

async function traverseBounds(page: Page, owner: Locator, direction: Direction): Promise<void> {
  const bar = owner.locator('.tabs-bar');
  const outward = direction === 'rtl' ? 'left' : 'right';
  const inward = direction === 'rtl' ? 'right' : 'left';
  const arrow = (edge: string) =>
    owner.getByRole('button', { name: `Scroll tabs ${edge}`, exact: true });
  await expect.poll(async () => (await metrics(bar)).range).toBeGreaterThan(100);
  await expect.poll(async () => (await metrics(bar)).left).toBe(0);
  await expect(arrow(outward)).toBeVisible();
  await expect(arrow(inward)).toHaveCount(0);

  await arrow(outward).click();
  await expect
    .poll(async () => (await metrics(bar)).left * (direction === 'rtl' ? -1 : 1))
    .toBeGreaterThan(1);
  await expect(arrow('left')).toBeVisible();
  await expect(arrow('right')).toBeVisible();

  // A native wheel input can be capped to one scroll-box step (Firefox). Repeat
  // real inputs until the edge rather than treating its delta as a scroll setter.
  for (let attempt = 0; attempt < 16; attempt++) {
    const value = await metrics(bar);
    if (Math.abs(Math.abs(value.left) - value.range) <= 1) {
      break;
    }
    await bar.hover();
    await page.mouse.wheel(direction === 'rtl' ? -4000 : 4000, 0);
    await expect
      .poll(async () => Math.abs((await metrics(bar)).left - value.left))
      .toBeGreaterThan(1);
  }
  await expect
    .poll(async () => {
      const value = await metrics(bar);
      return Math.abs(Math.abs(value.left) - value.range);
    })
    .toBeLessThanOrEqual(1);
  await expect(arrow(outward)).toHaveCount(0);
  await expect(arrow(inward)).toBeVisible();
  await expect(owner.getByRole('tab').last()).toBeInViewport();

  const end = (await metrics(bar)).left;
  await arrow(inward).click();
  await expect
    .poll(async () => Math.abs((await metrics(bar)).left))
    .toBeLessThan(Math.abs(end) - 1);
  await expect(arrow('left')).toBeVisible();
  await expect(arrow('right')).toBeVisible();
  for (let attempt = 0; attempt < 16; attempt++) {
    const value = await metrics(bar);
    if (Math.abs(value.left) <= 1) {
      break;
    }
    await bar.hover();
    await page.mouse.wheel(direction === 'rtl' ? 4000 : -4000, 0);
    await expect
      .poll(async () => Math.abs((await metrics(bar)).left - value.left))
      .toBeGreaterThan(1);
  }
  // The absolute underline can extend the browser's edge by one CSS pixel.
  // The first tab and the unavailable reverse arrow still pin the real boundary.
  await expect.poll(async () => Math.abs((await metrics(bar)).left)).toBeLessThanOrEqual(1);
  await expect(arrow(outward)).toBeVisible();
  await expect(arrow(inward)).toHaveCount(0);
  await expect(owner.getByRole('tab').first()).toBeInViewport();
}

for (const direction of ['ltr', 'rtl'] as const) {
  test(`${direction} source arrows traverse real physical bounds and wheel remains operable`, async ({
    page
  }) => {
    await gotoHydrated(page, `${fixtureBaseURL}/tabs-scroll-bounds/?direction=${direction}`);
    const owner = page.getByTestId('bounds-demo');
    await expect(owner.locator('.tabs-bar')).toHaveCSS('direction', direction);
    await traverseBounds(page, owner, direction);
    await expect(page.getByTestId('selection')).toHaveText('Selected: 0');
  });

  test(`${direction} fit has no arrow tab stop and responds to viewport, content and font changes`, async ({
    page
  }) => {
    await gotoHydrated(
      page,
      `${fixtureBaseURL}/tabs-scroll-bounds/?direction=${direction}&kind=fit`
    );
    const owner = page.getByTestId('bounds-demo');
    const arrows = owner.locator('button.tabs-arrow');
    await expect(arrows).toHaveCount(0);
    await page.getByTestId('before-tabs').click();
    await page.keyboard.press('Tab');
    await expect(owner.getByRole('tab', { name: 'Alpha', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('expand-items')).toBeFocused();

    await page.setViewportSize({ width: 220, height: 800 });
    await expect
      .poll(async () => (await metrics(owner.locator('.tabs-bar'))).range)
      .toBeGreaterThan(1);
    await expect(arrows).toHaveCount(1);
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(arrows).toHaveCount(0);

    await page.getByTestId('expand-items').click();
    await expect(owner.getByRole('tab')).toHaveCount(12);
    await expect(arrows).toHaveCount(1);
    await page.setViewportSize({ width: 2600, height: 800 });
    await page.getByTestId('wide').click();
    await expect
      .poll(async () => (await metrics(owner.locator('.tabs-bar'))).range)
      .toBeLessThanOrEqual(1);
    await expect(arrows).toHaveCount(0);
    await page.getByTestId('narrow').click();
    await expect(arrows).toHaveCount(1);
    await page.getByTestId('large-type').click();
    await expect(owner.getByRole('tab').first()).toHaveCSS('font-size', '24px');
    await expect
      .poll(async () => (await metrics(owner.locator('.tabs-bar'))).range)
      .toBeGreaterThan(100);
    await page.getByTestId('normal-type').click();
    await page.getByTestId('fit-items').click();
    await page.getByTestId('wide').click();
    await expect(owner.getByRole('tab')).toHaveCount(3);
    await expect(arrows).toHaveCount(0);
  });

  test(`${direction} public WC offers only operable arrows at the physical edges`, async ({
    page
  }) => {
    await gotoHydrated(page, `${fixtureBaseURL}/tabs-scroll-bounds/?kind=fit`);
    await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
    await page.evaluate(async (dir) => {
      await customElements.whenDefined('sui-tabs');
      const host = document.createElement('sui-tabs') as HTMLElement & {
        items: string[];
        activeIndex: number;
      };
      host.dataset.pw = 'public-scroll-bounds';
      host.dir = dir;
      host.style.cssText = 'display:block;width:220px;margin-top:12px';
      host.items = Array.from({ length: 12 }, (_, index) => `Audit tab ${index + 1}`);
      host.activeIndex = 0;
      document.body.append(host);
    }, direction);
    const owner = page.getByTestId('public-scroll-bounds');
    await expect(owner.getByRole('tab')).toHaveCount(12);
    await expect(owner.locator('.tabs-bar')).toHaveCSS('direction', direction);
    await traverseBounds(page, owner, direction);
  });
}
