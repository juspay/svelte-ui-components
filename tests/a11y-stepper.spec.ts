import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Each Step is an independent role="button" tab stop (not a roving-tabindex composite)
// — a deliberate choice for this "clickable breadcrumb" shape, not an APG tablist or
// toolbar. These tests exercise that contract from the keyboard: every step is
// individually reachable, Enter/Space activates it, and suppressRoleAndTabindex
// genuinely removes a step from the tab order.
test.describe('Stepper and Step keyboard interaction', () => {
  test('each step is independently reachable by Tab', async ({ page }) => {
    await gotoHydrated(page, '/components/stepper');

    const container = page.getByTestId('stepper-horizontal');
    const cartStep = container.getByRole('button', { name: 'Cart' });
    const shippingStep = container.getByRole('button', { name: 'Shipping' });

    await cartStep.focus();
    await expect(cartStep).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(shippingStep).toBeFocused();
  });

  test('Enter and Space both activate a step, moving aria-current to it', async ({ page }) => {
    await gotoHydrated(page, '/components/stepper');

    const container = page.getByTestId('stepper-horizontal');
    const shippingStep = container.getByRole('button', { name: 'Shipping' });
    const paymentStep = container.getByRole('button', { name: 'Payment' });
    const cartStep = container.getByRole('button', { name: 'Cart' });

    // currentStepIndex initialises to 1, so Shipping starts active.
    await expect(shippingStep).toHaveAttribute('aria-current', 'step');

    await paymentStep.focus();
    await page.keyboard.press('Enter');
    await expect(paymentStep).toHaveAttribute('aria-current', 'step');
    await expect(shippingStep).not.toHaveAttribute('aria-current', /.*/);

    await cartStep.focus();
    await page.keyboard.press(' ');
    await expect(cartStep).toHaveAttribute('aria-current', 'step');
    await expect(paymentStep).not.toHaveAttribute('aria-current', /.*/);
  });

  test('the accessible name comes from the step label, via aria-labelledby', async ({ page }) => {
    await gotoHydrated(page, '/components/stepper');

    const container = page.getByTestId('stepper-horizontal');
    await expect(container.getByRole('button', { name: 'Confirm' })).toBeVisible();
  });

  test('suppressRoleAndTabindex removes a step from the tab order entirely', async ({ page }) => {
    await gotoHydrated(page, '/components/stepper');

    const container = page.getByTestId('stepper-informational');
    const cartStep = container.locator('.step').filter({ hasText: 'Cart' });

    // No role="button" means getByRole can no longer find it as a button at all —
    // the strongest form of "not keyboard reachable" a test can assert.
    await expect(container.getByRole('button')).toHaveCount(0);

    // Direct, non-Tab focus (e.g. a screen reader's virtual cursor) must also fail:
    // a plain <div> with no tabindex is not a focus target for the browser either.
    await cartStep.evaluate((element) => {
      if (element instanceof HTMLElement) {
        element.focus();
      }
    });
    await expect(cartStep).not.toBeFocused();
  });
});
