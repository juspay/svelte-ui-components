import { expect, test } from '@playwright/test';

test.describe('Table follow-up API', () => {
  test('forwards explicit pagination button ids while keeping default generated ids unchanged', async ({
    page,
    context
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/components/table');

    const defaults = page.getByTestId('table-builtin-cells');
    await expect(defaults.getByTestId('builtin-docs-link-0')).toBeVisible();
    await defaults.getByTestId('builtin-docs-copy-0').click();
    await expect(defaults.getByTestId('builtin-docs-link-copied')).toContainText('Copied');
    await expect(defaults.getByTestId('builtin-docs-link-copied-0')).toHaveCount(0);

    const table = page.getByTestId('table-followups');
    await expect(table.getByTestId('followup-previous')).toBeDisabled();
    await expect(table.getByTestId('followup-next')).toBeEnabled();
    await table.getByTestId('followup-next').click();
    await expect(table.getByTestId('followup-previous')).toBeEnabled();
  });

  test('applies a column width and configurable built-in ids with row and item indices', async ({
    page,
    context
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/components/table');

    const table = page.getByTestId('table-followups');
    await expect(table.getByTestId('followup-name')).toHaveCSS('width', '176px');
    await expect(
      table.getByRole('rowgroup').last().getByRole('row').first().getByRole('cell').first()
    ).toHaveCSS('width', '176px');
    await expect(table.getByTestId('followup-docs-resource-0')).toBeVisible();
    await expect(table.getByTestId('followup-provider-brand-0')).toHaveCount(2);
    await expect(table.getByTestId('followup-docs-resource-1')).toBeVisible();

    await table.getByTestId('followup-docs-clipboard-0').click();
    await expect(table.getByTestId('followup-docs-copied-notice')).toContainText('Copied');
    await expect(table.getByTestId('followup-docs-copied-notice-0')).toHaveCount(0);
  });
});

test.describe('Table — pagination.rangeTestId', () => {
  test('an explicit rangeTestId wins over the id derived from the table testId', async ({
    page
  }) => {
    await page.goto('/components/table');
    // table-followups carries its own load-bearing testId (built-in cell ids
    // derive from it), so the range span would otherwise be locked to
    // `table-followups-paginator-range`. rangeTestId overrides that.
    const table = page.getByTestId('table-followups');
    await expect(table.getByTestId('followup-range')).toContainText('1-2 of 4');
    await expect(table.getByTestId('table-followups-paginator-range')).toHaveCount(0);
  });

  test('unset rangeTestId keeps deriving from the table testId', async ({ page }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-paginated');
    await expect(table.getByTestId('table-paginated-paginator-range')).toContainText('1-5 of 23');
  });
});

test.describe('Table — independent pagination control suppression', () => {
  test('hidePageSizeSelector hides only the page-size Select, steppers keep working', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-split-selector-hidden');
    await expect(table.getByTestId('split-selector-hidden-page-size')).toHaveCount(0);
    await expect(table.getByTestId('table-split-selector-hidden-paginator-range')).toContainText(
      '1-2 of 6'
    );

    const pager = table.getByTestId('split-selector-hidden-pages');
    await expect(pager).toBeVisible();
    await pager.getByRole('button', { name: 'Page 2' }).click();
    await expect(table.getByRole('rowgroup').last().getByRole('row').first()).toContainText(
      'Item 3'
    );
    await expect(table.getByTestId('table-split-selector-hidden-paginator-range')).toContainText(
      '3-4 of 6'
    );
  });

  test('hideSteppers hides only the Pagination steppers, the page-size Select keeps working', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-split-steppers-hidden');
    await expect(table.getByTestId('split-steppers-hidden-pages')).toHaveCount(0);
    await expect(table.getByRole('navigation')).toHaveCount(0);
    await expect(table.getByTestId('table-split-steppers-hidden-paginator-range')).toContainText(
      '1-2 of 6'
    );

    const sizeSelect = table.getByTestId('split-steppers-hidden-page-size');
    await sizeSelect.getByRole('combobox').click();
    // The page-size dropdown portals its listbox to <body>, so it is no
    // longer a descendant of sizeSelect — find it from the page root.
    await page.getByRole('listbox').getByText('3', { exact: true }).click();
    await expect(table.getByRole('rowgroup').last().getByRole('row')).toHaveCount(3);
    await expect(table.getByTestId('table-split-steppers-hidden-paginator-range')).toContainText(
      '1-3 of 6'
    );
  });

  test('hideControls still hides both, unaffected by the new independent flags', async ({
    page
  }) => {
    await page.goto('/components/table');
    const table = page.getByTestId('table-count-only-pagination');
    await expect(table.getByTestId('count-only-paged-page-size')).toHaveCount(0);
    await expect(table.getByTestId('count-only-paged-pages')).toHaveCount(0);
    await expect(table.getByTestId('table-count-only-pagination-paginator-range')).toContainText(
      '1-6 of 6'
    );
  });
});
