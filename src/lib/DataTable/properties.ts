import type { JSONValue } from 'type-decoder';
import type { Snippet } from 'svelte';

/**
 * DataTable — a column/field-based data grid built on top of the same visual
 * language as {@link Table}. Unlike `Table` (which renders positional
 * `string[]` headers + `JSONValue[][]` rows), `DataTable` is driven by typed
 * column definitions over an array of row objects.
 *
 * Feature parity targets (modelled on Blend's DataTable):
 *  1. Object/column-based data model with typed columns
 *  2. Built-in pagination
 *  3. Column filtering
 *  4. Column manager + reordering + freezing
 *  5. Loading / skeleton states
 *  6. Row expansion, inline editing, row actions, bulk action bar
 *
 * Every visual property remains a CSS custom property — the component ships
 * unstyled-by-default and inherits the `--table-*` variables already used by
 * `Table`, so a design system theming `Table` themes `DataTable` for free.
 */

/** A single row of data. Keyed by column `field`. */
export type DataRow = Record<string, JSONValue>;

export type DataTableSortDirection = 'asc' | 'desc' | 'none';

/** Built-in cell renderers. `custom` defers to the consumer's `cell` snippet. */
export type ColumnType = 'text' | 'number' | 'tag' | 'avatar' | 'progress' | 'date' | 'custom';

export type FilterType = 'text' | 'number' | 'select' | 'multiselect';

export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'range';

export type FilterOption = {
  id: string;
  label: string;
  value: string;
};

/** A resolved, active filter for a single column. */
export type ColumnFilterValue = {
  field: string;
  type: FilterType;
  /** string for text/select, string[] for multiselect, {min,max} for number-range. */
  value: string | string[] | { min: number | null; max: number | null };
};

/** Props for the per-column filter popover (`ColumnFilter.svelte`). */
export type ColumnFilterProperties = {
  field: string;
  header: string;
  filterType: FilterType;
  filterOptions?: FilterOption[];
  /** The currently-applied filter for this column, or `null` when none. */
  value: ColumnFilterValue | null;
  onApply: (filter: ColumnFilterValue) => void;
  onClear: (field: string) => void;
};

export type NumberFormat = 'integer' | 'decimal' | 'currency' | 'percentage';

export type TagColumnValue = {
  text: string;
  /** Maps to `--table-tag-<color>-*` variables. */
  color?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
};

export type AvatarColumnValue = {
  label: string;
  sublabel?: string;
  imageUrl?: string;
};

export type ProgressColumnValue = {
  value: number;
  max?: number;
  showPercentage?: boolean;
};

export type ColumnCellValueMap = {
  text: JSONValue;
  number: JSONValue;
  date: JSONValue;
  custom: JSONValue;
  tag: TagColumnValue;
  avatar: AvatarColumnValue;
  progress: ProgressColumnValue;
};

export type ColumnCellValue<TType extends ColumnType = ColumnType> = ColumnCellValueMap[TType];

export type TypedColumnCellValue = {
  [TType in ColumnType]: {
    type: TType;
    value: ColumnCellValueMap[TType];
  };
}[ColumnType];

export type ColumnDefinition<T extends DataRow = DataRow> = {
  /** Property key on the row object this column reads. */
  field: keyof T & string;
  /** Visible column title. */
  header: string;
  /** Optional secondary line under the header. */
  headerSubtext?: string;
  /** Built-in renderer. Defaults to `'text'`. */
  type?: ColumnType;
  /** Fixed CSS width (e.g. `'160px'`). Required for `frozen` columns. */
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  align?: 'left' | 'center' | 'right';
  /** Whether the column participates in sorting. Defaults to `sortable` prop. */
  isSortable?: boolean;
  /** Whether cells become editable when the row enters inline-edit mode. */
  isEditable?: boolean;
  /** Whether the column manager may hide this column. Defaults to `true`. */
  canHide?: boolean;
  /** Initial visibility. Defaults to `true`. */
  isVisible?: boolean;
  /** Freeze this column to the left edge (sticky). Requires `width`. */
  frozen?: boolean;
  /** Enables a filter affordance in the header for this column. */
  filterType?: FilterType;
  /** Options for `select` / `multiselect` filters. */
  filterOptions?: FilterOption[];
  /** Number formatting (only for `type: 'number'`). */
  format?: NumberFormat;
  /** Decimal places for number formatting. */
  precision?: number;
  /** Date formatting tokens are not parsed — pass a formatter via `formatValue`. */
  /** Transform the raw value to a display string (text/number/date columns). */
  formatValue?: (value: JSONValue, row: T, index: number) => string;
  /** Provide a comparable value for sorting (e.g. strip "INR " → number). */
  sortValueFormatter?: (value: JSONValue, row: T) => string | number | boolean;
  className?: string;
};

