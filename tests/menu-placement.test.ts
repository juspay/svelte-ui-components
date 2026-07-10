import { expect, test } from '@playwright/test';

// Covers the `placement` prop: the default stays left/below-anchored (backwards
// compatible), 'bottom-right' anchors the panel's right edge to the trigger, and
// 'auto' measures on open and flips corners so the panel stays inside the viewport.
test.describe('Menu — placement', () => {
  test('default placement keeps the panel left-aligned below the trigger', async ({ page }) => {
    await page.goto('/components/menu');

    const menu = page.locator('[data-pw="menu-default-demo"]');
    await menu.locator('.menu-trigger').click();

    const dropdown = menu.locator('.menu-dropdown');
    await expect(dropdown).toBeVisible();

    const containerBox = await menu.boundingBox();
    const dropdownBox = await dropdown.boundingBox();
    if (containerBox === null || dropdownBox === null) {
      throw new Error('expected trigger and dropdown boxes');
    }
    expect(Math.abs(dropdownBox.x - containerBox.x)).toBeLessThanOrEqual(1);
    expect(dropdownBox.y).toBeGreaterThanOrEqual(containerBox.y + containerBox.height - 1);
  });

  test('bottom-right anchors the panel right edge to the trigger right edge', async ({ page }) => {
    await page.goto('/components/menu');

    const menu = page.locator('[data-pw="menu-bottom-right-demo"]');
    await menu.locator('.menu-trigger').click();

    const dropdown = menu.locator('.menu-dropdown');
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toHaveClass(/menu-dropdown-bottom-right/);

    const containerBox = await menu.boundingBox();
    const dropdownBox = await dropdown.boundingBox();
    if (containerBox === null || dropdownBox === null) {
      throw new Error('expected trigger and dropdown boxes');
    }
    expect(
      Math.abs(dropdownBox.x + dropdownBox.width - (containerBox.x + containerBox.width))
    ).toBeLessThanOrEqual(1);
    expect(dropdownBox.y).toBeGreaterThanOrEqual(containerBox.y + containerBox.height - 1);
  });

  test('auto placement flips to top-right for a trigger pinned at the viewport corner', async ({
    page
  }) => {
    await page.goto('/components/menu');

    const menu = page.locator('[data-pw="menu-auto-corner-demo"]');
    await menu.scrollIntoViewIfNeeded();
    await menu.locator('.menu-trigger').click();

    const dropdown = menu.locator('.menu-dropdown');
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toHaveClass(/menu-dropdown-top-right/);
    await expect(dropdown).not.toHaveClass(/menu-dropdown-measuring/);

    const dropdownBox = await dropdown.boundingBox();
    const viewport = page.viewportSize();
    if (dropdownBox === null || viewport === null) {
      throw new Error('expected dropdown box and viewport');
    }
    expect(dropdownBox.x).toBeGreaterThanOrEqual(0);
    expect(dropdownBox.y).toBeGreaterThanOrEqual(0);
    expect(dropdownBox.x + dropdownBox.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(dropdownBox.y + dropdownBox.height).toBeLessThanOrEqual(viewport.height + 1);
  });

  test('auto placement stays at the default corner when there is room', async ({ page }) => {
    await page.goto('/components/menu');

    // This demo sits in the normal content flow near the top-left, so every
    // direction has room and resolveAutoPlacement must keep the default corner.
    const menu = page.locator('[data-pw="menu-auto-roomy-demo"]');
    await menu.locator('.menu-trigger').click();

    const dropdown = menu.locator('.menu-dropdown');
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toHaveClass(/menu-dropdown-bottom-left/);
    await expect(dropdown).not.toHaveClass(/menu-dropdown-measuring/);
    await expect(dropdown).not.toHaveClass(/menu-dropdown-top-left/);
    await expect(dropdown).not.toHaveClass(/menu-dropdown-top-right/);
    await expect(dropdown).not.toHaveClass(/menu-dropdown-bottom-right/);
  });

  test('omitted placement never gains a corner class (existing-consumer guard)', async ({
    page
  }) => {
    await page.goto('/components/menu');

    const menu = page.locator('[data-pw="menu-default-demo"]');
    await menu.locator('.menu-trigger').click();

    const dropdown = menu.locator('.menu-dropdown');
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toHaveClass(/menu-dropdown-bottom-left/);
    await expect(dropdown).not.toHaveClass(/menu-dropdown-top-right/);
    await expect(dropdown).not.toHaveClass(/menu-dropdown-bottom-right/);
  });
});
