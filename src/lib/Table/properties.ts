import type { JSONValue } from 'type-decoder';
import type { Snippet } from 'svelte';
import type { TooltipPosition } from '../Tooltip/properties';

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
  testId?: string;
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
  /**
   * Accessible name forwarded to the rendered Input's native element
   * (aria-label). Recommended whenever the cell has no visible label —
   * required in practice for icon-bearing inputs.
   */
  ariaLabel?: string;
  /**
   * URL of a passive leading icon rendered inside the input field (e.g. a
   * currency glyph). Sized via `--table-cell-input-icon-size` (default 16px).
   * Scheme-validated at narrowing time: only http(s), `data:image/*`, and
   * relative URLs are accepted; anything else is dropped.
   */
  iconUrl?: string;
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

/** Options shared by both button cell variants. */
export type TableButtonCellCommonData = {
  disabled?: boolean;
  /** CSS classes forwarded to the Button (the consumer owns variant mapping). */
  classes?: string;
  testId?: string;
};

/**
 * Text-bearing button cell — `text` stays required exactly as before this
 * type became a union, so existing consumers are unaffected. An optional
 * `iconUrl` renders a leading icon; `ariaLabel` may override the accessible
 * name (the visible text already names the button).
 */
export type TableTextButtonCellData = TableButtonCellCommonData & {
  text: string;
  /**
   * URL of a leading icon rendered next to the text. Sized via
   * `--table-cell-icon-size` (default 16px). Scheme-validated at narrowing
   * time: only http(s), `data:image/*`, and relative URLs are accepted;
   * anything else is dropped.
   */
  iconUrl?: string;
  ariaLabel?: string;
};

/**
 * Icon-only button cell — renders as a bare ghost control. `ariaLabel` is
 * required (the button has no visible text, so it MUST carry an accessible
 * name); the decoder enforces the same rule at runtime for untyped data.
 */
export type TableIconOnlyButtonCellData = TableButtonCellCommonData & {
  text?: never;
  /**
   * URL of the button's icon. Sized via `--table-cell-icon-size` (default
   * 16px). Scheme-validated at narrowing time: only http(s), `data:image/*`,
   * and relative URLs are accepted; anything else is dropped (the cell then
   * fails narrowing and falls back to plain text of the raw value).
   */
  iconUrl: string;
  ariaLabel: string;
};

/**
 * Cell shape for `type: 'button'` — the handler lives on the column. A
 * discriminated union: text-bearing buttons keep `text` required (unchanged
 * public contract), icon-only buttons require `iconUrl` + `ariaLabel`.
 */
export type TableButtonCellData = TableTextButtonCellData | TableIconOnlyButtonCellData;

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
/**
 * Customizes the generated `data-pw` suffixes of built-in cells for one
 * column. Values replace only the named suffix; row and item indices remain
 * appended where the default includes them. Cell-data `testId` values still
 * take precedence for renderers that accept one.
 */
