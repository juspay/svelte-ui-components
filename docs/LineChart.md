# LineChart

A responsive SVG line chart for visualizing trends over continuous data. Supports multiple series, four curve interpolations (linear, monotone, step, natural), an overlay hover tracker that finds the nearest point even when dots are hidden, crosshair vertical line, data point labels, legend, and custom tooltips.

## Usage

```svelte
<script>
  import { LineChart } from '@juspay/svelte-ui-components';

  const series = [
    {
      name: 'Revenue',
      data: [
        { x: 1, y: 30 },
        { x: 2, y: 45 },
        { x: 3, y: 38 },
        { x: 4, y: 52 },
        { x: 5, y: 48 }
      ]
    }
  ];
</script>

<LineChart {series} />
```

### Multi-Series with Legend

```svelte
<script>
  const series = [
    { name: 'Product A', data: [/* ... */] },
    { name: 'Product B', data: [/* ... */] }
  ];
</script>

<LineChart {series} showLegend />
```

### Curve Types

```svelte
<LineChart {series} curve="monotone" /> <!-- default, smooth monotone cubic -->
<LineChart {series} curve="linear" />   <!-- straight line segments -->
<LineChart {series} curve="step" />     <!-- horizontal-then-vertical steps -->
<LineChart {series} curve="natural" />  <!-- smooth natural cubic spline -->
```

### Data Labels

```svelte
<LineChart {series} showValues />
```

### Without Dots (Overlay Hover)

```svelte
<LineChart {series} showDots={false} />
```

Hovering anywhere over the plot area finds the nearest point and shows a crosshair + tooltip.

### Custom Tooltip

```svelte
<LineChart {series}>
  {#snippet tooltipSnippet(context)}
    <div style="background: #333; color: white; padding: 8px; border-radius: 4px;">
      <strong>X: {context.x}</strong>
      {#each context.points as p}
        <div style="color: {p.color}">{p.name}: {p.y}</div>
      {/each}
    </div>
  {/snippet}
</LineChart>
```

## Props

| Prop           | Type                                           | Required | Default      | Description                                                                                                                |
| -------------- | ---------------------------------------------- | -------- | ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| series         | `LineChartSeries[]`                            | Yes      | `-`          | Array of `{name, data, color?}`. Each series renders as a separate line.                                                   |
| curve          | `'linear' \| 'monotone' \| 'step' \| 'natural'` | No      | `'monotone'` | Interpolation between points.                                                                                              |
| showDots       | `boolean`                                      | No       | `true`       | Whether to render dots at each data point. Hover still works via overlay when `false`.                                     |
| showValues     | `boolean`                                      | No       | `false`      | Whether to render text labels with the y-value at each data point.                                                         |
| dotRadius      | `number`                                       | No       | `4`          | Radius of data point dots in pixels. Hovered dot is 1.5× this.                                                             |
| strokeWidth    | `number`                                       | No       | `2`          | Width of line strokes in pixels.                                                                                           |
| showGridlines  | `boolean`                                      | No       | `true`       | Whether to show dashed gridlines across the Y axis.                                                                        |
| showXAxis      | `boolean`                                      | No       | `true`       | Whether to render the X axis.                                                                                              |
| showYAxis      | `boolean`                                      | No       | `true`       | Whether to render the Y axis.                                                                                              |
| showLegend     | `boolean`                                      | No       | `false`      | Whether to render the legend. Only shown when there are multiple series.                                                   |
| xDomain        | `[number, number]`                             | No       | auto         | Fixed `[min, max]` for the X axis.                                                                                         |
| yDomain        | `[number, number]`                             | No       | auto         | Fixed `[min, max]` for the Y axis.                                                                                         |
| xAxisLabel     | `string`                                       | No       | `-`          | Text label below the X axis.                                                                                               |
| yAxisLabel     | `string`                                       | No       | `-`          | Text label beside the Y axis (rotated).                                                                                    |
| xTickFormat    | `(value: number \| string) => string`          | No       | abbreviated  | Formatter for X axis tick labels.                                                                                          |
| yTickFormat    | `(value: number \| string) => string`          | No       | abbreviated  | Formatter for Y axis tick labels.                                                                                          |
| aspectRatio    | `number`                                       | No       | `16/9`       | Width-to-height ratio.                                                                                                     |
| tooltipSnippet | `Snippet<[LineChartTooltipContext]>`           | No       | `-`          | Custom tooltip. Receives `{x, points: [{name, y, color, label?}]}` with values for all series at the hovered X.            |
| empty          | `Snippet`                                      | No       | `-`          | Content rendered when all series are empty.                                                                                |
| testId         | `string`                                       | No       | `-`          | Value for the data-pw attribute on the chart container.                                                                    |
| classes        | `string`                                       | No       | `-`          | CSS class string applied to the top-level element.                                                                         |

## Events

| Event          | Type                                                                                   | Description                                                        |
| -------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| onpointclick   | `(event: { seriesIndex: number; pointIndex: number; point: LineChartDataPoint }) => void` | Fires when the plot area is clicked with a hovered point.       |
| onpointhover   | `(event: { seriesIndex: number; pointIndex: number; point: LineChartDataPoint } \| null) => void` | Fires when hover moves to a new point or leaves. `null` on leave. |

## CSS Variables

In addition to the shared `--chart-*` variables (see BarChart docs), LineChart exposes:

| Variable                            | Default   | CSS Property     | Description                                               |
| ----------------------------------- | --------- | ---------------- | --------------------------------------------------------- |
| `--linechart-dimmed-opacity`        | `0.2`     | opacity          | Opacity of non-hovered series when hovering.              |
| `--linechart-hover-line-color`      | `#ccc`    | stroke           | Color of the vertical crosshair line.                     |
| `--linechart-hover-line-dash`       | `4 4`     | stroke-dasharray | Dash pattern of the crosshair.                            |
| `--linechart-value-color`           | `#333`    | fill             | Color of point value labels.                              |
| `--linechart-value-font-size`       | `11px`    | font-size        | Font size of point value labels.                          |

## Type Reference

```typescript
type LineChartDataPoint = {
  x: number;
  y: number;
  label?: string;
};

type LineChartSeries = {
  name: string;
  data: LineChartDataPoint[];
  color?: string;
};

type LineChartTooltipContext = {
  x: number;
  points: Array<{ name: string; y: number; color: string; label?: string }>;
};
```
