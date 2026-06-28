# ProportionBar

A horizontal stacked bar that visualises how a total is distributed across labelled segments. Renders proportional coloured bands in an SVG track with a default colour palette (overridable per segment) and an optional legend listing each segment's label and formatted value. Each band's width is derived from its `value` relative to the sum of all segments; negative and non-finite values are sanitized to zero so the rendered widths always stay within 0–100%. When the legend is hidden the SVG exposes the full breakdown as its accessible name (`role="img"` + `aria-label`), so screen-reader users still get the data. All visual properties are controlled via CSS custom properties.

## Usage

```svelte
<script>
  import { ProportionBar } from '@juspay/svelte-ui-components';

  const segments = [
    { label: 'UPI', value: 4820 },
    { label: 'Cards', value: 2150 },
    { label: 'Wallets', value: 870 },
    { label: 'NetBanking', value: 560 },
    { label: 'COD', value: 210 }
  ];
</script>

<ProportionBar {segments} />
```

### Custom Segment Colours

Omit `color` to fall back to the default palette, or set it per segment.

```svelte
<ProportionBar
  segments={[
    { label: 'Delivered', value: 7200, color: '#22c55e' },
    { label: 'In Transit', value: 1800, color: '#f59e0b' },
    { label: 'Cancelled', value: 540, color: '#ef4444' }
  ]}
/>
```

### Custom Value Format

Pass `valueFormat` `(value, percent) => string` to control the legend value column.

```svelte
<script>
  const currencyFormat = (value, percent) => `₹${(value / 100).toFixed(1)}L (${Math.round(percent)}%)`;
</script>

<ProportionBar segments={revenueSegments} valueFormat={currencyFormat} trackHeight="14px" />
```

### Without a Legend

When `showLegend={false}`, the legend list is removed and the SVG itself carries the full breakdown as its accessible name.

```svelte
<ProportionBar segments={paymentSegments} showLegend={false} />
```

### Themed Bar

```svelte
<div class="brand-bar">
  <ProportionBar segments={orderStatusSegments} trackHeight="6px" />
</div>

<style>
  .brand-bar {
    --proportion-bar-track-bg: #f3f4f6;
    --proportion-bar-track-border-radius: 2px;
    --proportion-bar-legend-label-color: #374151;
    --proportion-bar-legend-value-color: #111827;
  }
</style>
```

## Props

| Prop        | Type                                       | Required | Default | Description                                                                                                       |
| ----------- | ------------------------------------------ | -------- | ------- | --------------------------------------------------------------------------------------------------------------- |
| segments    | `ProportionBarSegment[]`                   | Yes      | `-`     | Segments whose values define the proportions. Each is `{ label: string; value: number; color?: string }`.       |
| showLegend  | `boolean`                                  | No       | `true`  | Whether to render the legend list below the bar.                                                                |
| valueFormat | `(value: number, percent: number) => string` | No    | `-`     | Custom formatter for the legend value column. Defaults to `"N (X%)"`.                                            |
| trackHeight | `string`                                   | No       | `-`     | Height of the bar track (e.g. `"8px"`). Also settable via `--proportion-bar-track-height`.                       |
| testId      | `string`                                   | No       | `-`     | Value for the `data-pw` attribute on the root element. Used for Playwright test selectors.                      |
| classes     | `string`                                   | No       | `-`     | Extra CSS class names appended to the root element. Useful for theming via CSS-variable overrides.              |

### ProportionBarSegment

| Field | Type     | Required | Description                                                       |
| ----- | -------- | -------- | ----------------------------------------------------------------- |
| label | `string` | Yes      | Display label for the segment.                                    |
| value | `number` | Yes      | Absolute value used to compute the proportion. Negative / non-finite values are treated as zero. |
| color | `string` | No       | Override fill colour. Falls back to the default palette by index. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                    | Default   | CSS Property  | Description                                  |
| ------------------------------------------- | --------- | ------------- | -------------------------------------------- |
| `--proportion-bar-gap`                      | `10px`    | gap           | Vertical gap between the track and legend.   |
| `--proportion-bar-width`                    | `100%`    | width         | Width of the component.                      |
| `--proportion-bar-track-height`             | `10px`    | height        | Height of the bar track.                     |
| `--proportion-bar-track-border-radius`      | `4px`     | border-radius | Corner radius of the track.                  |
| `--proportion-bar-track-bg`                 | `#f0f0f0` | background    | Background of the empty track.               |
| `--proportion-bar-legend-gap`               | `6px`     | gap           | Vertical gap between legend items.           |
| `--proportion-bar-legend-item-gap`          | `8px`     | gap           | Horizontal gap within a legend item.         |
| `--proportion-bar-swatch-size`              | `10px`    | width/height  | Size of a legend colour swatch.              |
| `--proportion-bar-swatch-border-radius`     | `2px`     | border-radius | Corner radius of a legend swatch.            |
| `--proportion-bar-legend-label-color`       | `#374151` | color         | Colour of legend labels.                     |
| `--proportion-bar-legend-value-color`       | `#111827` | color         | Colour of legend values.                     |

## Web Component

Tag: `<sui-proportion-bar>`

`segments` is an array and `valueFormat` is a function, so both are exposed as JS properties only (not HTML attributes):

```html
<sui-proportion-bar id="payments" track-height="12px"></sui-proportion-bar>

<script>
  const bar = document.querySelector('#payments');
  bar.segments = [
    { label: 'UPI', value: 4820 },
    { label: 'Cards', value: 2150 }
  ];
  bar.valueFormat = (value, percent) => `${value} (${percent}%)`;
</script>
```
