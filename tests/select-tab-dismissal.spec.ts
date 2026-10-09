import { expect, test, type Page } from '@playwright/test';
import { gotoHydrated } from './support/hydrated';

const variants = [
  {
    name: 'ordinary search',
    input: 'City (searchable)',
    before: 'Fruit (selected tick)',
    after: 'Fruits (multiple)',
    multiple: false,
    selectAll: false
  },
  {
    name: 'multiple search',
    input: 'Languages (multiple, searchable)',
    before: 'Fruits (multiple)',
    after: 'Fruits (select all)',
    multiple: true,
    selectAll: false
  },
  {
    name: 'select-all search',
    input: 'Languages (select all, searchable)',
    before: 'Fruits (select all)',
    after: 'Fruit (disabled options)',
    multiple: true,
    selectAll: true
  }
];

async function tabOut(
  page: Page,
  inputName: string,
  beforeName: string,
  afterName: string
): Promise<void> {
  const input = page.getByRole('textbox', { name: inputName, exact: true });
  await input.click();
  await expect(input).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('combobox', { name: afterName, exact: true })).toBeFocused();
  await input.click();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('combobox', { name: beforeName, exact: true })).toBeFocused();
}

for (const variant of variants) {
  test(`${variant.name} closes on one Tab and retains native forward and backward focus`, async ({
    page
  }) => {
    await gotoHydrated(page, '/components/select');
    await tabOut(page, variant.input, variant.before, variant.after);
  });

  test(`WC ${variant.name} closes on one Tab across its shadow root to external siblings`, async ({
    page
  }) => {
    await gotoHydrated(page, '/');
    await page.addScriptTag({
      path: process.env.SELECT_TAB_WC_BUNDLE ?? 'dist-wc/index.js',
      type: 'module'
    });
    await page.waitForFunction(() => Boolean(customElements.get('sui-select')));
    await page.evaluate((variant) => {
      const main = document.querySelector('main');
      if (main === null) {
        throw new Error('Main unavailable');
      }
      main.replaceChildren();
      const before = document.createElement('input');
      before.id = 'select-tab-before';
      before.setAttribute('aria-label', 'Before select');
      const host = document.createElement('sui-select');
      host.id = 'select-tab-wc';
      host.style.cssText = 'display:block; width:260px; margin:16px 0';
      host.setAttribute('aria-label', 'Search cities');
      Object.assign(host, {
        searchable: true,
        multiple: variant.multiple,
        showSelectAll: variant.selectAll,
        items: Array.from({ length: 30 }, (_, index) => ({
          id: String(index),
          label: `City ${index}`
        }))
      });
      const after = document.createElement('input');
      after.id = 'select-tab-after';
      after.setAttribute('aria-label', 'After select');
      main.append(before, host, after);
    }, variant);
    const input = page
      .locator('#select-tab-wc')
      .getByRole('textbox', { name: 'Search cities', exact: true });
    await page.getByRole('textbox', { name: 'Before select', exact: true }).click();
    await page.keyboard.press('Tab');
    await expect(input).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('textbox', { name: 'After select', exact: true })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(input).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('textbox', { name: 'Before select', exact: true })).toBeFocused();
  });
}
