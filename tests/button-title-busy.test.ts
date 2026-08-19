import { expect, test } from '@playwright/test';

// A menu/filter trigger needs a hover tooltip and a "contents still loading" signal while
// staying clickable. Button previously derived aria-busy solely from `loading`, which also
// disables the control, so that state was unreachable; `title` had no prop at all.
test.describe('Button — title and ariaBusy', () => {
  test('renders both attributes on the button element', async ({ page }) => {
    await page.goto('/components/button');

    const button = page.getByTestId('button-title-busy');
    await expect(button).toHaveAttribute('title', 'Filters');
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toHaveAttribute('aria-label', 'Filters, 2 selected');
  });

  test('ariaBusy leaves the button enabled — unlike loading', async ({ page }) => {
    await page.goto('/components/button');

    await expect(page.getByTestId('button-title-busy')).toBeEnabled();
  });

  test('consumers that pass neither prop are unchanged', async ({ page }) => {
    await page.goto('/components/button');

    // Regression guard: both props default to undefined and must render as
    // "attribute absent", not as an empty string.
    const plain = page.locator('.button-el').first();
    await expect(plain).not.toHaveAttribute('title', /.*/);
    await expect(plain).not.toHaveAttribute('aria-busy', /.*/);
  });
});
