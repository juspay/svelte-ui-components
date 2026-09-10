import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Table's row menus render a real Button in the trigger snippet, so Menu's inert-trigger
// wrapper was the wrong branch: it added a second focusable role="button" around the named
// Button, and its own aria-label resolved to null. The row menu was therefore both a
// duplicated tab stop and an unnamed one. These assert the shape rather than the symptom —
// a test that only looks for the Button passes either way.
test.describe('Table row menus — one named tab stop', () => {
  test('the action-group menu wrapper is inert, and the Button carries the ARIA', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/table');

    const wrapper = page.locator('[data-pw="demo-manage-menu-0"] .menu-trigger');
    await expect(wrapper).not.toHaveAttribute('role', /.*/);
    await expect(wrapper).not.toHaveAttribute('tabindex', /.*/);

    const button = page.getByTestId('demo-manage-menu-trigger-0');
    await expect(button).toHaveAccessibleName('More actions');
    await expect(button).toHaveAttribute('aria-haspopup', 'menu');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('the popup menu wrapper is inert, and the Button carries the ARIA', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    const wrapper = page.locator('[data-pw="demo-more-popup-0"] .menu-trigger');
    await expect(wrapper).not.toHaveAttribute('role', /.*/);
    await expect(wrapper).not.toHaveAttribute('tabindex', /.*/);

    const button = page.getByTestId('demo-more-popup-trigger-0');
    await expect(button).toHaveAccessibleName('More actions');
    await expect(button).toHaveAttribute('aria-haspopup', 'menu');
  });

  test('a row menu contributes exactly one focusable element', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    // The defect was two focus stops for one conceptual control, one of them nameless.
    // Counting is what distinguishes the fix from a wrapper that merely gained a label.
    const focusable = await page
      .locator('[data-pw="demo-manage-menu-0"]')
      .evaluate(
        (menu) =>
          menu.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ).length
      );

    expect(focusable).toBe(1);
  });

  test('the header filter trigger is the Button, not a wrapper around it', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    // Same mechanism, third call site: a column filter renders a real Button in the trigger
    // snippet too, so every filterable column carried the same nameless second tab stop.
    const wrapper = page.locator('[data-pw="meta-status-filter"] .menu-trigger');
    await expect(wrapper).not.toHaveAttribute('role', /.*/);
    await expect(wrapper).not.toHaveAttribute('tabindex', /.*/);

    const button = page.getByTestId('meta-status-filter-trigger');
    await expect(button).toHaveAccessibleName('Filter by Status');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('the trigger still opens the menu and reports expansion', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    // interactiveTrigger moves the click wiring off the wrapper and onto the snippet, so
    // the menu stops opening entirely if the snippet does not spread what Menu hands it.
    const button = page.getByTestId('demo-manage-menu-trigger-0');
    await button.click();

    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[role="menu"]').first()).toBeVisible();
  });

  test('the row menu still selects an item', async ({ page }) => {
    await gotoHydrated(page, '/components/table');

    const button = page.getByTestId('demo-manage-menu-trigger-0');
    await button.click();

    const item = page.locator('[role="menuitem"]').first();
    const label = (await item.textContent())?.trim() ?? '';
    await item.click();

    await expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(label.length).toBeGreaterThan(0);
  });
});
