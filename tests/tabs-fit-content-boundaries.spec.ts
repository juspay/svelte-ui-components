import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';
import { gotoHydrated } from './support/hydrated';

const arrowButtons = (owner: Locator) => owner.locator('button.tabs-arrow');
const sizes = (owner: Locator) =>
  owner.locator('.tabs-bar').evaluate((node) => ({
    client: node.clientWidth,
    scroll: node.scrollWidth,
    height: node.getBoundingClientRect().height
  }));
const fitting = async (owner: Locator): Promise<void> => {
  await expect
    .poll(async () => {
      const value = await sizes(owner);
      return value.scroll - value.client;
    })
    .toBeLessThanOrEqual(1);
  await expect(arrowButtons(owner)).toHaveCount(0);
};

const nativeLayout = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );
const indicatorStyle = (owner: Locator) => owner.locator('.tabs-indicator').getAttribute('style');
const alignedIndicator = async (owner: Locator, vertical = false): Promise<void> => {
  await expect
    .poll(async () => {
      const indicator = await owner.locator('.tabs-indicator').boundingBox();
      const active = await owner.locator('[role="tab"][aria-selected="true"]').boundingBox();
      if (indicator === null || active === null) {
        return Number.POSITIVE_INFINITY;
      }
      return Math.abs(vertical ? indicator.y - active.y : indicator.x - active.x);
    })
    .toBeLessThanOrEqual(1);
};

