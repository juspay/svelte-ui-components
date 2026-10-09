import { expect, test } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';

const fixtureURL =
  process.env.SUI_OVERLAY_HOST_FIXTURE_URL ?? `${fixtureBaseURL}/owned-overlay-host/`;

test.beforeEach(async ({ page }) => {
  await page.goto(fixtureURL);
  await expect(page.locator('html')).toHaveAttribute('data-fixture-ready', 'true');
});

for (const kind of ['modal', 'sheet', 'menu']) {
  test(`${kind}: owned app lock preserves host styles, bounds, scroll and focus`, async ({
    page
  }) => {
    const before = await page.evaluate(() => ({
      body: document.body.style.cssText,
      html: document.documentElement.style.cssText,
      nav: document.querySelector('[data-pw="host-nav"]')?.outerHTML,
      theme: document.querySelector('#embedded-app')?.getAttribute('data-theme'),
      url: location.href
    }));
    await page.getByTestId(`open-${kind}`).click();
    await expect(page.getByTestId(`owned-${kind}`)).toBeVisible();
    await expect(page.getByTestId('owner-a')).toHaveCSS('overflow', 'hidden');
    const during = await page.evaluate(() => ({
      body: document.body.style.cssText,
      html: document.documentElement.style.cssText,
      nav: document.querySelector('[data-pw="host-nav"]')?.outerHTML,
      theme: document.querySelector('#embedded-app')?.getAttribute('data-theme'),
      url: location.href
    }));
    expect(during).toEqual(before);
    const hostBox = await page.getByTestId('embedded-app').boundingBox();
    const overlayBox = await page.getByTestId(`owned-${kind}`).boundingBox();
    expect(hostBox).not.toBeNull();
    expect(overlayBox).not.toBeNull();
    if (hostBox && overlayBox) {
      expect(overlayBox.x).toBeGreaterThanOrEqual(hostBox.x);
      expect(overlayBox.y).toBeGreaterThanOrEqual(hostBox.y);
      expect(overlayBox.x + overlayBox.width).toBeLessThanOrEqual(hostBox.x + hostBox.width + 1);
      expect(overlayBox.y + overlayBox.height).toBeLessThanOrEqual(hostBox.y + hostBox.height + 1);
    }
    await page.getByTestId('host-scroll').hover();
    await page.mouse.wheel(0, 180);
    await expect
      .poll(() => page.getByTestId('host-scroll').evaluate((node) => node.scrollTop))
      .toBeGreaterThan(0);
    await page.evaluate(() =>
      window.dispatchEvent(new CustomEvent('overlay-fixture-control', { detail: 'close-all' }))
    );
    await expect(page.getByTestId(`owned-${kind}`)).toHaveCount(0);
    await expect(page.getByTestId('owner-a')).toHaveCSS('overflow', 'auto');
    await expect(page.getByTestId(`open-${kind}`)).toBeFocused();
    expect(await page.evaluate(() => document.body.style.cssText)).toBe(before.body);
  });
}

test('nested close leaves the app locked until the final overlay releases', async ({ page }) => {
  await page.getByTestId('open-modal').click();
  await page.getByTestId('nested-sheet').click();
  await expect(page.getByTestId('owned-sheet')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('owned-sheet')).toHaveCount(0);
  await expect(page.getByTestId('owned-modal')).toBeVisible();
  await expect(page.getByTestId('owner-a')).toHaveCSS('overflow', 'hidden');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('owned-modal')).toHaveCount(0);
  await expect(page.getByTestId('owner-a')).toHaveCSS('overflow', 'auto');
});

test('wrong body owner is detected by the host mutation assertion', async ({ page }) => {
  await page.goto(`${fixtureURL}?owner=body`);
  await expect(page.locator('html')).toHaveAttribute('data-fixture-ready', 'true');
  const before = await page.evaluate(() => document.body.style.cssText);
  await page.getByTestId('open-modal').click();
  await expect(page.getByTestId('owned-modal')).toBeVisible();
  expect(await page.evaluate(() => document.body.style.cssText)).not.toBe(before);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('owned-modal')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.cssText)).toBe(before);
});

