import { expect, test } from '@playwright/test';

test.describe('EmptyState and Pill native attributes', () => {
  test('EmptyState exposes stable title and description locators for text and snippets', async ({ page }) => {
    await page.goto('/components/empty-state');

    await expect(page.getByTestId('empty-state-attributes-title')).toHaveText('Fallback title');
    await expect(page.getByTestId('empty-state-attributes-description')).toHaveText(
      'Fallback description'
    );
    await expect(page.getByTestId('empty-state-snippet-attributes-title')).toHaveText(
      'Snippet title'
    );
    await expect(page.getByTestId('empty-state-snippet-attributes-description')).toHaveText(
      'Snippet description'
    );
  });

  test('EmptyState does not render a description locator when no description is rendered', async ({ page }) => {
    await page.goto('/components/empty-state');

    await expect(page.getByTestId('empty-state-without-description-title')).toHaveText('Title only');
    await expect(page.getByTestId('empty-state-without-description-description')).toHaveCount(0);
  });

  test('Pill exposes an optional native title only when supplied', async ({ page }) => {
    await page.goto('/components/pill');

    await expect(page.getByTestId('pill-title')).toHaveAttribute('title', 'Pill tooltip');
    await expect(page.getByTestId('pill-without-title')).not.toHaveAttribute('title', /.*/);
  });
});
