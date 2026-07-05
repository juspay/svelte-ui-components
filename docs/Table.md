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

| `type`                | Cell value shape                                                               | Renders                                                                                       |
| --------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `tag`                 | `TableTagCellData` `{ text, classes?, dismissible?, testId? }`                 | a single Pill — the consumer owns tone→class mapping                                          |
| `text-tag`            | `TableTextTagCellData` `{ text, tag? }`                                        | text with an optional trailing Pill                                                           |
| `two-line-text`       | `TableTwoLineTextCellData` `{ text1?, text2? }`                                | primary line over secondary line                                                              |
| `icon-label`          | `TableIconLabelCellData` `{ icons?, label? }`                                  | leading image(s) plus a label                                                                 |
| `image-two-line-text` | `TableImageTwoLineTextCellData` `{ imageUrl?, text1?, text2? }`                | thumbnail (or placeholder) plus two lines                                                     |
| `tag-array`           | `TableTagArrayCellItem[]` `{ text, classes? }[]`                               | a wrapping row of Pills                                                                       |
| `avatar-stack`        | `TableAvatarStackCellData` `{ items: { id, label? }[], max? }`                 | initials chips capped at `max` (default 4) with a `+N` overflow                               |
| `compare`             | `TableCompareCellData` `{ primary?, comparison?, trendPercent?, trendLabel? }` | value over comparison with a colored trend row (↑ green / ↓ red / label)                      |
| `toggle`              | `TableToggleCellData` `{ checked?, ariaLabel?, testId? }`                      | a Toggle; `column.onToggle(rowIndex, checked)` receives the **new** state after the flip      |
| `link`                | `TableLinkCellData` `{ url, label?, copyable? }` (or a bare url string)        | external link with an optional copy-to-clipboard affordance                                   |

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

Keyed columns carry their own header behavior: `tooltip` (hover text on the label), `align` (`'left' | 'center' | 'right'`, applied to header and body cells), `maxWidth` (caps the column; overflowing scalar cells ellipsize with the full value on the native title tooltip), and `filter` (a header dropdown — Table renders the Menu mechanics, the consumer owns options/selection/filtering; re-selecting the active option clears to `null`):

```svelte
const columns: TableColumn[] = [
  { id: 'id', label: 'Order', maxWidth: '120px' },
  { id: 'name', label: 'Name', tooltip: 'Customer display name' },
  { id: 'amount', label: 'Amount', align: 'right' },
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

```svelte
<Table
  {columns}
  {rows}
  rowNumberColumn
  pagination={{ pageSize: 10, onPageChange: (page) => {}, testId: 'orders-paginator' }}
