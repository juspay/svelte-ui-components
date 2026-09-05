import { expect, test } from '@playwright/test';

// Covers Snippet's `copiedLabel` and `copyResetMs` (#530). Before this change the
// copied-feedback text and its 2000ms reset were hardcoded, so a consumer wanting
// a different label or a faster/slower reset had to hand-roll the whole copy
// affordance instead of using Snippet's built-in one -- exactly what TARA's
// CopyButton.svelte did. Both props are additive and optional; the assertions
// below only pass once the component actually reads them.
test.describe('Snippet copiedLabel / copyResetMs', () => {
  test('default instance keeps the unchanged "Copied!" text and does not revert early', async ({
    page,
    context
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/components/snippet');

    const snippet = page.getByTestId('snippet-default');
    await snippet.getByRole('button', { name: 'Copy to clipboard' }).click();

    await expect(snippet.locator('.snippet-copied')).toHaveText('Copied!');

    // copyResetMs was not set, so this must NOT have reverted to the icon after
    // 300ms -- the interval the sibling instance below uses as its full reset.
    await page.waitForTimeout(300);
    await expect(snippet.locator('.snippet-copied')).toHaveText('Copied!');
  });

  test('copiedLabel replaces the default text, and copyResetMs shortens the reset', async ({
    page,
    context
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/components/snippet');

    const snippet = page.getByTestId('snippet-copy-options');
    await snippet.getByRole('button', { name: 'Copy to clipboard' }).click();

    // The custom label, not the hardcoded 'Copied!'.
    await expect(snippet.locator('.snippet-copied')).toHaveText('Link copied!');

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('echo custom');

    // copyResetMs={300}: back to the copy icon well before the library's own
    // 2000ms default would have fired.
    await expect(snippet.locator('.snippet-copied')).toHaveCount(0, { timeout: 1000 });
  });
});
