# PieChart

A responsive SVG pie/donut chart with slice hover highlighting, custom labels, legend, and donut center content. When `innerRadius` is set, renders as a donut with optional content in the center hole via the `center` snippet.

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

| Prop           | Type                                 | Required | Default       | Description                                                                                                  |
| -------------- | ------------------------------------ | -------- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| data           | `PieChartSlice[]`                    | Yes      | `-`           | Array of `{label, value, color?}`. Each item becomes one slice. Slice angle is proportional to value.       |
| innerRadius    | `number`                             | No       | `0`           | Inner radius as a fraction of outer radius (0-1). `0` renders a pie; `>0` renders a donut.                  |
| padAngle       | `number`                             | No       | `0.02`        | Angular gap between slices in radians.                                                                       |
| showLabels     | `boolean`                            | No       | `false`       | Whether to render slice labels (either inside or outside depending on `labelPosition`).                     |
| showValues     | `boolean`                            | No       | `false`       | Whether to render the slice percentage as a label.                                                           |
| labelPosition  | `'inside' \| 'outside'`              | No       | `'outside'`   | Where to render slice labels.                                                                                |
| showLegend     | `boolean`                            | No       | `false`       | Whether to render a legend above the chart.                                                                  |
| startAngle     | `number`                             | No       | `-Math.PI/2`  | Starting angle in radians. Default starts at 12 o'clock position.                                            |
| aspectRatio    | `number`                             | No       | `1`           | Width-to-height ratio. `1` produces a circular container.                                                    |
| valueFormat    | `(value: number) => string`          | No       | abbreviated   | Formatter for slice values in the default tooltip.                                                           |
| tooltipSnippet | `Snippet<[PieChartSlice, number]>`   | No       | `-`           | Custom tooltip content. Receives the hovered slice and its index.                                            |
| center         | `Snippet`                            | No       | `-`           | Content rendered inside the donut hole (only when `innerRadius > 0`). Rendered via SVG `foreignObject`.      |
| empty          | `Snippet`                            | No       | `-`           | Content rendered when `data` is empty or all values are zero.                                                |
| testId         | `string`                             | No       | `-`           | Value for the data-pw attribute on the chart container.                                                      |
| classes        | `string`                             | No       | `-`           | CSS class string applied to the top-level element.                                                           |

## Events

| Event          | Type                                                      | Description                                                                             |
| -------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| onsliceclick   | `(event: { index: number; slice: PieChartSlice }) => void` | Fires when a slice is clicked.                                                         |
| onslicehover   | `(event: { index: number; slice: PieChartSlice } \| null) => void` | Fires on slice hover enter or leave. `null` on leave.                           |

## CSS Variables

In addition to the shared `--chart-*` variables (see BarChart docs), PieChart exposes:

| Variable                          | Default   | CSS Property | Description                                                    |
| --------------------------------- | --------- | ------------ | -------------------------------------------------------------- |
| `--piechart-stroke-color`         | `#fff`    | stroke       | Color of the stroke between slices.                            |
| `--piechart-stroke-width`         | `2`       | stroke-width | Width of the stroke between slices.                            |
| `--piechart-hover-scale`          | `1.05`    | transform    | Scale factor applied to the hovered slice.                     |
| `--piechart-dimmed-opacity`       | `0.3`     | opacity      | Opacity of non-hovered slices when hovering.                   |
| `--piechart-label-color`          | `#333`    | fill         | Color of slice labels.                                         |
| `--piechart-label-font-size`      | `12px`    | font-size    | Font size of slice labels.                                     |

## Type Reference

```typescript
type PieChartSlice = {
  label: string;
  value: number;
  color?: string;
};
```
