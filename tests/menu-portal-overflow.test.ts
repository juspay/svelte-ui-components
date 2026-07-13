import { expect, test } from '@playwright/test';

test.describe('Menu — usePortal escapes clipping containers', () => {
  // The demo wraps two Menus in 90px-tall overflow:hidden boxes. The default
  // in-flow panel is clipped by that box; the usePortal panel is relocated to
  // <body> and fixed-positioned at the resolved corner so it renders in full.
  test('portals the dropdown to <body> so an overflow:hidden ancestor cannot clip it', async ({
    page
  }) => {
    await page.goto('/components/menu');

    const portalMenu = page.locator('[data-pw="menu-portal-demo"]');
    await expect(portalMenu).toBeVisible();
    await portalMenu.locator('.menu-trigger').click();

    // The panel is portaled: the menu-dropdown is a descendant of <body>, not of
    // the .menu-container inside the clipper.
    const portaledDropdown = page.locator('body > .menu-dropdown');
    await expect(portaledDropdown).toHaveCount(1);
    await expect(portaledDropdown).toBeVisible();
    await expect(portaledDropdown).toHaveCSS('position', 'fixed');

    // It extends below the 90px clipper box (would be cut off in-flow).
    const clipperBox = await page.locator('[data-pw="menu-portal-clipper"]').boundingBox();
    const dropdownBox = await portaledDropdown.boundingBox();
    expect(clipperBox).not.toBeNull();
    expect(dropdownBox).not.toBeNull();
    if (clipperBox !== null && dropdownBox !== null) {
      expect(dropdownBox.y + dropdownBox.height).toBeGreaterThan(clipperBox.y + clipperBox.height);
    }

    // The last item is fully reachable and selectable.
    await portaledDropdown.getByText('Delete', { exact: true }).click();
    await expect(portaledDropdown).toHaveCount(0); // selecting closes the menu
  });

  test('the default (in-flow) dropdown stays inside the .menu-container', async ({ page }) => {
    await page.goto('/components/menu');

    const inflowMenu = page.locator('[data-pw="menu-inflow-demo"]');
    await inflowMenu.locator('.menu-trigger').click();

    // Not portaled: no menu-dropdown is a direct child of <body>; it lives in
    // the container.
    await expect(page.locator('body > .menu-dropdown')).toHaveCount(0);
    await expect(inflowMenu.locator('.menu-dropdown')).toBeVisible();
  });
});
