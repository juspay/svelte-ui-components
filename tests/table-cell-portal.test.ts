import { expect, test } from '@playwright/test';

test.describe('Table — usePortal escapes clipping containers for in-cell dropdowns', () => {
  // The demo wraps a usePortal table (a type:'select' column) in a 120px-tall
  // overflow:hidden frame. Without portaling the dropdown would be clipped; with
  // it, the panel is relocated to <body> and fixed-positioned.
  test('an in-cell select dropdown portals to <body> instead of being clipped', async ({
    page
  }) => {
    await page.goto('/components/table');

    const table = page.locator('[data-pw="table-portal-cells"]');
    await expect(table).toBeVisible();

    // Open the in-cell tier select.
    await page.locator('[data-pw="portal-tier-0"]').getByRole('combobox').click();

    // The dropdown is portaled: a top-level child of <body>, fixed-positioned.
    const portaled = page.locator('body > [role="listbox"]');
    await expect(portaled).toHaveCount(1);
    await expect(portaled).toBeVisible();
    await expect(portaled).toHaveCSS('position', 'fixed');

    // It extends beyond the 120px clipper (would be cut off in-flow).
    const clipperBox = await page.locator('[data-pw="table-portal-clipper"]').boundingBox();
    const dropdownBox = await portaled.boundingBox();
    expect(clipperBox).not.toBeNull();
    expect(dropdownBox).not.toBeNull();
    if (clipperBox !== null && dropdownBox !== null) {
      expect(dropdownBox.y + dropdownBox.height).toBeGreaterThan(clipperBox.y + clipperBox.height);
    }

    // The last option is reachable and selectable.
    await portaled.getByRole('option', { name: 'Enterprise', exact: true }).click();
    await expect(portaled).toHaveCount(0); // single-select closes on pick
  });

  test('without usePortal the in-cell select dropdown stays in the table', async ({ page }) => {
    await page.goto('/components/table');

    // The interactive demo table (no usePortal) keeps its dropdown in-flow.
    await page
      .locator('[data-pw="table-interactive-cells"] [data-pw="demo-tier-0"]')
      .getByRole('combobox')
      .click();
    await expect(page.locator('body > [role="listbox"]')).toHaveCount(0);
  });
});
