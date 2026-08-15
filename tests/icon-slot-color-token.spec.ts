import { expect, test } from '@playwright/test';

// 2.120.3 made six icon slots inline their SVG, so a `currentColor` asset finally resolves
// against the host document instead of painting UA black. That was necessary but not
// sufficient: none of those slots exposed a COLOUR hook, so an inlined icon could only ever
// land on its component's text colour — exactly its label's value. A muted-icon/strong-label
// hierarchy became inexpressible, and any consumer migrating an icon to `currentColor` had to
// accept the flattening.
//
// Each slot now reads `--<component>-<slot>-icon-color`, defaulting to `inherit` so nothing
// changes for a component that sets none.
//
// Note on the locator: with `inlineSvg` the testId lands on the `<svg>` ITSELF, not on a
// wrapper around it — so these assert on the element directly. A `.locator('svg')` descendant
// search finds nothing, which is a useful tell that the icon really is inlined rather than
// wrapped in an `<img>`.
test.describe('per-icon colour token', () => {
  test('defaults to inherit — the icon still takes the trigger text colour', async ({ page }) => {
    await page.goto('/components/select');

    const icon = page.getByTestId('select-left-icon');
    await expect(icon).toBeVisible();

    // That demo row sets only --select-color: #2563eb and no icon colour, so the icon must
    // follow it. This is the pre-existing behaviour the change must not alter.
    await expect(icon).toHaveCSS('color', 'rgb(37, 99, 235)');
  });

  test('an explicit --select-left-icon-color decouples the icon from the label', async ({
    page
  }) => {
    await page.goto('/components/select');

    const icon = page.getByTestId('select-tinted-left-icon');
    await expect(icon).toBeVisible();

    // The row sets --select-color: #111827 (label) and --select-left-icon-color: #9ca3af (icon).
    // Assert BOTH halves — that the icon takes the muted grey, and that the surrounding trigger
    // does not. Checking only the icon would still pass if the token had simply recoloured
    // everything, which is the failure this exists to catch.
    await expect(icon).toHaveCSS('color', 'rgb(156, 163, 175)');

    const trigger = page.locator('.select-trigger').filter({ has: icon });
    await expect(trigger).toHaveCSS('color', 'rgb(17, 24, 39)');
  });

  test('the inlined SVG paints from the token, not merely a wrapper', async ({ page }) => {
    await page.goto('/components/select');

    // The asset is drawn with stroke="currentColor". A wrapper carrying the right `color`
    // proves nothing on its own — what matters is that the SVG's own resolved `stroke` picks
    // it up, which only happens when the asset is inlined into this document.
    const icon = page.getByTestId('select-tinted-left-icon');
    await expect(icon).toBeVisible();

    const painted = await icon.evaluate((node) => ({
      tag: node.tagName.toLowerCase(),
      stroke: getComputedStyle(node).stroke
    }));

    expect(painted.tag).toBe('svg');
    expect(painted.stroke).toBe('rgb(156, 163, 175)');
  });
});
