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

  test('Enter opens the menu exactly once, rather than toggling it shut again', async ({
    page
  }) => {
    await page.goto('/components/menu');

    // The regression this guards: a native <button> synthesises a click from Enter, and that
    // click is already wired to toggle. If Menu also handled Enter in the keydown it hands the
    // snippet, the two would cancel and the menu would flicker open then closed.
    const button = page.getByTestId('menu-interactive-trigger-button');
    await button.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByText('Newest first')).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  test('Space opens the menu exactly once too', async ({ page }) => {
    await page.goto('/components/menu');

    const button = page.getByTestId('menu-interactive-trigger-button');
    await button.focus();
    await page.keyboard.press('Space');

    await expect(page.getByText('Newest first')).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  test('ArrowDown still opens the menu — the key a native button does not implement', async ({
    page
  }) => {
    await page.goto('/components/menu');

    const button = page.getByTestId('menu-interactive-trigger-button');
    await button.focus();
    await page.keyboard.press('ArrowDown');

    await expect(page.getByText('Newest first')).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  test('closing returns focus to the control, not the wrapper', async ({ page }) => {
    await page.goto('/components/menu');

    // The wrapper carries no tabindex under interactiveTrigger, so focusing it is a no-op
    // and focus would fall to <body> — leaving a keyboard user stranded after Escape.
    const button = page.getByTestId('menu-interactive-trigger-button');
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Newest first')).toBeVisible();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await expect(button).toBeFocused();
  });

  test('selecting an item also returns focus to the control', async ({ page }) => {
    await page.goto('/components/menu');

    const button = page.getByTestId('menu-interactive-trigger-button');
    await button.click();
    await page.getByText('Newest first').click();
    await page.waitForTimeout(300);

    await expect(button).toBeFocused();
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
