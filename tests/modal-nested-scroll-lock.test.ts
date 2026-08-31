import { expect, test } from '@playwright/test';

test.describe('Body scroll lock — reference counted across surfaces', () => {
  test('closing a nested Modal leaves the outer Modal’s lock in place', async ({ page }) => {
    await page.goto('/components/modal');

    const overflow = () => page.evaluate(() => document.body.style.overflow);
    const outer = page.locator('[data-pw="nested-lock-outer-modal"]');
    const inner = page.locator('[data-pw="nested-lock-inner-modal"]');

    await expect.poll(overflow).toBe('');

    await page.getByTestId('nested-lock-open-outer').click();
    await expect(outer).toBeVisible();
    await expect.poll(overflow).toBe('hidden');

    // Second holder: the count goes to 2 and the body stays hidden.
    await page.getByTestId('nested-lock-open-inner').click();
    await expect(inner).toBeVisible();
    await expect.poll(overflow).toBe('hidden');

    // Wait for the inner Modal to be genuinely DETACHED before reading overflow.
    // Modal plays an exit transition, so its onDestroy — and therefore the unlock —
    // runs after the click resolves; asserting immediately samples the old value and
    // passes even when the lock is being clobbered.
    await page.getByTestId('nested-lock-close-inner').click();
    await expect(inner).toHaveCount(0);
    await expect(outer).toBeVisible();

    // Releasing ONE holder must not restore scrolling while the outer Modal is still
    // mounted. Without reference counting this reads '' and the page behind the
    // still-open modal scrolls. Asserted directly, not via poll: poll would retry
    // past a transient correct value, and here the value must be right and STAY right.
    expect(await overflow()).toBe('hidden');

    // Only the last holder releasing restores it.
    await page.getByTestId('nested-lock-close-outer').click();
    await expect(outer).toHaveCount(0);
    await expect.poll(overflow).toBe('');
  });
});
