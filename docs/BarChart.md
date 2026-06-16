# BarChart

A responsive SVG bar chart for comparing categorical values. Supports vertical and horizontal orientations, single or multi-series data (grouped/stacked), value labels, custom colors per data point, hover tooltips, and click events. Zero external dependencies — built from pure SVG with CSS custom property theming.

## Usage

```svelte
<script>
  import { BarChart } from '@juspay/svelte-ui-components';

  const data = [
    { label: 'Jan', value: 4200 },
    { label: 'Feb', value: 3800 },
    { label: 'Mar', value: 5100 },
    { label: 'Apr', value: 4600 }
  ];
</script>

<BarChart {data} />
```

### Horizontal Orientation

```svelte
<BarChart {data} orientation="horizontal" />
```

### Value Labels

```svelte
<BarChart {data} showValues />
```

### Multi-Series (Grouped)

```svelte
<script>
  const series = [
    {
      name: 'Product A',
      data: [
        { label: 'Q1', value: 30 },
        { label: 'Q2', value: 50 }
      ]
    },
    {
      name: 'Product B',
      data: [
        { label: 'Q1', value: 20 },
        { label: 'Q2', value: 40 }
      ]
    }
  ];
</script>

<BarChart {series} groupMode="grouped" showLegend />
```

### Multi-Series (Stacked)

```svelte
<BarChart {series} groupMode="stacked" showLegend />
```

### Custom Tooltip

```svelte
<BarChart {data}>
  {#snippet tooltipSnippet(point, index)}
    <div style="background: #333; color: white; padding: 8px; border-radius: 4px;">
      <strong>{point.label}</strong>: ${point.value.toLocaleString()}
    </div>
  {/snippet}
</BarChart>
```

### Empty State

```svelte
<BarChart data={[]}>
  {#snippet empty()}
    <p>No data available.</p>
  {/snippet}
</BarChart>
```

## Props

| Prop           | Type                                   | Required | Default      | Description                                                                                                                                                                                                                                                                   |
| -------------- | -------------------------------------- | -------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| data           | `BarChartDataPoint[]`                  | No       | `-`          | Array of `{label, value, range?, color?}` for a single series. Provide either `data` or `series`. Each data point maps to one bar. `range` enables floating/range bars (`[low, high]`). `color` accepts a plain color string, a pattern fill, or a gradient fill (`BarFill`). |
| series         | `BarChartSeries[]`                     | No       | `-`          | Array of `{name, data, color?}` for multi-series charts. When provided, overrides `data`. `color` accepts a plain color string, a pattern fill, or a gradient fill (`BarFill`).                                                                                               |
| groupMode      | `'grouped' \| 'stacked'`               | No       | `'grouped'`  | Layout mode for multi-series. `grouped` places bars side-by-side within each category; `stacked` stacks them vertically.                                                                                                                                                      |
| orientation    | `'vertical' \| 'horizontal'`           | No       | `'vertical'` | Bar orientation.                                                                                                                                                                                                                                                              |
| showValues     | `boolean`                              | No       | `false`      | Whether to render the numeric value as a text label at the end of each bar. Disabled in stacked mode.                                                                                                                                                                         |
| showGridlines  | `boolean`                              | No       | `true`       | Whether to show dashed gridlines across the value axis.                                                                                                                                                                                                                       |
| showXAxis      | `boolean`                              | No       | `true`       | Whether to render the X axis (ticks, labels, axis line).                                                                                                                                                                                                                      |
| showYAxis      | `boolean`                              | No       | `true`       | Whether to render the Y axis.                                                                                                                                                                                                                                                 |
| showLegend     | `boolean`                              | No       | `false`      | Whether to render the legend above the chart. Only applies when `series` is provided.                                                                                                                                                                                         |
| barPadding     | `number`                               | No       | `0.2`        | Space between bars as a fraction of bar width (0 = no gaps, 0.5 = half-width gaps).                                                                                                                                                                                           |
| barRadius      | `number`                               | No       | `4`          | Corner radius of each bar in pixels.                                                                                                                                                                                                                                          |
| aspectRatio    | `number`                               | No       | `16/9`       | Width-to-height ratio for the chart. Used when parent height is not constrained.                                                                                                                                                                                              |
| xAxisLabel     | `string`                               | No       | `-`          | Text label shown below the X axis.                                                                                                                                                                                                                                            |
| yAxisLabel     | `string`                               | No       | `-`          | Text label shown beside the Y axis (rotated 90°).                                                                                                                                                                                                                             |
| yDomain        | `[number, number]`                     | No       | auto         | Fixed `[min, max]` for the value axis. When omitted, domain is derived from data with nice rounding.                                                                                                                                                                          |
| valueFormat    | `(value: number) => string`            | No       | abbreviated  | Formatter for bar values. Default abbreviates with K/M/B suffixes (e.g., 1500 → "1.5K").                                                                                                                                                                                      |
| stackNormalize | `boolean`                              | No       | `false`      | When `true` and `groupMode="stacked"`, normalises stacked values to 100% so bars represent proportions rather than absolutes. Appends `%` to value labels unless `valueFormat` is provided.                                                                                   |
| scrollable     | `boolean`                              | No       | `false`      | When `true`, wraps the chart in a horizontally-scrollable container. Use with `minBandWidth` to keep bars readable at small container widths.                                                                                                                                 |
| minBandWidth   | `number`                               | No       | `48`         | Minimum pixel width per category band when `scrollable` is `true`. The inner chart width expands until each band is at least this wide.                                                                                                                                       |
| tooltipSnippet | `Snippet<[BarChartDataPoint, number]>` | No       | `-`          | Custom tooltip content. Receives the hovered data point and its index. Replaces the default tooltip.                                                                                                                                                                          |
| empty          | `Snippet`                              | No       | `-`          | Content rendered when `data` is empty. When omitted, nothing renders for empty data.                                                                                                                                                                                          |
| renderOverlay  | `Snippet<[BarChartRenderContext]>`     | No       | `-`          | Escape-hatch snippet rendered inside the SVG transform group after all bars. Use for custom overlays, annotations, or drop-off indicators in SVG coordinate space. Receives `{ innerWidth, innerHeight, margin }`.                                                            |
| testId         | `string`                               | No       | `-`          | Value for the data-pw attribute on the chart container.                                                                                                                                                                                                                       |
| classes        | `string`                               | No       | `-`          | CSS class string applied to the top-level element. Useful for theming via class-scoped CSS variable overrides.                                                                                                                                                                |

