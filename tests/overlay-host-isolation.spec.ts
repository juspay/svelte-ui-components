import { expect, test } from '@playwright/test';
import { fixtureBaseURL } from './support/fixture-server';
import { inlineDeclarations } from './support/overlay-assertions';
import { activateOverlayBy, ownedStyle, type OverlayActivation } from './support/overlay-ownership';

const fixtureURL =
  process.env.SUI_OVERLAY_HOST_FIXTURE_URL ?? `${fixtureBaseURL}/owned-overlay-host/`;

test.beforeEach(async ({ page }) => {
  await page.goto(fixtureURL);
  await expect(page.locator('html')).toHaveAttribute('data-fixture-ready', 'true');
});

const activations: readonly OverlayActivation[] = ['pointer', 'keyboard', 'tab'];

for (const activation of activations) {
  for (const kind of ['modal', 'sheet', 'menu']) {
    test(`${kind}: owned app lock preserves host styles, bounds, scroll and focus (${activation})`, async ({
      page
    }) => {
      const before = await page.evaluate(() => ({
        body: Array.from(document.body.style)
          .sort()
          .map((name) => ({
            name,
            value: document.body.style.getPropertyValue(name),
            priority: document.body.style.getPropertyPriority(name)
          })),
        html: Array.from(document.documentElement.style)
          .sort()
          .map((name) => ({
            name,
            value: document.documentElement.style.getPropertyValue(name),
            priority: document.documentElement.style.getPropertyPriority(name)
          })),
        nav: document.querySelector('[data-pw="host-nav"]')?.outerHTML,
        theme: document.querySelector('#embedded-app')?.getAttribute('data-theme'),
        url: location.href
      }));
      const assertRestoredFocus = await activateOverlayBy(
        page,
        page.getByTestId(`open-${kind}`),
        activation
      );
      await expect(page.getByTestId(`owned-${kind}`)).toBeVisible();
      await expect(page.getByTestId('owner-a')).toHaveCSS('overflow', 'hidden');
      const during = await page.evaluate(() => ({
        body: Array.from(document.body.style)
          .sort()
          .map((name) => ({
            name,
            value: document.body.style.getPropertyValue(name),
            priority: document.body.style.getPropertyPriority(name)
          })),
        html: Array.from(document.documentElement.style)
          .sort()
          .map((name) => ({
            name,
            value: document.documentElement.style.getPropertyValue(name),
            priority: document.documentElement.style.getPropertyPriority(name)
          })),
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
        expect(overlayBox.y + overlayBox.height).toBeLessThanOrEqual(
          hostBox.y + hostBox.height + 1
        );
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
      await assertRestoredFocus();
      expect(await inlineDeclarations(page)).toEqual(before.body);
    });
  }
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
  const before = await inlineDeclarations(page);
  await page.getByTestId('open-modal').click();
  await expect(page.getByTestId('owned-modal')).toBeVisible();
  expect(await inlineDeclarations(page)).not.toEqual(before);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('owned-modal')).toHaveCount(0);
  expect(await inlineDeclarations(page)).toEqual(before);
  // Prove the complete-map guard also detects unrelated values and priority-only changes.
  for (const mutation of ['padding-value', 'overflow-priority'] as const) {
    const original = await page.evaluate((kind) => {
      const style = document.body.style;
      const name = kind === 'padding-value' ? 'padding-right' : 'overflow-x';
      const value = style.getPropertyValue(name);
      const priority = style.getPropertyPriority(name);
      style.setProperty(name, kind === 'padding-value' ? '12px' : value, '');
      return { name, value, priority };
    }, mutation);
    try {
      expect(await inlineDeclarations(page)).not.toEqual(before);
    } finally {
      await page.evaluate(({ name, value, priority }) => {
        document.body.style.setProperty(name, value, priority);
      }, original);
    }
    expect(await inlineDeclarations(page)).toEqual(before);
  }
});

test('wrong body owner keeps host declarations written while the lock is held', async ({
  page
}) => {
  await page.goto(`${fixtureURL}?owner=body`);
  await expect(page.locator('html')).toHaveAttribute('data-fixture-ready', 'true');
  const body = page.locator('body');
  const before = await ownedStyle(body);
  await page.getByTestId('open-modal').click();
  await expect(page.getByTestId('owned-modal')).toBeVisible();
  expect(await ownedStyle(body)).not.toEqual(before);
  await expect(body).toHaveCSS('overflow', 'hidden');
  await body.evaluate((node) => {
    node.style.setProperty('padding-right', '13px');
    node.style.setProperty('--host-live', 'updated');
  });
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('owned-modal')).toHaveCount(0);
  expect(await ownedStyle(body)).toEqual({
    ...before,
    inline: { ...before.inline, 'padding-right': ['13px', ''], '--host-live': ['updated', ''] },
    computed: { ...before.computed, paddingRight: '13px' }
  });
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
    const hostStyle = await inlineDeclarations(page);
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
    expect(await inlineDeclarations(page)).toEqual(hostStyle);
    await page.evaluate(() =>
      window.dispatchEvent(new CustomEvent('overlay-fixture-control', { detail: 'close-all' }))
    );
    await expect(page.getByTestId(`owned-${kind}`)).toHaveCount(0);
    expect(await inlineDeclarations(page)).toEqual(hostStyle);
  });
}