export type PaginationConfig = {
  currentPage: number;
  pageSize: number;
  /** Total rows across all pages. Used for server-side pagination. */
  totalRows: number;
  pageSizeOptions?: number[];
};

export type RowSelectionConfig<T extends DataRow = DataRow> = {
  selectionMode?: 'single' | 'multiple';
  isDisabled?: (row: T, index: number) => boolean;
  disabledText?: (row: T, index: number) => string;
};

export type RowActionConfig<T extends DataRow = DataRow> = {
  id: string;
  text?: string;
  icon?: Snippet;
  disabled?: boolean | ((row: T, index: number) => boolean);
  hidden?: boolean | ((row: T, index: number) => boolean);
  onClick: (row: T, index: number) => void;
};

export type RowActionsConfig<T extends DataRow = DataRow> = {
  /** Show a pencil action that puts the row into inline-edit mode. */
  showEditAction?: boolean;
  slot1?: RowActionConfig<T>;
  slot2?: RowActionConfig<T>;
};

export type DataTableProperties<T extends DataRow = DataRow> = {
  // ── Data model (feature 1) ────────────────────────────────────────────────
  data?: T[];
  columns?: ColumnDefinition<T>[];
  /** Property uniquely identifying a row. Drives selection/expansion identity. */
  idField: keyof T & string;
  title?: string;
  description?: string;
  caption?: string;
  classes?: string;
  testId?: string;
  isHoverable?: boolean;
  stickyHeader?: boolean;
  isTableScrollable?: boolean;
  /** Fixed height for the scroll body, e.g. `'400px'`. */
  tableBodyHeight?: string;

  // ── Sorting ───────────────────────────────────────────────────────────────
  sortable?: boolean;
  defaultSort?: { field: string; direction: DataTableSortDirection };
  /** Disable internal sorting and delegate to the server. */
  serverSideSort?: boolean;
  onSortChange?: (sort: { field: string; direction: DataTableSortDirection }) => void;

  // ── Search ────────────────────────────────────────────────────────────────
  enableSearch?: boolean;
  searchPlaceholder?: string;
  /** Restrict search to these fields. Defaults to all visible columns. */
  searchFields?: (keyof T & string)[];
  serverSideSearch?: boolean;
  onSearchChange?: (query: string) => void;

  // ── Filtering (feature 3) ─────────────────────────────────────────────────
  enableFiltering?: boolean;
  serverSideFiltering?: boolean;
  onFilterChange?: (filters: ColumnFilterValue[]) => void;

  // ── Pagination (feature 2) ────────────────────────────────────────────────
  pagination?: PaginationConfig;
  serverSidePagination?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;

  // ── Column manager / reorder / freeze (feature 4) ─────────────────────────
  enableColumnManager?: boolean;
  enableColumnReordering?: boolean;
  onColumnReorder?: (columns: ColumnDefinition<T>[]) => void;
  onColumnVisibilityChange?: (visibleFields: string[]) => void;

  // ── Loading / skeleton (feature 5) ────────────────────────────────────────
  isLoading?: boolean;
  showSkeleton?: boolean;
  /** Number of skeleton rows to render while loading. Defaults to page size or 5. */
  skeletonRows?: number;
  isRowLoading?: (row: T, index: number) => boolean;

  // ── Row selection + bulk actions (feature 6) ──────────────────────────────
  enableRowSelection?: boolean;
  rowSelectionConfig?: RowSelectionConfig<T>;
  showBulkActionBar?: boolean;
  onRowSelectionChange?: (selectedIds: string[]) => void;
  /** Custom buttons rendered inside the bulk action bar. */
  bulkActions?: Snippet<[{ selectedIds: string[]; clear: () => void }]>;

  // ── Row expansion (feature 6) ─────────────────────────────────────────────
  enableRowExpansion?: boolean;
  isRowExpandable?: (row: T, index: number) => boolean;
  renderExpandedRow?: Snippet<[{ row: T; index: number }]>;
  onRowExpansionChange?: (rowId: string, isExpanded: boolean, row: T) => void;

  // ── Inline edit + row actions (feature 6) ─────────────────────────────────
  enableInlineEdit?: boolean;
  showActionsColumn?: boolean;
  rowActions?: RowActionsConfig<T>;
  onRowSave?: (rowId: string, updatedRow: T) => void;
  onRowCancel?: (rowId: string) => void;
  onFieldChange?: (rowId: string, field: keyof T & string, value: JSONValue) => void;

  // ── Events ────────────────────────────────────────────────────────────────
  onRowClick?: (row: T, index: number) => void;

  // ── Snippets ──────────────────────────────────────────────────────────────
  /** Custom cell renderer; receives the column, raw value, row and row index. */
  cell?: Snippet<[ColumnDefinition<T>, JSONValue, T, number]>;
  /** Rendered when there are no rows to show. */
  empty?: Snippet;
  /** Header toolbar extras, rendered to the right of search. */
  toolbarSlot?: Snippet;
};