for (const direction of ['ltr', 'rtl']) {
  test(`${direction} source content and font shrink fit without changing the fixed width`, async ({
    page
  }) => {
    await gotoHydrated(
      page,
      `${fixtureBaseURL}/tabs-scroll-bounds/?direction=${direction}&width=220`
    );
    const owner = page.getByTestId('bounds-demo');
    await expect(arrowButtons(owner)).toHaveCount(1);
    const firstTab = owner.getByRole('tab').first();
    await page.getByTestId('before-tabs').click();
    for (let stop = 0; stop < 3; stop += 1) {
      await page.keyboard.press('Tab');
      if (await firstTab.evaluate((node) => document.activeElement === node)) {
        break;
      }
    }
    await expect(firstTab).toBeFocused();
    const originalTab = await firstTab.elementHandle();
    await page.keyboard.press('r');
    await expect(owner.getByRole('tab')).toHaveText(['Alpha', 'Beta', 'Gamma']);
    await fitting(owner);
    await expect(owner.getByRole('tab', { name: 'Alpha', exact: true })).toBeFocused();
    expect(await firstTab.evaluate((node, previous) => node === previous, originalTab)).toBe(true);
    await page.getByTestId('large-type').click();
    await expect(arrowButtons(owner)).toHaveCount(1);
    await page.getByTestId('normal-type').click();
    await fitting(owner);
    await expect(owner).toHaveCSS('width', '220px');
    await page.getByTestId('before-tabs').click();
    await page.keyboard.press('Tab');
    await expect(owner.getByRole('tab', { name: 'Alpha', exact: true })).toBeFocused();
    await page.keyboard.press('q');
    await expect(owner.getByRole('tab')).toHaveText(['A "B"', '東京', 'Été']);
    await fitting(owner);
    await expect(owner.getByRole('tab', { name: 'A "B"', exact: true })).toBeFocused();
    expect(await firstTab.evaluate((node, previous) => node === previous, originalTab)).toBe(true);
    await page.keyboard.press('ArrowRight');
    await expect(
      owner.getByRole('tab', { name: direction === 'rtl' ? 'Été' : '東京', exact: true })
    ).toBeFocused();
    await alignedIndicator(owner);
    const measured = await indicatorStyle(owner);
    await page.getByTestId('zero-axis').click();
    await nativeLayout(page);
    expect(await owner.locator('.tabs-bar').evaluate((node) => node.clientWidth)).toBe(0);
    expect(await indicatorStyle(owner)).toBe(measured);
    await page.getByTestId('restore-axis').click();
    await fitting(owner);
    await alignedIndicator(owner);
    const visible = await indicatorStyle(owner);
    await page.getByTestId('hide-tabs').click();
    await nativeLayout(page);
    expect(await indicatorStyle(owner)).toBe(visible);
    await page.getByTestId('show-tabs').click();
    await fitting(owner);
    await alignedIndicator(owner);
    await page.getByTestId('expand-items').click();
    await owner.getByRole('tab', { name: 'Audit tab 12', exact: true }).click();
    await page.getByTestId('fit-selected-items').click();
    await fitting(owner);
    await expect(owner.getByRole('tab', { name: 'Beta', exact: true })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await alignedIndicator(owner);
  });

  test(`${direction} width-only weight and padding changes update arrows at unchanged bar height`, async ({
    page
  }) => {
    await gotoHydrated(
      page,
      `${fixtureBaseURL}/tabs-scroll-bounds/?direction=${direction}&kind=fit&width=210`
    );
    const owner = page.getByTestId('bounds-demo');
    await fitting(owner);
    const initial = await sizes(owner);
    await page.getByTestId('heavy-weight').click();
    await expect(arrowButtons(owner)).toHaveCount(1);
    expect((await sizes(owner)).height).toBeCloseTo(initial.height, 3);
    await page.getByTestId('normal-weight').click();
    await fitting(owner);
    await page.getByTestId('wide-padding').click();
    await expect(arrowButtons(owner)).toHaveCount(1);
    expect((await sizes(owner)).height).toBeCloseTo(initial.height, 3);
    await page.getByTestId('normal-padding').click();
    await fitting(owner);
  });

  test(`${direction} public WC fixed-width content and supported font tokens clear gutters`, async ({
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
      host.dataset.pw = 'fit-public-tabs';
      host.dir = dir;
      host.style.cssText = 'display:block;width:220px;--tabs-active-font-weight:400';
      host.items = Array.from({ length: 12 }, (_, index) => `Audit tab ${index + 1}`);
      host.activeIndex = 0;
      document.body.append(host);
    }, direction);
    const owner = page.getByTestId('fit-public-tabs');
    await expect(owner.getByRole('tab')).toHaveCount(12);
    await expect(arrowButtons(owner)).toHaveCount(1);
    await owner.getByRole('tab').first().click();
    const firstTab = await owner.getByRole('tab').first().elementHandle();
    await owner.evaluate((host: HTMLElement & { items?: string[] }) => {
      host.items = ['Alpha', 'Beta', 'Gamma'];
    });
    await expect(owner.getByRole('tab')).toHaveText(['Alpha', 'Beta', 'Gamma']);
    await fitting(owner);
    await expect(owner.getByRole('tab', { name: 'Alpha', exact: true })).toBeFocused();
    expect(
      await owner
        .getByRole('tab')
        .first()
        .evaluate((node, previous) => node === previous, firstTab)
    ).toBe(true);
    await owner.evaluate((host) => host.style.removeProperty('--tabs-active-font-weight'));
    const witness = owner.getByRole('tab', { name: 'Gamma', exact: true });
    const beforeSelection = await witness.boundingBox();
    await owner.getByRole('tab', { name: 'Beta', exact: true }).click();
    expect((await witness.boundingBox())?.x).toBe(beforeSelection?.x);
    await owner.evaluate((host: HTMLElement & { items?: string[] }) => {
      host.items = ['A "B"', '東京', 'Été'];
    });
    await expect(owner.getByRole('tab')).toHaveText(['A "B"', '東京', 'Été']);
    await expect(owner.getByRole('tab', { name: '東京', exact: true })).toBeFocused();
    await fitting(owner);
    await owner.evaluate((host) => host.style.setProperty('--tabs-active-font-weight', '400'));
    await owner.evaluate((host) => host.style.setProperty('--tabs-item-padding', '12px 28px'));
    await expect(arrowButtons(owner)).toHaveCount(1);
    await owner.evaluate((host) => host.style.setProperty('--tabs-item-padding', '12px 16px'));
    await fitting(owner);
    await alignedIndicator(owner);
    const measured = await indicatorStyle(owner);
    await owner.evaluate((host) => (host.style.width = '0px'));
    await nativeLayout(page);
    expect(await owner.locator('.tabs-bar').evaluate((node) => node.clientWidth)).toBe(0);
    expect(await indicatorStyle(owner)).toBe(measured);
    await owner.evaluate((host) => (host.style.width = '220px'));
    await fitting(owner);
    await alignedIndicator(owner);
    const visible = await indicatorStyle(owner);
    await owner.evaluate((host) => (host.style.display = 'none'));
    await nativeLayout(page);
    expect(await indicatorStyle(owner)).toBe(visible);
    await owner.evaluate((host) => (host.style.display = 'block'));
    await fitting(owner);
    await alignedIndicator(owner);
    await owner.evaluate((host: HTMLElement & { items?: string[]; activeIndex?: number }) => {
      host.items = Array.from({ length: 12 }, (_, index) => `Audit tab ${index + 1}`);
      host.activeIndex = 11;
    });
    await owner.getByRole('tab', { name: 'Audit tab 12', exact: true }).click();
    await owner.evaluate((host: HTMLElement & { items?: string[]; activeIndex?: number }) => {
      host.items = ['Alpha', 'Beta', 'Gamma'];
      host.activeIndex = 1;
    });
    await fitting(owner);
    await expect(owner.getByRole('tab', { name: 'Beta', exact: true })).toBeFocused();
    await alignedIndicator(owner);
    await owner.evaluate((host: HTMLElement & { items?: string[]; activeIndex?: number }) => {
      host.items = ['Alpha', 'Beta', 'Gamma', 'Delta'];
      host.activeIndex = 0;
      host.style.transform = 'scale(0.5)';
      host.style.transformOrigin = 'top left';
    });
    await expect
      .poll(async () => (await sizes(owner)).scroll - (await sizes(owner)).client)
      .toBeGreaterThan(1);
    const needed = owner.getByRole('button', {
      name: direction === 'rtl' ? 'Scroll tabs left' : 'Scroll tabs right',
      exact: true
    });
    await expect(needed).toBeVisible();
    const beforeScaledScroll = await owner.locator('.tabs-bar').evaluate((node) => node.scrollLeft);
    await needed.click();
    await expect
      .poll(() =>
        owner
          .locator('.tabs-bar')
          .evaluate((node, before) => Math.abs(node.scrollLeft - before), beforeScaledScroll)
      )
      .toBeGreaterThan(1);
  });
}

