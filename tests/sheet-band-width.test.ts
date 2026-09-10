import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Closes #572: Sheet's top/bottom sides had no width-capping mechanism. left
// and right expose --sheet-width; top and bottom were always full-viewport-
// width with a border only on the entering edge. That made the shape most
// mobile-first action sheets actually use above phone widths -- a centred,
// width-capped, fully bordered card entering from the bottom -- impossible
// without faking it through hand-computed --sheet-left/--sheet-right calc()
// and a global border override, which relocates the consumer's centring maths
// into a stylesheet rather than adopting the component.
//
// The tokens are deliberately NOT --sheet-width/--sheet-max-width. Those
// already mean "the width of a left/right panel", and a consumer who themes
// them for their side sheets must not have their bottom sheets silently
// reshaped. side="center" set this precedent for the same reason.

const openAndSettle = async (
  page: import('@playwright/test').Page,
  triggerId: string,
  panelId: string
) => {
  const panel = page.getByTestId(panelId);
  await page.getByTestId(triggerId).click();
  await expect(panel).toBeVisible();
  // Svelte's fly transition uses the Web Animations API. Already-finished
  // animations resolve immediately, unlike a late transitionend listener.
  await panel.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
  return panel;
};

const boxOf = async (locator: import('@playwright/test').Locator) => {
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error('panel boundingBox is null');
  }
  return box;
};

const viewportOf = (page: import('@playwright/test').Page) => {
  const size = page.viewportSize();
  if (size === null) {
    throw new Error('viewport size is null');
  }
  return size;
};

