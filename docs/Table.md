# Table

A sortable data table with clean, modern defaults. Supports column sorting (ascending/descending) for string, number, and boolean values. Features sticky headers, custom cell rendering via Svelte 5 snippets, row click interaction, customizable sort icons, a footer paginator slot, per-row/cell `data-pw` test ID callbacks, opt-in checkbox row selection (single and multiple mode), and a built-in search bar with client-side filtering or server-side delegation. Data is supplied either through the keyed column model (`columns`/`rows`, preferred — cells addressed by column id, with per-column `sortable`/`testId`/custom `cell` snippet options) or the positional model (`tableHeaders`/`tableData`, an array of arrays).

## Usage

Describe columns once and address row values by column id (the keyed column model). Missing keys render as empty cells.

```svelte
<script lang="ts">
  import { Table, type TableColumn, type TableRow } from '@juspay/svelte-ui-components';

  const columns: TableColumn[] = [
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email' },
    { id: 'role', label: 'Role', sortable: false }
  ];

  const rows: TableRow[] = [
    { name: 'Alice', email: 'alice@example.com', role: 'Admin' },
    { name: 'Bob', email: 'bob@example.com', role: 'Editor' }
  ];
</script>

<Table {columns} {rows} />
```

### Positional Model (legacy)

The original positional API remains fully supported and unchanged — pass parallel `tableHeaders`/`tableData` arrays. The keyed model is normalized internally onto the same engine, so sorting, search, selection, and snippets behave identically across both.

```svelte
<Table
  tableHeaders={['Name', 'Email', 'Role']}
  tableData={[
    ['Alice', 'alice@example.com', 'Admin'],
    ['Bob', 'bob@example.com', 'Editor']
  ]}
/>
```

### Keyed Column Options

Per-column options: `sortable: false` opts a single column out of sorting, `testId` emits a `data-pw` attribute on that column's header cell, and `type: 'custom'` with a `cell` snippet gives the column its own renderer receiving the keyed row:

```svelte
<script lang="ts">
  const columns: TableColumn[] = [
    { id: 'name', label: 'Name' },
    { id: 'status', label: 'Status', type: 'custom', cell: statusCell }
  ];
</script>

{#snippet statusCell(row: TableRow, rowIndex: number)}
  <Pill
    text={String(row.status)}
    classes={row.status === 'Active' ? 'pill-success' : 'pill-error'}
  />
{/snippet}
```

The projection used internally is exported as `normalizeColumns(columns, rows)` so consumers can unit-test their own column/row assembly against the exact shape Table renders.

### Built-in Cell Renderers

Beyond `'text'` and `'custom'`, `column.type` selects a built-in renderer composed purely from library primitives. Each expects its matching cell-data shape as the row value and falls back to plain text for scalar values (so mixed columns are well-defined). All appearance is themeable via `--table-cell-*` / `--table-trend-*` / `--table-link-*` CSS variables.

| `type`                | Cell value shape                                                                                                                          | Renders                                                                                                                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tag`                 | `TableTagCellData` `{ text, classes?, dismissible?, testId? }`                                                                            | a single Pill — the consumer owns tone→class mapping                                                                                                                                             |
| `text-tag`            | `TableTextTagCellData` `{ text, tag? }`                                                                                                   | text with an optional trailing Pill                                                                                                                                                              |
| `two-line-text`       | `TableTwoLineTextCellData` `{ text1?, text2? }`                                                                                           | primary line over secondary line                                                                                                                                                                 |
| `icon-label`          | `TableIconLabelCellData` `{ icons?, label? }`                                                                                             | leading image(s) plus a label                                                                                                                                                                    |
| `image-two-line-text` | `TableImageTwoLineTextCellData` `{ imageUrl?, text1?, text2? }`                                                                           | thumbnail (or placeholder) plus two lines                                                                                                                                                        |
| `tag-array`           | `TableTagArrayCellItem[]` `{ text, classes? }[]`                                                                                          | a wrapping row of Pills                                                                                                                                                                          |
| `avatar-stack`        | `TableAvatarStackCellData` `{ items: { id, label? }[], max? }`                                                                            | initials chips capped at `max` (default 4) with a `+N` overflow                                                                                                                                  |
| `compare`             | `TableCompareCellData` `{ primary?, comparison?, trendPercent?, trendLabel? }`                                                            | value over comparison with a colored trend row (↑ green / ↓ red / label)                                                                                                                         |
| `toggle`              | `TableToggleCellData` `{ checked?, ariaLabel?, testId? }`                                                                                 | a Toggle; `column.onToggle(rowIndex, checked)` receives the **new** state after the flip                                                                                                         |
| `link`                | `TableLinkCellData` `{ url, label?, copyable? }` (or a bare url string)                                                                   | external link with an optional copy-to-clipboard affordance                                                                                                                                      |
| `select`              | `TableSelectCellData` `{ options, selectedId?, placeholder?, disabled?, testId?, itemTestId? }`                                           | a Select; `column.onSelect(rowIndex, selectedId, originalIndex)`                                                                                                                                 |
| `input`               | `TableInputCellData` `{ value?, placeholder?, disabled?, testId?, ariaLabel?, iconUrl?, dataType?, validationPattern?, onErrorMessage? }` | an Input; `column.onInput(rowIndex, value, originalIndex)`. `ariaLabel` names the field for screen readers (recommended — cells have no visible label); `iconUrl` renders a passive leading icon |
| `button`              | `TableButtonCellData` — union: `{ text, iconUrl?, ariaLabel?, … }` (text button) or `{ iconUrl, ariaLabel, … }` (icon-only)               | a Button; `column.onButtonClick(rowIndex, originalIndex)`. Icon-only buttons render as a bare ghost control and **require** `ariaLabel` (enforced by the type and the runtime narrowing)         |
| `action-group`        | `TableActionGroupCellData` `{ primaryButton?, menuItems? }`                                                                               | a primary Button plus a kebab overflow Menu; `column.onPrimaryAction` / `column.onMenuAction`                                                                                                    |
| `popup-menu`          | `TablePopupMenuCellData` `{ items, ariaLabel? }`                                                                                          | a kebab-triggered row Menu; `column.onMenuAction(rowIndex, itemId, originalIndex)`                                                                                                               |

Icon URLs in cell data (`iconUrl`) are scheme-validated at narrowing time: only `http:`, `https:`, `data:image/<svg+xml|png|jpeg|jpg|gif|webp>`, and scheme-less (relative) URLs are accepted — anything else is dropped. A text button whose icon URL is rejected still renders (without the icon); an icon-only cell whose URL is rejected (or whose `ariaLabel` is missing) fails narrowing entirely, and the cell renders the raw value via the plain-text fallback (`'-'` for objects).

```svelte
const columns: TableColumn[] = [
  { id: 'plan', label: 'Plan', type: 'two-line-text' },
  { id: 'state', label: 'State', type: 'tag' },
  { id: 'revenue', label: 'Revenue', type: 'compare' },
  { id: 'active', label: 'Active', type: 'toggle', onToggle: (rowIndex, checked) => update(rowIndex, checked) }
];

