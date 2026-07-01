import type { JSONValue } from 'type-decoder';
import type { Snippet } from 'svelte';
import type { DataTableProperties, DataRow } from '../DataTable/properties';

export type SortDirection = 'asc' | 'desc';

/**
 * Configuration for row checkbox selection (C2-1).
 *
 * - `enabled` — activates the checkbox column.
 * - `selectionMode` — `'single'` allows at most one row selected at a time;
 *   `'multiple'` (default) allows arbitrary many.
 * - `onSelectionChange` — called whenever the selection set changes, receives
 *   the new set of selected row IDs.
 * - `getRowId` — derives a stable string ID from a row + its index. Defaults
 *   to `String(rowIndex)` when omitted.
 * - `disabledRowIds` — rows whose IDs appear in this set render a disabled,
 *   unchecked checkbox and cannot be selected.
 */
export type TableCheckboxSelectionConfig = {
  /**
   * Whether to activate the checkbox column. Defaults to `true` when the
   * config object is provided — the presence of `checkboxSelection` already
   * signals the intent to enable selection, so `enabled: false` is redundant.
   * Kept for explicit opt-out without removing the config object.
   */
  enabled?: boolean;
  selectionMode?: 'single' | 'multiple';
  onSelectionChange?: (selectedIds: Set<string>) => void;
  getRowId?: (row: JSONValue[], rowIndex: number) => string;
  disabledRowIds?: Set<string>;
};

/**
 * Configuration for the built-in search bar (C2-3).
 *
 * - `placeholder` — input placeholder text (default "Search…").
 * - `searchableColumnIndices` — restrict filtering to these column indices.
 *   When omitted all columns are searched.
 * - `testId` — `data-pw` attribute on the search input element.
 */
export type TableSearchConfig = {
  placeholder?: string;
  searchableColumnIndices?: number[];
  testId?: string;
};

export type TableProperties<T extends DataRow = DataRow> = OptionalTableProperties<T> &
  TableEventProperties;

export type OptionalTableProperties<T extends DataRow = DataRow> = {
  /**
   * Opt into the advanced **data-grid** engine. When provided, `Table` renders the
   * column-model grid (typed columns, pagination, filtering, column manager, loading
   * skeletons, row selection/expansion/inline-edit, bulk actions) instead of the legacy
   * positional (`tableHeaders`/`tableData`) table. All legacy props are ignored in this
   * mode. Pass `{ columns, data, idField, ... }`; see the DataTable property types.
   */
  dataGrid?: DataTableProperties<T>;
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
  /**
   * C2-1: Opt-in checkbox row-selection.
   * Pass `{ enabled: true }` to show a leading checkbox column.
   */
  checkboxSelection?: TableCheckboxSelectionConfig;
  /**
   * C2-3: Opt-in built-in search bar rendered above the table.
   * Client-side filtering is performed by default; pass `onSearchChange` to
   * delegate to the server instead.
   */
  searchConfig?: TableSearchConfig;
};

export type TableEventProperties = {
  onRowClick?: (rowIndex: number, rowData: JSONValue[]) => void;
  onSort?: (columnIndex: number, direction: SortDirection) => void;
  /**
   * C2-2: Callback invoked when a cell value changes via an editable element
   * inside the consumer's `cell` snippet (e.g. an `<Input>` or `<Select>`).
   *
   * **How to wire it**: Svelte 5 snippets execute in the consumer's scope, so
   * `onCellChange` is NOT forwarded by Table — you must close over your own
   * handler directly inside the snippet:
   *
   * ```svelte
   * <script>
   *   let rows = $state(myData);
   *   const handleCellChange = (rowIndex, colIndex, newValue) => {
   *     rows[rowIndex][colIndex] = newValue;
   *   };
   * </script>
   *
   * <Table tableData={rows}>
   *   {#snippet cell(value, rowIndex, colIndex)}
   *     <Input
   *       value={String(value ?? '')}
   *       onInput={(newValue) => handleCellChange(rowIndex, colIndex, newValue)}
   *     />
   *   {/snippet}
   * </Table>
   * ```
   *
   * Table never mutates `tableData`; the consumer owns the source-of-truth
   * array. Pass `onCellChange` as a top-level prop if you want Table to expose
   * this handler to parent components via the standard props channel — it does
   * not change the wiring inside the snippet.
   */
  onCellChange?: (rowIndex: number, colIndex: number, newValue: JSONValue) => void;
  /**
   * C2-3: When provided, the built-in client-side filtering is disabled and
   * this callback is called on every search input change instead, letting the
   * server decide what rows to show.
   */
  onSearchChange?: (searchTerm: string) => void;
};
