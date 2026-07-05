import type { JSONValue } from 'type-decoder';
import type { TableColumn, TableRow } from './properties';

/**
 * Result of projecting the keyed column model onto Table's positional engine.
 *
 * - `tableHeaders` — column labels, in column order.
 * - `tableData` — one positional array per row, cells in column order; a key
 *   missing from a row projects to `null` (renders as an empty cell).
 * - `sortableColumns` — indices of columns whose `sortable` is not `false`,
 *   or `null` when no column opts out (preserving the table-wide default of
 *   "all columns sortable").
 */
export type NormalizedColumns = {
  tableHeaders: string[];
  tableData: Array<JSONValue[]>;
  sortableColumns: number[] | null;
};

/**
 * Projects the keyed `columns`/`rows` model onto the positional
 * `tableHeaders`/`tableData` shape that Table's sort/search/selection engine
 * operates on. Pure and deterministic — exported so consumers can unit-test
 * their own column/row assembly against the exact projection Table uses.
 */
export const normalizeColumns = (columns: TableColumn[], rows: TableRow[]): NormalizedColumns => {
  const tableHeaders = columns.map((column) => column.label);

  const tableData = rows.map((row) =>
    columns.map((column) => {
      const cellValue = row[column.id];
      return cellValue ?? null;
    })
  );

  const hasSortOptOut = columns.some((column) => column.sortable === false);
  const sortableColumns = hasSortOptOut
    ? columns.reduce<number[]>((sortableIndices, column, columnIndex) => {
        if (column.sortable !== false) {
          sortableIndices.push(columnIndex);
        }
        return sortableIndices;
      }, [])
    : null;

  return { tableHeaders, tableData, sortableColumns };
};