test.describe('Sheet — width-capped top/bottom (#572)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, '/components/sheet');
  });

  test('an unconfigured bottom sheet is still edge-to-edge', async ({ page }) => {
    // Back-compat: this passes before the change and must keep passing. The
    // whole feature is opt-in, so a consumer setting nothing sees no move.
    const panel = await openAndSettle(page, 'sheet-bottom-trigger', 'sheet-bottom-panel');
    const box = await boxOf(panel);
    const viewport = viewportOf(page);

    expect(Math.round(box.x)).toBe(0);
    expect(Math.round(box.width)).toBe(viewport.width);
  });

  test('--sheet-band-width caps the panel below the viewport width', async ({ page }) => {
    const panel = await openAndSettle(
      page,
      'sheet-capped-bottom-trigger',
      'sheet-capped-bottom-panel'
    );
    const box = await boxOf(panel);
    const viewport = viewportOf(page);

    // The cap itself is honoured exactly.
    await expect(panel).toHaveCSS('width', '560px');

    // The responsive recipe includes the border in its capped width.
    expect(Math.round(box.width)).toBe(560);
    expect(Math.round(box.width)).toBeLessThan(viewport.width);
  });

  test('a capped panel is centred horizontally', async ({ page }) => {
    const panel = await openAndSettle(
      page,
      'sheet-capped-bottom-trigger',
      'sheet-capped-bottom-panel'
    );
    const box = await boxOf(panel);
    const viewport = viewportOf(page);

    const leftGap = box.x;
    const rightGap = viewport.width - (box.x + box.width);

    // Equal gaps alone would be satisfied by a full-bleed panel, where both
    // are zero -- the assertion would pass on the very code this covers. The
    // gaps must also be real, which only a capped panel produces.
    expect(leftGap).toBeGreaterThan(0);
    expect(rightGap).toBeGreaterThan(0);
    expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(2);
  });

  test('a capped panel still meets the bottom edge it enters from', async ({ page }) => {
    // Capping the width must not turn it into a floating centre dialog --
    // that is what side="center" is for. A bottom sheet still sits on the
    // bottom edge.
    const panel = await openAndSettle(
      page,
      'sheet-capped-bottom-trigger',
      'sheet-capped-bottom-panel'
    );
    const box = await boxOf(panel);
    const viewport = viewportOf(page);

    expect(Math.round(box.y + box.height)).toBe(viewport.height);
  });

  test('--sheet-band-border gives a capped panel all four edges', async ({ page }) => {
    const panel = await openAndSettle(
      page,
      'sheet-capped-bottom-trigger',
      'sheet-capped-bottom-panel'
    );

    // A floating card needs every edge, unlike an edge-anchored panel which
    // deliberately draws only the one it enters from.
    for (const side of ['top', 'right', 'bottom', 'left']) {
      await expect(panel).toHaveCSS(`border-${side}-width`, '1px');
      await expect(panel).toHaveCSS(`border-${side}-style`, 'solid');
    }
  });

  test('an unconfigured bottom sheet draws no border at all', async ({ page }) => {
    // Back-compat for the border half: the default is `none` on every edge,
    // and adding the band tokens must not start painting one.
    const panel = await openAndSettle(page, 'sheet-bottom-trigger', 'sheet-bottom-panel');

    for (const side of ['top', 'right', 'bottom', 'left']) {
      await expect(panel).toHaveCSS(`border-${side}-style`, 'none');
    }
  });

  test('a bordered cap fits a phone viewport without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    const panel = await openAndSettle(
      page,
      'sheet-capped-bottom-trigger',
      'sheet-capped-bottom-panel'
    );
    const box = await boxOf(panel);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
  });

  test('top cap honours asymmetric insets and max-width', async ({ page }) => {
    // Selected by test id rather than the demo's button copy, which is prose
    // and free to change without this test being wrong.
    await page.getByTestId('sheet-top-trigger').click();
    const panel = page.getByTestId('sheet-top-panel');
    await panel.evaluate(async (el) => {
      el.style.setProperty('--sheet-left', '20px');
      el.style.setProperty('--sheet-right', '60px');
      el.style.setProperty('--sheet-band-max-width', '400px');
      el.style.setProperty('--sheet-band-border', '2px solid black');
      el.style.setProperty('--sheet-band-box-sizing', 'border-box');
      await Promise.all(el.getAnimations().map((a) => a.finished));
    });
    const box = await boxOf(panel);
    expect(box.width).toBe(400);
    expect(box.y).toBe(0);
    expect(Math.abs(box.x - 20 - (viewportOf(page).width - 60 - box.x - box.width))).toBeLessThan(
      2
    );
    await page.setViewportSize({ width: 320, height: 700 });
    await expect.poll(async () => (await boxOf(panel)).width).toBe(240);
    for (const side of ['top', 'right', 'bottom', 'left']) {
      await expect(panel).toHaveCSS(`border-${side}-width`, '2px');
    }
  });

  test('capped sheets trap focus, lock scrolling and restore focus after Escape', async ({
    page
  }) => {
    const trigger = page.getByTestId('sheet-capped-bottom-trigger');
    const panel = await openAndSettle(
      page,
      'sheet-capped-bottom-trigger',
      'sheet-capped-bottom-panel'
    );
    await expect(panel).toBeFocused();
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('sheet-capped-bottom-close')).toBeFocused();
    await page.keyboard.press('Tab');
    expect(await panel.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });

  test('clicking outside a capped sheet dismisses it', async ({ page }) => {
    const panel = await openAndSettle(
      page,
      'sheet-capped-bottom-trigger',
      'sheet-capped-bottom-panel'
    );
    await page.getByTestId('sheet-capped-bottom').click({ position: { x: 5, y: 5 } });
    await expect(panel).toHaveCount(0);
  });

  test('--sheet-width does not leak into a bottom sheet', async ({ page }) => {
    // The reason the new tokens are not called --sheet-width. A consumer who
    // themes their left/right sheets to 280px must not find their bottom
    // sheets silently reshaped to match.
    const panel = await openAndSettle(
      page,
      'sheet-width-token-trigger',
      'sheet-width-token-bottom-panel'
    );
    const box = await boxOf(panel);
    const viewport = viewportOf(page);

    expect(Math.round(box.width)).toBe(viewport.width);
    expect(Math.round(box.width)).not.toBe(280);
  });
});
