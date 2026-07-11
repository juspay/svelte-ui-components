import { expect, test } from '@playwright/test';

test.describe('Pagination — cursor / load-more mode', () => {
  test('basic pagination still renders prev/next (backward compatible)', async ({ page }) => {
    await page.goto('/components/pagination');
    const basic = page.getByTestId('pagination-basic');
    await expect(basic).toBeVisible();
    await expect(basic.getByRole('button', { name: 'Previous page' })).toBeVisible();
    await expect(basic.getByRole('button', { name: 'Next page' })).toBeVisible();
  });

  test('cursor mode swaps the next-button for a load-more CTA on the last page', async ({
    page
  }) => {
    await page.goto('/components/pagination');
    const cursor = page.getByTestId('pagination-cursor');
    await expect(cursor).toBeVisible();
    // On page 1 of 3 there is no load-more CTA yet — normal next-button is shown.
    await expect(cursor.getByRole('button', { name: 'Load more' })).toHaveCount(0);
    await expect(cursor.getByRole('button', { name: 'Next page' })).toBeVisible();
    // Jump to the last known page; the load-more CTA replaces the next-button.
    await cursor.getByRole('button', { name: 'Page 3' }).click();
    await expect(cursor.getByRole('button', { name: 'Load more' })).toBeVisible();
    await expect(cursor.getByRole('button', { name: 'Next page' })).toHaveCount(0);
  });
});
