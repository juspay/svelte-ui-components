import { expect, test } from '@playwright/test';

test.describe('Select — usePortal escapes clipping containers', () => {
  // The demo wraps two Selects in 90px-tall overflow:hidden boxes. The default
  // in-flow panel is clipped by that box; the usePortal panel is relocated to
  // <body> and fixed-positioned against the trigger so it renders in full.
  test('portals the dropdown to <body> so an overflow:hidden ancestor cannot clip it', async ({
    page
  }) => {
    await page.goto('/components/select');

    const portalSelect = page.locator('[data-pw="select-portal-demo"]');
    await expect(portalSelect).toBeVisible();
    await portalSelect.getByRole('combobox').click();

    // The panel is portaled: its listbox is a top-level child of <body>, not a
    // descendant of the .select container inside the clipper.
    const portaledListbox = page.locator('body > [role="listbox"]');
    await expect(portaledListbox).toHaveCount(1);
    await expect(portaledListbox).toBeVisible();
    await expect(portaledListbox).toHaveCSS('position', 'fixed');

    // It extends below the 90px clipper box (would be cut off in-flow).
    const clipperBox = await page.locator('[data-pw="select-portal-clipper"]').boundingBox();
    const listboxBox = await portaledListbox.boundingBox();
    expect(clipperBox).not.toBeNull();
    expect(listboxBox).not.toBeNull();
    if (clipperBox !== null && listboxBox !== null) {
      expect(listboxBox.y + listboxBox.height).toBeGreaterThan(clipperBox.y + clipperBox.height);
    }

    // The last option is fully reachable and selectable.
    await portaledListbox.getByRole('option', { name: 'Grape', exact: true }).click();
    await expect(portalSelect.getByText('Grape')).toBeVisible();
  });

  test('the default (in-flow) dropdown stays inside the .select container', async ({ page }) => {
    await page.goto('/components/select');

    const inflowSelect = page.locator('[data-pw="select-inflow-demo"]');
    await inflowSelect.getByRole('combobox').click();

    // Not portaled: no listbox is a direct child of <body>; it lives in .select.
    await expect(page.locator('body > [role="listbox"]')).toHaveCount(0);
    await expect(inflowSelect.getByRole('listbox')).toBeVisible();
  });
});
