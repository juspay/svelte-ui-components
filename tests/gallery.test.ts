import { expect, test } from '@playwright/test';

test.describe('Gallery', () => {
  test('renders one item per image, with edit/delete actions since both handlers are set', async ({
    page
  }) => {
    await page.goto('/components/gallery');

    const gallery = page.getByTestId('gallery-demo');
    await expect(gallery.locator('.gallery-item')).toHaveCount(3);
    await expect(gallery.locator('.gallery-item-action')).toHaveCount(6); // edit + delete per item
  });

  test('clicking an item opens the lightbox on that image', async ({ page }) => {
    await page.goto('/components/gallery');

    const gallery = page.getByTestId('gallery-demo');
    await gallery.locator('.gallery-item-content').nth(1).click();

    const lightbox = page.locator('.lightbox');
    await expect(lightbox).toBeVisible();
    await expect(lightbox.locator('.lightbox-counter')).toHaveText('2 / 3');
  });

  test('next/previous controls navigate, disabled at the ends when not looping', async ({
    page
  }) => {
    await page.goto('/components/gallery');

    const gallery = page.getByTestId('gallery-demo');
    await gallery.locator('.gallery-item-content').first().click();

    const lightbox = page.locator('.lightbox');
    await expect(lightbox.locator('.lightbox-previous')).toHaveCount(0);
    await expect(lightbox.locator('.lightbox-counter')).toHaveText('1 / 3');

    await lightbox.getByRole('button', { name: 'Next image' }).click();
    await expect(lightbox.locator('.lightbox-counter')).toHaveText('2 / 3');
    await expect(lightbox.locator('.lightbox-previous')).toHaveCount(1);

    await lightbox.getByRole('button', { name: 'Next image' }).click();
    await expect(lightbox.locator('.lightbox-counter')).toHaveText('3 / 3');
    await expect(lightbox.locator('.lightbox-next')).toHaveCount(0);
  });

  test('arrow keys navigate and Escape closes the lightbox', async ({ page }) => {
    await page.goto('/components/gallery');

    const gallery = page.getByTestId('gallery-demo');
    await gallery.locator('.gallery-item-content').first().click();

    const lightbox = page.locator('.lightbox');
    await expect(lightbox).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(lightbox.locator('.lightbox-counter')).toHaveText('2 / 3');

    await page.keyboard.press('Escape');
    await expect(lightbox).toHaveCount(0);
  });

  test('Tab from the last control wraps to the close button (focus trap)', async ({ page }) => {
    await page.goto('/components/gallery');

    const gallery = page.getByTestId('gallery-demo');
    // Open on the middle image so both previous and next controls render -
    // exercises the trap's "last = next ?? previous ?? close" fallback chain.
    await gallery.locator('.gallery-item-content').nth(1).click();

    const lightbox = page.locator('.lightbox');
    const closeButton = lightbox.getByRole('button', { name: 'Close gallery' });
    const nextButton = lightbox.getByRole('button', { name: 'Next image' });

    await nextButton.focus();
    await expect(nextButton).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(closeButton).toBeFocused();

    // Shift+Tab from the close button (the trap's "first") wraps back to last.
    await page.keyboard.press('Shift+Tab');
    await expect(nextButton).toBeFocused();
  });

  test('closing the lightbox returns focus to the item that opened it', async ({ page }) => {
    await page.goto('/components/gallery');

    const gallery = page.getByTestId('gallery-demo');
    const secondItem = gallery.locator('.gallery-item-content').nth(1);
    await secondItem.click();

    await page.keyboard.press('Escape');
    await expect(secondItem).toBeFocused();
  });
});
