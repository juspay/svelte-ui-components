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
};

export type TableEventProperties = {
  onRowClick?: (rowIndex: number, rowData: JSONValue[]) => void;
  onSort?: (columnIndex: number, direction: SortDirection) => void;
};
