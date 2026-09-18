import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

/*
 * `primary: 'auto'` resolves against the RENDERED type scale, so it cannot be
 * tested without a layout engine: jsdom reports every font size as 0, which is
 * why the unit tests cover only the explicit `primary` and the metric gate.
 *
 * That left the default path -- the one every adopter actually uses -- with no
 * end-to-end coverage at all, while a commit message claimed the browser suite
 * covered it. It did not. This is that coverage.
 *
 * The demo reproduces the shape this exists for: a 44px subtitle above 18px
 * rows, which is the business StatCard variant. Getting it wrong there animated
 * the small supporting rows and left the headline static.
 */
const ROUTE = '/components/stat-card';

test('primary:auto animates the largest metric, not the small rows', async ({ page }) => {
  await gotoHydrated(page, ROUTE);

  const card = page.getByTestId('primary-auto');
  await expect(card).toBeVisible();

  const resolved = await card.evaluate((node: HTMLElement) => {
    const slots = Array.from(node.querySelectorAll('[data-sc-slot]'));
    return slots.map((slot) => ({
      slot: slot.getAttribute('data-sc-slot'),
      size: Number.parseFloat(getComputedStyle(slot).fontSize),
      animated: slot.querySelector('.animated-number') !== null,
      text: (slot.textContent ?? '').trim().slice(0, 12)
    }));
  });

  const animated = resolved.filter((slot) => slot.animated);
  expect(animated, `exactly one slot should animate, got ${JSON.stringify(resolved)}`).toHaveLength(
    1
  );
  expect(animated[0]?.slot).toBe('subtitle');

  // And it must be the largest, not merely the first: that is the whole
  // difference between measuring and guessing.
  const largest = resolved.reduce((a, b) => (b.size > a.size ? b : a));
  expect(animated[0]?.slot).toBe(largest.slot);
  expect(largest.size).toBeGreaterThan(
    Math.max(...resolved.filter((s) => s.slot !== largest.slot).map((s) => s.size))
  );
});

test('primary:auto animates nothing on a card whose values are identifiers', async ({ page }) => {
  await gotoHydrated(page, ROUTE);

  const card = page.getByTestId('primary-identifiers');
  await expect(card).toBeVisible();

  const animated = await card.evaluate(
    (node: HTMLElement) => node.querySelectorAll('.animated-number').length
  );
  // A hostname and a parenthesised account id both carry digits. Neither is a
  // measurement, so the largest-slot search must come back empty rather than
  // settling for the biggest identifier on the card.
  expect(animated).toBe(0);
});
