import { expect, test } from '@playwright/test';

test.describe('ListItem and Menu — SVG transforms and ListItem semantics', () => {
  test('ListItem transforms and inlines both image SVGs', async ({ page }) => {
    await page.goto('/components/list-item');

    const leftIcon = page.getByTestId('list-item-transform-left').locator('svg');
    const rightIcon = page.getByTestId('list-item-transform-right').locator('svg');

    await expect(leftIcon).toHaveAttribute('data-transformed', 'true');
    await expect(rightIcon).toHaveAttribute('data-transformed', 'true');
    await expect(leftIcon.locator('circle')).toHaveCount(1);
    await expect(rightIcon.locator('circle')).toHaveCount(1);
  });

  test('Menu transforms and inlines its item SVG icon', async ({ page }) => {
    await page.goto('/components/menu');

    await page.locator('[data-pw="menu-transform-svg"] .menu-trigger').click();

    const icon = page.locator(
      '[data-pw="menu-transform-svg-item-transformed"] .menu-item-icon svg'
    );
    await expect(icon).toHaveAttribute('data-transformed', 'true');
    await expect(icon.locator('circle')).toHaveCount(1);
  });

  test('ListItem suppression removes synthetic roles and tab stops but keeps clicks', async ({
    page
  }) => {
    await page.goto('/components/list-item');

    const item = page.getByTestId('list-item-suppressed');
    const topSection = page.getByTestId('list-item-suppressed-top');
    const centerText = page.getByTestId('list-item-suppressed-center');
    const leftImage = page.getByTestId('list-item-suppressed-left');
    const rightImage = page.getByTestId('list-item-suppressed-right');

    await expect(item).not.toHaveAttribute('role');
    await expect(item).not.toHaveAttribute('tabindex');
    await expect(topSection).not.toHaveAttribute('role');
    await expect(topSection).not.toHaveAttribute('tabindex');
    await expect(centerText).not.toHaveAttribute('role');
    await expect(centerText).not.toHaveAttribute('tabindex');
    await expect(leftImage).not.toHaveAttribute('role');
    await expect(leftImage).not.toHaveAttribute('tabindex');
    await expect(rightImage).not.toHaveAttribute('role');
    await expect(rightImage).not.toHaveAttribute('tabindex');

    await item.click();
    await expect(page.getByTestId('list-item-suppressed-clicks')).toHaveText('1');
  });

  test('ListItem defaults retain synthetic button semantics', async ({ page }) => {
    await page.goto('/components/list-item');

    const item = page.locator('.item').filter({ hasText: 'John Doe' });
    await expect(item).toHaveAttribute('role', 'button');
    await expect(item).toHaveAttribute('tabindex', '0');
  });
});
