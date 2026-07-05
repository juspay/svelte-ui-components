import { describe, it, expect } from 'vitest';
import { normalizeColumns } from './normalizeColumns';
import type { TableColumn, TableRow } from './properties';

const columns: TableColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'amount', label: 'Amount' },
  { id: 'status', label: 'Status' }
];

const rows: TableRow[] = [
  { name: 'Plan A', amount: 4938.1, status: 'active' },
  { name: 'Plan B', amount: 19752.4, status: 'paused' }
];

describe('normalizeColumns', () => {
  it('projects labels into tableHeaders in column order', () => {
    const { tableHeaders } = normalizeColumns(columns, rows);
    expect(tableHeaders).toEqual(['Name', 'Amount', 'Status']);
  });

  it('projects keyed rows into positional arrays in column order', () => {
    const { tableData } = normalizeColumns(columns, rows);
    expect(tableData).toEqual([
      ['Plan A', 4938.1, 'active'],
      ['Plan B', 19752.4, 'paused']
    ]);
  });

  it('projects missing row keys to null (empty cell), not undefined', () => {
    const { tableData } = normalizeColumns(columns, [{ name: 'Plan C' }]);
    expect(tableData).toEqual([['Plan C', null, null]]);
  });

  it('preserves explicit null cell values', () => {
    const { tableData } = normalizeColumns(columns, [{ name: null, amount: 0, status: '' }]);
    expect(tableData).toEqual([[null, 0, '']]);
  });

  it('ignores row keys that have no matching column', () => {
    const { tableData } = normalizeColumns(columns, [
      { name: 'Plan D', amount: 1, status: 'active', extraneous: 'dropped' }
    ]);
    expect(tableData).toEqual([['Plan D', 1, 'active']]);
  });

  it('returns null sortableColumns when no column opts out', () => {
    const { sortableColumns } = normalizeColumns(columns, rows);
    expect(sortableColumns).toBeNull();
  });

  it('returns the indices of non-opted-out columns when any column sets sortable: false', () => {
    const mixedColumns: TableColumn[] = [
      { id: 'name', label: 'Name' },
      { id: 'amount', label: 'Amount', sortable: false },
      { id: 'status', label: 'Status', sortable: true }
    ];
    const { sortableColumns } = normalizeColumns(mixedColumns, rows);
    expect(sortableColumns).toEqual([0, 2]);
  });

  it('handles empty rows and empty columns', () => {
    expect(normalizeColumns(columns, [])).toEqual({
      tableHeaders: ['Name', 'Amount', 'Status'],
      tableData: [],
      sortableColumns: null
    });
    expect(normalizeColumns([], rows)).toEqual({
      tableHeaders: [],
      tableData: [[], []],
      sortableColumns: null
    });
  });

  it('keeps row-reference alignment: tableData[i] corresponds to rows[i]', () => {
    const { tableData } = normalizeColumns(columns, rows);
    tableData.forEach((projectedRow, index) => {
      expect(projectedRow[0]).toBe(rows[index].name);
    });
  });
});
