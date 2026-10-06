import { fireEvent, render, waitFor, within } from '@testing-library/svelte';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import Table from './Table.svelte';
import AccessibleEditors from './AccessibleEditors.test.svelte';
import type { TableColumn, TableRow } from './properties';

// jsdom supplies real DOM/IDREF resolution but no layout observer. Browser tests
// separately prove native Tab, activation, editing and painted glyph contrast.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});

const references = (header: HTMLElement): Element[] => {
  const ids = (header.getAttribute('aria-controls') ?? '').split(/\s+/).filter(Boolean);
  const root = header.getRootNode() as Document | ShadowRoot;
  return ids.map((id) => {
    const control = root.getElementById(id);
    expect(control, `IDREF ${id} resolves in the control's own DOM scope`).not.toBeNull();
    expect(control?.getAttribute('role')).toBe('checkbox');
    return control as Element;
  });
};

describe('Table selection control identity', () => {
  it('generates whitespace-free, collision-free controls across tables with duplicate/Unicode labels', () => {
    const data = [
      ['Same', 'A B'],
      ['Same', 'A-B'],
      ['李 星', '名 前'],
      ['Other', '名-前']
    ];
    const props = {
      tableHeaders: ['Name', 'Record'],
      tableData: data,
      checkboxSelection: { getRowId: (row: unknown[]) => String(row[1]) }
    };
    const first = render(Table, props);
    const second = render(Table, props);
    const controls = [first, second].flatMap(({ container }) =>
      references(within(container).getByRole('checkbox', { name: 'Select all rows' }))
    );
    const ids = controls.map((control) => control.id);
    expect(ids).toHaveLength(8);
    expect(new Set(ids).size).toBe(8);
    for (const id of ids) {
      expect(id).not.toMatch(/\s/);
    }
  });

  it('references the actual consumer-supplied control IDs while preserving other attributes', () => {
    const { getByRole } = render(Table, {
      tableHeaders: ['Name'],
      tableData: [['Zoe'], ['Amy']],
      checkboxSelection: {
        getRowId: (row) => String(row[0]),
        getRowAttributes: (id, index) => ({
          id: index === -1 ? 'custom-header' : `custom-${id}`,
          'data-record': id
        })
      }
    });
    const controls = references(getByRole('checkbox', { name: 'Select all rows' }));
    expect(controls.map((control) => control.id)).toEqual(['custom-Zoe', 'custom-Amy']);
    expect(controls.map((control) => control.getAttribute('data-record'))).toEqual(['Zoe', 'Amy']);
  });

  it('keeps default selection and control identity on the same source row after sorting', async () => {
    const { getByRole, container } = render(Table, {
      tableHeaders: ['Name', 'Score'],
      tableData: [
        ['Zoe', 1],
        ['Amy', 2]
      ],
      checkboxSelection: {}
    });
    const checkbox = getByRole('checkbox', { name: 'Select row 0' });
    const beforeId = checkbox.id;
    await fireEvent.click(checkbox);
    await fireEvent.click(getByRole('button', { name: 'Sort by Name' }));
    await waitFor(() => {
      const selected = container.querySelector('tbody [role="checkbox"][aria-checked="true"]');
      expect(selected?.closest('tr')?.textContent).toContain('Zoe');
      expect(selected?.id).toBe(beforeId);
    });
    expect(getByRole('checkbox', { name: 'Select all rows' }).getAttribute('aria-checked')).toBe(
      'mixed'
    );
    expect(references(getByRole('checkbox', { name: 'Select all rows' }))).toHaveLength(2);
  });

  it('keeps row IDs through filtering and client pagination, and references only selectable visible rows', async () => {
    const data = [
      ['Same', 'A B'],
      ['Same', 'A-B'],
      ['李 星', '名 前'],
      ['Other', '名-前']
    ];
    const props = {
      tableHeaders: ['Name', 'Record'],
      tableData: data,
      checkboxSelection: {
        getRowId: (row: unknown[]) => String(row[1]),
        disabledRowIds: new Set(['A-B'])
      },
      pagination: { pageSize: 2, hideControls: true },
      searchConfig: { placeholder: 'Search records' }
    };
    const { getByRole, getByPlaceholderText, rerender } = render(Table, props);
    const header = getByRole('checkbox', { name: 'Select all rows' });
    const firstId = getByRole('checkbox', { name: 'Select row A B' }).id;
    expect(references(header)).toHaveLength(1);
    await fireEvent.click(getByRole('checkbox', { name: 'Select row A B' }));
    expect(header.getAttribute('aria-checked')).toBe('true');
    await rerender({ ...props, pagination: { ...props.pagination, page: 2 } });
    await waitFor(() => expect(references(header)).toHaveLength(2));
    expect(header.getAttribute('aria-checked')).toBe('false');
    await fireEvent.input(getByPlaceholderText('Search records'), { target: { value: 'Same' } });
    await waitFor(() => {
      expect(getByRole('checkbox', { name: 'Select row A B' }).id).toBe(firstId);
      expect(references(header)).toHaveLength(1);
      expect(header.getAttribute('aria-checked')).toBe('true');
    });
  });
});

