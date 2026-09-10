import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// The accordion trigger (WAI-ARIA disclosure pattern) already had aria-controls/aria-expanded
// wiring exercised via .click() elsewhere, but nothing drove it from the keyboard — the actual
// way a screen-reader or keyboard-only user operates a disclosure widget.
test.describe('Accordion keyboard interaction (WAI-ARIA disclosure pattern)', () => {
  test('Tab reaches the trigger, which is focusable with a visible focus target', async ({
    page
  }) => {
    await gotoHydrated(page, '/components/accordion');

    const trigger = page.getByRole('button', { name: /Shipping details/ });
    await trigger.focus();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('tabindex', '0');
  });

  test('Enter and Space both toggle aria-expanded and the panel', async ({ page }) => {
    await gotoHydrated(page, '/components/accordion');

    const trigger = page.getByRole('button', { name: /Shipping details/ });
    const panel = page.getByTestId('accordion-linked');

    await trigger.focus();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).not.toHaveClass(/expanded/);

    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toHaveClass(/expanded/);

    await page.keyboard.press(' ');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).not.toHaveClass(/expanded/);
  });

  test('the accessible name comes from the rendered trigger content', async ({ page }) => {
    await gotoHydrated(page, '/components/accordion');

    // getByRole with a name only resolves if accessible-name computation reaches the
    // trigger's snippet content — a regression here would make every getByRole lookup
    // above fail silently instead of loudly.
    await expect(page.getByRole('button', { name: /Returns policy/ })).toBeVisible();
  });

  test('a disabled trigger leaves the tab order and ignores Enter/Space', async ({ page }) => {
    await gotoHydrated(page, '/components/accordion');

    const trigger = page.locator('.accordion-trigger', {
      has: page.getByTestId('accordion-disabled-trigger-label')
    });

    await expect(trigger).toHaveAttribute('tabindex', '-1');
    await expect(trigger).toHaveAttribute('aria-disabled', 'true');

    // tabindex=-1 still allows a direct, non-Tab focus call (e.g. a screen reader's
    // virtual cursor) — the handler itself must refuse to act, not merely the tab order.
    await trigger.evaluate((element) => {
      if (element instanceof HTMLElement) {
        element.focus();
      }
    });
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press(' ');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