## Events

| Event      | Type                                                                       | Description                                                           |
| ---------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| onbarclick | `(event: { index: number; dataPoint: BarChartDataPoint }) => void`         | Fires when a bar is clicked. Receives the bar's index and data point. |
| onbarhover | `(event: { index: number; dataPoint: BarChartDataPoint } \| null) => void` | Fires when the user hovers over or leaves a bar. `null` on leave.     |

## CSS Variables

Override these custom properties to theme the component.

| Variable                        | Default                     | CSS Property     | Description                                                                                                                           |
| ------------------------------- | --------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `--chart-background`            | `transparent`               | background       | Background color of the chart container.                                                                                              |
| `--chart-font-family`           | `inherit`                   | font-family      | Font family for all chart text.                                                                                                       |
| `--chart-transition-duration`   | `0.2s`                      | transition       | Duration of hover transitions.                                                                                                        |
| `--chart-axis-color`            | `#666`                      | stroke, fill     | Color of axis lines, tick marks, and tick labels.                                                                                     |
| `--chart-axis-stroke-width`     | `1`                         | stroke-width     | Width of axis lines and tick marks.                                                                                                   |
| `--chart-axis-font-size`        | `11px`                      | font-size        | Font size of tick labels.                                                                                                             |
| `--chart-axis-label-color`      | `#333`                      | fill             | Color of axis labels (xAxisLabel, yAxisLabel).                                                                                        |
| `--chart-axis-label-font-size`  | `12px`                      | font-size        | Font size of axis labels.                                                                                                             |
| `--chart-gridline-color`        | `#e0e0e0`                   | stroke           | Color of gridlines.                                                                                                                   |
| `--chart-gridline-opacity`      | `0.5`                       | stroke-opacity   | Opacity of gridlines.                                                                                                                 |
| `--chart-gridline-dash`         | `4 4`                       | stroke-dasharray | Dash pattern for gridlines.                                                                                                           |
| `--chart-tooltip-background`    | `rgba(0,0,0,0.85)`          | background       | Background of default tooltip.                                                                                                        |
| `--chart-tooltip-color`         | `#fff`                      | color            | Text color of default tooltip.                                                                                                        |
| `--chart-tooltip-font-size`     | `12px`                      | font-size        | Font size of tooltip content.                                                                                                         |
| `--chart-tooltip-padding`       | `8px 12px`                  | padding          | Inner padding of tooltip.                                                                                                             |
| `--chart-tooltip-border-radius` | `4px`                       | border-radius    | Border radius of tooltip.                                                                                                             |
| `--chart-tooltip-shadow`        | `0 2px 8px rgba(0,0,0,0.2)` | box-shadow       | Shadow on the tooltip.                                                                                                                |
| `--chart-legend-gap`            | `16px`                      | gap              | Space between legend items.                                                                                                           |
| `--chart-legend-font-size`      | `12px`                      | font-size        | Font size of legend labels.                                                                                                           |
| `--chart-legend-swatch-size`    | `12px`                      | width, height    | Size of color swatches in the legend.                                                                                                 |
| `--chart-legend-color`          | `#333`                      | color            | Color of legend text.                                                                                                                 |
| `--chart-empty-padding`         | `32px 24px`                 | padding          | Padding around the empty state content.                                                                                               |
| `--chart-empty-color`           | `#9ca3af`                   | color            | Text color of empty state default.                                                                                                    |
| `--barchart-bar-hover-opacity`  | `1`                         | opacity          | Opacity of the hovered bar.                                                                                                           |
| `--barchart-bar-dimmed-opacity` | `0.3`                       | opacity          | Opacity of non-hovered bars when hovering.                                                                                            |
| `--barchart-value-color`        | `#333`                      | fill             | Color of value labels.                                                                                                                |
| `--barchart-value-font-size`    | `11px`                      | font-size        | Font size of value labels.                                                                                                            |
| `--barchart-scroll-area-height` | `auto`                      | height           | Fixed height of the scroll area when `scrollable` is `true`. Useful to constrain tall charts while still allowing horizontal panning. |

## Type Reference

```typescript
type BarChartDataPoint = {
  label: string;
  value: number;
  color?: string;
};

type BarChartSeries = {
  name: string;
  data: BarChartDataPoint[];
  color?: string;
};
```
