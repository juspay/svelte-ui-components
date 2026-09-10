import { expect, test } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

// Closes #415. The DS dropdown sheet's keyboard-accessibility guidelines put
// the search box INSIDE the open menu, reached by Tab after opening, while
// Select's `searchable` put the filter input in the trigger and focused it
// automatically. That difference is not cosmetic: with the input in the
// trigger there is no way to open the menu and keep focus on the combobox, so
// a keyboard user who wanted to arrow through the options had to type first.
test.describe('Select — in-menu search (#415)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHydrated(page, '/components/select');
  });

  const openMenu = async (page: import('@playwright/test').Page) => {
    const select = page.getByTestId('select-menu-search');
    await select.locator('.select-trigger').click();
    await expect(select.locator('.select-dropdown')).toBeVisible();
    return select;
  };

  test('renders the search box inside the menu, not the trigger', async ({ page }) => {
    const select = await openMenu(page);

    await expect(select.locator('.select-dropdown .select-menu-search')).toBeVisible();
    await expect(select.locator('.select-trigger .select-search')).toHaveCount(0);
  });

  test('leaves focus on the trigger when the menu opens', async ({ page }) => {
    // The DS contract. Auto-focusing the search box is exactly what the
    // trigger-positioned variant does, and what this one must not.
    const select = await openMenu(page);

    const searchFocused = await select
      .locator('.select-menu-search')
      .evaluate((el) => el === document.activeElement);
    expect(searchFocused).toBe(false);
  });

  test('reaches the search box with Tab after opening', async ({ page }) => {
    const select = page.getByTestId('select-menu-search');

    // Opened from the keyboard rather than by click, which is both the flow
    // the DS contract describes and the only way to be sure focus starts on
    // the trigger rather than wherever a click happened to leave it.
    await select.locator('.select-trigger').focus();
    await page.keyboard.press('Enter');
    await expect(select.locator('.select-dropdown')).toBeVisible();

    await page.keyboard.press('Tab');

    const searchFocused = await select
      .locator('.select-menu-search')
      .evaluate((el) => el === document.activeElement);
    expect(searchFocused).toBe(true);
  });

  test('filters the options as the search box is typed into', async ({ page }) => {
    const select = await openMenu(page);

    await select.locator('.select-menu-search').fill('lon');

    await expect(select.locator('.select-option')).toHaveCount(1);
    await expect(select.locator('.select-option')).toHaveText('London');
  });

  test('keeps arrow-key navigation working from the search box', async ({ page }) => {
    const select = await openMenu(page);
    const search = select.locator('.select-menu-search');

    await search.focus();
    await page.keyboard.press('ArrowDown');

    await expect(select.locator('.select-option.highlighted')).toHaveCount(1);
  });

  test('selects the highlighted option with Enter from the search box', async ({ page }) => {
    const select = await openMenu(page);
    const search = select.locator('.select-menu-search');

    await search.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(select.locator('.select-value')).toHaveText('New York');
  });

  test('closes on Escape from the search box', async ({ page }) => {
    const select = await openMenu(page);

    await select.locator('.select-menu-search').focus();
    await page.keyboard.press('Escape');

    await expect(select.locator('.select-dropdown')).toHaveCount(0);
  });

  test('keeps the listbox role off the panel and on the option list', async ({ page }) => {
    // A listbox may only contain options, so a search box inside one is
    // invalid. The panel therefore carries no role and the inner list owns it
    // — and aria-controls has to point at the list, not the panel.
    const select = await openMenu(page);

    await expect(select.locator('.select-dropdown')).not.toHaveAttribute('role', 'listbox');
    await expect(select.locator('.select-menu-list')).toHaveAttribute('role', 'listbox');

    const controls = await select.locator('.select-trigger').getAttribute('aria-controls');
    await expect(select.locator('.select-menu-list')).toHaveAttribute('id', String(controls));
  });

  test('the search box is not inside the listbox element', async ({ page }) => {
    const select = await openMenu(page);
    await expect(select.locator('.select-menu-list .select-menu-search')).toHaveCount(0);
  });

  test('preserves the dropdown stacking order', async ({ page }) => {
    const select = await openMenu(page);
    await expect(select.locator('.select-dropdown')).toHaveCSS('z-index', '10');
  });

  test('Shift+Tab from the search returns to the trigger without closing', async ({ page }) => {
    const select = await openMenu(page);
    await select.locator('.select-menu-search').focus();
    await page.keyboard.press('Shift+Tab');
    await expect(select.locator('.select-trigger')).toBeFocused();
    await expect(select.locator('.select-dropdown')).toBeVisible();
  });

  test('Shift+Tab from the trigger leaves and closes the menu', async ({ page }) => {
    const select = await openMenu(page);
    await select.locator('.select-trigger').focus();
    await page.keyboard.press('Shift+Tab');
    await expect(select.locator('.select-dropdown')).toHaveCount(0);
  });

  test('returns focus after selecting from menu search', async ({ page }) => {
    const select = await openMenu(page);
    await select.locator('.select-menu-search').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(select.locator('.select-trigger')).toBeFocused();
  });

  test('portaled menu supports forward and reverse Tab and exit', async ({ page }) => {
    const trigger = page.getByTestId('select-menu-portal').locator('.select-trigger');
    const search = page.getByTestId('select-menu-portal-menu-search');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(search).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(search).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(search).toHaveCount(0);
    await expect(page.getByTestId('select-menu-portal-next')).toBeFocused();
  });

  test('bottom actions are outside the listbox and keyboard reachable', async ({ page }) => {
    const select = page.getByTestId('select-menu-multi');
    await select.locator('.select-trigger').focus();
    await page.keyboard.press('Enter');
    await expect(select.locator('.select-menu-search')).toBeVisible();
    await expect(select.locator('[role="listbox"] button')).toHaveCount(0);
    await page.keyboard.press('Tab');
    await expect(select.locator('.select-menu-search')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('select-menu-clear-all')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('select-menu-apply')).toBeFocused();
  });

  test('filtered select-all preserves other values and pinned actions apply or clear', async ({
    page
  }) => {
    const select = page.getByTestId('select-menu-multi');
    await select.locator('.select-trigger').click();
    await select.locator('.select-menu-search').fill('lon');
    await page.getByTestId('select-menu-multi-select-all').click();
    await expect(page.getByTestId('select-menu-apply')).toHaveText('Select (2)');
    await page.getByTestId('select-menu-apply').click();
    await expect(page.getByTestId('select-menu-applied')).toHaveText('Applied: nyc,ldn');
    await select.locator('.select-trigger').click();
    await expect(select.locator('.select-menu-search')).toHaveValue('');
    await page.getByTestId('select-menu-clear-all').click();
    await expect(page.getByTestId('select-menu-apply')).toHaveText('Select (0)');
  });

  test('recovers from no results and resets query on reopen', async ({ page }) => {
    const select = await openMenu(page);
    await select.locator('.select-menu-search').fill('not-a-city');
    await expect(select.locator('.select-empty')).toHaveText('No results');
    await select.locator('.select-menu-search').fill('Tokyo');
    await expect(select.locator('.select-option')).toHaveText('Tokyo');
    await page.keyboard.press('Escape');
    await select.locator('.select-trigger').click();
    await expect(select.locator('.select-option')).toHaveCount(8);
  });

  test('a default searchable Select still puts the input in the trigger', async ({ page }) => {
    // Back-compat: passes before the change and must keep passing.
    const select = page.getByTestId('select-search-demo');
    await expect(select.locator('.select-trigger .select-search')).toHaveCount(1);
  });
});
