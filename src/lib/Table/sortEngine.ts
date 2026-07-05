import type { JSONValue } from 'type-decoder';

/** Comparison strategy for `sortTableRows`. */
export type TableSortType = 'date' | 'number' | 'string';

type SortableValue = number | string | Date;

export type SortTableRowsOptions = {
  /**
   * Key to extract the comparable value from object-shaped cells (e.g. a
   * compare cell's primary line). Scalar cells are compared directly.
   */
  nestedKey?: string;
  /** Pins the first row (a totals/summary row) in place while the rest sort. */
  hasSummaryRow?: boolean;
  /**
   * Forces the comparison strategy. When omitted, values that parse as
   * numbers after stripping thousands separators, percent signs, and common
   * currency symbols sort numerically; everything else sorts as
   * case-insensitive text. Pass `'date'` explicitly for date columns —
   * date detection is deliberately not inferred.
   */
  sortType?: TableSortType;
};

const extractCellValue = (cellValue: JSONValue, nestedKey: string): JSONValue => {
  if (cellValue === null) {
    return '';
  }
  if (typeof cellValue === 'object' && !Array.isArray(cellValue)) {
    return cellValue[nestedKey] ?? '';
  }
  return cellValue;
};

const CURRENCY_AND_SEPARATORS = /[,%₹$€£]/g;

const inferSortType = (sampleValue: JSONValue, nestedKey: string): TableSortType => {
  const value = extractCellValue(sampleValue, nestedKey);
  const cleanedValue = String(value).replace(CURRENCY_AND_SEPARATORS, '');
  if (/^-?\d+(\.\d+)?%?$/.test(cleanedValue)) {
    return 'number';
  }
  return 'string';
};

const toSortableValue = (
  cellValue: JSONValue,
  sortType: TableSortType,
  nestedKey: string
): SortableValue => {
  const value = extractCellValue(cellValue, nestedKey);

  if (sortType === 'number') {
    const cleanedNumber = parseFloat(String(value).replace(CURRENCY_AND_SEPARATORS, ''));
    return isNaN(cleanedNumber) ? 0 : cleanedNumber;
  }

  if (sortType === 'date') {
    // Range cells ("1 Jun - 7 Jun") sort by their start date.
    const dateString = String(value).split(' - ')[0];
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date(0) : date;
  }

  return String(value);
};

const compareSortableValues = (a: SortableValue, b: SortableValue): number => {
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return String(a).toLowerCase().localeCompare(String(b).toLowerCase());
};

/**
 * Sorts positional table rows by a column with type-aware comparison —
 * currency/percent/thousands-separated numeric strings sort numerically,
 * text sorts case-insensitively, dates (opt-in via `sortType: 'date'`) sort
 * chronologically — with optional summary-row pinning. Pure and exported so
 * consumers can pre-sort data for `sortMode: 'server'` tables or unit-test
 * their sort expectations against exactly what Table would do.
 */
export const sortTableRows = (
  rows: Array<JSONValue[]>,
  columnIndex: number,
  direction: 'asc' | 'desc' | null,
  options: SortTableRowsOptions = {}
): Array<JSONValue[]> => {
  if (direction === null || rows.length <= 1) {
    return rows;
  }

  const nestedKey = options.nestedKey ?? '';
  let summaryRow: JSONValue[] | null = null;
  let rowsToSort: Array<JSONValue[]>;

  if (options.hasSummaryRow) {
    [summaryRow, ...rowsToSort] = rows;
  } else {
    rowsToSort = rows;
  }

  const sortType = options.sortType ?? inferSortType(rowsToSort[0]?.[columnIndex], nestedKey);
  const multiplier = direction === 'desc' ? -1 : 1;

  const sortedRows = [...rowsToSort].sort((rowA, rowB) => {
    const valueA = toSortableValue(rowA[columnIndex], sortType, nestedKey);
    const valueB = toSortableValue(rowB[columnIndex], sortType, nestedKey);
    return compareSortableValues(valueA, valueB) * multiplier;
  });

  return options.hasSummaryRow && summaryRow ? [summaryRow, ...sortedRows] : sortedRows;
};