test('vertical authored fixed height clears content gutters and preserves true overflow', async ({
  page
}) => {
  await gotoHydrated(page, `${fixtureBaseURL}/tabs-scroll-bounds/?orientation=vertical&width=220`);
  const owner = page.getByTestId('bounds-demo');
  await expect(owner.getByRole('button', { name: 'Scroll tabs down', exact: true })).toBeVisible();
  await page.getByTestId('fit-items').click();
  await expect
    .poll(() =>
      owner.locator('.tabs-bar').evaluate((node) => node.scrollHeight - node.clientHeight)
    )
    .toBeLessThanOrEqual(1);
  await expect(arrowButtons(owner)).toHaveCount(0);
  await page.getByTestId('expand-items').click();
  const down = owner.getByRole('button', { name: 'Scroll tabs down', exact: true });
  await down.click();
  await expect
    .poll(() => owner.locator('.tabs-bar').evaluate((node) => node.scrollTop))
    .toBeGreaterThan(1);
  await expect(owner.getByRole('button', { name: 'Scroll tabs up', exact: true })).toBeVisible();
  await owner.getByRole('tab', { name: 'Audit tab 12', exact: true }).click();
  await alignedIndicator(owner, true);
  const measured = await indicatorStyle(owner);
  await page.getByTestId('zero-axis').click();
  await nativeLayout(page);
  expect(await owner.locator('.tabs-bar').evaluate((node) => node.clientHeight)).toBe(0);
  expect(await indicatorStyle(owner)).toBe(measured);
  await page.getByTestId('restore-axis').click();
  await alignedIndicator(owner, true);
  const visible = await indicatorStyle(owner);
  await page.getByTestId('hide-tabs').click();
  await nativeLayout(page);
  expect(await indicatorStyle(owner)).toBe(visible);
  await page.getByTestId('fit-selected-items').click();
  await page.getByTestId('show-tabs').click();
  await expect
    .poll(() =>
      owner.locator('.tabs-bar').evaluate((node) => node.scrollHeight - node.clientHeight)
    )
    .toBeLessThanOrEqual(1);
  await expect(arrowButtons(owner)).toHaveCount(0);
  await alignedIndicator(owner, true);
});

for (const constraint of ['bar-max', 'owner-padding', 'bar-fixed', 'bar-percent', 'bar-calc']) {
  test(`authored ${constraint} keeps needed arrows rather than borrowing unavailable width`, async ({
    page
  }) => {
    await gotoHydrated(
      page,
      `${fixtureBaseURL}/tabs-scroll-bounds/?width=220&constraint=${constraint}`
    );
    const owner = page.getByTestId('bounds-demo');
    await page.getByTestId(constraint === 'bar-fixed' ? 'fit-short-items' : 'fit-items').click();
    await expect(owner.getByRole('tab')).toHaveCount(3);
    await expect
      .poll(async () => (await sizes(owner)).scroll - (await sizes(owner)).client)
      .toBeGreaterThan(1);
    const right = owner.getByRole('button', { name: 'Scroll tabs right', exact: true });
    await expect(right).toBeVisible();
    await right.click();
    await expect
      .poll(() => owner.locator('.tabs-bar').evaluate((node) => node.scrollLeft))
      .toBeGreaterThan(1);
  });
}

test('fixed non-growing vertical bar keeps its actual height budget', async ({ page }) => {
  await gotoHydrated(
    page,
    `${fixtureBaseURL}/tabs-scroll-bounds/?orientation=vertical&constraint=bar-fixed-height`
  );
  const owner = page.getByTestId('bounds-demo');
  await page.getByTestId('fit-items').click();
  await expect(owner.locator('.tabs-bar')).toHaveCSS('height', '100px');
  await expect(owner.getByRole('button', { name: 'Scroll tabs down', exact: true })).toBeVisible();
});
