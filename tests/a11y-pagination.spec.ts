import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Pagination renders plain native <button> elements, so Tab order, Enter/Space
// activation and disabled exclusion are the browser's job. These tests pin the
// aria-current/aria-label contract layered on top, and confirm the native disabled
// wiring the `disabled` prop is supposed to produce.
test.describe('Pagination keyboard interaction', () => {
  test('Tab reaches a page control and Enter/Space activates it', async ({ page }) => {
    await gotoHydrated(page, '/components/pagination');

    const basic = page.getByTestId('pagination-basic');
    const page2 = basic.getByRole('button', { name: 'Page 2', exact: true });

    await page2.focus();
    await expect(page2).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page2).toHaveAttribute('aria-current', 'page');

    // Moving to page 2 brings page 3 into the sibling window; Space activates it
    // the same way Enter did.
    const page3 = basic.getByRole('button', { name: 'Page 3', exact: true });
    await page3.focus();
    await page.keyboard.press(' ');
    await expect(page3).toHaveAttribute('aria-current', 'page');
    await expect(page2).not.toHaveAttribute('aria-current', /.*/);
  });

  test('aria-current marks only the active page, and prev/next carry their own names', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/pagination');

    const basic = page.getByTestId('pagination-basic');
    await expect(basic.getByRole('button', { name: 'Page 1', exact: true })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await expect(basic.getByRole('button', { name: 'Previous page' })).toBeVisible();
    await expect(basic.getByRole('button', { name: 'Next page' })).toBeVisible();
  });

  test('the previous button is natively disabled (and unreachable by Tab) on the first page', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/pagination');

    const basic = page.getByTestId('pagination-basic');
    await expect(basic.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  });

  test('the disabled prop natively disables every button in the group', async ({ page }) => {
    await gotoHydrated(page, '/components/pagination');

    // This instance carries no testId, so scope by the only nav whose buttons are
    // all disabled.
    const disabledNav = page.locator('nav.pagination.disabled');
    await expect(disabledNav.getByRole('button', { name: 'Page 5', exact: true })).toBeDisabled();
    await expect(disabledNav.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await expect(disabledNav.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  test('cursor mode: the load-more control is keyboard-activatable and gets its own name', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/pagination');

    const cursor = page.getByTestId('pagination-cursor');
    await cursor.getByRole('button', { name: 'Page 3', exact: true }).click();

    const loadMore = cursor.getByRole('button', { name: 'Load more' });
    await loadMore.focus();
    await expect(loadMore).toBeFocused();
    await page.keyboard.press('Enter');

    // A successful load-more bumps totalPages, so page 4 now exists.
    await expect(cursor.getByRole('button', { name: 'Page 4', exact: true })).toBeVisible();
  });
});
