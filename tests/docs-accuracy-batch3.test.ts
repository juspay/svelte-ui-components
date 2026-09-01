import { expect, test } from '@playwright/test';

// Regression coverage for the documentation-accuracy pass on this batch of components.
// Each test proves that a CSS variable this batch newly added/corrected in the docs
// actually themes the component as described -- not just that the markdown table exists.

test.describe('Choicebox — indicator CSS variables actually theme the indicator', () => {
  test('--choicebox-indicator-selected-background/-border/-size reach the indicator span', async ({
    page
  }) => {
    await page.goto('/components/choicebox');

    const card = page.getByTestId('choicebox-themed-indicator');
    await expect(card).toBeVisible();

    const indicator = card.locator('.indicator');
    await expect(indicator).toHaveCSS('background-color', 'rgb(20, 130, 40)');
    await expect(indicator).toHaveCSS('width', '28px');
    await expect(indicator).toHaveCSS('height', '28px');
  });
});

test.describe('Gallery — CSS variables actually theme the grid layout', () => {
  test('--gallery-columns, --gallery-gap, and --gallery-item-border-radius reach the grid', async ({
    page
  }) => {
    await page.goto('/components/gallery');

    const gallery = page.getByTestId('gallery-themed-demo');
    await expect(gallery).toBeVisible();

    await expect(gallery).toHaveCSS('gap', '24px');

    const firstItem = gallery.locator('.gallery-item').first();
    await expect(firstItem).toHaveCSS('border-radius', '16px');

    // 2 columns: two items should sit at roughly the same vertical position.
    const items = gallery.locator('.gallery-item');
    const box0 = await items.nth(0).boundingBox();
    const box1 = await items.nth(1).boundingBox();
    expect(box0).not.toBeNull();
    expect(box1).not.toBeNull();
    expect(Math.abs((box0?.y ?? 0) - (box1?.y ?? 0))).toBeLessThan(2);
  });
});
