import type { JSONValue } from 'type-decoder';
import type { Snippet } from 'svelte';

export type SortDirection = 'asc' | 'desc';

/**
 * Built-in cell renderer vocabulary for the keyed column model.
 *
 * `'text'` (the default) renders the cell value as plain text through the
 * existing engine; `'custom'` delegates rendering entirely to the column's
 * own `cell` snippet. The remaining types are built-in renderers composed
 * purely from library primitives — each expects its matching `Table*CellData`
 * shape as the cell value and falls back to plain text for scalar values.
 */
export type TableColumnType =
  | 'text'
  | 'tag'
  | 'text-tag'
  | 'two-line-text'
  | 'icon-label'
  | 'image-two-line-text'
  | 'tag-array'
  | 'avatar-stack'
  | 'compare'
  | 'toggle'
  | 'link'
  | 'select'
  | 'input'
  | 'button'
  | 'action-group'
  | 'popup-menu'
  | 'custom';

/**
 * Cell value for the keyed row model: plain JSON. Structured cell shapes
 * (`TableTagCellData`, `TableCompareCellData`, …) are JSON-compatible
 * objects, so rows stay serializable; behavior (e.g. a toggle handler)
 * lives on the column, never in row data.
 */
export type TableCellValue = JSONValue;

/** Cell shape for `type: 'tag'` — a single Pill. */
export type TableTagCellData = {
  text: string;
  /** CSS classes forwarded to the Pill (the consumer owns tone mapping). */
  classes?: string;
  dismissible?: boolean;
  testId?: string;
};

/** Cell shape for `type: 'text-tag'` — text with an optional trailing Pill. */
export type TableTextTagCellData = {
  text: string;
  tag?: TableTagCellData;
};

/** Cell shape for `type: 'two-line-text'` — primary over secondary line. */
export type TableTwoLineTextCellData = {
  text1?: string;
  text2?: string;
};

/** Cell shape for `type: 'icon-label'` — leading image(s) plus a label. */
export type TableIconLabelCellData = {
  icons?: string[];
  label?: string;
};

/** Cell shape for `type: 'image-two-line-text'` — thumbnail plus two lines. */
export type TableImageTwoLineTextCellData = {
  imageUrl?: string;
  text1?: string;
  text2?: string;
};

/** One chip of a `type: 'tag-array'` cell. */
export type TableTagArrayCellItem = {
  text: string;
  classes?: string;
};

/** Cell shape for `type: 'avatar-stack'` — initials chips with overflow. */
export type TableAvatarStackCellData = {
  items: Array<{ id: string; label?: string }>;
  /** Chips rendered before collapsing into a "+N" overflow. Default 4. */
  max?: number;
};

/**
 * Cell shape for `type: 'compare'` — a primary value over a comparison value
 * with an optional trend row (percent with up/down arrow, or a plain label).
 * Scalar cell values in the same column render as plain text, so compare and
 * plain rows coexist.
 */
export type TableCompareCellData = {
  primary?: string;
  comparison?: string;
  trendPercent?: number;
  trendLabel?: string;
};

/** Cell shape for `type: 'toggle'` — the handler lives on the column. */
export type TableToggleCellData = {
  checked?: boolean;
  ariaLabel?: string;
  testId?: string;
};

/** Cell shape for `type: 'link'` — external link with an optional copy affordance. */
export type TableLinkCellData = {
  url: string;
  /** Visible text; defaults to the url. */
  label?: string;
  /** Renders a copy-to-clipboard button next to the link. Default true. */
  copyable?: boolean;
};

/** Cell shape for `type: 'select'` — the handler lives on the column. */
export type TableSelectCellData = {
  options: Array<{ id: string; label: string }>;
  selectedId?: string;
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
  /** Per-option test id prefix — each option emits `data-pw="{itemTestId}-{id}"`. */
  itemTestId?: string;
};

/** Cell shape for `type: 'input'` — the handler lives on the column. */
export type TableInputCellData = {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
  /** Input dataType forwarded to the rendered Input ('text' | 'tel' | 'number' | …). */
  dataType?: string;
  /**
   * Live-validation pattern forwarded to the rendered Input. A RegExp SOURCE
   * string (cell data must stay JSON-safe) — compiled at render time.
   */
  validationPattern?: string;
  /** Inline error message shown when the validation pattern rejects the value. */
  onErrorMessage?: string;
};

