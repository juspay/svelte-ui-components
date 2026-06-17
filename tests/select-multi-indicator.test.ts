import { expect, test } from '@playwright/test';

test.describe('Select — multi-select checkbox indicator', () => {
  // The default multi-select option indicator is a design-system checkbox box:
  // an unchecked bordered square that fills and shows a checkmark when selected
  // (replacing the legacy ☐/☑ text glyph).
  test('renders a checkbox box that fills with a checkmark when an option is selected', async ({
    page
  }) => {
    await page.goto('/components/select');

    const select = page.locator('[data-pw="select-multi-demo"]');
    await expect(select).toBeVisible();

    // Open the dropdown.
    await select.getByRole('combobox').click();
    const listbox = select.getByRole('listbox');
    await expect(listbox).toBeVisible();

    // Every option carries a checkbox-box indicator; none are checked initially.
    const indicators = listbox.locator('.select-option-indicator');
    expect(await indicators.count()).toBeGreaterThan(0);
    await expect(listbox.locator('.select-option-indicator.checked')).toHaveCount(0);

    // Selecting an option fills exactly one box and renders a checkmark svg inside it.
    await listbox.getByRole('option', { name: 'Apple', exact: true }).click();
    const checked = listbox.locator('.select-option-indicator.checked');
    await expect(checked).toHaveCount(1);
    await expect(checked.locator('svg')).toHaveCount(1);

    // Multi-select keeps the dropdown open; a second pick adds a second checked box.
    await listbox.getByRole('option', { name: 'Cherry', exact: true }).click();
    await expect(listbox.locator('.select-option-indicator.checked')).toHaveCount(2);
  });
});