/>
```

`rowNumberColumn` prepends a 1-based, pagination-aware sequence column.

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

| Prop                | Type                                                                | Required | Default          | Description                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------- | -------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tableTitle          | `string \| null`                                                    | No       | `''`             | Optional title text displayed above the table.                                                                                                                                          |
| tableHeaders        | `string[]`                                                          | No       | `[]`             | Array of column header strings. Each header is clickable for sorting (when sortable).                                                                                                   |
| tableData           | `Array<JSONValue[]>`                                                | No       | `[]`             | Array of row arrays. Each row is an array of cell values (string, number, or boolean). Columns correspond to tableHeaders by index.                                                     |
| sortable            | `boolean`                                                           | No       | `true`           | When false, disables sorting on all columns. Sort buttons are hidden.                                                                                                                   |
| sortableColumns     | `number[]`                                                          | No       | `-`              | Array of column indices that are sortable. When provided, only these columns show sort buttons. Other columns are non-sortable regardless of the `sortable` prop.                       |
| stickyHeader        | `boolean`                                                           | No       | `false`          | When true, the header row sticks to the top during scroll. Works with `isTableScrollable` or any parent scroll container. Offset via `--table-header-sticky-top`.                       |
| isTableScrollable   | `boolean`                                                           | No       | `false`          | When true, creates a bounded scroll area on the table container. Headers are automatically sticky. Use `--table-container-height` to set the scroll area height.                        |
| isContentScrollable | `boolean`                                                           | No       | `false`          | When true, individual cell content scrolls vertically if it overflows the fixed cell height.                                                                                            |
| testId              | `string`                                                            | No       | `-`              | Value for the data-pw attribute on the table container, used for end-to-end testing selectors.                                                                                          |
| caption             | `string`                                                            | No       | `-`              | Accessible caption for screen readers. Rendered as a visually hidden `<caption>` element.                                                                                               |
| sortAscIcon         | `Snippet`                                                           | No       | SVG chevron up   | Custom snippet rendered for the ascending sort indicator.                                                                                                                               |
| sortDescIcon        | `Snippet`                                                           | No       | SVG chevron down | Custom snippet rendered for the descending sort indicator.                                                                                                                              |
| sortDefaultIcon     | `Snippet`                                                           | No       | SVG chevron pair | Custom snippet rendered for columns that haven't been sorted yet. Default is a dimmed up/down chevron pair.                                                                             |
| cell                | `Snippet<[JSONValue, number, number]>`                              | No       | `-`              | Custom cell renderer. Receives `(value, rowIndex, colIndex)`. When not provided, cells render the raw value as text.                                                                    |
| empty               | `Snippet`                                                           | No       | `-`              | Content to show when `tableData` is empty. Rendered inside a full-width table row.                                                                                                      |
| classes             | `string`                                                            | No       | `-`              | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                  |
| paginatorSlot       | `Snippet`                                                           | No       | `-`              | Snippet rendered in a footer region below the table. Use for pagination controls, row count info, or any per-page UI.                                                                   |
| getRowTestId        | `(row: JSONValue[], rowIndex: number) => string`                    | No       | `-`              | Callback that returns a `data-pw` attribute value for each row `<tr>`. Useful for Playwright and other E2E test selectors.                                                              |
| getCellTestId       | `(row: JSONValue[], column: JSONValue, rowIndex: number) => string` | No       | `-`              | Callback that returns a `data-pw` attribute value for each data cell `<td>`. Receives the full row, the cell value, and the row index.                                                  |
| checkboxSelection   | `TableCheckboxSelectionConfig`                                      | No       | `-`              | Opt-in checkbox row-selection column. See `TableCheckboxSelectionConfig` type below.                                                                                                    |
| searchConfig        | `TableSearchConfig`                                                 | No       | `-`              | Opt-in search bar rendered above the table. Client-side filtering is applied by default; pass `onSearchChange` to delegate filtering to the server. See `TableSearchConfig` type below. |

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

| Variable                    | Default      | CSS Property | Description                     |
| --------------------------- | ------------ | ------------ | ------------------------------- |
| `--table-title-margin`      | `0 0 12px 0` | margin       | Margin around the table title.  |
| `--table-title-font-size`   | `18px`       | font-size    | Font size of the table title.   |
| `--table-title-font-weight` | `600`        | font-weight  | Font weight of the table title. |
| `--table-title-color`       | `#111827`    | color        | Text color of the table title.  |
| `--table-title-font-family` | `-`          | font-family  | Font family of the table title. |
| `--table-title-padding`     | `-`          | padding      | Padding of the table title.     |

### Container & Layout

| Variable                   | Default             | CSS Property    | Description                                                        |
| -------------------------- | ------------------- | --------------- | ------------------------------------------------------------------ |
| `--table-border`           | `1px solid #e5e7eb` | border          | Border of the table container.                                     |
| `--table-border-radius`    | `8px`               | border-radius   | Border radius of the table container.                              |
| `--table-container-width`  | `100%`              | width           | Width of the table container.                                      |
| `--table-container-height` | `143px`             | height          | Height of the scrollable table container (when isTableScrollable). |
| `--table-width`            | `100%`              | width           | Width of the table element.                                        |
| `--table-border-collapse`  | `collapse`          | border-collapse | Border collapse mode of the table.                                 |

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

### Header Cells

