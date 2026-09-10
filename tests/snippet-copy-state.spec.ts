import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Coverage for #574: the copy affordance was only reachable by also taking
// Snippet's `<code>` box and `$` prompt, so consumers who wanted a bare copy
// control beside their own content hand-rolled the whole thing -- label swap,
// reset timer, cleanup -- and #530's timer-safety work never reached them.
//
// `createCopyState` exposes that state machine on its own. These assertions
// run against a demo that uses it with no Snippet in sight, which is the
// arrangement the issue says is impossible today.
test.describe('createCopyState — copy affordance without the presentation', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await gotoHydrated(page, '/components/snippet');
  });

  test('copies the value to the real clipboard', async ({ page }) => {
    const row = page.getByTestId('snippet-headless');
    await row.getByRole('button').click();

    // Read the actual clipboard rather than trusting the label: the label is
    // what a hand-rolled duplicate also gets right, while a copy that never
    // reached the clipboard is the failure worth catching.
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe('ssh://runner-04.internal.example.com:2222');
  });

  test('swaps the label on copy and reverts after the reset delay', async ({ page }) => {
    const button = page.getByTestId('snippet-headless').getByRole('button');

    await expect(button).toHaveText('Copy');
    // The accessible name must BE the visible label, not an aria-label that
    // overrides it (WCAG 2.5.3). An `ariaLabel="Copy host"` here would leave a
    // screen-reader user hearing "Copy host" while the button reads "Copied!".
    await expect(button).toHaveAccessibleName('Copy');

    await button.click();
    await expect(button).toHaveText('Copied!');
    await expect(button).toHaveAccessibleName('Copied!');

    // The demo passes copyResetMs=300, so this reverts well inside the
    // default 2000ms -- proving the option is read, not ignored.
    await expect(button).toHaveText('Copy', { timeout: 2000 });
  });

  test('Snippet announces the copy through a persistent live region', async ({ page }) => {
    // A live region has to exist before its text changes: inserting the
    // element and its text together is exactly what many screen-reader and
    // browser pairs fail to announce. So the region is always rendered and
    // only its text changes -- and it is outside the button, whose visible
    // label is swapped.
    const snippet = page.getByTestId('snippet-default');
    const status = snippet.locator('[role="status"]');

    await expect(status).toHaveCount(1);
    await expect(status).toHaveText('');
    expect(await status.evaluate((el) => el.closest('button') === null)).toBe(true);

    await snippet.getByRole('button').click();
    await expect(status).toHaveText('Copied!');
  });

  test('the accessible name follows the visible label into the copied state', async ({ page }) => {
    // The button is icon-only at rest, so it needs a label; once the visible
    // text becomes "Copied!" that label would override it, leaving a screen
    // reader announcing "Copy to clipboard" over the feedback (WCAG 2.5.3).
    const button = page.getByTestId('snippet-default').getByRole('button');

    await expect(button).toHaveAccessibleName('Copy to clipboard');
    await button.click();
    await expect(button).toHaveAccessibleName('Copied!');
  });

  test('the headless demo announces through a sibling region, not one inside the button', async ({
    page
  }) => {
    const row = page.getByTestId('snippet-headless');
    const status = row.locator('[role="status"]');

    await expect(status).toHaveCount(1);
    expect(await status.evaluate((el) => el.closest('button') === null)).toBe(true);
    await expect(row.locator('button [aria-live]')).toHaveCount(0);

    await row.getByRole('button').click();
    await expect(status).toHaveText('Copied to clipboard');
  });

  test('renders no Snippet presentation around it', async ({ page }) => {
    // The point of the extraction: no code box, no prompt glyph.
    const row = page.getByTestId('snippet-headless');
    await expect(row.locator('.snippet')).toHaveCount(0);
    await expect(row.locator('.snippet-prompt')).toHaveCount(0);
  });
});
