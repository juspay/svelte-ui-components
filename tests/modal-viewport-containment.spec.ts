import { expect, test } from '@playwright/test';

// Only .fit-content used to carry a max-height, so a size class whose height
// var was overridden to fit-content (the common app-level sizing) grew past
// the viewport with tall content — footer and bottom rounding off-screen, no
// internal scroll. .modal-content now caps at --modal-max-height
// (calc(100dvh - 32px) default) and .slot-content { min-height: 0 } lets the
// slot actually shrink so its own overflow-y scroll engages.
test.describe('Modal viewport containment', () => {
  test.use({ viewport: { width: 1280, height: 560 } });

  test('a tall fit-content modal stays inside a short viewport with its footer visible', async ({
    page
  }) => {
    await page.goto('/components/modal');

    await page.getByText('Open tall modal (viewport containment)').click();
    const modal = page.getByTestId('tall-modal');
    const content = modal.locator('.modal-content');
    await expect(content).toBeVisible();
    // Let the modal enter transition finish before measuring.
    await page.waitForTimeout(400);

    const box = await content.boundingBox();
    if (box === null) {
      throw new Error('modal-content boundingBox is null');
    }
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(Math.round(box.y + box.height)).toBeLessThanOrEqual(560);

    // The footer must be pinned on-screen, not pushed below the fold.
    const footer = modal.locator('.footer-content');
    await expect(footer).toBeVisible();
    const footerBox = await footer.boundingBox();
    if (footerBox === null) {
      throw new Error('footer boundingBox is null');
    }
    expect(Math.round(footerBox.y + footerBox.height)).toBeLessThanOrEqual(560);

    // The overflow lives on the slot's own scrollbar, not spilled content.
    const slotScrolls = await modal
      .locator('.slot-content')
      .evaluate((el) => el.scrollHeight > el.clientHeight + 1);
    expect(slotScrolls).toBe(true);
  });

  test('default medium modal keeps its 50vh height (defaults unchanged)', async ({ page }) => {
    await page.goto('/components/modal');

    await page.getByText('Open Modal', { exact: true }).click();
    const content = page.locator('.modal-content.medium');
    await expect(content).toBeVisible();
    await page.waitForTimeout(400);

    const box = await content.boundingBox();
    if (box === null) {
      throw new Error('modal-content boundingBox is null');
    }
    // 50vh of the 560px viewport; the new max-height cap must stay inert here.
    expect(Math.round(box.height)).toBe(280);
  });
});
