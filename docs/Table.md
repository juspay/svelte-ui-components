# Table

A sortable data table with clickable column headers for sort toggling (ascending/descending). Supports string, number, and boolean sorting. The `isTableScrollable` prop enables vertical scrolling with sticky headers. The `isContentScrollable` prop enables per-cell content scrolling for long values. Table data is an array of arrays (rows × columns).

## Usage

```svelte
<script>
  import { Table } from '@juspay/svelte-ui-components';
</script>

<Table />
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| tableTitle | `string \| null` | No | `''` | Optional title text displayed above the table. |
| tableHeaders | `string[]` | No | `[]` | Array of column header strings. Each header is clickable for sorting. |
| tableData | `Array<JSONValue[]>` | No | `[]` | Array of row arrays. Each row is an array of cell values (string, number, or boolean). Columns correspond to tableHeaders by index. |
| isTableScrollable | `boolean` | No | `false` | When true, the table body scrolls vertically with sticky headers fixed at the top. |
| isContentScrollable | `boolean` | No | `false` | When true, individual cell content scrolls vertically if it overflows the fixed cell height. |

## CSS Variables

Override these custom properties to theme the component.

| Variable | Default | CSS Property | Description |
|----------|---------|-------------|-------------|
| `--table-title-margin` | `0px 0px 10px 0px` | margin | Margin around the table title. |
| `--table-tile-font-size` | `25px` | font-size | Font size of the table title. |
| `--table-title-font-family` | `-` | font-family | Font family of the table title. |
| `--table-title-padding` | `-` | padding | Padding of the table title. |
| `--table-border` | `0.5px solid #ccc` | border-top | Top border of the table. |
| `--table-container-width` | `400px` | width | Width of the scrollable table container. |
| `--table-container-height` | `143px` | height | Height of the scrollable table container (when isTableScrollable). |
| `--table-width` | `400px` | width | Width of the table element. |
| `--table-border-collapse` | `collapse` | border-collapse | Border collapse mode of the table. |
| `--table-inner-border` | `1px solid #ccc` | border | Border of table cells. |
| `--table-padding` | `8px` | padding | Padding inside table cells. |
| `--table-text-align` | `left` | text-align | Text alignment inside table cells. |
| `--table-column-width` | `100px` | width | Width of each table column. |
| `--scrollable-column-height` | `20px` | height | Height of scrollable cell content (when isContentScrollable). |
| `--table-header-border-bgcolor` | `beige` | background-color | Background color of table header cells. |
| `--table-header-font-size` | `-` | font-size | Font size of header cells. |
| `--table-header-font-family` | `-` | font-family | Font family of header cells. |
| `--table-header-font-color` | `-` | color | Text color of header cells. |
| `--table-content-border-bgcolor` | `-` | background-color | Background color of data cells. |
| `--table-content-font-size` | `-` | font-size | Font size of data cells. |
| `--table-content-font-family` | `-` | font-family | Font family of data cells. |
| `--table-content-font-color` | `-` | color | Text color of data cells. |
