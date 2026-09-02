import { expect, test } from '@playwright/test';

// suppressRoleAndTabindex hands the interactive semantics to a consumer-owned element. Once the
// item has no role, an aria-selected left on the generic div is state on nothing: assistive
// technology ignores it at best and reports a contradiction at worst.
test.describe('ListItem — suppressRoleAndTabindex also drops aria-selected', () => {
  test('the suppressed item carries neither a role nor a selected state', async ({ page }) => {
    await page.goto('/components/list-item');
    const item = page.getByTestId('list-item-suppressed');
    await expect(item).toBeVisible();
    await expect(item).not.toHaveAttribute('role', /.*/);
    await expect(item).not.toHaveAttribute('tabindex', /.*/);
    await expect(item).not.toHaveAttribute('aria-selected', /.*/);
  });
});
