import type { JSONValue } from 'type-decoder';
import type { Snippet } from 'svelte';

export type SortDirection = 'asc' | 'desc';

export type TableProperties = OptionalTableProperties & TableEventProperties;

export type OptionalTableProperties = {
  tableTitle?: string | null;
  tableHeaders?: string[];
  tableData?: Array<JSONValue[]>;
  sortable?: boolean;
  sortableColumns?: number[];
  stickyHeader?: boolean;
  isTableScrollable?: boolean;
  isContentScrollable?: boolean;
  testId?: string;
  caption?: string;
  sortAscIcon?: Snippet;
  sortDescIcon?: Snippet;
  sortDefaultIcon?: Snippet;
  cell?: Snippet<[JSONValue, number, number]>;
  empty?: Snippet;
  classes?: string;
  /** Snippet rendered in a footer region below the table (e.g. a paginator). */
  paginatorSlot?: Snippet;
  /** Return a data-pw value for the given row. */
  getRowTestId?: (row: JSONValue[], rowIndex: number) => string;
  /** Return a data-pw value for the given cell. */
  getCellTestId?: (row: JSONValue[], column: JSONValue, rowIndex: number) => string;
};

export type TableEventProperties = {
  onRowClick?: (rowIndex: number, rowData: JSONValue[]) => void;
  onSort?: (columnIndex: number, direction: SortDirection) => void;
};
