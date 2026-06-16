# PieChart

A responsive SVG pie/donut chart with slice hover highlighting, custom labels, legend, and donut center content. When `innerRadius` is set, renders as a donut with optional content in the center hole via the `center` snippet. Supports a semi-circle (half-donut) layout via `semiCircle`, a tabular value legend via `legendShowValues`, and configurable percentage decimal places via `percentDecimals`.

## Usage

```svelte
<script>
  import { PieChart } from '@juspay/svelte-ui-components';

  const data = [
    { label: 'Chrome', value: 65 },
    { label: 'Safari', value: 19 },
    { label: 'Firefox', value: 8 },
    { label: 'Edge', value: 5 },
    { label: 'Other', value: 3 }
  ];
</script>

<PieChart {data} />
```

### Donut

```svelte
<PieChart {data} innerRadius={0.6} />
```

### Donut with Center Content

```svelte
<PieChart {data} innerRadius={0.6}>
  {#snippet center()}
    <div>
      <div style="font-size: 14px; color: #666;">Total</div>
      <div style="font-size: 24px; font-weight: 600;">100%</div>
    </div>
  {/snippet}
</PieChart>
```

### With Labels

```svelte
<PieChart {data} showLabels showValues labelPosition="outside" />
```

### Semi-Circle (Half-Donut)

```svelte
<PieChart {data} innerRadius={0.6} semiCircle />
```

The aspect ratio for the semi-circle layout defaults to `2:1` (width:height). Override it with the `aspectRatio` prop or with `--piechart-semi-aspect-ratio`:

```svelte
<PieChart {data} innerRadius={0.6} semiCircle aspectRatio={2.5} />
```

### With Value Legend

Renders a tabular legend below the chart listing each slice's formatted value and percentage.

```svelte
<PieChart {data} showLegend legendShowValues />
```

Use `percentDecimals` to control decimal places in the percentage column and on-arc labels:

```svelte
<!-- Show percentages as "12.34%" instead of "12%" -->
<PieChart {data} showLegend legendShowValues percentDecimals={2} />
```

### Custom Tooltip

```svelte
<PieChart {data}>
  {#snippet tooltipSnippet(slice, index)}
    <div style="background: #333; color: white; padding: 8px; border-radius: 4px;">
      <strong>{slice.label}</strong>: {slice.value}
    </div>
  {/snippet}
</PieChart>
```

## Props

| Prop             | Type                               | Required | Default      | Description                                                                                                |
| ---------------- | ---------------------------------- | -------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| data             | `PieChartSlice[]`                  | Yes      | `-`          | Array of `{label, value, color?}`. Each item becomes one slice. Slice angle is proportional to value.      |
| innerRadius      | `number`                           | No       | `0`          | Inner radius as a fraction of outer radius (0-1). `0` renders a pie; `>0` renders a donut.                 |
| padAngle         | `number`                           | No       | `0.02`       | Angular gap between slices in radians.                                                                     |
| showLabels       | `boolean`                          | No       | `false`      | Whether to render slice labels (either inside or outside depending on `labelPosition`).                    |
| showValues       | `boolean`                          | No       | `false`      | Whether to render the slice percentage as a label.                                                         |
| labelPosition    | `'inside' \| 'outside'`            | No       | `'outside'`  | Where to render slice labels.                                                                              |
| showLegend       | `boolean`                          | No       | `false`      | Whether to render a legend above the chart.                                                                |
| startAngle       | `number`                           | No       | `-Math.PI/2` | Starting angle in radians. Default starts at 12 o'clock position.                                          |
| aspectRatio      | `number`                           | No       | `1`          | Width-to-height ratio. `1` produces a circular container.                                                  |
| valueFormat      | `(value: number) => string`        | No       | abbreviated  | Formatter for slice values in the default tooltip.                                                         |
| tooltipSnippet   | `Snippet<[PieChartSlice, number]>` | No       | `-`          | Custom tooltip content. Receives the hovered slice and its index.                                          |
| center           | `Snippet`                          | No       | `-`          | Content rendered inside the donut hole (only when `innerRadius > 0`). Rendered via SVG `foreignObject`.    |
| empty            | `Snippet`                          | No       | `-`          | Content rendered when `data` is empty or all values are zero.                                              |
| semiCircle       | `boolean`                          | No       | `false`      | Render as a semi-circle (half-pie/donut). Arc spans the top 180°. Aspect ratio defaults to 2:1.            |
| legendShowValues | `boolean`                          | No       | `false`      | When `showLegend` is also true, renders a tabular legend with formatted values and percentages per slice.  |
| percentDecimals  | `number`                           | No       | `0`          | Decimal places used for percentage formatting in on-arc labels (`showValues`) and the legend value column. |
| testId           | `string`                           | No       | `-`          | Value for the data-pw attribute on the chart container.                                                    |
| classes          | `string`                           | No       | `-`          | CSS class string applied to the top-level element.                                                         |

