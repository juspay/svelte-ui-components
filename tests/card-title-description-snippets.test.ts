import { expect, test } from '@playwright/test';

// Covers Card's `titleSnippet` / `descriptionSnippet`. The reason they exist:
// `title` and `description` are plain strings, so a consumer whose heading
// carries markup — or a test hook such as data-pw that a suite already selects
// on — had no way to use the card's own header and hand-rolled one in the body
// instead. The snippets render into the same .card-title / .card-description
// containers, so the header keeps its normal typography.
test.describe('Card title/description snippets', () => {
  test('titleSnippet renders the header even when no title string is passed', async ({ page }) => {
    await page.goto('/components/card');

    const card = page.getByTestId('card-snippet-header');
    await expect(card).toBeVisible();

    // The header row exists purely because titleSnippet was supplied — this
    // instance passes no `title` prop at all.
    await expect(card.locator('.card-header')).toHaveCount(1);
  });

  test('snippet content renders inside the card-title / card-description containers', async ({
    page
  }) => {
    await page.goto('/components/card');

    const card = page.getByTestId('card-snippet-header');

    // Not merely present somewhere in the card — nested in the header
    // containers, which is what preserves the card's header typography.
    await expect(card.locator('.card-title [data-pw="snippet-card-heading"]')).toBeVisible();
    await expect(
      card.locator('.card-description [data-pw="snippet-card-description"]')
    ).toBeVisible();

    // The hook the consumer put on its own element survives, which is the whole
    // point — a string prop could not have carried it.
    await expect(card.getByTestId('snippet-card-heading')).toHaveText('Editing window');
  });

  test('string title/description still render unchanged when no snippet is given', async ({
    page
  }) => {
    await page.goto('/components/card');

    // Regression guard for every existing consumer: the string path is untouched.
    const stringCard = page.locator('.card', { hasText: 'Order Summary' }).first();
    await expect(stringCard.locator('.card-title')).toHaveText('Order Summary');
    await expect(stringCard.locator('.card-description')).toHaveText(
      'Review your items before checkout.'
    );
  });
});
