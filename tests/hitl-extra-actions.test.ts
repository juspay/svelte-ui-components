import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Closes #528: HITL supported exactly one decision (confirm/cancel), so a
// third disposition (e.g. "deny with instructions") or any free-text/
// multi-select control had nowhere to live and consumers hand-rolled a
// separate Card instead of using HITL at all. `actions` adds extra buttons
// that never settle the card; `children` adds an extra content slot rendered
// only while the card is pending. Both are additive and off by default.
test.describe('HITL — extra actions and children (#528)', () => {
  test('an extra action never settles the card and calls its own onSelect', async ({ page }) => {
    await gotoHydrated(page, '/components/hitl');

    const card = page.getByTestId('demo-extra');
    await expect(card).toBeVisible();

    const extra = page.getByTestId('demo-extra-action-0');
    await expect(extra).toHaveText('Deny with instructions…');

    await extra.click();

    // Selecting it ran the consumer's onSelect (the counter incremented and the
    // children snippet's textarea appeared) ...
    await expect(page.getByTestId('demo-extra-count')).toHaveText('1');
    await expect(page.getByTestId('demo-extra-note')).toBeVisible();

    // ... but the card itself is NOT settled: no completion strip, and
    // confirm/cancel are both still there and still clickable.
    await expect(page.getByTestId('demo-extra-completion')).toHaveCount(0);
    await expect(page.getByTestId('demo-extra-confirm')).toBeVisible();
    await expect(page.getByTestId('demo-extra-cancel')).toBeVisible();
  });

  test('confirm still settles the card normally with an extra action present', async ({ page }) => {
    await gotoHydrated(page, '/components/hitl');

    await page.getByTestId('demo-extra-confirm').click();

    await expect(page.getByTestId('demo-extra-completion')).toBeVisible();
    await expect(page.getByTestId('demo-extra-completion-text')).toHaveText('Approved');
    // Settled: the extra action button is gone along with cancel/confirm.
    await expect(page.getByTestId('demo-extra-action-0')).toHaveCount(0);
  });

  test('default HITL usage (no actions, no children) renders unchanged: exactly two buttons', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/hitl');

    const card = page.getByTestId('demo-confirmation');
    await expect(card).toBeVisible();
    await expect(card.locator('.action-buttons > div')).toHaveCount(2);
    await expect(card.locator('.extra-content')).toHaveCount(0);
  });
});