/** Cell shape for `type: 'button'` — the handler lives on the column. */
export type TableButtonCellData = {
  text: string;
  disabled?: boolean;
  /** CSS classes forwarded to the Button (the consumer owns variant mapping). */
  classes?: string;
  testId?: string;
};

/** One overflow-menu entry for action-group / popup-menu cells (JSON-safe). */
export type TableMenuItemData = {
  id: string;
  /** Visible label; defaults to the id. */
  label?: string;
  danger?: boolean;
  separator?: boolean;
};

/** Cell shape for `type: 'action-group'` — primary button plus overflow menu. */
export type TableActionGroupCellData = {
  primaryButton?: TableButtonCellData;
  menuItems?: TableMenuItemData[];
};

/** Cell shape for `type: 'popup-menu'` — a kebab-triggered row menu. */
export type TablePopupMenuCellData = {
  items: TableMenuItemData[];
  ariaLabel?: string;
};

/**
 * Per-column header filter dropdown. Table renders the dropdown mechanics
 * (a Menu beside the header label with the current selection highlighted);
 * the options, selection state, and filtering itself belong to the consumer.
 * Selecting the already-selected option clears the filter (emits `null`).
 */
export type TableColumnFilterConfig = {
  options: Array<{ label: string; value: string }>;
  selectedValue?: string | null;
  onFilterChange?: (value: string | null) => void;
};

/**
 * Keyed row shape for the keyed column model: cell values addressed by
 * `TableColumn.id` instead of array position. Keys missing from a row render
 * as empty cells.
 */
export type TableRow = Record<string, TableCellValue>;

/**
 * Column definition for the keyed column model.
 *
 * - `id` — key into each `TableRow` for this column's cell value.
 * - `label` — header text (fills the same role as a `tableHeaders` entry).
 * - `type` — built-in renderer selection; defaults to `'text'`.
 * - `sortable` — per-column sort opt-out; defaults to the table-wide
 *   `sortable` prop. Equivalent to listing/omitting the column's index in
 *   `sortableColumns`.
 * - `testId` — `data-pw` attribute emitted on this column's header cell.
 * - `cell` — column-scoped renderer snippet receiving the full keyed row, the
 *   display row index, and the original (pre-sort) row index. Takes precedence
 *   over the table-wide `cell` snippet for this column; required when `type` is `'custom'`.
 * - `onToggle`/`onSelect`/`onInput`/`onButtonClick`/`onPrimaryAction`/`onMenuAction`
 *   — change/action handlers for the matching interactive cell types. Behavior
 *   lives on the column so row data stays plain JSON.
 */
