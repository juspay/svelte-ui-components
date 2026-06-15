# AreaChart

A responsive SVG area chart for visualizing volume under a trend. Supports multiple series with regular stacking, 100% (normalized) stacking, configurable fill opacity, data labels, hover overlay with crosshair, and custom tooltips. Shares the same curve types and axis options as LineChart.

## Usage

```svelte
<script>
  import { AreaChart } from '@juspay/svelte-ui-components';

  const series = [
    {
      name: 'Traffic',
      data: [
        { x: 1, y: 120 },
        { x: 2, y: 180 },
        { x: 3, y: 150 },
        { x: 4, y: 220 }
      ]
    }
  ];
</script>

<AreaChart {series} />
```

### Stacked Areas

```svelte
<AreaChart {series} stacked showLegend />
```

### 100% Stacked (Normalized)

```svelte
<AreaChart {series} stacked stackNormalize showLegend />
```

Each column is normalized so series values sum to 100%.

### Higher Fill Opacity

```svelte
<AreaChart {series} fillOpacity={0.6} />
```

### With Dots and Data Labels

```svelte
<AreaChart {series} showDots showValues />
```

### Custom Tooltip

```svelte
<AreaChart {series}>
  {#snippet tooltipSnippet(context)}
    <div style="background: #333; color: white; padding: 8px; border-radius: 4px;">
      <strong>X: {context.x}</strong>
      {#each context.points as p}
        <div style="color: {p.color}">{p.name}: {p.y}</div>
      {/each}
    </div>
  {/snippet}
</AreaChart>
```

## Props

| Prop           | Type                                           | Required | Default      | Description                                                                                                                |
| -------------- | ---------------------------------------------- | -------- | ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| series         | `AreaChartSeries[]`                            | Yes      | `-`          | Array of `{name, data, color?}`. Each series renders as a filled area.                                                     |
| curve          | `'linear' \| 'monotone' \| 'step' \| 'natural'` | No      | `'monotone'` | Interpolation between points.                                                                                              |
| stacked        | `boolean`                                      | No       | `false`      | Whether to stack series vertically. Bottom series provides the baseline for the next.                                      |
| stackNormalize | `boolean`                                      | No       | `false`      | When true with `stacked`, normalizes each column to 100%. Y axis becomes 0-100 percent scale.                              |
| fillOpacity    | `number`                                       | No       | `0.3`        | Opacity of area fill (0-1). Hovered series gets `+0.2` boost.                                                              |
| showDots       | `boolean`                                      | No       | `false`      | Whether to render dots at each data point.                                                                                 |
| showLine       | `boolean`                                      | No       | `true`       | Whether to draw the outline on top of the area fill.                                                                       |
| showValues     | `boolean`                                      | No       | `false`      | Whether to render text labels with the y-value at each data point.                                                         |
| strokeWidth    | `number`                                       | No       | `2`          | Width of the outline stroke in pixels.                                                                                     |
| showGridlines  | `boolean`                                      | No       | `true`       | Whether to show gridlines across the Y axis.                                                                               |
| showXAxis      | `boolean`                                      | No       | `true`       | Whether to render the X axis.                                                                                              |
| showYAxis      | `boolean`                                      | No       | `true`       | Whether to render the Y axis.                                                                                              |
| showLegend     | `boolean`                                      | No       | `false`      | Whether to render the legend. Only shown when there are multiple series.                                                   |
| xDomain        | `[number, number]`                             | No       | auto         | Fixed `[min, max]` for the X axis.                                                                                         |
| yDomain        | `[number, number]`                             | No       | auto         | Fixed `[min, max]` for the Y axis. Overrides auto-normalization in `stackNormalize` mode.                                  |
| xAxisLabel     | `string`                                       | No       | `-`          | Text label below the X axis.                                                                                               |
| yAxisLabel     | `string`                                       | No       | `-`          | Text label beside the Y axis.                                                                                              |
| xTickFormat    | `(value: number \| string) => string`          | No       | abbreviated  | Formatter for X axis tick labels.                                                                                          |
| yTickFormat    | `(value: number \| string) => string`          | No       | abbreviated  | Formatter for Y axis tick labels.                                                                                          |
| aspectRatio    | `number`                                       | No       | `16/9`       | Width-to-height ratio.                                                                                                     |
| tooltipSnippet | `Snippet<[AreaChartTooltipContext]>`           | No       | `-`          | Custom tooltip. Receives `{x, points: [{name, y, color, label?}]}` with values for all series at the hovered X.            |
| empty          | `Snippet`                                      | No       | `-`          | Content rendered when all series are empty.                                                                                |
| testId         | `string`                                       | No       | `-`          | Value for the data-pw attribute on the chart container.                                                                    |
| classes        | `string`                                       | No       | `-`          | CSS class string applied to the top-level element.                                                                         |

## Events

| Event          | Type                                                                                   | Description                                             |
| -------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| onpointclick   | `(event: { seriesIndex: number; pointIndex: number; point: AreaChartDataPoint }) => void` | Fires when the plot area is clicked.                 |
| onpointhover   | `(event: { seriesIndex: number; pointIndex: number; point: AreaChartDataPoint } \| null) => void` | Fires when hover moves or leaves. `null` on leave. |

## CSS Variables

In addition to the shared `--chart-*` variables (see BarChart docs), AreaChart exposes:

| Variable                            | Default   | CSS Property     | Description                                               |
| ----------------------------------- | --------- | ---------------- | --------------------------------------------------------- |
| `--areachart-dimmed-opacity`        | `0.1`     | opacity          | Opacity of non-hovered series when hovering.              |
| `--areachart-value-color`           | `#333`    | fill             | Color of point value labels.                              |
| `--areachart-value-font-size`       | `11px`    | font-size        | Font size of point value labels.                          |

## Type Reference

```typescript
type AreaChartDataPoint = {
  x: number;
  y: number;
  label?: string;
};

type AreaChartSeries = {
  name: string;
  data: AreaChartDataPoint[];
  color?: string;
};

type AreaChartTooltipContext = {
  x: number;
  points: Array<{ name: string; y: number; color: string; label?: string }>;
};
```