export type TableBuiltinCellTestIdSuffixes = {
  icon?: string;
  thumbnail?: string;
  thumbnailPlaceholder?: string;
  tag?: string;
  trendUp?: string;
  trendDown?: string;
  menu?: string;
  menuTrigger?: string;
  popup?: string;
  popupTrigger?: string;
  link?: string;
  copy?: string;
  linkCopied?: string;
};

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
  /** Fixed/preferred column width (any CSS length), applied inline to its header and cells. */
  width?: string;
  /**
   * Caps the column width (any CSS length). Overflowing scalar cell text
   * ellipsizes with the full value available on the native title tooltip.
   */
  maxWidth?: string;
  /**
   * Per-built-in generated `data-pw` suffix overrides for this column. Omitted
   * entries preserve the existing suffixes exactly; row/item indices remain.
   */
  testIdSuffixes?: TableBuiltinCellTestIdSuffixes;
  /**
   * Paints this column's header and body cells with the highlight wash —
   * `--table-col-highlight-background` (body) and
   * `--table-col-highlight-header-background` (header; falls back to the body
   * wash). Use to emphasize a selected/pivot column. Row hover and row
   * selection still paint over the wash.
   */
  highlighted?: boolean;
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
  /**
   * Keeps the paginator footer (range text, page-size selector, steppers)
   * visible even when the data fits on a single page. Default `false`
   * matches DataGrid parity — a single page renders no footer at all.
   */
  showFooterOnSinglePage?: boolean;
  /**
   * Renders only the range summary text ("{from}-{to} of {total}") and
   * suppresses the page-size selector and page steppers — for a bare
   * "Showing X-Y of Z" affordance with no navigation controls. Implies
   * `showFooterOnSinglePage`: a count-only footer has nothing to hide behind
   * "already on the only page". Shorthand for `hidePageSizeSelector: true`
   * plus `hideSteppers: true`; reach for those two directly when you only
   * want to suppress one of the pair. Default `false`.
   */
  hideControls?: boolean;
  /**
   * Suppresses just the page-size Select, independently of the steppers —
   * e.g. a fixed page size with no reason to expose the selector, while
   * still keeping working page navigation. Default `false`.
   */
  hidePageSizeSelector?: boolean;
  /**
   * Suppresses just the Pagination steppers, independently of the page-size
   * Select — for a call site with its own working paginator elsewhere that
   * only wants Table's range text (and, optionally, its page-size selector).
   * Default `false`.
   */
  hideSteppers?: boolean;
  /** Range text override; default "{from}-{to} of {total}". */
  rangeLabel?: (from: number, to: number, total: number) => string;
  /**
   * Explicit `data-pw`/`testID` for the range summary span. Wins over the
   * derived id — the default derives from the table's own `testId`
   * (`${testId}-paginator-range`), falling back to `${pagination.testId}-range`
   * only when the table has none, so a call site whose table `testId` is
   * already load-bearing (built-in cell ids derive from it) has no way to
   * give the range span an independent locator without this.
   */
  rangeTestId?: string;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onLoadMore?: () => void;
  testId?: string;
  /** Forwarded to Pagination's previous-page button without modification. */
  prevButtonTestId?: string;
  /** Forwarded to Pagination's next-page (or load-more) button without modification. */
  nextButtonTestId?: string;
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
  displayMode?: 'toolbar' | 'inline';
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
  /**
   * Index (into the consumer-supplied `rows`, pre-sort/pre-filter) of a
   * summary/period-total row that renders with a distinct background — the
   * DataGrid-parity `summaryRowIndex`. The row is matched by its original
   * position, so it keeps its highlight through sort, search, and pagination.
   * Background comes from `--table-summary-row-background` (falls back to the
   * regular cell background when unset). Pass `null`/omit for no summary row.
   */
  summaryRowIndex?: number | null;
  /** Header label for the row-number column. Defaults to `'#'`. */
  rowNumberLabel?: string;
  /**
   * Icon snippet shown after each header label that has a `tooltip` — the
   * consumer supplies the glyph; the table places it trailing inside the tooltip
   * trigger. When set, the default underline affordance on those labels is dropped.
   */
  headerTooltipIcon?: Snippet;
  /** Placement of every header tooltip bubble. Defaults to `'top'`. */
  headerTooltipPosition?: TooltipPosition;
  /**
   * When `true`, in-cell `Select` dropdowns (`type: 'select'` columns) and in-cell
   * `Menu` popovers (`type: 'action-group'` / `'popup-menu'` columns) are portaled
   * to `document.body` and positioned `fixed`, so the table's own scroll/overflow
   * container cannot clip them. Set this on tables whose rows can be near a scroll
   * edge. Defaults to `false` (in-flow rendering, unchanged).
   */
  usePortal?: boolean;
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
  onrowclick?: (rowIndex: number, rowData: JSONValue[], originalIndex: number) => void;
  /** @deprecated Use `onrowclick` instead; both work until 4.0.0. */
  onRowClick?: (rowIndex: number, rowData: JSONValue[], originalIndex: number) => void;
  onsort?: (columnIndex: number, direction: SortDirection) => void;
  /** @deprecated Use `onsort` instead; both work until 4.0.0. */
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
  oncellchange?: (rowIndex: number, colIndex: number, newValue: JSONValue) => void;
  /** @deprecated Use `oncellchange` instead; both work until 4.0.0. */
  onCellChange?: (rowIndex: number, colIndex: number, newValue: JSONValue) => void;
  /**
   * C2-3: When provided, the built-in client-side filtering is disabled and
   * this callback is called on every search input change instead, letting the
   * server decide what rows to show.
   */
  onsearchchange?: (searchTerm: string) => void;
  /** @deprecated Use `onsearchchange` instead; both work until 4.0.0. */
  onSearchChange?: (searchTerm: string) => void;
};
