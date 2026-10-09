import { describe, it, expect, beforeAll, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import Table from './Table.svelte';
import type { TableColumn, TableRow, TableLabels } from './properties';

/**
 * Table names its own sort buttons, filter triggers and selection checkboxes.
 * Those names were hardcoded English, and `sortable` defaults to true, so every
 * consumer shipping a non-English UI shipped English on controls they never
 * wrote.
 *
 * Covered here by mounting the component rather than through the demo route:
 * a demo section would change that route's visual baseline, and the assertion
 * is about generated accessible names, which needs no page to be true.
 */
const columns: TableColumn[] = [
  { id: 'name', label: 'Nom' },
  { id: 'score', label: 'Score' }
];
const rows: TableRow[] = [
  { id: 'r1', name: 'Amelie', score: 91 },
  { id: 'r2', name: 'Bruno', score: 78 }
];

// jsdom ships no ResizeObserver and Table observes its scroll shell, so mounting
// it throws without this. Stubbed locally rather than in vitest-setup.ts: this is
// the first component-level Table test, and widening shared setup from inside a
// feature PR would put infrastructure changes where reviewers are not looking.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeAll(() => {
  if (!('ResizeObserver' in globalThis)) {
    Object.defineProperty(globalThis, 'ResizeObserver', {
      value: ResizeObserverStub,
      writable: true,
      configurable: true
    });
  }
});

describe('Table labels', () => {
  it('keeps localized duplicate row names and activation bound to original records after sort', async () => {
    const onrowclick = vi.fn();
    const { getByRole, container } = render(Table, {
      columns: [
        { id: 'name', label: 'Name' },
        { id: 'score', label: 'Score' }
      ],
      rows: [
        { name: 'Same', score: 3 },
        { name: 'Same', score: 1 },
        { name: 'Other', score: 2 }
      ],
      onrowclick,
      labels: { rowAction: (rowLabel) => `Ouvrir ${rowLabel}` }
    });
    await fireEvent.click(getByRole('button', { name: 'Sort by Score' }));
    await waitFor(() => {
      expect(container.querySelector('tbody tr')?.getAttribute('aria-label')).toBe(
        'Ouvrir Same, record 2'
      );
    });
    const row = getByRole('row', { name: 'Ouvrir Same, record 2' });
    await fireEvent.keyDown(row, { key: 'Enter' });
    expect(onrowclick).toHaveBeenCalledExactlyOnceWith(0, ['Same', 1], 1);
  });

  it('keeps nonaction rows as ordinary cell containers even when rowAction is supplied', () => {
    const { container, getByRole } = render(Table, {
      tableHeaders: ['Name'],
      tableData: [['Same']],
      labels: { rowAction: (rowLabel) => `Ouvrir ${rowLabel}` }
    });
    expect(container.querySelector('tbody tr')?.hasAttribute('aria-label')).toBe(false);
    expect(getByRole('cell', { name: 'Same' })).toBeTruthy();
  });
  it('uses the English defaults when no labels are given', () => {
    const { getByRole } = render(Table, { columns, rows });
    expect(getByRole('button', { name: 'Sort by Nom' })).toBeTruthy();
    expect(getByRole('button', { name: 'Sort by Score' })).toBeTruthy();
  });

  it('overrides the generated names, with word order the caller controls', () => {
    const labels: TableLabels = {
      sortBy: (header) => `Trier par ${header}`,
      selectAllRows: 'Tout sélectionner',
      selectRow: (rowId) => `Sélectionner la ligne ${rowId}`
    };
    const { getByRole, queryByRole } = render(Table, {
      columns,
      rows,
      labels,
      checkboxSelection: { getRowId: (_row, rowIndex) => `r${rowIndex + 1}` }
    });

    expect(getByRole('button', { name: 'Trier par Nom' })).toBeTruthy();
    expect(getByRole('checkbox', { name: 'Tout sélectionner' })).toBeTruthy();
    expect(getByRole('checkbox', { name: 'Sélectionner la ligne r1' })).toBeTruthy();

    // And the English defaults are gone on this instance.
    expect(queryByRole('button', { name: 'Sort by Nom' })).toBeNull();
    expect(queryByRole('checkbox', { name: 'Select all rows' })).toBeNull();
  });

  it('falls back per member, so an omitted one keeps English', () => {
    // `filterBy` is deliberately omitted above; members are independent rather
    // than the bundle being all-or-nothing.
    const { getByRole } = render(Table, {
      columns,
      rows,
      labels: { sortBy: (header) => `Trier par ${header}` }
    });
    expect(getByRole('button', { name: 'Trier par Score' })).toBeTruthy();
  });
});
