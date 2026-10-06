import { expect, test, type Page } from '@playwright/test';
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

  // Passing `children` with no `sections`/`functionArguments` must not, by
  // itself, suppress the "No parameters" placeholder -- only `questions`
  // does that. `demo-extra` is exactly this shape (an extra action plus a
  // conditionally-rendered children textarea, no sections/args/questions).
  test('a card with only children (no sections/functionArguments/questions) still shows "No parameters"', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/hitl');

    const card = page.getByTestId('demo-extra');
    await expect(card.locator('.parameter-label')).toHaveText('PARAMETERS');
    await expect(card.locator('.parameter-value')).toHaveText('No parameters');
  });
});

// The action row used to be a non-wrapping flex line inside a `contain: layout` card.
// With a third button it was wider than a phone: Confirm sat past the screen edge
// reading "Confi", outside its card, and because layout containment keeps overflow out
// of the document's scrollable width there was nothing to scroll to. The row now
// breaks between buttons when they do not fit.
test.describe('HITL — action row on a narrow card', () => {
  const boxOf = async (page: Page, testId: string) => {
    const box = await page.getByTestId(testId).boundingBox();
    expect(box, `${testId} is laid out`).not.toBeNull();
    return box as NonNullable<typeof box>;
  };

  for (const width of [390, 320]) {
    test(`all three buttons stay inside the card and the screen at ${width}px`, async ({
      page
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await gotoHydrated(page, '/components/hitl');

      const card = await boxOf(page, 'demo-extra');
      for (const id of ['demo-extra-cancel', 'demo-extra-action-0', 'demo-extra-confirm']) {
        const box = await boxOf(page, id);
        expect(box.x, `${id} starts inside the card`).toBeGreaterThanOrEqual(card.x - 0.5);
        expect(box.x + box.width, `${id} ends inside the card`).toBeLessThanOrEqual(
          card.x + card.width + 0.5
        );
        expect(box.x + box.width, `${id} ends inside the screen`).toBeLessThanOrEqual(width);
      }
      // It wrapped rather than shrinking text: one of the buttons is on a lower line.
      const tops = await Promise.all(
        ['demo-extra-cancel', 'demo-extra-action-0', 'demo-extra-confirm'].map(
          async (id) => (await boxOf(page, id)).y
        )
      );
      expect(new Set(tops.map(Math.round)).size).toBeGreaterThan(1);

      // Reachable, not merely drawn: a click lands on the real Confirm.
      await page.getByTestId('demo-extra-confirm').click();
      await expect(page.getByTestId('demo-extra-completion-text')).toHaveText('Approved');
    });

    test(`a two-button card keeps both on one line at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await gotoHydrated(page, '/components/hitl');
      // The "manual only" card has no timers, so its buttons are always there.
      const cancel = await page.getByRole('button', { name: 'Not yet' }).boundingBox();
      const confirm = await page.getByRole('button', { name: 'Publish now' }).boundingBox();
      expect(cancel).not.toBeNull();
      expect(confirm).not.toBeNull();
      expect(Math.abs((cancel?.y ?? 0) - (confirm?.y ?? 99))).toBeLessThan(1);
      expect(confirm?.x ?? 0).toBeGreaterThan((cancel?.x ?? 0) + (cancel?.width ?? 0) - 1);
    });
  }

  test('on a wide column the three buttons share one line, as before', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoHydrated(page, '/components/hitl');
    const tops = await Promise.all(
      ['demo-extra-cancel', 'demo-extra-action-0', 'demo-extra-confirm'].map(
        async (id) => (await boxOf(page, id)).y
      )
    );
    expect(new Set(tops.map(Math.round)).size).toBe(1);
  });
});
