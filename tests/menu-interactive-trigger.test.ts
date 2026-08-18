import { expect, test } from '@playwright/test';

// Menu wraps its trigger snippet in a role="button" tabindex="0" div. That is right for
// inert trigger content and wrong when the snippet renders a real control: the result is
// two focusable elements for one conceptual trigger, both announcing as a button, with
// interactive content nested inside interactive content.
test.describe('Menu — interactiveTrigger', () => {
  test('the wrapper stops being a second interactive element', async ({ page }) => {
    await page.goto('/components/menu');

    const wrapper = page.locator('[data-pw="menu-interactive-trigger"] .menu-trigger');
    await expect(wrapper).not.toHaveAttribute('role', /.*/);
    await expect(wrapper).not.toHaveAttribute('tabindex', /.*/);

    // The ARIA moves onto the real control the consumer rendered.
    const button = page.getByTestId('menu-interactive-trigger-button');
    await expect(button).toHaveAttribute('aria-haspopup', 'menu');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('the trigger still opens the menu, and reports expansion', async ({ page }) => {
    await page.goto('/components/menu');

    const button = page.getByTestId('menu-interactive-trigger-button');
    await button.click();

    await expect(page.getByText('Newest first')).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  test('default menus are unchanged — the wrapper stays the interactive element', async ({
    page
  }) => {
    await page.goto('/components/menu');

    // Regression guard for every existing consumer: without the flag, Menu keeps
    // driving the trigger from its own wrapper exactly as before.
    const defaultWrapper = page.locator('.menu-trigger').first();
    await expect(defaultWrapper).toHaveAttribute('role', 'button');
    await expect(defaultWrapper).toHaveAttribute('tabindex', '0');
  });
});