export type TableColumn = {
  id: string;
  label: string;
  type?: TableColumnType;
  sortable?: boolean;
  testId?: string;
  cell?: Snippet<[TableRow, number, number]>;
  /** Header tooltip text, shown on hover over the column label. */
  tooltip?: string;
  /**
   * Horizontal alignment for this column's header and body cells. When unset,
   * cells follow the table-wide `--table-text-align` (left by default).
   */
  align?: 'left' | 'center' | 'right';
  /**
   * Caps the column width (any CSS length). Overflowing scalar cell text
   * ellipsizes with the full value available on the native title tooltip.
   */
  maxWidth?: string;
  /** Opt-in header filter dropdown (see TableColumnFilterConfig). */
  filter?: TableColumnFilterConfig;
  /**
   * Extracts the comparable value for client-side sorting of this column —
   * the seam for currency/date/locale-aware sorting without that logic
   * entering the library. When absent, the built-in comparator is used on
   * the cell value itself.
   */
  getSortValue?: (row: TableRow, rowIndex: number) => string | number | boolean;
  /**
   * Row-action handlers. `rowIndex` is the row's position in the CURRENT
   * (sorted/filtered/paginated) view; `originalIndex` is its position in the
   * consumer-supplied `rows` array, stable under sort/filter — index your own
   * source array with `originalIndex` so actions hit the correct row when the
   * table is sorted. `checked` is the NEW state after the flip, not the pre-click value.
   */
  onToggle?: (rowIndex: number, checked: boolean, originalIndex: number) => void;
  onSelect?: (rowIndex: number, selectedId: string, originalIndex: number) => void;
  onInput?: (rowIndex: number, value: string, originalIndex: number) => void;
  onButtonClick?: (rowIndex: number, originalIndex: number) => void;
  onPrimaryAction?: (rowIndex: number, originalIndex: number) => void;
  onMenuAction?: (rowIndex: number, itemId: string, originalIndex: number) => void;
};

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
  getRowId?: (row: JSONValue[], rowIndex: number, originalIndex: number) => string;
  disabledRowIds?: Set<string>;
  /**
   * Controlled-selection overlay. Omitted: today's uncontrolled behavior via
   * an internal set, unchanged. Provided: Table renders selection FROM this
   * set and never mutates it — `onSelectionChange` reports the would-be next
   * set and the consumer decides. Required for cross-page-persistent
   * selection under server pagination.
   */
  selectedIds?: Set<string>;
  /**
   * Generic DOM-attribute spread onto each row checkbox (`rowIndex` is `-1`
   * for the header select-all). An escape hatch for consumer-specific
   * attributes (e.g. native test IDs) without the library learning them.
   */
  getRowAttributes?: (rowId: string, rowIndex: number) => Record<string, string>;
};

/**
 * Built-in paginator config. `'client'` mode slices rows internally;
 * `'server'` mode leaves the supplied rows untouched (they are the current
 * page) and drives the paginator from `page`/`totalItems`/`hasMore`.
 * A consumer `paginatorSlot` takes precedence over the built-in paginator.
 */
export type TablePaginationConfig = {
  mode?: 'client' | 'server';
  /** 1-indexed current page. Server mode: controlled by the consumer. */
  page?: number;
  /** Rows per page. Default 10. */
  pageSize?: number;
  /** Page-size selector options. Default [10, 25, 50, 100]; `[]` hides the selector. */
  pageSizeOptions?: number[];
  /** Total row count (server mode). Client mode derives it from the data. */
  totalItems?: number;
  /** Cursor-mode hint forwarded to the paginator's load-more affordance. */
  hasMore?: boolean;
  /** Disables the paginator and page-size selector during a fetch. */
  isLoading?: boolean;
  /** Range text override; default "{from}-{to} of {total}". */
  rangeLabel?: (from: number, to: number, total: number) => string;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onLoadMore?: () => void;
  testId?: string;
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

export type TableProperties = OptionalTableProperties & TableEventProperties;

export type OptionalTableProperties = {
  tableTitle?: string | null;
  tableHeaders?: string[];
  tableData?: Array<JSONValue[]>;
  /**
   * Keyed column model (preferred): column definitions addressed by id.
   * When provided, `columns`/`rows` are normalized internally into the
   * positional `tableHeaders`/`tableData` shape and drive the same engine —
   * the positional props are ignored for that instance. Omit both to keep
   * the positional API exactly as before.
   */
  columns?: TableColumn[];
  /** Keyed row data, addressed by `TableColumn.id`. Used with `columns`. */
  rows?: TableRow[];
  /**
   * `'client'` (default) sorts rows internally on header click, exactly as
   * before. `'server'` keeps the header sort UI and `onSort` callback but
   * skips the internal reorder — the consumer re-orders the data itself
   * (e.g. via a server query).
   */
  sortMode?: 'client' | 'server';
  /** Built-in paginator (see TablePaginationConfig). */
  pagination?: TablePaginationConfig;
  /**
   * Bulk-action bar rendered above the table while the checkbox selection is
   * non-empty. The library owns only placement; buttons, labels, and actions
   * are entirely consumer-rendered content.
   */
  toolbarSlot?: Snippet<[{ selectedIds: Set<string> }]>;
  /** Prepends a sequential row-number column (1-based, pagination-aware). */
  rowNumberColumn?: boolean;
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
  onRowClick?: (rowIndex: number, rowData: JSONValue[], originalIndex: number) => void;
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
