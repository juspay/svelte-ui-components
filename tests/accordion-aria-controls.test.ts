import { expect, test } from '@playwright/test';

test.describe('Accordion — the trigger is linked to the panel it controls', () => {
  // The trigger and the collapsible panel are siblings, not ancestor/descendant, so
  // without aria-controls nothing in the markup says WHICH region the trigger's
  // aria-expanded describes. A screen-reader user hears "expanded" with no way to jump
  // to what expanded. The trigger already had role="button" and aria-expanded, which is
  // exactly the pattern that makes the missing link conspicuous.
  test('aria-controls points at the panel element, which really carries that id', async ({
    page
  }) => {
    await page.goto('/components/accordion');

    const panel = page.getByTestId('accordion-linked');
    const trigger = page.locator('.accordion-trigger').first();

    const controls = await trigger.getAttribute('aria-controls');
    expect(controls, 'the trigger must reference a panel').toBeTruthy();

    // The reference has to resolve to the actual panel, not merely be present.
    await expect(panel).toHaveAttribute('id', String(controls));
  });

  test('aria-expanded tracks the real open state on the linked panel', async ({ page }) => {
    await page.goto('/components/accordion');

    const trigger = page.locator('.accordion-trigger').first();
    const panel = page.getByTestId('accordion-linked');

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).not.toHaveClass(/expanded/);

    await trigger.click();

    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toHaveClass(/expanded/);
  });

  test('each instance generates its own panel id, so two accordions never collide', async ({
    page
  }) => {
    await page.goto('/components/accordion');

    const triggers = page.locator('.accordion-trigger');
    const first = await triggers.nth(0).getAttribute('aria-controls');
    const second = await triggers.nth(1).getAttribute('aria-controls');

    expect(first).toBeTruthy();
    expect(second).toBeTruthy();
    expect(first).not.toBe(second);
  });

  test('an explicit panelId is used verbatim for both the panel and the reference', async ({
    page
  }) => {
    await page.goto('/components/accordion');

    const panel = page.getByTestId('accordion-custom-panel');
    await expect(panel).toHaveAttribute('id', 'returns-policy-panel');

    const trigger = page.locator('.accordion-trigger').nth(1);
    await expect(trigger).toHaveAttribute('aria-controls', 'returns-policy-panel');
  });
});
