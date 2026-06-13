# Table

A sortable data table with clean, modern defaults. Supports column sorting (ascending/descending) for string, number, and boolean values. Features sticky headers, custom cell rendering via Svelte 5 snippets, row click interaction, and customizable sort icons. Table data is an array of arrays (rows x columns).

## Usage

```svelte
<script>
  import { Table } from '@juspay/svelte-ui-components';
</script>

<Table
  tableHeaders={['Name', 'Email', 'Role']}
  tableData={[
    ['Alice', 'alice@example.com', 'Admin'],
    ['Bob', 'bob@example.com', 'Editor']
  ]}
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

## Props

| Prop                | Type                                   | Required | Default          | Description                                                                                                                                                            |
| ------------------- | -------------------------------------- | -------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tableTitle          | `string \| null`                       | No       | `''`             | Optional title text displayed above the table.                                                                                                                         |
| tableHeaders        | `string[]`                             | No       | `[]`             | Array of column header strings. Each header is clickable for sorting (when sortable).                                                                                  |
| tableData           | `Array<JSONValue[]>`                   | No       | `[]`             | Array of row arrays. Each row is an array of cell values (string, number, or boolean). Columns correspond to tableHeaders by index.                                    |
| sortable            | `boolean`                              | No       | `true`           | When false, disables sorting on all columns. Sort buttons are hidden.                                                                                                  |
| sortableColumns     | `number[]`                             | No       | `-`              | Array of column indices that are sortable. When provided, only these columns show sort buttons. Other columns are non-sortable regardless of the `sortable` prop.      |
| stickyHeader        | `boolean`                              | No       | `false`          | When true, the header row sticks to the top during scroll. Works with `isTableScrollable` or any parent scroll container. Offset via `--table-header-sticky-top`.      |
| isTableScrollable   | `boolean`                              | No       | `false`          | When true, creates a bounded scroll area on the table container. Headers are automatically sticky. Use `--table-container-height` to set the scroll area height.       |
| isContentScrollable | `boolean`                              | No       | `false`          | When true, individual cell content scrolls vertically if it overflows the fixed cell height.                                                                           |
| testId              | `string`                               | No       | `-`              | Value for the data-pw attribute on the table container, used for end-to-end testing selectors.                                                                         |
| caption             | `string`                               | No       | `-`              | Accessible caption for screen readers. Rendered as a visually hidden `<caption>` element.                                                                              |
| sortAscIcon         | `Snippet`                              | No       | SVG chevron up   | Custom snippet rendered for the ascending sort indicator.                                                                                                              |
| sortDescIcon        | `Snippet`                              | No       | SVG chevron down | Custom snippet rendered for the descending sort indicator.                                                                                                             |
| sortDefaultIcon     | `Snippet`                              | No       | SVG chevron pair | Custom snippet rendered for columns that haven't been sorted yet. Default is a dimmed up/down chevron pair.                                                            |
| cell                | `Snippet<[JSONValue, number, number]>` | No       | `-`              | Custom cell renderer. Receives `(value, rowIndex, colIndex)`. When not provided, cells render the raw value as text.                                                   |
| empty               | `Snippet`                              | No       | `-`              | Content to show when `tableData` is empty. Rendered inside a full-width table row.                                                                                     |
| classes             | `string`                               | No       | `-`              | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Events

| Event      | Type                                                      | Description                                                                                       |
| ---------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| onRowClick | `(rowIndex: number, rowData: JSONValue[]) => void`        | Fires when a data row is clicked. The row becomes focusable and keyboard-navigable when provided. |
| onSort     | `(columnIndex: number, direction: SortDirection) => void` | Fires after a column sort is toggled. `direction` is `'asc'` or `'desc'`.                         |

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

| Variable                     | Default             | CSS Property  | Description                                                                                                |
| ---------------------------- | ------------------- | ------------- | ---------------------------------------------------------------------------------------------------------- |
| `--table-inner-border`       | `none`              | border        | Border of individual table cells. Set to `1px solid #ccc` for full grid.                                   |
| `--table-row-border`         | `1px solid #f3f4f6` | border-bottom | Border on the bottom of each data row. Subtle row separators.                                              |
| `--table-row-last-border`    | `none`              | border-bottom | Border on the last data row. Set to match `--table-row-border` if needed.                                  |
| `--table-padding`            | `12px 16px`         | padding       | Padding inside table cells.                                                                                |
| `--table-text-align`         | `left`              | text-align    | Text alignment inside table cells.                                                                         |
| `--table-column-width`       | `-`                 | width         | Sets a uniform width for all table columns. Unset lets the table auto-size columns.                        |
| `--scrollable-column-height` | `20px`              | height        | Height of scrollable cell content (when isContentScrollable).                                              |

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

| Variable                       | Default   | CSS Property     | Description                                                                                  |
| ------------------------------ | --------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `--table-row-background`       | `-`       | background-color | Background color of data rows.                                                               |
| `--table-row-alt-background`   | `-`       | background-color | Background of even-numbered rows for striped effect. Falls back to `--table-row-background`. |
| `--table-row-hover-background` | `-`       | background-color | Background color of data rows on hover.                                                      |
| `--table-focus-outline-color`  | `#3b82f6` | outline          | Outline color for focused clickable rows.                                                    |

### Sort Controls

| Variable                               | Default            | CSS Property     | Description                                       |
| -------------------------------------- | ------------------ | ---------------- | ------------------------------------------------- |
| `--table-sort-button-color`            | `inherit`          | color            | Color of the sort button icon.                    |
| `--table-sort-button-hover-color`      | `-`                | color            | Color of the sort button icon on hover.           |
| `--table-sort-button-hover-background` | `rgba(0,0,0,0.05)` | background-color | Background of the sort button on hover.           |
| `--table-sort-icon-size`               | `14px`             | width, height    | Size of the sort indicator SVG icons.             |
| `--table-sort-idle-opacity`            | `0.5`              | opacity          | Opacity of the default (unsorted) sort indicator. |
| `--table-sort-idle-hover-opacity`      | `0.85`             | opacity          | Opacity of the default sort indicator on hover (before a column is sorted). |

### Empty State

| Variable                | Default     | CSS Property | Description                             |
| ----------------------- | ----------- | ------------ | --------------------------------------- |
| `--table-empty-padding` | `32px 24px` | padding      | Padding around the empty state content. |
| `--table-empty-color`   | `#9ca3af`   | color        | Text color of the empty state content.  |

## Type Reference

```typescript
type SortDirection = 'asc' | 'desc';

// JSONValue is imported from 'type-decoder'
// JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue }
```

## Web Component

Tag: `<sui-table>`

```html
<sui-table table-title="Users" sortable sticky-header>
  <div slot="empty">No data found</div>
</sui-table>
```

### Slots

| Slot Name           | Maps to Snippet   | Description                               |
| ------------------- | ----------------- | ----------------------------------------- |
| `empty`             | `empty`           | Content shown when the table has no data. |
| `sort-asc-icon`     | `sortAscIcon`     | Custom ascending sort icon.               |
| `sort-desc-icon`    | `sortDescIcon`    | Custom descending sort icon.              |
| `sort-default-icon` | `sortDefaultIcon` | Custom default (unsorted) sort icon.      |

> **Note:** `tableHeaders`, `tableData`, and `sortableColumns` are arrays — set them via JavaScript properties. The `cell` snippet is parameterized and only available via JavaScript.
