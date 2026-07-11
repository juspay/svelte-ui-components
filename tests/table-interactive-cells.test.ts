import { expect, test } from '@playwright/test';

test.describe('Table — interactive cell renderers', () => {
  test('button cell fires the column handler and never the row click', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-interactive-cells');
    await expect(table).toBeVisible();
    await table.getByTestId('demo-renew-0').click();
    await expect(page.getByTestId('interactive-log')).toContainText('button r0');
    await expect(page.getByTestId('row-click-log')).toContainText('none');
  });

  test('clicking a plain text cell still fires the row click (guard is scoped)', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-interactive-cells');
    await table
      .getByRole('rowgroup')
      .last()
      .getByRole('row')
      .first()
      .getByRole('cell')
      .first()
      .click();
    await expect(page.getByTestId('row-click-log')).toContainText('row 0');
  });

  test('disabled button cell renders disabled', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-interactive-cells');
    await expect(table.getByTestId('demo-renew-1')).toBeDisabled();
  });

  test('select cell forwards itemTestId — options carry data-pw="{prefix}-{id}"', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-interactive-cells');
    const select = table.getByTestId('demo-tier-0');
    await select.getByRole('combobox').click();
    await expect(select.getByTestId('demo-tier-option-basic')).toBeVisible();
    await expect(select.getByTestId('demo-tier-option-pro')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('select cell fires onSelect with the chosen option id, no row click', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-interactive-cells');
    const select = table.getByTestId('demo-tier-0');
    await select.getByRole('combobox').click();
    const listbox = select.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await listbox.getByText('Basic', { exact: true }).click();
    await expect(page.getByTestId('interactive-log')).toContainText('select r0 → basic');
    await expect(page.getByTestId('row-click-log')).toContainText('none');
  });

  test('input cell fires onInput with the typed value, no row click', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-interactive-cells');
    const input = table.getByTestId('demo-note-1');
    await input.first().fill('hello');
    await expect(page.getByTestId('interactive-log')).toContainText('input r1 → hello');
    await expect(page.getByTestId('row-click-log')).toContainText('none');
  });

  test('input cell forwards validationPattern/onErrorMessage — live inline validation', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-interactive-cells');
    const input = table.getByTestId('demo-note-1');
    // demo-note-1 carries validationPattern '^\d+$' + onErrorMessage 'Digits only'.
    await input.first().fill('abc');
    await expect(table.getByTestId('demo-note-1-error-message')).toContainText('Digits only');
    await input.first().fill('123');
    await expect(table.getByTestId('demo-note-1-error-message')).toHaveCount(0);
  });

  test('action-group primary button and overflow menu both dispatch column handlers', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-interactive-cells');
    await table.getByTestId('demo-edit-0').click();
    await expect(page.getByTestId('interactive-log')).toContainText('primary r0');

    await table.getByTestId('demo-manage-menu-trigger-0').click();
    await page.getByText('Duplicate', { exact: true }).click();
    await expect(page.getByTestId('interactive-log')).toContainText('menu r0 → duplicate');
    await expect(page.getByTestId('row-click-log')).toContainText('none');
  });

  test('action-group without a primary button renders menu only', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-interactive-cells');
    const secondManageCell = table
      .getByRole('rowgroup')
      .last()
      .getByRole('row')
      .nth(1)
      .getByRole('cell')
      .nth(4);
    await expect(secondManageCell.getByTestId('demo-manage-menu-trigger-1')).toBeVisible();
    await expect(secondManageCell.getByText('Edit')).toHaveCount(0);
  });

  test('popup-menu cell dispatches onMenuAction, no row click', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-interactive-cells');
    await table.getByTestId('demo-more-popup-trigger-0').click();
    await page.getByText('Archive', { exact: true }).first().click();
    await expect(page.getByTestId('interactive-log')).toContainText('popup r0 → archive');
    await expect(page.getByTestId('row-click-log')).toContainText('none');
  });
});
