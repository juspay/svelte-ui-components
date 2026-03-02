# GridItem

A square grid cell with a header icon (top-right), centered main icon, and text label below. Clicking toggles a loading overlay animation (clip-path radial sweep). The `showLoader` state is bindable and toggles on each click. Good for payment method or app icon grids.

## Usage

```svelte
<script>
  import { GridItem } from '@juspay/svelte-ui-components';
</script>

<GridItem icon={'...'} text={'...'} />
```

## Props

| Prop       | Type             | Required | Default | Description                                                                                                                                                            |
| ---------- | ---------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| icon       | `string`         | Yes      | `''`    | URL of the main center icon image.                                                                                                                                     |
| text       | `string`         | Yes      | `''`    | Label text displayed below the icon.                                                                                                                                   |
| headerIcon | `string \| null` | No       | `''`    | URL of a small icon displayed in the top-right corner of the grid cell (e.g., an offer tag or badge).                                                                  |
| showLoader | `boolean`        | No       | `false` | Bindable. When true, shows a rotating clip-path animation overlay on the icon area. Toggles on each click.                                                             |
| classes    | `string`         | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Events

| Event     | Type                             | Description                                                                                   |
| --------- | -------------------------------- | --------------------------------------------------------------------------------------------- |
| onclick   | `(event: MouseEvent) => void`    | Fires when the grid cell is clicked. The showLoader state toggles before this callback fires. |
| onkeydown | `(event: KeyboardEvent) => void` | Fires when a key is pressed while the grid cell has focus.                                    |

## CSS Variables

Override these custom properties to theme the component.

| Variable                             | Default                | CSS Property     | Description                                                  |
| ------------------------------------ | ---------------------- | ---------------- | ------------------------------------------------------------ |
| `--grid-item-height`                 | `98px`                 | height           | Height of the grid cell.                                     |
| `--grid-item-width`                  | `66px`                 | width            | Width of the grid cell.                                      |
| `--grid-header-width`                | `100%`                 | width            | Width of the header icon row.                                |
| `--grid-header-justify-content`      | `end`                  | justify-content  | Horizontal alignment of the header icon.                     |
| `--grid-header-position`             | `absolute`             | position         | CSS position of the header icon.                             |
| `--grid-header-top`                  | `5px`                  | top              | Top offset of the header icon.                               |
| `--grid-header-z-index`              | `100`                  | z-index          | Z-index of the header icon.                                  |
| `--grid-item-header-icon-height`     | `16px`                 | height           | Height of the header icon image.                             |
| `--grid-item-header-icon-width`      | `auto`                 | width            | Width of the header icon image.                              |
| `--grid-item-header-icon-object-fit` | `contain`              | object-fit       | Object-fit of the header icon image.                         |
| `--grid-item-header-icon-z-index`    | `2`                    | z-index          | Z-index of the header icon image.                            |
| `--grid-item-body-height`            | `64px`                 | height           | Height of the main icon container.                           |
| `--grid-item-body-width`             | `64px`                 | width            | Width of the main icon container.                            |
| `--grid-item-background-color`       | `#faf9f9`              | background-color | Background color of the grid cell body.                      |
| `--grid-item-border`                 | `1px solid #eaeaea`    | border           | Border of the grid cell body.                                |
| `--grid-item-border-radius`          | `4px`                  | border-radius    | Corner rounding of the grid cell body.                       |
| `--grid-item-margin`                 | `8px 0 0 0`            | margin           | Margin of the grid cell body.                                |
| `--grid-item-icon-height`            | `32px`                 | height           | Height of the main center icon.                              |
| `--grid-item-icon-width`             | `auto`                 | width            | Width of the main center icon.                               |
| `--grid-item-icon-object-fit`        | `contain`              | object-fit       | Object-fit of the main center icon.                          |
| `--grid-item-icon-z-index`           | `100`                  | z-index          | Z-index of the main center icon.                             |
| `--grid-item-footer-margin`          | `8px 0 0 0`            | margin           | Margin above the text label.                                 |
| `--grid-item-font-size`              | `14px`                 | font-size        | Font size of the text label.                                 |
| `--grid-item-color`                  | `#333`                 | color            | Color of the text label.                                     |
| `--grid-item-footer-text-overflow`   | `ellipsis`             | text-overflow    | Text overflow style for the label (ellipsis for truncation). |
| `--grid-item-footer-white-space`     | `nowrap`               | white-space      | White space handling for the label.                          |
| `--grid-item-footer-overflow`        | `hidden`               | overflow         | Overflow behavior of the label.                              |
| `--grid-item-footer-width`           | `100%`                 | width            | Width of the label area.                                     |
| `--grid-item-footer-text-align`      | `center`               | text-align       | Text alignment of the label.                                 |
| `--grid-item-footer-height`          | `fit-content`          | height           | Height of the label area.                                    |
| `--animation-version`                | `32px solid #cbcccf66` | border           | Border style for the loading animation overlay.              |
