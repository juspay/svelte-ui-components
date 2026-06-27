import { expect, test } from '@playwright/test';

// Covers the `showSelectAll` multi-select feature: the synthetic "select all" row,
// toggle-all / deselect-all, the indeterminate (dash) state + its accessible label,
// keyboard reachability, and search-scoped selection.
test.describe('Select — select all (multi-select)', () => {
  test('renders a select-all row that selects and deselects every option', async ({ page }) => {
    await page.goto('/components/select');

    const select = page.locator('[data-pw="select-all-demo"]');
    await expect(select).toBeVisible();
    await select.getByRole('combobox').click();

    const listbox = select.getByRole('listbox');
    await expect(listbox).toBeVisible();

    const selectAll = listbox.locator('[data-pw="select-all-demo-select-all"]');
    await expect(selectAll).toBeVisible();
    await expect(listbox.locator('.select-option-indicator.checked')).toHaveCount(0);

    // Select all -> the select-all box and every option box are checked.
    await selectAll.click();
    await expect(selectAll.locator('.select-option-indicator.checked')).toHaveCount(1);
    await expect(
      listbox.locator('[data-pw="select-all-demo-apple"] .select-option-indicator.checked')
    ).toHaveCount(1);
    await expect(
      listbox.locator('[data-pw="select-all-demo-grape"] .select-option-indicator.checked')
    ).toHaveCount(1);

    // Toggle again -> nothing is checked.
    await selectAll.click();
    await expect(listbox.locator('.select-option-indicator.checked')).toHaveCount(0);
  });

  test('shows an indeterminate dash and accessible state when only some are selected', async ({
    page
  }) => {
    await page.goto('/components/select');

    const select = page.locator('[data-pw="select-all-demo"]');
    await select.getByRole('combobox').click();
    const listbox = select.getByRole('listbox');
    const selectAll = listbox.locator('[data-pw="select-all-demo-select-all"]');

    await listbox.locator('[data-pw="select-all-demo-apple"]').click();

    const indicator = selectAll.locator('.select-option-indicator');
    await expect(indicator).toHaveClass(/indeterminate/);
    await expect(indicator).not.toHaveClass(/checked/);
    await expect(selectAll.locator('.select-option-dash')).toHaveCount(1);
    // Partial state is exposed to assistive tech via the row's accessible name.
    await expect(selectAll).toHaveAttribute('aria-label', /of 7 selected/);
  });

  test('keyboard navigation reaches the select-all row', async ({ page }) => {
    await page.goto('/components/select');

    const select = page.locator('[data-pw="select-all-demo"]');
    await select.getByRole('combobox').focus();
    await page.keyboard.press('ArrowDown'); // open
    const listbox = select.getByRole('listbox');
    await expect(listbox).toBeVisible();

    await page.keyboard.press('ArrowDown'); // highlight the first row (select-all)
    const selectAll = listbox.locator('[data-pw="select-all-demo-select-all"]');
    await expect(selectAll).toHaveClass(/highlighted/);

    await page.keyboard.press('Enter'); // toggle the highlighted select-all row
    await expect(selectAll.locator('.select-option-indicator.checked')).toHaveCount(1);
  });

  test('searchable: select-all toggles only the filtered options', async ({ page }) => {
    await page.goto('/components/select');

    const select = page.locator('[data-pw="select-all-search-demo"]');
    await expect(select).toBeVisible();

    const search = select.locator('.select-search');
    await search.click();
    await search.fill('java'); // matches "JavaScript" and "Java"

    const listbox = select.getByRole('listbox');
    await expect(listbox).toBeVisible();
    // select-all row + the two filtered options
    await expect(listbox.getByRole('option')).toHaveCount(3);

    await listbox.locator('[data-pw="select-all-search-demo-select-all"]').click();
    await expect(
      listbox.locator('[data-pw="select-all-search-demo-js"] .select-option-indicator.checked')
    ).toHaveCount(1);
    await expect(
      listbox.locator('[data-pw="select-all-search-demo-java"] .select-option-indicator.checked')
    ).toHaveCount(1);

    // A non-matching option (Python) was untouched.
    await search.fill('');
    await expect(
      listbox.locator('[data-pw="select-all-search-demo-py"] .select-option-indicator.checked')
    ).toHaveCount(0);
  });
});