const rows: TableRow[] = [
  {
    plan: { text1: 'Growth Monthly', text2: 'PLN-0042' },
    state: { text: 'Active', classes: 'pill-success' },
    revenue: { primary: '₹4,938.10', comparison: '₹4,100.00', trendPercent: 20 },
    active: { checked: true }
  }
];
```

### Per-Column Header Metadata

Keyed columns carry their own header behavior: `tooltip` (hover text on the label), `align` (`'left' | 'center' | 'right'`, applied to header and body cells), `width` (an inline fixed/preferred CSS width on the header and every body cell), `maxWidth` (caps the column; overflowing scalar cells ellipsize with the full value on the native title tooltip), `highlighted` (paints the column's header and body cells with the highlight wash — see `--table-col-highlight-background`; row hover and row selection still paint over it), and `filter` (a header dropdown — Table renders the Menu mechanics, the consumer owns options/selection/filtering; re-selecting the active option clears to `null`):

```svelte
const columns: TableColumn[] = [
  { id: 'id', label: 'Order', width: '120px', maxWidth: '120px' },
  { id: 'name', label: 'Name', tooltip: 'Customer display name' },
  { id: 'amount', label: 'Amount', align: 'right', highlighted: true },
  {
    id: 'status', label: 'Status',
    filter: {
      options: [{ label: 'Active', value: 'active' }],
      selectedValue: currentFilter,
      onFilterChange: (value) => (currentFilter = value)
    }
  }
];
```

### Sorting: getSortValue and server mode

`column.getSortValue(row, rowIndex)` supplies the comparable value for client-side sorting (currency/date parsing stays in the consumer): `{ id: 'amount', getSortValue: (row) => Number(String(row.amount).replace(/[₹,]/g, '')) }`. Setting `sortMode="server"` keeps the header sort UI and `onSort` callback but skips the internal reorder — the consumer re-orders its rows (e.g. via a server query).

The standalone `sortTableRows(rows, columnIndex, direction, options?)` export sorts positional rows type-aware (numeric strings with thousands separators / percent / currency sort numerically; text case-insensitively; `sortType: 'date'` opt-in for dates, using range starts) with optional `hasSummaryRow` pinning and `nestedKey` extraction for object cells — useful for `sortMode="server"` consumers and unit tests.

### Built-in Pagination

`pagination` renders a footer paginator (range label, optional page-size selector, page controls). `'client'` mode slices the rows internally — search and page-size changes snap back to page 1; `'server'` mode leaves the supplied rows untouched (they are the current page) and drives the chrome from `page`/`totalItems`/`hasMore`, with `isLoading` disabling the controls during fetches. A consumer `paginatorSlot` takes precedence.

`showFooterOnSinglePage` keeps that footer visible when the data fits on one page — the default hides it entirely, which is DataGrid parity but wrong for a call site whose page-size selector is how the merchant asks for more rows.

`hideControls` renders the range summary alone, suppressing both the page-size selector and the steppers as a single unit; it implies `showFooterOnSinglePage`, since a count-only footer has nothing to hide behind "already on the only page". To suppress only one of the two, use `hidePageSizeSelector` or `hideSteppers` instead — each defaults to `false`, works independently of the other, and independently of `hideControls`. Setting both together behaves exactly like `hideControls` (including the same `showFooterOnSinglePage` implication once both are true); `hideControls` remains a plain shorthand for that combination and existing consumers of it are unaffected.

```svelte
<!-- A call site with its own working steppers elsewhere on the page: keep
     Table's range text and steppers, drop the duplicate size selector. -->
<Table
  {columns}
  {rows}
  pagination={{
    pageSize: 10,
    hidePageSizeSelector: true,
    testId: 'orders-paginator'
  }}
/>
```

The range span's `data-pw`/`testID` is derived as `` `${testId}-paginator-range` `` from the **table's** `testId`, falling back to `` `${pagination.testId}-range` `` only when the table has none. A table's `testId` is usually load-bearing (the built-in cell ids derive from it), so the derivation alone cannot give the range span an independent name — pass `pagination.rangeTestId` to do that; it wins over the derived id whenever it's set, and the derivation is unchanged when it's left unset:

```svelte
<Table
  {columns}
  {rows}
  testId="orders-table"
  pagination={{ testId: 'orders-paginator', rangeTestId: 'orders-range' }}
/>
<!-- range span emits data-pw="orders-range", not "orders-table-paginator-range" -->
```

The range text itself uses a plain hyphen by default (`"{from}-{to} of {total}"`) — override `rangeLabel` to use an en dash or any other format.

```svelte
<Table
  {columns}
  {rows}
  rowNumberColumn
  pagination={{
    pageSize: 10,
    onPageChange: (page) => {},
    testId: 'orders-paginator',
    prevButtonTestId: 'orders-previous',
    nextButtonTestId: 'orders-next'
  }}
/>
```

`rowNumberColumn` prepends a 1-based, pagination-aware sequence column.

`prevButtonTestId` and `nextButtonTestId` forward unchanged to the paginator's previous and next controls (the latter is also used by cursor-mode's load-more control). They are omitted by default, so existing paginator test IDs remain unchanged.

### Built-in Cell Test-ID Suffixes

A keyed column's `testIdSuffixes` customizes only the generated suffixes used by built-in renderers. The column's `testId` remains the prefix; suffixes that normally include a row or item index still append that index after the override. Omitted suffixes retain their exact existing defaults. Per-cell `testId` values remain authoritative for `tag`, `toggle`, `select`, `input`, and button renderers.

```svelte
<Table
  {rows}
  columns={[
    {
      id: 'docs',
      label: 'Docs',
      type: 'link',
      testId: 'document',
      testIdSuffixes: { link: 'resource', copy: 'clipboard', linkCopied: 'copied-notice' }
    }
  ]}