## Events

| Event        | Type                                                               | Description                                           |
| ------------ | ------------------------------------------------------------------ | ----------------------------------------------------- |
| onsliceclick | `(event: { index: number; slice: PieChartSlice }) => void`         | Fires when a slice is clicked.                        |
| onslicehover | `(event: { index: number; slice: PieChartSlice } \| null) => void` | Fires on slice hover enter or leave. `null` on leave. |

## CSS Variables

In addition to the shared `--chart-*` variables (see BarChart docs), PieChart exposes:

| Variable                            | Default      | CSS Property  | Description                                                                                          |
| ----------------------------------- | ------------ | ------------- | ---------------------------------------------------------------------------------------------------- |
| `--piechart-stroke-color`           | `#fff`       | stroke        | Color of the stroke between slices.                                                                  |
| `--piechart-stroke-width`           | `2`          | stroke-width  | Width of the stroke between slices.                                                                  |
| `--piechart-hover-scale`            | `1.05`       | transform     | Scale factor applied to the hovered slice.                                                           |
| `--piechart-dimmed-opacity`         | `0.3`        | opacity       | Opacity of non-hovered slices when hovering.                                                         |
| `--piechart-label-color`            | `#333`       | fill          | Color of slice labels.                                                                               |
| `--piechart-label-font-size`        | `12px`       | font-size     | Font size of slice labels.                                                                           |
| `--piechart-semi-aspect-ratio`      | `2`          | —             | Aspect ratio (width÷height) used when `semiCircle` is true and `aspectRatio` prop is not set.        |
| `--piechart-legend-gap`             | `8px`        | gap           | Row gap in the `legendShowValues` table.                                                             |
| `--piechart-legend-padding`         | `12px 0 0 0` | padding       | Padding on the `legendShowValues` container.                                                         |
| `--piechart-legend-label-min-width` | `120px`      | min-width     | Minimum width of the label column in the `legendShowValues` table; aligns value columns across rows. |
| `--piechart-legend-value-min-width` | `60px`       | min-width     | Minimum width of the value column; combined with `text-align: right` for tabular alignment.          |
| `--piechart-legend-value-font-size` | `12px`       | font-size     | Font size of the value column text in the `legendShowValues` table.                                  |
| `--piechart-legend-value-color`     | `#333`       | color         | Text color of the value column in the `legendShowValues` table.                                      |
| `--piechart-legend-row-gap`         | `6px`        | gap           | Inline gap between swatch, label, and value within each legend row.                                  |
| `--piechart-legend-swatch-radius`   | `2px`        | border-radius | Border radius of the color swatch in each legend row.                                                |

## Utility: formatNumberIndian

`formatNumberIndian` is exported from the library root and formats a number in the Indian denomination system (Cr / L / K), useful as a `valueFormat` callback:

```svelte
<script>
  import { PieChart, formatNumberIndian } from '@juspay/svelte-ui-components';
</script>

<PieChart {data} valueFormat={formatNumberIndian} legendShowValues percentDecimals={1} />
```

Thresholds: ≥ 1 Cr (10 million) → `"1.5Cr"`, ≥ 1 L (100 thousand) → `"2.3L"`, ≥ 1 K (1 thousand) → `"4.7K"`, otherwise `toLocaleString('en-IN')`.

## Type Reference

```typescript
type PieChartSlice = {
  label: string;
  value: number;
  color?: string;
};
```
