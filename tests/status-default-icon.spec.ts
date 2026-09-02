import { expect, test } from '@playwright/test';

/**
 * `statusIcon` defaults to `icons/order-success-icon.svg` — a relative URL
 * resolved against whatever page renders the component, for a file the library
 * has never shipped. It pointed at something real only for an app serving that
 * exact path at its own root, and resolved to
 * `<route>/icons/order-success-icon.svg` anywhere deeper. On this demo, at
 * `/components/status`, it requests `/components/icons/order-success-icon.svg`
 * and 404s, so every card relying on the default rendered a broken image.
 *
 * The default is left alone, because an app that does host that path is
 * relying on it. A built-in icon stands in only when the fetch fails.
 */
test('the default icon falls back to the built-in one when the file is absent', async ({
  page
}) => {
  await page.goto('/components/status');

  const icon = page.locator(
    '[data-pw="status-inline"] .status-image img, [data-pw="status-inline"] .status-image svg'
  );
  await expect(icon.first()).toBeVisible();

  // Painted, not merely present: a broken image still occupies the DOM.
  const painted = await icon.first().evaluate((node) => {
    if (node instanceof HTMLImageElement) {
      return node.complete && node.naturalWidth > 0;
    }
    const box = node.getBoundingClientRect();
    return box.width > 0 && box.height > 0;
  });
  expect(painted).toBe(true);
});

test('the fallback does not replace an icon the caller supplied', async ({ page }) => {
  // Forced to fail, because that is the only state where the scoping matters.
  // Asserting merely that the caller's URL was requested would pass even if the
  // built-in icon then replaced it -- both render as an <svg>.
  await page.route('**/status-success.svg', (route) => route.abort());

  await page.goto('/components/status');

  const icon = page.locator('[data-pw="status-default-icon"] .status-image');
  // The built-in fallback is inlined into an <svg>; its absence is what proves
  // it was not applied. A caller's failed icon stays a plain <img>.
  await expect(icon.locator('svg')).toHaveCount(0);
  await expect(icon.locator('img')).toHaveCount(1);
});

test('the icon takes its accessible name from statusIconAlt, not from its own markup', async ({
  page
}) => {
  // `role` and `aria-label` are both in Img's allowlist, so an icon carrying
  // its own would outrank the alt-derived label on every screen that uses it.
  // The fallback is inlined into an <svg> host, where the name lives on
  // `aria-label` rather than on `alt`.
  await page.goto('/components/status');

  const icon = page.locator('[data-pw="status-inline"] .status-image svg');
  await expect(icon).toHaveAttribute('aria-label', 'status');
});

test('statusIconAlt is forwarded, not just defaulted', async ({ page }) => {
  // Asserting only the default would pass even if the prop stopped being
  // forwarded at all.
  await page.goto('/components/status');

  await expect(page.locator('[data-pw="status-alt-named"] .status-image svg')).toHaveAttribute(
    'aria-label',
    'Payment confirmed'
  );
});

test('an empty statusIconAlt marks the icon decorative', async ({ page }) => {
  await page.goto('/components/status');

  const icon = page.locator('[data-pw="status-alt-decorative"] .status-image svg');
  await expect(icon).toHaveAttribute('aria-hidden', 'true');
  await expect(icon).not.toHaveAttribute('aria-label', /.+/);
});