for (const kind of ['sheet', 'menu']) {
  test(`${kind}: logical reopen during outro acquires the newly selected app owner`, async ({
    page
  }) => {
    await page.getByTestId(`open-${kind}`).click();
    await expect(page.getByTestId(`owned-${kind}`)).toBeVisible();
    await expect(page.getByTestId('owner-a')).toHaveCSS('overflow', 'hidden');
    await page.evaluate(async (overlayKind) => {
      window.dispatchEvent(
        new CustomEvent('overlay-fixture-control', { detail: `${overlayKind}-close` })
      );
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      window.dispatchEvent(
        new CustomEvent('overlay-fixture-control', { detail: `${overlayKind}-open-b` })
      );
    }, kind);
    await expect(page.getByTestId(`owned-${kind}`)).toBeVisible();
    await expect(page.getByTestId('owner-b')).toHaveCSS('overflow', 'hidden');
    await expect(page.getByTestId('owner-a')).toHaveCSS('overflow', 'auto');
    await page.evaluate(() =>
      window.dispatchEvent(new CustomEvent('overlay-fixture-control', { detail: 'close-all' }))
    );
    await expect(page.getByTestId(`owned-${kind}`)).toHaveCount(0);
    await expect(page.getByTestId('owner-b')).toHaveCSS('overflow', 'scroll');
  });
}

for (const kind of ['sheet', 'menu']) {
  test(`${kind}: changing ownership during an uninterrupted open keeps the original hold`, async ({
    page
  }) => {
    await page.getByTestId(`open-${kind}`).click();
    await expect(page.getByTestId(`owned-${kind}`)).toBeVisible();
    await page.evaluate(
      (overlayKind) =>
        window.dispatchEvent(
          new CustomEvent('overlay-fixture-control', { detail: `${overlayKind}-open-b` })
        ),
      kind
    );
    await expect(page.getByTestId('owner-a')).toHaveCSS('overflow', 'hidden');
    await expect(page.getByTestId('owner-b')).toHaveCSS('overflow', 'scroll');
    await page.evaluate(() =>
      window.dispatchEvent(new CustomEvent('overlay-fixture-control', { detail: 'close-all' }))
    );
    await expect(page.getByTestId(`owned-${kind}`)).toHaveCount(0);
    await expect(page.getByTestId('owner-a')).toHaveCSS('overflow', 'auto');
  });

  test(`${kind}: a null owner on logical reopen releases the prior hold without body fallback`, async ({
    page
  }) => {
    const hostStyle = await page.evaluate(() => document.body.style.cssText);
    await page.getByTestId(`open-${kind}`).click();
    await expect(page.getByTestId('owner-a')).toHaveCSS('overflow', 'hidden');
    await page.evaluate(async (overlayKind) => {
      window.dispatchEvent(
        new CustomEvent('overlay-fixture-control', { detail: `${overlayKind}-close` })
      );
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      window.dispatchEvent(
        new CustomEvent('overlay-fixture-control', { detail: `${overlayKind}-open-null` })
      );
    }, kind);
    await expect(page.getByTestId(`owned-${kind}`)).toBeVisible();
    await expect(page.getByTestId('owner-a')).toHaveCSS('overflow', 'auto');
    await expect(page.getByTestId('owner-b')).toHaveCSS('overflow', 'scroll');
    expect(await page.evaluate(() => document.body.style.cssText)).toBe(hostStyle);
    await page.evaluate(() =>
      window.dispatchEvent(new CustomEvent('overlay-fixture-control', { detail: 'close-all' }))
    );
    await expect(page.getByTestId(`owned-${kind}`)).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.cssText)).toBe(hostStyle);
  });
}
