import { expect, test } from '@playwright/test';

// Two contracts that only a real browser can settle. Manual activation is the
// WAI-ARIA APG recommendation for expensive panels: arrowing must move focus
// WITHOUT selecting. And direction inherited purely through CSS cannot be tested
// in jsdom, whose cascade does not inherit `direction` into an element that
// matches a stylesheet rule — so the arrow-key reversal is asserted here.
test.describe('Tabs manual activation, disabled items and inherited direction', () => {
  test('manual activation moves focus without selecting until Enter', async ({ page }) => {
    await page.goto('/components/tabs');

    const demo = page.getByTestId('tabs-manual-demo');
    const tabAt = (label: string) => demo.getByRole('tab', { name: label, exact: true });

    await tabAt('Overview').focus();
    await page.keyboard.press('ArrowRight');

    // Billing is disabled, so focus lands past it, and nothing is selected yet.
    await expect(tabAt('Members')).toBeFocused();
    await expect(tabAt('Overview')).toHaveAttribute('aria-selected', 'true');
    await expect(tabAt('Members')).toHaveAttribute('aria-selected', 'false');

    await page.keyboard.press('Enter');
    await expect(tabAt('Members')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Active key: members')).toBeVisible();
  });

  test('a disabled tab cannot be selected by click or keyboard', async ({ page }) => {
    await page.goto('/components/tabs');

    const demo = page.getByTestId('tabs-manual-demo');
    const billing = demo.getByRole('tab', { name: 'Billing', exact: true });

    await expect(billing).toHaveAttribute('aria-disabled', 'true');
    await expect(billing).toHaveAttribute('tabindex', '-1');
    // Playwright refuses to act on an aria-disabled element, which is itself part of
    // the contract; forcing the click through shows nothing changes either.
    await billing.click({ force: true });
    await expect(billing).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByText('Active key: overview')).toBeVisible();
  });

  test('loop=false stops at the ends instead of wrapping', async ({ page }) => {
    await page.goto('/components/tabs');

    const demo = page.getByTestId('tabs-manual-demo');
    const tabAt = (label: string) => demo.getByRole('tab', { name: label, exact: true });

    await tabAt('Overview').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(tabAt('Overview')).toBeFocused();

    await page.keyboard.press('End');
    await expect(tabAt('Audit log')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(tabAt('Audit log')).toBeFocused();
  });

  test('arrow keys reverse under a direction inherited only from CSS', async ({ page }) => {
    await page.goto('/components/tabs');

    const demo = page.getByTestId('tabs-rtl-demo');
    const tabAt = (label: string) => demo.getByRole('tab', { name: label, exact: true });

    // The ancestor sets `direction: rtl` in CSS and carries no dir attribute.
    await expect(demo.locator('[dir]')).toHaveCount(0);

    await tabAt('Beta').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(tabAt('Gamma')).toHaveAttribute('aria-selected', 'true');
    await expect(tabAt('Gamma')).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(tabAt('Beta')).toHaveAttribute('aria-selected', 'true');
    await expect(tabAt('Beta')).toBeFocused();
  });
});
