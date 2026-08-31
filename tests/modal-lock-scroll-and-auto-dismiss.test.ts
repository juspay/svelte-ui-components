import { expect, test } from '@playwright/test';

test.describe('Modal lockScroll', () => {
  test('lockScroll=false leaves document.body scrollable', async ({ page }) => {
    await page.goto('/components/modal');

    await page.getByTestId('open-no-scroll-lock-modal').click();
    await expect(page.getByTestId('no-scroll-lock-modal')).toBeVisible();

    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).not.toBe('hidden');
  });

  test('the default (lockScroll unset) still locks scroll, unchanged', async ({ page }) => {
    await page.goto('/components/modal');

    await page.getByText('Open Modal', { exact: true }).click();
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('hidden');
  });
});

test.describe('Modal autoDismissAfter', () => {
  test('the modal closes itself after the given delay, firing onclose', async ({ page }) => {
    await page.goto('/components/modal');

    await page.getByTestId('open-auto-dismiss-modal').click();
    await expect(page.getByTestId('auto-dismiss-modal')).toBeVisible();

    await expect(page.getByTestId('auto-dismiss-modal')).toHaveCount(0, { timeout: 2000 });
    await expect(page.getByTestId('auto-dismiss-fired')).toBeVisible();
  });

  test('scroll unlocks once an auto-dismissed modal unmounts', async ({ page }) => {
    await page.goto('/components/modal');

    await page.getByTestId('open-auto-dismiss-modal').click();
    await expect(page.getByTestId('auto-dismiss-modal')).toHaveCount(0, { timeout: 2000 });

    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('');
  });
});