describe('Table editor ownership and context', () => {
  const columns: TableColumn[] = [
    { id: 'person', label: 'Person', type: 'two-line-text' },
    { id: 'tier', label: 'Tier', type: 'select' },
    { id: 'note', label: 'Note', type: 'input' },
    { id: 'active', label: 'Active', type: 'toggle' }
  ];
  const rows: TableRow[] = [
    {
      person: { text1: 'Ada', text2: 'Staff 42' },
      tier: { options: [{ id: 'pro', label: 'Pro' }] },
      note: { value: '' },
      active: { checked: false }
    }
  ];

  it('names the real built-in controls from column and displayed row identity', () => {
    const { getByRole, queryAllByRole, container } = render(Table, { columns, rows });
    expect(getByRole('combobox', { name: 'Tier for Ada' })).toBeTruthy();
    expect(getByRole('textbox', { name: 'Note for Ada' })).toBeTruthy();
    const toggle = getByRole('switch', { name: 'Active for Ada' });
    expect(toggle.tagName).toBe('INPUT');
    expect(toggle.getAttribute('type')).toBe('checkbox');
    expect(queryAllByRole('checkbox')).toHaveLength(0);
    expect(container.querySelectorAll('[role="switch"]')).toHaveLength(1);
  });

  it('preserves explicit per-cell names and names the page-size field independently of its value', () => {
    const { getByRole } = render(Table, {
      columns,
      rows: rows.map((row) => ({
        ...row,
        tier: { options: [{ id: 'pro', label: 'Pro' }], ariaLabel: 'Membership tier' },
        note: { value: '', ariaLabel: 'Renewal note' },
        active: { checked: false, ariaLabel: 'Account enabled' }
      })),
      tableTitle: 'Employees',
      pagination: { pageSize: 1, showFooterOnSinglePage: true }
    });
    expect(getByRole('combobox', { name: 'Membership tier' })).toBeTruthy();
    expect(getByRole('textbox', { name: 'Renewal note' })).toBeTruthy();
    expect(getByRole('switch', { name: 'Account enabled' })).toBeTruthy();
    expect(getByRole('combobox', { name: 'Rows per page' })).toBeTruthy();
  });

  it('saves custom input/textarea edits to the correct source row after sorting and retains form values', async () => {
    const onedit = vi.fn();
    const { getByRole, container } = render(AccessibleEditors, { onedit });
    await fireEvent.click(getByRole('button', { name: 'Sort by Name' }));
    const department = getByRole('textbox', { name: 'Department for employee 2' });
    expect(department.closest('tr')?.querySelector('input')?.value).toBe('Amy');
    await fireEvent.input(department, { target: { value: 'Finance\nPlanning' } });
    expect(onedit).toHaveBeenLastCalledWith(1, 1, 'Finance\nPlanning');
    expect(container.querySelector('[data-pw="saved-editors"]')?.textContent).toBe(
      JSON.stringify([
        ['Zoe', 'Operations'],
        ['Amy', 'Finance\nPlanning']
      ])
    );
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    const data = new FormData(form as HTMLFormElement);
    expect(data.get('employee-1-1')).toBe('Operations');
    expect(data.get('employee-2-1')).toBe('Finance\nPlanning');
  });
});
