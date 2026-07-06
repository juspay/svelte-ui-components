import { expect, test } from '@playwright/test';

test.describe('Tooltip component', () => {
  test('shows bubble on hover and hides on mouse leave', async ({ page }) => {
    await page.goto('/components/tooltip');

    const trigger = page.locator('[data-pw="tooltip-container"]').first();
    await expect(trigger).toBeVisible();

    // No tooltip bubble visible initially.
    await expect(page.locator('[role="tooltip"]')).toHaveCount(0);

    // Hover the first Tooltip trigger.
    await trigger.hover();
    const bubble = page.locator('[role="tooltip"]').first();
    await expect(bubble).toBeVisible();

    // Mouse leave removes the bubble.
    await page.mouse.move(0, 0);
    await expect(page.locator('[role="tooltip"]')).toHaveCount(0);
  });
});

test.describe('tooltip action — use:tooltip directive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/tooltip');
  });

  test('shows bubble with correct text on hover', async ({ page }) => {
    const trigger = page.getByTestId('tooltip-action-top');
    await expect(trigger).toBeVisible();

    // No bubble before hover.
    await expect(page.locator('[role="tooltip"]')).toHaveCount(0);

    await trigger.hover();
    const bubble = page.locator('[role="tooltip"]').last();
    await expect(bubble).toBeVisible();
    await expect(bubble).toContainText('Save document');
  });

  test('removes bubble when mouse leaves trigger', async ({ page }) => {
    const trigger = page.getByTestId('tooltip-action-top');
    await trigger.hover();
    await expect(page.locator('[role="tooltip"]').last()).toBeVisible();

    await page.mouse.move(0, 0);
    // The action-appended bubble is removed from body.
    await expect(page.locator('body > [role="tooltip"]')).toHaveCount(0);
  });

  test('establishes aria-describedby between trigger and bubble', async ({ page }) => {
    const trigger = page.getByTestId('tooltip-action-top');
    await trigger.hover();

    const describedBy = await trigger.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    // The referenced element must exist and have role=tooltip.
    const referencedEl = page.locator(`#${describedBy}`);
    await expect(referencedEl).toHaveAttribute('role', 'tooltip');
  });

  test('removes aria-describedby when bubble is hidden', async ({ page }) => {
    const trigger = page.getByTestId('tooltip-action-top');
    await trigger.hover();
    await page.mouse.move(0, 0);

    const describedBy = await trigger.getAttribute('aria-describedby');
    expect(describedBy).toBeNull();
  });

  test('double-show race guard: only one bubble exists when trigger receives rapid mouseenter events', async ({
    page
  }) => {
    const trigger = page.getByTestId('tooltip-action-top');
    // Fire mouseenter twice in rapid succession via JS.
    await page.evaluate((selector: string) => {
      const el = document.querySelector(`[data-pw="${selector}"]`);
      if (el !== null) {
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      }
    }, 'tooltip-action-top');

    await expect(trigger).toBeVisible();
    const bubbles = page.locator('body > [role="tooltip"]');
    await expect(bubbles).toHaveCount(1);
  });

  test('delayed tooltip (300 ms) does not show immediately', async ({ page }) => {
    // The bottom trigger has delay=300.
    const trigger = page.getByTestId('tooltip-action-bottom');
    await expect(trigger).toBeVisible();
    // The action section sits below the fold; raw mouse.move cannot reach
    // coordinates outside the viewport, so bring the trigger on-screen first.
    await trigger.scrollIntoViewIfNeeded();
    const box = await trigger.boundingBox();
    if (box === null) {
      throw new Error('Trigger element boundingBox is null — element may not be visible');
    }
    await page.mouse.move(box.x + 5, box.y + 5);

    // Immediately after hover the bubble should not yet be visible.
    await expect(page.locator('body > [role="tooltip"]')).toHaveCount(0);

    // After 350ms it should appear.
    await page.waitForTimeout(350);
    await expect(page.locator('body > [role="tooltip"]')).toHaveCount(1);
    await expect(page.locator('body > [role="tooltip"]').last()).toContainText('Delete item');
  });

  test('tooltip bubble is mounted on document.body (portal behaviour)', async ({ page }) => {
    const trigger = page.getByTestId('tooltip-action-top');
    await trigger.hover();

    // The bubble must be a direct child of <body>, not nested inside the component.
    const bubbleCount = await page.evaluate(() => {
      return document.body.querySelectorAll(':scope > [role="tooltip"]').length;
    });
    expect(bubbleCount).toBe(1);
  });
});