| Variable                        | Default   | CSS Property     | Description                                                                      |
| ------------------------------- | --------- | ---------------- | -------------------------------------------------------------------------------- |
| `--table-header-background`     | `#f9fafb` | background-color | Background color of header cells. Falls back to `--table-header-border-bgcolor`. |
| `--table-header-font-size`      | `13px`    | font-size        | Font size of header cells.                                                       |
| `--table-header-font-family`    | `-`       | font-family      | Font family of header cells.                                                     |
| `--table-header-font-weight`    | `600`     | font-weight      | Font weight of header cells.                                                     |
| `--table-header-letter-spacing` | `0.02em`  | letter-spacing   | Letter spacing of header text.                                                   |
| `--table-header-text-transform` | `-`       | text-transform   | Text transform of header cells (e.g. `uppercase`, `capitalize`).                 |
| `--table-header-color`          | `#6b7280` | color            | Text color of header cells. Falls back to `--table-header-font-color`.           |
| `--table-header-sticky-top`     | `0`       | top              | Top offset for sticky headers. Use when a fixed navbar is above the table.       |

### Data Cells

| Variable                      | Default   | CSS Property     | Description                                                                     |
| ----------------------------- | --------- | ---------------- | ------------------------------------------------------------------------------- |
| `--table-content-background`  | `-`       | background-color | Background color of data cells. Falls back to `--table-content-border-bgcolor`. |
| `--table-content-font-size`   | `14px`    | font-size        | Font size of data cells.                                                        |
| `--table-content-font-family` | `-`       | font-family      | Font family of data cells.                                                      |
| `--table-content-color`       | `#111827` | color            | Text color of data cells. Falls back to `--table-content-font-color`.           |

### Rows

| Variable                          | Default   | CSS Property     | Description                                                                                                           |
| --------------------------------- | --------- | ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--table-row-background`          | `-`       | background-color | Background color of data rows.                                                                                        |
| `--table-row-alt-background`      | `-`       | background-color | Background of even-numbered rows for striped effect. Falls back to `--table-row-background`.                          |
| `--table-row-hover-background`    | `-`       | background-color | Background color of data rows on hover.                                                                               |
| `--table-row-selected-background` | `#eff6ff` | background-color | Background of selected rows (when `checkboxSelection` is active). Applied to both the `<tr>` and its `<td>` children. |
| `--table-focus-outline-color`     | `#3b82f6` | outline          | Outline color for focused clickable rows and focused search inputs.                                                   |

### Sort Controls

| Variable                               | Default            | CSS Property     | Description                                                                 |
| -------------------------------------- | ------------------ | ---------------- | --------------------------------------------------------------------------- |
| `--table-sort-button-color`            | `inherit`          | color            | Color of the sort button icon.                                              |
| `--table-sort-button-hover-color`      | `-`                | color            | Color of the sort button icon on hover.                                     |
| `--table-sort-button-hover-background` | `rgba(0,0,0,0.05)` | background-color | Background of the sort button on hover.                                     |
| `--table-sort-icon-size`               | `14px`             | width, height    | Size of the sort indicator SVG icons.                                       |
| `--table-sort-idle-opacity`            | `0.5`              | opacity          | Opacity of the default (unsorted) sort indicator.                           |
| `--table-sort-idle-hover-opacity`      | `0.85`             | opacity          | Opacity of the default sort indicator on hover (before a column is sorted). |

### Empty State

| Variable                | Default     | CSS Property | Description                             |
| ----------------------- | ----------- | ------------ | --------------------------------------- |
| `--table-empty-padding` | `32px 24px` | padding      | Padding around the empty state content. |
| `--table-empty-color`   | `#9ca3af`   | color        | Text color of the empty state content.  |

### Footer

| Variable                    | Default             | CSS Property     | Description                                                  |
| --------------------------- | ------------------- | ---------------- | ------------------------------------------------------------ |
| `--table-footer-border`     | `1px solid #e5e7eb` | border-top       | Top border of the footer region rendered by `paginatorSlot`. |
| `--table-footer-padding`    | `8px 16px`          | padding          | Padding inside the footer region.                            |
| `--table-footer-background` | `transparent`       | background-color | Background color of the footer region.                       |

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
