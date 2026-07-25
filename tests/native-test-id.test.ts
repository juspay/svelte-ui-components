import { expect, test } from '@playwright/test';

/**
 * Every component that accepts `testId` must emit the id for BOTH runners:
 * `data-pw` for Playwright and the native accessibility id for Appium, which
 * cannot read `data-pw`. Svelte lower-cases DOM attribute names, so the rendered
 * attribute is `testid`.
 */
test.describe('testId emits both web and native test attributes', () => {
  test('Checkbox exposes data-pw and the native testid from one testId prop', async ({ page }) => {
    await page.goto('/components/checkbox');

    const target = page.locator('[data-pw="checkbox-default"]').first();
    await expect(target).toBeVisible();

    // Same element, same value, reachable by either runner's attribute.
    await expect(target).toHaveAttribute('testid', 'checkbox-default');
    await expect(page.locator('[testid="checkbox-default"]').first()).toBeVisible();
  });

  test('the native attribute is omitted when no testId is supplied', async ({ page }) => {
    await page.goto('/components/checkbox');

    // A bare `testid` must never render as the literal string "undefined"/"null";
    // absent ids emit no attribute at all.
    const strayIds = await page
      .locator('[testid="undefined"], [testid="null"], [testid=""]')
      .count();
    expect(strayIds).toBe(0);
  });
});