/>
```

The link and copy controls above emit `document-resource-{rowIndex}` and `document-clipboard-{rowIndex}`. The transient copied message deliberately remains `document-copied-notice` with no row index, matching the existing `link-copied` behavior. Other defaults include `icon-{iconIndex}`, `thumb`, `thumb-placeholder`, `tag-{itemIndex}`, `trend-up`, `trend-down`, `menu-{rowIndex}`, `menu-trigger-{rowIndex}`, `popup-{rowIndex}`, and `popup-trigger-{rowIndex}`.

`summaryRowIndex` marks one row (by its index in the consumer-supplied `rows`, pre-sort/pre-filter) as a summary/period-total row: it gets the `table-summary-row` class and a distinct background from `--table-summary-row-background` (falling back to the regular cell background when the token is unset). Because the row is matched by its original position, the highlight survives sorting, searching, and pagination. Pair it with `sortTableRows(..., { hasSummaryRow: true })` to also pin the row in place during client-side re-sorts.

```svelte
<Table {columns} {rows} summaryRowIndex={0} />
```

### Controlled Selection + Bulk Toolbar

`checkboxSelection.selectedIds` switches selection to controlled mode: Table renders from the consumer's set and never mutates it — `onSelectionChange` reports the would-be next set (required for cross-page-persistent selection under server pagination). Omitting it keeps the internal uncontrolled behavior exactly as before. `getRowAttributes(rowId, rowIndex)` spreads arbitrary attributes onto each row checkbox (`rowIndex` is `-1` for the header select-all) — an escape hatch for consumer-specific attributes such as native test IDs. `toolbarSlot` renders a bulk-action bar above the table while the selection is non-empty; the library owns only placement, the content is consumer-rendered:

```svelte
{#snippet bulkToolbar({ selectedIds })}
  <span>{selectedIds.size} selected</span>
  <Button text="Delete" onclick={() => deleteAll(selectedIds)} />
{/snippet}

<Table
  {columns}
  {rows}
  checkboxSelection={{ selectedIds: selection, onSelectionChange: (next) => (selection = next) }}
  toolbarSlot={bulkToolbar}
/>
```

### Custom Cell Rendering

Use the `cell` snippet to render components (Pills, links, badges) inside cells instead of plain text:

```svelte
<script>
  import { Table, Pill } from '@juspay/svelte-ui-components';
</script>

<Table
  tableHeaders={['Name', 'Status']}
  tableData={[
    ['Alice', 'Active'],
    ['Bob', 'Inactive']
  ]}
>
  {#snippet cell(value, rowIndex, colIndex)}
    {#if colIndex === 1}
      <Pill text={String(value)} classes={value === 'Active' ? 'pill-success' : 'pill-error'} />
    {:else}
      {value}
    {/if}
  {/snippet}
</Table>
```

### Sticky Header

Use `stickyHeader` to keep headers fixed while scrolling. Works with `isTableScrollable` (table's own scroll area) or a parent scroll container.

```svelte
<Table
  stickyHeader
  isTableScrollable
  tableHeaders={['Name', 'Score']}
  tableData={largeDataset}
  --table-container-height="400px"
/>
```

### Custom Sort Icons

Replace the default SVG chevron icons with custom snippets:

```svelte
<Table tableHeaders={['Name', 'Score']} tableData={data}>
  {#snippet sortAscIcon()}<span>↑</span>{/snippet}
  {#snippet sortDescIcon()}<span>↓</span>{/snippet}
  {#snippet sortDefaultIcon()}<span>↕</span>{/snippet}
</Table>
```

### Per-Column Widths

Control individual column widths via CSS using the `classes` prop and `nth-child` selectors:

```css
/* app.css */
.my-table th:nth-child(1),
.my-table td:nth-child(1) {
  width: 200px;
}
.my-table th:nth-child(2),
.my-table td:nth-child(2) {
  width: 30%;
}
.my-table th:nth-child(3),
.my-table td:nth-child(3) {
  width: 100px;
}
```

```svelte
<Table classes="my-table" tableHeaders={['Name', 'Email', 'Role']} tableData={data} />
```

For a uniform column width across all columns, use the `--table-column-width` CSS variable instead.

### Empty State

Show a placeholder when `tableData` is empty:

```svelte
<Table tableHeaders={['Name', 'Email']} tableData={[]}>
  {#snippet empty()}
    <p>No records found.</p>
  {/snippet}
</Table>
```

### Paginator Slot

Render a pagination control in a footer region below the table using the `paginatorSlot` snippet:

```svelte
<script>
  import { Table } from '@juspay/svelte-ui-components';
  let page = $state(1);
</script>

<Table tableHeaders={['Name', 'Role']} tableData={rows}>
  {#snippet paginatorSlot()}
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button onclick={() => page--} disabled={page === 1}>Prev</button>
      <span>Page {page}</span>
      <button onclick={() => page++}>Next</button>
    </div>
  {/snippet}
</Table>
```

### Row & Cell Test IDs

Use `getRowTestId` and `getCellTestId` to apply `data-pw` attributes for Playwright/E2E selectors:

```svelte
<Table
  tableHeaders={['Name', 'Status']}
  tableData={rows}
  getRowTestId={(row, rowIndex) => `user-row-${rowIndex}`}
  getCellTestId={(row, cell, rowIndex) => `user-cell-${rowIndex}-${String(row[0])}`}
/>
```

### Checkbox Row Selection

Pass `checkboxSelection` to render a leading checkbox column. Set `selectionMode` to `'single'` to allow at most one row selected at a time.

```svelte
<script>
  import { Table } from '@juspay/svelte-ui-components';

  let selectedIds = $state(new Set());
</script>

<!-- Multiple selection (default) -->
<Table
  tableHeaders={['Name', 'Department']}
  tableData={rows}
  checkboxSelection={{
    selectionMode: 'multiple',
    getRowId: (row, rowIndex) => String(row[0]),
    disabledRowIds: new Set(['Alice']),
    onSelectionChange: (ids) => {
      selectedIds = ids;
    }
  }}
/>

<!-- Single selection -->
<Table
  tableHeaders={['Name', 'Department']}
  tableData={rows}
  checkboxSelection={{
    selectionMode: 'single',
    onSelectionChange: (ids) => {
      selectedIds = ids;
    }
  }}
/>
```

`disabledRowIds` expects a `Set<string>` of row IDs that should render as disabled (unchecked, non-interactive). `getRowId` derives a stable string key from each row; when omitted the default key is the row's pre-sort positional index as a string.

### Search Bar

Pass `searchConfig` to show a search input above the table. By default the table filters rows client-side across all columns. Pass `onSearchChange` to disable client-side filtering and delegate to the server instead.

```svelte
<!-- Server-side delegation: client filtering disabled, onSearchChange fires on every keystroke -->
<script>
  import { Table } from '@juspay/svelte-ui-components';
  let filteredRows = $state(allRows);
</script>

<!-- Client-side filtering (searchableColumnIndices restricts which columns are searched) -->
<Table
  tableHeaders={['Name', 'Email', 'Role']}
  tableData={rows}
  searchConfig={{
    placeholder: 'Search users…',
    searchableColumnIndices: [0, 2],
    testId: 'user-search'
  }}
/>
<Table
  tableHeaders={['Name', 'Email', 'Role']}
  tableData={filteredRows}
  searchConfig={{ placeholder: 'Search…' }}
  onSearchChange={(term) => {
    filteredRows = fetchRows(term);
  }}
/>
```

### Editable Cells (onCellChange pattern)

`onCellChange` is accepted as a prop for components that want to pass a handler via the standard props channel (e.g. for type-checking at the call site), but Table does **not** call it internally. The correct wiring pattern is to close over your own handler directly inside the `cell` snippet, which runs in consumer scope:

```svelte
<script>
  import { Table } from '@juspay/svelte-ui-components';
  import { Input } from '@juspay/svelte-ui-components';

  let rows = $state(myData);
  const handleCellChange = (rowIndex, colIndex, newValue) => {
    const updated = rows[rowIndex].slice();
    updated[colIndex] = newValue;
    rows = rows.map((row, idx) => (idx === rowIndex ? updated : row));
  };
</script>

<Table tableData={rows} tableHeaders={['Name', 'Score']}>
  {#snippet cell(value, rowIndex, colIndex)}
    <Input
      value={String(value ?? '')}
      onInput={(newValue) => handleCellChange(rowIndex, colIndex, newValue)}
    />
  {/snippet}
</Table>
```

## Props

| Prop                  | Type                                                                | Required | Default               | Description                                                                                                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------- | -------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tableTitle            | `string \| null`                                                    | No       | `''`                  | Optional title text displayed above the table.                                                                                                                                                                                                                              |
| tableHeaders          | `string[]`                                                          | No       | `[]`                  | Array of column header strings. Each header is clickable for sorting (when sortable).                                                                                                                                                                                       |
| tableData             | `Array<JSONValue[]>`                                                | No       | `[]`                  | Array of row arrays. Each row is an array of cell values (string, number, or boolean). Columns correspond to tableHeaders by index.                                                                                                                                         |
| sortable              | `boolean`                                                           | No       | `true`                | When false, disables sorting on all columns. Sort buttons are hidden.                                                                                                                                                                                                       |
| sortableColumns       | `number[]`                                                          | No       | `-`                   | Array of column indices that are sortable. When provided, only these columns show sort buttons. Other columns are non-sortable regardless of the `sortable` prop.                                                                                                           |
| stickyHeader          | `boolean`                                                           | No       | `false`               | When true, the header row sticks to the top during scroll. Works with `isTableScrollable` or any parent scroll container. Offset via `--table-header-sticky-top`.                                                                                                           |
| isTableScrollable     | `boolean`                                                           | No       | `false`               | When true, creates a bounded scroll area on the table container. Headers are automatically sticky. Use `--table-container-height` to set the scroll area height.                                                                                                            |
| isContentScrollable   | `boolean`                                                           | No       | `false`               | When true, individual cell content scrolls vertically if it overflows the fixed cell height.                                                                                                                                                                                |
| testId                | `string`                                                            | No       | `-`                   | Value for the data-pw attribute on the table container, used for end-to-end testing selectors.                                                                                                                                                                              |
| caption               | `string`                                                            | No       | `-`                   | Accessible caption for screen readers. Rendered as a visually hidden `<caption>` element.                                                                                                                                                                                   |
| sortAscIcon           | `Snippet`                                                           | No       | Two-tone chevron pair | Custom snippet rendered for the ascending sort indicator. Default is the up/down chevron pair with the up half in `currentColor` and the down half in `--table-sort-inactive-color`.                                                                                        |
| sortDescIcon          | `Snippet`                                                           | No       | Two-tone chevron pair | Custom snippet rendered for the descending sort indicator. Default is the up/down chevron pair with the down half in `currentColor` and the up half in `--table-sort-inactive-color`.                                                                                       |
| sortDefaultIcon       | `Snippet`                                                           | No       | SVG chevron pair      | Custom snippet rendered for columns that haven't been sorted yet. Default is the solid up/down chevron pair in `--table-sort-inactive-color`.                                                                                                                               |
| cell                  | `Snippet<[JSONValue, number, number]>`                              | No       | `-`                   | Custom cell renderer. Receives `(value, rowIndex, colIndex)`. When not provided, cells render the raw value as text.                                                                                                                                                        |
| empty                 | `Snippet`                                                           | No       | `-`                   | Content to show when `tableData` is empty. Rendered inside a full-width table row.                                                                                                                                                                                          |
| classes               | `string`                                                            | No       | `-`                   | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                                                      |
| paginatorSlot         | `Snippet`                                                           | No       | `-`                   | Snippet rendered in a footer region below the table. Use for pagination controls, row count info, or any per-page UI.                                                                                                                                                       |
| getRowTestId          | `(row: JSONValue[], rowIndex: number) => string`                    | No       | `-`                   | Callback that returns a `data-pw` attribute value for each row `<tr>`. Useful for Playwright and other E2E test selectors.                                                                                                                                                  |
| getCellTestId         | `(row: JSONValue[], column: JSONValue, rowIndex: number) => string` | No       | `-`                   | Callback that returns a `data-pw` attribute value for each data cell `<td>`. Receives the full row, the cell value, and the row index.                                                                                                                                      |
| checkboxSelection     | `TableCheckboxSelectionConfig`                                      | No       | `-`                   | Opt-in checkbox row-selection column. See `TableCheckboxSelectionConfig` type below.                                                                                                                                                                                        |
| searchConfig          | `TableSearchConfig`                                                 | No       | `-`                   | Opt-in search bar rendered above the table. Client-side filtering is applied by default; pass `onSearchChange` to delegate filtering to the server. See `TableSearchConfig` type below.                                                                                     |
| columns               | `TableColumn[]`                                                     | No       | `-`                   | Keyed column model (preferred). When provided, `columns`/`rows` are normalized internally onto the same engine as `tableHeaders`/`tableData`, which are then ignored for that instance. See `TableColumn` type below and "Usage" above.                                     |
| rows                  | `TableRow[]`                                                        | No       | `-`                   | Keyed row data, addressed by `TableColumn.id`. Used with `columns`. Missing keys render as empty cells. See `TableRow` type below.                                                                                                                                          |
| sortMode              | `'client' \| 'server'`                                              | No       | `'client'`            | `'client'` sorts rows internally on header click. `'server'` keeps the header sort UI and `onSort` callback but skips the internal reorder — the consumer re-orders the data itself.                                                                                        |
| pagination            | `TablePaginationConfig`                                             | No       | `-`                   | Built-in footer paginator (range label, optional page-size selector, page controls). See `TablePaginationConfig` type below and "Built-in Pagination" above.                                                                                                                |
| toolbarSlot           | `Snippet<[{ selectedIds: Set<string> }]>`                           | No       | `-`                   | Bulk-action bar rendered above the table while the checkbox selection is non-empty. The library owns only placement — content is entirely consumer-rendered. See "Controlled Selection + Bulk Toolbar" above.                                                               |
| rowNumberColumn       | `boolean`                                                           | No       | `false`               | Prepends a sequential row-number column (1-based, pagination-aware).                                                                                                                                                                                                        |
| rowNumberLabel        | `string`                                                            | No       | `'#'`                 | Header label for the row-number column.                                                                                                                                                                                                                                     |
| summaryRowIndex       | `number \| null`                                                    | No       | `null`                | Index (into the consumer-supplied `rows`, pre-sort/pre-filter) of a summary/period-total row that renders with a distinct background (`--table-summary-row-background`). Matched by original position, so it survives sort/search/pagination.                               |
| headerTooltipIcon     | `Snippet`                                                           | No       | `-`                   | Icon snippet shown after each header label that has a `tooltip`. When set, the default underline affordance on those labels is dropped.                                                                                                                                     |
| headerTooltipPosition | `TooltipPosition`                                                   | No       | `'top'`               | Placement of every header tooltip bubble.                                                                                                                                                                                                                                   |
| usePortal             | `boolean`                                                           | No       | `false`               | When true, in-cell `Select` dropdowns and `Menu` popovers (`action-group`/`popup-menu` columns) are portaled to `document.body` and positioned `fixed`, so the table's own scroll/overflow container cannot clip them. Set on tables whose rows can sit near a scroll edge. |

## Snippets

| Snippet           | Parameters                                               | Description                                                                                |
| ----------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `sortAscIcon`     | none                                                     | Custom ascending sort icon, replaces the default SVG chevron.                              |
| `sortDescIcon`    | none                                                     | Custom descending sort icon, replaces the default SVG chevron.                             |
| `sortDefaultIcon` | none                                                     | Custom default (unsorted) sort icon, replaces the dimmed up/down chevron pair.             |
| `cell`            | `(value: JSONValue, rowIndex: number, colIndex: number)` | Custom cell renderer. When not provided, cells render the raw value as text.               |
| `empty`           | none                                                     | Content shown when `tableData` is empty. Rendered inside a full-width table row.           |
| `paginatorSlot`   | none                                                     | Content rendered in a footer region below the table (e.g. pagination controls, row count). |

## Events

| Event          | Type                                                                | Description                                                                                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onRowClick     | `(rowIndex: number, rowData: JSONValue[]) => void`                  | Fires when a data row is clicked. The row becomes focusable and keyboard-navigable when provided.                                                                                                                                                                         |
| onSort         | `(columnIndex: number, direction: SortDirection) => void`           | Fires after a column sort is toggled. `direction` is `'asc'` or `'desc'`.                                                                                                                                                                                                 |
| onCellChange   | `(rowIndex: number, colIndex: number, newValue: JSONValue) => void` | Accepted as a prop for type-checking at the call site, but **not called by Table internally**. Wire your handler directly inside the `cell` snippet instead — snippets run in consumer scope and already have your handler in closure. See "Editable Cells" recipe above. |
| onSearchChange | `(searchTerm: string) => void`                                      | When provided, disables built-in client-side filtering and calls this callback on every search input change. Use to delegate filtering to the server. Requires `searchConfig` to be set.                                                                                  |

## CSS Variables

Override these custom properties to theme the component.

### Title

| Variable                    | Default      | CSS Property | Description                                                                                                                                                                                                |
| --------------------------- | ------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--table-title-margin`      | `0 0 12px 0` | margin       | Margin around the table title.                                                                                                                                                                             |
| `--table-title-font-size`   | `18px`       | font-size    | Font size of the table title.                                                                                                                                                                              |
| `--table-title-font-weight` | `600`        | font-weight  | Font weight of the table title.                                                                                                                                                                            |
| `--table-title-color`       | `#111827`    | color        | Text color of the table title.                                                                                                                                                                             |
| `--table-title-font-family` | `-`          | font-family  | Font family of the table title.                                                                                                                                                                            |
| `--table-title-padding`     | `-`          | padding      | Padding of the table title.                                                                                                                                                                                |
| `--table-tile-font-size`    | `18px`       | font-size    | Secondary fallback for the title font size — `--table-title-font-size` falls back to this before the `18px` literal. Kept for backward compatibility; set `--table-title-font-size` directly for new code. |

### Container & Layout

| Variable                     | Default             | CSS Property          | Description                                                                                                |
| ---------------------------- | ------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------- |
| `--table-border`             | `1px solid #e5e7eb` | border                | Border of the table container.                                                                             |
| `--table-border-radius`      | `8px`               | border-radius         | Border radius of the table container.                                                                      |
| `--table-container-width`    | `100%`              | width                 | Width of the table container.                                                                              |
| `--table-container-height`   | `143px`             | height                | Height of the scrollable table container (when isTableScrollable).                                         |
| `--table-width`              | `100%`              | width                 | Width of the table element.                                                                                |
| `--table-border-collapse`    | `collapse`          | border-collapse       | Border collapse mode of the table.                                                                         |
| `--table-scroll-scrim-width` | `32px`              | width                 | Width of the fade-out gradient hint shown at the leading/trailing edge of a horizontally scrollable table. |
| `--table-scroll-scrim-color` | `#ffffff`           | background (gradient) | Color the scroll scrim fades from — set to match the table's background when it isn't white.               |

### Cell Grid

| Variable                     | Default             | CSS Property  | Description                                                                         |
| ---------------------------- | ------------------- | ------------- | ----------------------------------------------------------------------------------- |
| `--table-inner-border`       | `none`              | border        | Border of individual table cells. Set to `1px solid #ccc` for full grid.            |
| `--table-row-border`         | `1px solid #f3f4f6` | border-bottom | Border on the bottom of each data row. Subtle row separators.                       |
| `--table-row-last-border`    | `none`              | border-bottom | Border on the last data row. Set to match `--table-row-border` if needed.           |
| `--table-padding`            | `12px 16px`         | padding       | Padding inside table cells.                                                         |
| `--table-text-align`         | `left`              | text-align    | Text alignment inside table cells.                                                  |
| `--table-column-width`       | `-`                 | width         | Sets a uniform width for all table columns. Unset lets the table auto-size columns. |
| `--scrollable-column-height` | `20px`              | height        | Height of scrollable cell content (when isContentScrollable).                       |
| `--table-overflow-wrap`      | `-`                 | overflow-wrap | Overflow-wrap behavior for cell text.                                               |
| `--table-word-break`         | `-`                 | word-break    | Word-break behavior for cell text.                                                  |

### Header Cells

| Variable                           | Default   | CSS Property     | Description                                                                                       |
| ---------------------------------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `--table-header-background`        | `#f9fafb` | background-color | Background color of header cells. Falls back to `--table-header-border-bgcolor`.                  |
| `--table-header-font-size`         | `13px`    | font-size        | Font size of header cells.                                                                        |
| `--table-header-font-family`       | `-`       | font-family      | Font family of header cells.                                                                      |
| `--table-header-font-weight`       | `600`     | font-weight      | Font weight of header cells.                                                                      |
| `--table-header-letter-spacing`    | `0.02em`  | letter-spacing   | Letter spacing of header text.                                                                    |
| `--table-header-text-transform`    | `-`       | text-transform   | Text transform of header cells (e.g. `uppercase`, `capitalize`).                                  |
| `--table-header-color`             | `#6b7280` | color            | Text color of header cells. Falls back to `--table-header-font-color`.                            |
| `--table-header-sticky-top`        | `0`       | top              | Top offset for sticky headers. Use when a fixed navbar is above the table.                        |
| `--table-header-border`            | `-`       | border           | Border on header cells.                                                                           |
| `--table-header-border-bgcolor`    | `-`       | background-color | Fallback background for header cells when `--table-header-background` is unset.                   |
| `--table-header-font-color`        | `-`       | color            | Fallback text color for header cells when `--table-header-color` is unset.                        |
| `--table-header-justify`           | `-`       | justify-content  | Horizontal alignment of a header cell's label + sort-icon + tooltip-icon group.                   |
| `--table-header-tooltip-underline` | `-`       | text-decoration  | Underline style on header labels that carry a `tooltip`, when `headerTooltipIcon` is not set.     |
| `--table-filter-active-color`      | `-`       | color            | Header label/icon color while that column's `filter` dropdown is active (a selection is applied). |

### Data Cells

| Variable                                  | Default                                          | CSS Property     | Description                                                                                 |
| ----------------------------------------- | ------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------- |
| `--table-content-background`              | `-`                                              | background-color | Background color of data cells. Falls back to `--table-content-border-bgcolor`.             |
| `--table-content-font-size`               | `14px`                                           | font-size        | Font size of data cells.                                                                    |
| `--table-content-font-family`             | `-`                                              | font-family      | Font family of data cells.                                                                  |
| `--table-content-color`                   | `#111827`                                        | color            | Text color of data cells. Falls back to `--table-content-font-color`.                       |
| `--table-col-highlight-background`        | `#f3f9ff`                                        | background-color | Background of a `highlighted: true` column's body cells. Row hover/selection paint over it. |
| `--table-col-highlight-header-background` | falls back to `--table-col-highlight-background` | background-color | Background of a `highlighted: true` column's header cell.                                   |
| `--table-content-border-bgcolor`          | `-`                                              | background-color | Fallback background for data cells when `--table-content-background` is unset.              |
| `--table-content-font-color`              | `-`                                              | color            | Fallback text color for data cells when `--table-content-color` is unset.                   |

### Built-in Cells

| Variable                                    | Default                          | CSS Property     | Description                                                                                                                   |
| ------------------------------------------- | -------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `--table-cell-icon-size`                    | `16px`                           | width, height    | Size of icons in `icon-label` cells and icon-capable `button` cells.                                                          |
| `--table-cell-input-icon-size`              | `16px`                           | width, height    | Size of the leading icon inside an `input` cell (`iconUrl`).                                                                  |
| `--table-interactive-width`                 | `auto`                           | width            | Width of the wrapper around interactive built-in cells (`toggle`, `select`, `input`, `button`, `action-group`, `popup-menu`). |
| `--table-cell-icon-color`                   | `-`                              | color            | Color of icons in `icon-label` cells and icon-capable `button` cells.                                                         |
| `--table-cell-icon-button-color`            | `-`                              | color            | Color of an icon-only `button` cell's ghost control.                                                                          |
| `--table-cell-icon-button-hover-background` | `-`                              | background-color | Hover background of an icon-only `button` cell's ghost control.                                                               |
| `--table-cell-primary-color`                | `-`                              | color            | Ink of the primary line in `two-line-text` / `image-two-line-text` cells.                                                     |
| `--table-cell-primary-font-size`            | `-`                              | font-size        | Font size of the primary line in `two-line-text` / `image-two-line-text` cells.                                               |
| `--table-cell-secondary-color`              | `-`                              | color            | Ink of the secondary line in `two-line-text` / `image-two-line-text` cells.                                                   |
| `--table-cell-secondary-font-size`          | `-`                              | font-size        | Font size of the secondary line in `two-line-text` / `image-two-line-text` cells.                                             |
| `--table-cell-inline-gap`                   | `-`                              | gap              | Horizontal gap between a leading icon/thumbnail and its label/text in a built-in cell.                                        |
| `--table-cell-line-gap`                     | `-`                              | gap              | Vertical gap between the primary and secondary lines in a two-line cell.                                                      |
| `--table-cell-thumb-size`                   | `32px`                           | width, height    | Size of the `image-two-line-text` cell's thumbnail image.                                                                     |
| `--table-cell-thumb-radius`                 | falls back to `--radius` (`4px`) | border-radius    | Corner rounding of the thumbnail image.                                                                                       |
| `--table-cell-thumb-placeholder-background` | `-`                              | background-color | Background of the thumbnail placeholder shown when `imageUrl` is unset or fails to load.                                      |
| `--table-cell-thumb-placeholder-color`      | `-`                              | color            | Ink/icon color of the thumbnail placeholder.                                                                                  |
| `--table-cell-thumb-placeholder-font-size`  | `-`                              | font-size        | Font size of the thumbnail placeholder's fallback glyph.                                                                      |
| `--table-tag-array-gap`                     | `-`                              | gap              | Gap between chips in a `tag-array` cell.                                                                                      |
| `--table-link-color`                        | `-`                              | color            | Text color of a `link` cell's anchor.                                                                                         |
| `--table-link-decoration`                   | `-`                              | text-decoration  | Text decoration of a `link` cell's anchor.                                                                                    |
| `--table-link-copy-color`                   | `-`                              | color            | Color of a `link` cell's copy-to-clipboard icon.                                                                              |
| `--table-link-copy-hover-background`        | `-`                              | background-color | Hover background of a `link` cell's copy-to-clipboard icon.                                                                   |
| `--table-trend-up-color`                    | `-`                              | color            | Ink of a `compare` cell's trend row when the trend is positive.                                                               |
| `--table-trend-down-color`                  | `-`                              | color            | Ink of a `compare` cell's trend row when the trend is negative.                                                               |
| `--table-trend-flat-color`                  | `-`                              | color            | Ink of a `compare` cell's trend row when `trendPercent` is 0 or only `trendLabel` is set.                                     |
| `--table-trend-gap`                         | `-`                              | gap              | Gap between the trend arrow/icon and its text.                                                                                |
| `--table-trend-icon-size`                   | `-`                              | width, height    | Size of the trend up/down arrow icon.                                                                                         |

### Row Numbers

Style the leading sequence column shown when `rowNumberColumn` is true.

| Variable                       | Default | CSS Property | Description                                    |
| ------------------------------ | ------- | ------------ | ---------------------------------------------- |
| `--table-row-number-col-width` | `-`     | width        | Width of the row-number header and data cells. |
| `--table-row-number-align`     | `-`     | text-align   | Text alignment of the row number.              |
| `--table-row-number-color`     | `-`     | color        | Text color of the row number.                  |

### Bulk Toolbar

Style the bar rendered above the table by `toolbarSlot` while `checkboxSelection` is non-empty.

| Variable                        | Default                          | CSS Property     | Description                                                                                      |
| ------------------------------- | -------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| `--table-toolbar-background`    | `#f9fafb`                        | background-color | Background of the toolbar bar.                                                                   |
| `--table-toolbar-border`        | `1px solid #e5e7eb`              | border           | Border of the toolbar bar.                                                                       |
| `--table-toolbar-border-radius` | falls back to `--radius` (`4px`) | border-radius    | Corner rounding of the toolbar bar.                                                              |
| `--table-toolbar-padding`       | `8px 12px`                       | padding          | Inner padding of the toolbar bar.                                                                |
| `--table-toolbar-gap`           | `-`                              | gap              | Gap between the toolbar's own content and the table below it, or within `toolbarSlot`'s content. |
| `--table-toolbar-margin-bottom` | `-`                              | margin-bottom    | Space between the toolbar and the table.                                                         |

### Inline Search

A second search-input mode (`searchConfig.displayMode: 'inline'`) — a trigger icon that expands into a text field, styled independently of the toolbar Search Bar above.

| Variable                                | Default | CSS Property  | Description                                       |
| --------------------------------------- | ------- | ------------- | ------------------------------------------------- |
| `--table-inline-search-trigger-padding` | `-`     | padding       | Padding of the collapsed search trigger icon.     |
| `--table-inline-search-icon-color`      | `-`     | color         | Color of the search icon.                         |
| `--table-inline-search-icon-size`       | `-`     | width, height | Size of the search icon.                          |
| `--table-inline-search-input-width`     | `-`     | width         | Width of the expanded text field.                 |
| `--table-inline-search-gap`             | `-`     | gap           | Gap between the icon and the expanded text field. |
| `--table-inline-search-clear-color`     | `-`     | color         | Color of the clear (✕) button icon.               |
| `--table-inline-search-clear-icon-size` | `-`     | width, height | Size of the clear button icon.                    |
| `--table-inline-search-clear-padding`   | `-`     | padding       | Padding of the clear button's hit area.           |

### Rows

| Variable                          | Default                                    | CSS Property     | Description                                                                                                                           |
| --------------------------------- | ------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `--table-row-background`          | `-`                                        | background-color | Background color of data rows.                                                                                                        |
| `--table-row-alt-background`      | `-`                                        | background-color | Background of even-numbered rows for striped effect. Falls back to `--table-row-background`.                                          |
| `--table-row-hover-background`    | `-`                                        | background-color | Background color of data rows on hover.                                                                                               |
| `--table-row-selected-background` | `#eff6ff`                                  | background-color | Background of selected rows (when `checkboxSelection` is active). Applied to both the `<tr>` and its `<td>` children.                 |
| `--table-summary-row-background`  | falls back to `--table-content-background` | background-color | Background of the `summaryRowIndex` row. Applied to both the `<tr>` and its `<td>` children so it wins over a themed cell background. |
| `--table-focus-outline-color`     | `#3b82f6`                                  | outline          | Outline color for focused clickable rows and focused search inputs.                                                                   |

### Sort Controls

| Variable                               | Default            | CSS Property     | Description                                                                                                                                                                                    |
| -------------------------------------- | ------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--table-sort-button-color`            | `inherit`          | color            | Color of the sort button icon — paints the ACTIVE (sorted) chevron half via `currentColor`.                                                                                                    |
| `--table-sort-button-hover-color`      | `-`                | color            | Color of the sort button icon on hover.                                                                                                                                                        |
| `--table-sort-button-hover-background` | `rgba(0,0,0,0.05)` | background-color | Background of the sort button on hover.                                                                                                                                                        |
| `--table-sort-icon-size`               | `14px`             | width, height    | Size of the sort indicator SVG icons.                                                                                                                                                          |
| `--table-sort-active-color`            | `#1B85FF`          | color            | Color of the active (sorted) chevron half.                                                                                                                                                     |
| `--table-sort-inactive-color`          | `#C7C7C7`          | fill             | Fill of the inactive chevron halves: both halves when unsorted, and the non-sorted direction when a column is sorted.                                                                          |
| `--table-sort-hover-color`             | `#797979`          | fill             | Fill the inactive halves step to while the sort button is hovered.                                                                                                                             |
| `--table-sort-idle-opacity`            | `1`                | opacity          | Opacity of the default (unsorted) sort indicator. The design system draws sort glyphs solid — faintness comes from `--table-sort-inactive-color`; set below 1 only to restore the legacy fade. |
| `--table-sort-idle-hover-opacity`      | `1`                | opacity          | Opacity of the default sort indicator on hover (before a column is sorted).                                                                                                                    |

### Empty State

| Variable                | Default     | CSS Property | Description                             |
| ----------------------- | ----------- | ------------ | --------------------------------------- |
| `--table-empty-padding` | `32px 24px` | padding      | Padding around the empty state content. |
| `--table-empty-color`   | `#9ca3af`   | color        | Text color of the empty state content.  |

### Footer

| Variable                            | Default             | CSS Property     | Description                                                                                            |
| ----------------------------------- | ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| `--table-footer-border`             | `1px solid #e5e7eb` | border-top       | Top border of the footer region rendered by `paginatorSlot`.                                           |
| `--table-footer-padding`            | `8px 16px`          | padding          | Padding inside the footer region.                                                                      |
| `--table-footer-background`         | `transparent`       | background-color | Background color of the footer region.                                                                 |
| `--table-paginator-gap`             | `-`                 | gap              | Gap between the range text, page-size selector, and steppers in the built-in paginator (`pagination`). |
| `--table-paginator-range-color`     | `-`                 | color            | Text color of the "{from}-{to} of {total}" range summary.                                              |
| `--table-paginator-range-font-size` | `-`                 | font-size        | Font size of the range summary.                                                                        |
| `--table-paginator-size-width`      | `-`                 | width            | Width of the page-size `Select`.                                                                       |

### Checkbox Selection

These variables style the leading checkbox column that appears when `checkboxSelection` is set.

| Variable                                      | Default                          | CSS Property     | Description                                                                |
| --------------------------------------------- | -------------------------------- | ---------------- | -------------------------------------------------------------------------- |
| `--table-checkbox-col-width`                  | `44px`                           | width            | Width of the checkbox column header and data cells.                        |
| `--table-checkbox-col-padding`                | `12px 12px`                      | padding          | Padding of the checkbox column cells.                                      |
| `--table-checkbox-size`                       | `18px`                           | width, height    | Size (width and height) of the checkbox box element.                       |
| `--table-checkbox-border`                     | `2px solid #9ca3af`              | border           | Border of the unchecked checkbox.                                          |
| `--table-checkbox-border-radius`              | `3px`                            | border-radius    | Border radius of the checkbox box.                                         |
| `--table-checkbox-background`                 | `transparent`                    | background-color | Background of the unchecked checkbox.                                      |
| `--table-checkbox-hover-border-color`         | `#6b7280`                        | border-color     | Border color of the checkbox on hover (when not disabled).                 |
| `--table-checkbox-checked-background`         | `#2563eb`                        | background-color | Background of the checked checkbox.                                        |
| `--table-checkbox-checked-border-color`       | `#2563eb`                        | border-color     | Border color of the checked checkbox.                                      |
| `--table-checkbox-indeterminate-background`   | `#2563eb`                        | background-color | Background of the header checkbox in indeterminate (partial-select) state. |
| `--table-checkbox-indeterminate-border-color` | `#2563eb`                        | border-color     | Border color of the header checkbox in indeterminate state.                |
| `--table-checkbox-disabled-opacity`           | `0.4`                            | opacity          | Opacity of a disabled checkbox row.                                        |
| `--table-checkbox-focus-ring`                 | `0 0 0 3px rgba(59,130,246,0.3)` | box-shadow       | Focus ring shown on the checkbox element when focused via keyboard.        |
| `--table-checkbox-icon-size`                  | `12px`                           | width, height    | Size of the checkmark / minus SVG icon inside the checkbox box.            |
| `--table-checkbox-icon-color`                 | `#ffffff`                        | color            | Color of the checkmark / minus icon.                                       |

### Search Bar

These variables style the search input rendered above the table when `searchConfig` is set.

| Variable                                | Default             | CSS Property     | Description                                                     |
| --------------------------------------- | ------------------- | ---------------- | --------------------------------------------------------------- |
| `--table-search-gap`                    | `8px`               | gap              | Gap between the search icon, input, and clear button.           |
| `--table-search-padding`                | `8px 12px`          | padding          | Padding inside the search bar container.                        |
| `--table-search-border`                 | `1px solid #e5e7eb` | border           | Border of the search bar container.                             |
| `--table-search-border-radius`          | `8px`               | border-radius    | Border radius of the search bar container.                      |
| `--table-search-background`             | `#ffffff`           | background-color | Background of the search bar container.                         |
| `--table-search-margin-bottom`          | `8px`               | margin-bottom    | Margin below the search bar, separating it from the table.      |
| `--table-search-icon-color`             | `#9ca3af`           | color            | Color of the search magnifier icon.                             |
| `--table-search-icon-size`              | `16px`              | width, height    | Size of the search magnifier icon.                              |
| `--table-search-font-size`              | `14px`              | font-size        | Font size of the search input text.                             |
| `--table-search-color`                  | `#111827`           | color            | Text color of the search input.                                 |
| `--table-search-placeholder-color`      | `#9ca3af`           | color            | Placeholder text color of the search input.                     |
| `--table-search-focus-border-radius`    | `2px`               | border-radius    | Border radius of the focus-visible outline on the search input. |
| `--table-search-clear-color`            | `#6b7280`           | color            | Color of the clear (✕) button icon.                             |
| `--table-search-clear-hover-color`      | `#111827`           | color            | Color of the clear button icon on hover.                        |
| `--table-search-clear-hover-background` | `rgba(0,0,0,0.05)`  | background-color | Background of the clear button on hover.                        |
| `--table-search-clear-icon-size`        | `14px`              | width, height    | Size of the clear button icon.                                  |

## Type Reference

```typescript
type SortDirection = 'asc' | 'desc';

// JSONValue is imported from 'type-decoder'
// JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue }

type TableCheckboxSelectionConfig = {
  /** Activate the checkbox column. Defaults to true when the config object is present. */
  enabled?: boolean;
  /** 'single' allows at most one row selected at a time; 'multiple' (default) allows many. */
  selectionMode?: 'single' | 'multiple';
  /** Called whenever the selection set changes, receives the new set of selected row IDs. */
  onSelectionChange?: (selectedIds: Set<string>) => void;
  /** Derives a stable string ID from a row and its pre-sort index. Defaults to String(rowIndex). */
  getRowId?: (row: JSONValue[], rowIndex: number) => string;
  /** Rows whose IDs appear here render a disabled, non-interactive checkbox. */
  disabledRowIds?: Set<string>;
};

type TableSearchConfig = {
  /** Placeholder text for the search input. Default: 'Search…' */
  placeholder?: string;
  /** Restrict client-side filtering to these column indices. When omitted all columns are searched. */
  searchableColumnIndices?: number[];
  /** Value for the data-pw attribute on the search input element. */
  testId?: string;
};

// Helper aliases the two declarations below build on. All are exported from
// the package alongside TableRow/TableColumn.
type TableCellValue = JSONValue;

type TableColumnType =
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

// Per-column overrides for the data-pw suffixes built-in renderers emit.
type TableBuiltinCellTestIdSuffixes = {
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

type TableColumnFilterConfig = {
  options: Array<{ label: string; value: string }>;
  selectedValue?: string | null;
  onFilterChange?: (value: string | null) => void;
};

// Keyed row shape for the keyed column model: cell values addressed by
// TableColumn.id instead of array position.
type TableRow = Record<string, TableCellValue>;

type TableColumn = {
  id: string;
  label: string;
  /** Built-in renderer selection; defaults to 'text'. */
  type?: TableColumnType;
  /** Per-column sort opt-out; defaults to the table-wide `sortable` prop. */
  sortable?: boolean;
  testId?: string;
  /** Column-scoped renderer, receiving (row, displayIndex, originalIndex). Required when type is 'custom'. */
  cell?: Snippet<[TableRow, number, number]>;
  tooltip?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  maxWidth?: string;
  testIdSuffixes?: TableBuiltinCellTestIdSuffixes;
  /** Paints this column's header/body cells with the highlight wash. */
  highlighted?: boolean;
  filter?: TableColumnFilterConfig;
  /** Extracts the comparable value for client-side sorting (currency/date parsing stays in the consumer). */
  getSortValue?: (row: TableRow, rowIndex: number) => string | number | boolean;
  onToggle?: (rowIndex: number, checked: boolean, originalIndex: number) => void;
  onSelect?: (rowIndex: number, selectedId: string, originalIndex: number) => void;
  onInput?: (rowIndex: number, value: string, originalIndex: number) => void;
  onButtonClick?: (rowIndex: number, originalIndex: number) => void;
  onPrimaryAction?: (rowIndex: number, originalIndex: number) => void;
  onMenuAction?: (rowIndex: number, itemId: string, originalIndex: number) => void;
};

type TablePaginationConfig = {
  /** 'client' slices rows internally. 'server' leaves rows untouched and drives chrome from page/totalItems/hasMore. */
  mode?: 'client' | 'server';
  /** 1-indexed current page. Server mode: controlled by the consumer. */
  page?: number;
  /** Rows per page. Default 10. */
  pageSize?: number;
  /** Page-size selector options. Default [10, 25, 50, 100]; [] hides the selector. */
  pageSizeOptions?: number[];
  /** Total row count (server mode). Client mode derives it from the data. */
  totalItems?: number;
  hasMore?: boolean;
  /** Disables the paginator and page-size selector during a fetch. */
  isLoading?: boolean;
  /** Keeps the footer visible even on a single page. Default false. */
  showFooterOnSinglePage?: boolean;
  /** Range-summary-only footer; suppresses the page-size selector and steppers. Implies showFooterOnSinglePage. */
  hideControls?: boolean;
  hidePageSizeSelector?: boolean;
  hideSteppers?: boolean;
  /** Range text override; default "{from}-{to} of {total}". */
  rangeLabel?: (from: number, to: number, total: number) => string;
  /** Explicit data-pw for the range span; wins over the testId-derived default. */
  rangeTestId?: string;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onLoadMore?: () => void;
  testId?: string;
  prevButtonTestId?: string;
  nextButtonTestId?: string;
};
```

## Web Component

Tag: `<sui-table>`

```html
<sui-table table-title="Users" sortable sticky-header>
  <div slot="empty">No data found</div>
  <div slot="paginator-slot">
    <button>Prev</button>
    <span>Page 1</span>
    <button>Next</button>
  </div>
</sui-table>
```

### Slots

| Slot Name           | Maps to Snippet   | Description                                                    |
| ------------------- | ----------------- | -------------------------------------------------------------- |
| `empty`             | `empty`           | Content shown when the table has no data.                      |
| `sort-asc-icon`     | `sortAscIcon`     | Custom ascending sort icon.                                    |
| `sort-desc-icon`    | `sortDescIcon`    | Custom descending sort icon.                                   |
| `sort-default-icon` | `sortDefaultIcon` | Custom default (unsorted) sort icon.                           |
| `paginator-slot`    | `paginatorSlot`   | Footer content below the table, typically pagination controls. |

> **Note:** `tableHeaders`, `tableData`, and `sortableColumns` are arrays — set them via JavaScript properties. The `cell`, `getRowTestId`, and `getCellTestId` props are function-typed and only available via JavaScript.
