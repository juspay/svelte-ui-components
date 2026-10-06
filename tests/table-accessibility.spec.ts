import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { createRawSnippet } from 'svelte';
import { gotoHydrated } from './support/hydrated';

type FixtureWindow = Window & {
  tableRawSnippet: typeof createRawSnippet;
  editorRows: string[][];
};

const loadWC = async (page: Page) => {
  await gotoHydrated(page, '/');
  // Test transport delivers the actual locally built public WC artifact. No
  // component/controller behavior is mocked, and its public snippet factory is used.
  const artifact = readFileSync('dist-wc/index.js', 'utf8');
  await page.route('**/__table-wc-artifact.js', (route) =>
    route.fulfill({ status: 200, contentType: 'text/javascript', body: artifact })
  );
  await page.evaluate(async () => {
    const url = '/__table-wc-artifact.js';
    const runtime = await import(url);
    (window as unknown as FixtureWindow).tableRawSnippet = runtime.createRawSnippet;
  });
  await page.waitForFunction(() => !!customElements.get('sui-table'));
};

const references = async (header: Locator) => {
  const state = await header.evaluate((element) => {
    const root = element.getRootNode() as Document | ShadowRoot;
    const table = element.closest('table');
    return (element.getAttribute('aria-controls') ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => {
        const control = root.getElementById(id);
        return {
          id,
          matches: Array.from(root.querySelectorAll('[id]')).filter((node) => node.id === id)
            .length,
          role: control?.getAttribute('role'),
          sameTable: control?.closest('table') === table,
          disabled: control?.getAttribute('aria-disabled')
        };
      });
  });
  for (const ref of state) {
    expect(ref.id).not.toMatch(/\s/);
    expect(ref.matches).toBe(1);
    expect(ref.role).toBe('checkbox');
    expect(ref.sameTable).toBe(true);
    expect(ref.disabled).not.toBe('true');
  }
  return state.map((ref) => ref.id);
};

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`Table accessibility (${colorScheme})`, () => {
    test.use({ colorScheme });

    test('every demonstrated combobox and built-in editor has a contextual field name', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/table');
      const combos = page.getByRole('combobox');
      await expect(combos).toHaveCount(9);
      for (const combo of await combos.all()) {
        await expect(combo).toHaveAttribute('aria-label', /.+ for .+/);
      }
      await expect(page.getByTestId('demo-note-0')).toHaveAccessibleName('Note for Growth Monthly');
      const table = page.getByTestId('table-builtin-cells');
      await expect(table.getByRole('switch')).toHaveCount(3);
      await expect(table.getByRole('checkbox')).toHaveCount(0);
      await expect(table.getByRole('switch', { name: 'Active for Legacy' })).toHaveCount(1);
      for (const field of await page
        .getByTestId('table-editable-cells')
        .getByRole('textbox')
        .all()) {
        await expect(field).toHaveAttribute('aria-label', /^(Name|Department) for employee [123]$/);
      }
    });

    test('the native switch is reached once by real Tab and toggles without another owner', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/table');
      const table = page.getByTestId('table-builtin-cells');
      await table.evaluate((el) => {
        const before = document.createElement('button');
        before.id = 'table-switch-before';
        before.textContent = 'Before table';
        el.before(before);
      });
      const control = table.getByRole('switch', { name: 'Toggle Growth Monthly' });
      await page.locator('#table-switch-before').focus();
      let reached = false;
      for (let step = 0; step < 15; step += 1) {
        await page.keyboard.press('Tab');
        if (
          await control.evaluate(
            (el) => el.getRootNode() instanceof Document && document.activeElement === el
          )
        ) {
          reached = true;
          break;
        }
      }
      expect(reached).toBe(true);
      await expect(control).toBeFocused();
      await expect(control).toBeChecked();
      expect(await control.evaluate((el) => el.tagName)).toBe('INPUT');
      expect(await control.ariaSnapshot()).not.toContain('- checkbox');
      await page.keyboard.press('Space');
      await expect(control).not.toBeChecked();
      await expect(page.getByTestId('builtin-toggle-result')).toContainText('row 0 → false');
      await page.keyboard.press('Tab');
      await expect(control).not.toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(control).toBeFocused();
    });

    test('the legacy editable recipe saves the source row after descending sort', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/table');
      const table = page.getByTestId('table-editable-cells');
      const before = await table
        .locator('tbody tr')
        .evaluateAll((rows) =>
          rows.map((row) => Array.from(row.querySelectorAll('input'), (el) => el.value))
        );
      await table.getByRole('button', { name: 'Sort by Name' }).click();
      await table.getByRole('button', { name: 'Sort by Name' }).click();
      const department = table.getByRole('textbox', { name: 'Department for employee 3' });
      expect(
        await department.evaluate((el) => el.closest('tr')?.querySelector('input')?.value)
      ).toBe(before[2][0]);
      await department.fill('Finance and operations');
      const live = table.locator('..').locator('.state-display');
      await expect
        .poll(async () => {
          const text = await live.textContent();
          return JSON.parse((text ?? '').replace(/^Live data:\s*/, ''));
        })
        .toEqual(
          before.map((row, index) => (index === 2 ? [row[0], 'Finance and operations'] : row))
        );
    });

    test('all real-shell select-all references resolve through native paging and selection', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/table');
      for (const header of await page.locator('[role="checkbox"][aria-controls]').all()) {
        await references(header);
      }
      const table = page.getByTestId('table-paged-select');
      const header = table.getByRole('checkbox', { name: 'Select all rows' });
      const row = table.getByRole('checkbox', { name: 'Select row Member 5' });
      const id = await row.getAttribute('id');
      await row.click();
      await expect(header).toHaveAttribute('aria-checked', 'mixed');
      await table.getByTestId('psel-pages').getByRole('button', { name: 'Page 2' }).click();
      expect(await references(header)).toHaveLength(2);
      await expect(header).toHaveAttribute('aria-checked', 'false');
      await header.click();
      await expect(header).toHaveAttribute('aria-checked', 'true');
      await table.getByTestId('psel-pages').getByRole('button', { name: 'Page 1' }).click();
      await expect(table.getByRole('checkbox', { name: 'Select row Member 5' })).toHaveAttribute(
        'id',
        id ?? ''
      );
      await expect(table.getByRole('checkbox', { name: 'Select row Member 5' })).toHaveAttribute(
        'aria-checked',
        'true'
      );
      expect(await references(header)).toHaveLength(4);
      await expect(header).toHaveAttribute('aria-checked', 'mixed');
    });

    test('WC references survive spaced/Unicode keys, duplicate labels, sort/filter and public page changes', async ({
      page
    }) => {
      await loadWC(page);
      await page.evaluate(() => {
        const host = document.createElement('sui-table');
        host.id = 'wc-identity';
        host.style.cssText = 'display:block;max-width:700px';
        Object.assign(host, {
          tableHeaders: ['Name', 'Record'],
          tableData: [
            ['Same', 'A B'],
            ['Same', 'A-B'],
            ['李 星', '名 前'],
            ['Other', '名-前']
          ],
          checkboxSelection: {
            getRowId: (row: string[]) => row[1],
            disabledRowIds: new Set(['A-B']),
            onSelectionChange: (ids: Set<string>) =>
              (host.dataset.selection = JSON.stringify([...ids]))
          },
          searchConfig: { placeholder: 'Find records' },
          pagination: { mode: 'client', pageSize: 2, hideControls: true }
        });
        document.querySelector('main')?.append(host);
      });
      const table = page.locator('#wc-identity');
      const header = table.getByRole('checkbox', { name: 'Select all rows' });
      const selected = table.getByRole('checkbox', { name: 'Select row A B' });
      await expect(selected).toHaveAttribute('id', /\S+/);
      const id = await selected.getAttribute('id');
      expect(await references(header)).toHaveLength(1);
      await selected.click();
      await expect(header).toHaveAttribute('aria-checked', 'true');
      await expect(table).toHaveAttribute('data-selection', '["A B"]');
      // The existing WC bridge has no built-in paginator UI; its supported public
      // property drives client pagination. Native Svelte paging is covered by neighbors.
      await table.evaluate((el) =>
        Object.assign(el, {
          pagination: { mode: 'client', page: 2, pageSize: 2, hideControls: true }
        })
      );
      await expect(table.getByRole('checkbox', { name: 'Select row 名 前' })).toHaveCount(1);
      expect(await references(header)).toHaveLength(2);
      await table.getByPlaceholder('Find records').fill('Same');
      await expect(selected).toHaveAttribute('id', id ?? '');
      expect(await references(header)).toHaveLength(1);
      await table.getByRole('button', { name: 'Sort by Name' }).click();
      await references(header);
      await expect(selected).toHaveAttribute('aria-checked', 'true');
    });

    test('WC native input/select/switch names, validation and callbacks survive sorting', async ({
      page
    }) => {
      await loadWC(page);
      await page.evaluate(() => {
        const host = document.createElement('sui-table');
        host.id = 'wc-editors';
        host.style.cssText = 'display:block;max-width:800px';
        Object.assign(host, {
          columns: [
            { id: 'name', label: 'Name' },
            {
              id: 'tier',
              label: 'Tier',
              type: 'select',
              onSelect: (view: number, value: string, original: number) =>
                (host.dataset.select = JSON.stringify([view, value, original]))
            },
            {
              id: 'note',
              label: 'Note',
              type: 'input',
              onInput: (view: number, value: string, original: number) =>
                (host.dataset.input = JSON.stringify([view, value, original]))
            },
            {
              id: 'active',
              label: 'Active',
              type: 'toggle',
              onToggle: (view: number, value: boolean, original: number) =>
                (host.dataset.toggle = JSON.stringify([view, value, original]))
            }
          ],
          rows: [
            {
              name: 'Zoe',
              tier: { options: [{ id: 'pro', label: 'Pro' }], selectedId: 'pro' },
              note: { value: '1', validationPattern: '^\\d+$', onErrorMessage: 'Digits only' },
              active: { checked: false }
            },
            {
              name: 'Amy',
              tier: { options: [{ id: 'pro', label: 'Pro' }] },
              note: { value: '' },
              active: { checked: true }
            }
          ]
        });
        document.querySelector('main')?.append(host);
      });
      const table = page.locator('#wc-editors');
      await expect(table.getByRole('combobox', { name: 'Tier for Zoe' })).toHaveCount(1);
      await table.getByRole('button', { name: 'Sort by Name' }).click();
      const input = table.getByRole('textbox', { name: 'Note for Zoe' });
      await input.fill('bad');
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(table).toHaveAttribute('data-input', '[1,"bad",0]');
      await input.fill('42');
      await expect(input).not.toHaveAttribute('aria-invalid', 'true');
      const toggle = table.getByRole('switch', { name: 'Active for Zoe' });
      await input.press('Tab');
      await expect(toggle).toBeFocused();
      await page.keyboard.press('Space');
      await expect(toggle).toBeChecked();
      await expect(table).toHaveAttribute('data-toggle', '[1,true,0]');
      const select = table.getByRole('combobox', { name: 'Tier for Amy' });
      await select.press('Enter');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await expect(table).toHaveAttribute('data-select', '[0,"pro",1]');
      await expect(select).toHaveAccessibleName('Tier for Amy');
    });

    test('WC public custom textarea uses the source index and preserves real edited/form values', async ({
      page
    }) => {
      await loadWC(page);
      await page.evaluate(() => {
        const win = window as unknown as FixtureWindow;
        win.editorRows = [
          ['Zoe', 'Operations'],
          ['Amy', 'Engineering']
        ];
        const host = document.createElement('sui-table');
        host.id = 'wc-custom-editors';
        host.style.cssText = 'display:block;max-width:700px';
        Object.assign(host, { tableHeaders: ['Name', 'Department'], tableData: win.editorRows });
        const cell = win.tableRawSnippet<[string, number, number, number]>(
          (value, _view, column, original) => ({
            render: () =>
              column() === 1
                ? `<form><textarea aria-label="Department for employee ${original() + 1}" name="employee-${original() + 1}-department">${value()}</textarea></form>`
                : `<span>${value()}</span>`,
            setup: (element) => {
              const area = element.querySelector('textarea');
              if (!(area instanceof HTMLTextAreaElement)) {
                return;
              }
              const save = () => {
                const source = original();
                win.editorRows = win.editorRows.map((row, index) =>
                  index === source ? [row[0], area.value] : row
                );
                Object.assign(host, { tableData: win.editorRows });
                host.dataset.saved = JSON.stringify(win.editorRows);
              };
              area.addEventListener('input', save);
              return () => area.removeEventListener('input', save);
            }
          })
        );
        Object.assign(host, { cell });
        document.querySelector('main')?.append(host);
      });
      const table = page.locator('#wc-custom-editors');
      await table.getByRole('button', { name: 'Sort by Name' }).click();
      const area = table.getByRole('textbox', { name: 'Department for employee 2' });
      expect(await area.evaluate((el) => el.closest('tr')?.textContent)).toContain('Amy');
      await area.fill('Finance\nPlanning');
      await expect(table).toHaveAttribute(
        'data-saved',
        '[["Zoe","Operations"],["Amy","Finance\\nPlanning"]]'
      );
      // This form is in the same shadow scope as the custom controls. Table itself
      // is not form-associated, so this does not claim outer light-DOM submission.
      const fields = await area.evaluate((element) => {
        const form = (element as HTMLTextAreaElement).form;
        if (form === null) {
          throw new Error('custom textarea lost its native form association');
        }
        return Array.from(new FormData(form));
      });
      expect(fields).toContainEqual(['employee-2-department', 'Finance\nPlanning']);
    });

    test('custom sort glyphs remain visible in all states and sorting keeps its column name', async ({
      page
    }) => {
      await gotoHydrated(page, '/components/table');
      const table = page.getByTestId('table-sort-icons');
      const button = table.getByRole('button', { name: 'Sort by City' });
      await expect(button.locator('[data-sort-state="none"]')).toHaveText('↕');
      await button.press('Enter');
      await expect(button.locator('[data-sort-state="ascending"]')).toHaveText('↑');
      await expect(table.locator('tbody tr').first()).toContainText('Delhi');
      await button.press('Enter');
      await expect(button.locator('[data-sort-state="descending"]')).toHaveText('↓');
      await expect(table.locator('tbody tr').first()).toContainText('Tokyo');
      await expect(button).toHaveAccessibleName('Sort by City');
    });
  });
}
