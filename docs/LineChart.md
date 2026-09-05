# LineChart

A responsive SVG line chart for visualizing trends over continuous data. Supports multiple series, five curve interpolations (linear, monotone, spline, step, natural), gradient fill under the line, a `showArea` mode with per-gradient custom colours, an `xAxisCategories` prop that replaces numeric x indices with string labels, an imperative highlight API exposed via `onchartready` for external orchestration (e.g. voice narration sync), a declarative `highlightedIndex` prop, an overlay hover tracker that finds the nearest point even when dots are hidden, crosshair vertical line, data point labels, legend, and custom tooltips. Zero external dependencies — built from pure SVG with CSS custom property theming.

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
    {
      name: 'Product A',
      data: [
        /* ... */
      ]
    },
    {
      name: 'Product B',
      data: [
        /* ... */
      ]
    }
  ];
</script>

<LineChart {series} showLegend />
```

### Curve Types

```svelte
<LineChart {series} curve="monotone" />
<!-- default, smooth monotone cubic -->
<LineChart {series} curve="linear" />
<!-- straight line segments -->
<LineChart {series} curve="spline" />
<!-- alias for monotone -->
<LineChart {series} curve="step" />
<!-- horizontal-then-vertical steps -->
<LineChart {series} curve="natural" />
<!-- smooth natural cubic spline -->
```

### xAxisCategories — String Category Labels

Replace the raw numeric x values on the X axis with human-readable category names. The array is parallel to the x indices (index 0 maps to `x=1`, index 1 maps to `x=2`, and so on).

```svelte
<script>
  const monthSeries = [
    {
      name: 'Revenue',
      data: [
        { x: 1, y: 30 },
        { x: 2, y: 45 },
        { x: 3, y: 38 }
      ]
    }
  ];
  const months = ['Jan', 'Feb', 'Mar'];
</script>

<LineChart series={monthSeries} xAxisCategories={months} />
```

Category labels also appear in the default tooltip title instead of the raw numeric `x` value.

### showArea — Filled Area Under the Line

Fill the area below each line with a vertical gradient. By default the gradient is derived from the series colour (opaque at the top, transparent at the bottom). Supply `areaGradient` to use fully custom from/to colour stops.

```svelte
<!-- Default: uses series colour -->
<LineChart {series} showArea />

<!-- Custom gradient colours -->
<LineChart
  {series}
  showArea
  areaGradient={{ from: 'rgba(99,102,241,0.5)', to: 'rgba(99,102,241,0)' }}
/>
```

### Highlight Hook — onChartReady

Receive a `ChartHighlightAPI` after mount to drive point highlighting from an external orchestrator (e.g. animated step-through, voice narration sync, keyboard navigation):

```svelte
<script>
  import type { ChartHighlightAPI } from '@juspay/svelte-ui-components';

  let api;

  const onChartReady = (chartApi) => {
    api = chartApi;
  };

  // Later, to highlight the 3rd point:
  api?.highlight(2);

  // To clear:
  api?.highlight(null);

  // To read back the category labels:
  const labels = api?.getCategories(); // e.g. ['Jan', 'Feb', 'Mar', ...]
</script>

<LineChart {series} xAxisCategories={months} onchartready={onChartReady} />
```

### highlightedIndex — Declarative Prop

Highlight a point without a callback. Set `highlightedIndex` to a zero-based point index. The chart enlarges that dot, draws the crosshair, and dims all other dots. Set to `null` to clear.

```svelte
<!-- Highlight the 6th point (index 5) -->
<LineChart {series} highlightedIndex={5} />
```

### Data Labels

```svelte
<LineChart {series} showValues />
```

### Dashed Comparison Series

Set `dash` on a series to render it with a dashed stroke — the standard treatment for a comparison/previous-period line. `true` uses the default `'6 4'` pattern; pass a string for a custom SVG `stroke-dasharray`.

```svelte
<LineChart
  series={[
    { name: 'This week', data: current },
    { name: 'Last week', data: previous, color: '#A4CEFF', dash: true }
  ]}
/>
```

### Single Data Point

A series whose data resolves to a single finite point renders as a **flat horizontal line at that y across the full plot width** (design-system contract — a lone dot reads as a glitch). The point marker still renders at its true x, and hover/tooltip behave normally.

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

### Empty State

```svelte
<LineChart series={[]}>
  {#snippet empty()}
    <p>No data available.</p>
  {/snippet}
</LineChart>
```

### Sparse Series — Gap Points

A data point with a non-finite y (`NaN`) marks a **gap**: the line breaks around it and resumes
at the next finite point, instead of one poisoned SVG path (a single `NaN` coordinate makes the
browser drop everything after it, visually cutting the line mid-chart). Gap points render no
marker, no data label, are skipped by hover/crosshair/tooltip, and are excluded from the
auto-computed axis domains.

```svelte
<script>
  const series = [
    {
      name: 'Sales',
      // Jun 3 had no data — the line gaps over x=3 and resumes at x=4.
      data: [
        { x: 1, y: 120 },
        { x: 2, y: 180 },
        { x: 3, y: NaN },
        { x: 4, y: 150 }
      ]
    }
  ];
</script>

<LineChart {series} />
```

### X-Axis Tick Density

The x-axis renders at most **6 ticks** (per the design-system line-chart spec), thinning further
on narrow charts. Y-axis ticks were already capped at 6.

## Props

| Prop              | Type                                                        | Required | Default      | Description                                                                                                                                                                                                                      |
| ----------------- | ----------------------------------------------------------- | -------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| series            | `LineChartSeries[]`                                         | Yes      | `-`          | Array of `{name, data, color?}`. Each series renders as a separate line.                                                                                                                                                         |
| curve             | `'linear' \| 'monotone' \| 'spline' \| 'step' \| 'natural'` | No       | `'monotone'` | Interpolation between points. `'spline'` is an alias for `'monotone'`.                                                                                                                                                           |
| gradientFill      | `boolean`                                                   | No       | `false`      | Legacy gradient fill: renders a per-series gradient using the series colour, from `fillOpacity+0.3` at top to transparent. Superseded by `showArea` + `areaGradient` for new usage.                                              |
| fillOpacity       | `number`                                                    | No       | `0.3`        | Base opacity of the `gradientFill` area (0–1). Hovered series gets `+0.2` boost.                                                                                                                                                 |
| showArea          | `boolean`                                                   | No       | `false`      | Fill the area under each line. Uses `areaGradient` colours when provided; otherwise derives a vertical gradient from the series colour (0.35 opacity at top, transparent at bottom).                                             |
| areaGradient      | `{ from: string; to: string }`                              | No       | `-`          | Custom CSS colour stops for the `showArea` fill. `from` is the colour at the top (near the line), `to` is the colour at the baseline. Any valid CSS colour string is accepted.                                                   |
| showDots          | `boolean`                                                   | No       | `true`       | Whether to render dots at each data point. Hover still works via overlay when `false`.                                                                                                                                           |
| showValues        | `boolean`                                                   | No       | `false`      | Whether to render text labels with the y-value at each data point.                                                                                                                                                               |
| dotRadius         | `number`                                                    | No       | `4`          | Radius of data point dots in pixels. Hovered or highlighted dot is 1.5× this.                                                                                                                                                    |
| strokeWidth       | `number`                                                    | No       | `2`          | Width of line strokes in pixels.                                                                                                                                                                                                 |
| showGridlines     | `boolean`                                                   | No       | `true`       | Whether to show dashed gridlines across the Y axis.                                                                                                                                                                              |
| showXAxis         | `boolean`                                                   | No       | `true`       | Whether to render the X axis.                                                                                                                                                                                                    |
| showYAxis         | `boolean`                                                   | No       | `true`       | Whether to render the Y axis.                                                                                                                                                                                                    |
| showLegend        | `boolean`                                                   | No       | `false`      | Whether to render the legend. Only shown when there are multiple series.                                                                                                                                                         |
| xDomain           | `[number, number]`                                          | No       | auto         | Fixed `[min, max]` for the X axis.                                                                                                                                                                                               |
| yDomain           | `[number, number]`                                          | No       | auto         | Fixed `[min, max]` for the Y axis.                                                                                                                                                                                               |
| xAxisLabel        | `string`                                                    | No       | `-`          | Text label below the X axis.                                                                                                                                                                                                     |
| yAxisLabel        | `string`                                                    | No       | `-`          | Text label beside the Y axis (rotated).                                                                                                                                                                                          |
| xAxisCategories   | `string[]`                                                  | No       | `-`          | String category labels, one per x-index (parallel array). Index 0 maps to `x=1`, index 1 to `x=2`, and so on. When provided, these labels replace raw numeric x values on tick labels, the tooltip title, and `getCategories()`. |
| xTickFormat       | `(value: number \| string) => string`                       | No       | abbreviated  | Formatter for X axis tick labels. When provided, overrides the `xAxisCategories` tick formatter.                                                                                                                                 |
| yTickFormat       | `(value: number \| string) => string`                       | No       | abbreviated  | Formatter for Y axis tick labels.                                                                                                                                                                                                |
| yIntegerTicks     | `boolean`                                                   | No       | `false`      | Snap Y-axis ticks to whole numbers. Use for discrete count metrics (orders, sessions) where a small domain would otherwise produce fractional ticks (0, 0.5, 1, 1.5, 2).                                                         |
| aspectRatio       | `number`                                                    | No       | `16/9`       | Width-to-height ratio.                                                                                                                                                                                                           |
| minHeight         | `number`                                                    | No       | `-`          | Minimum chart height in pixels, regardless of computed aspect-ratio height.                                                                                                                                                      |
| maxHeight         | `number`                                                    | No       | `-`          | Maximum chart height in pixels, regardless of computed aspect-ratio height.                                                                                                                                                      |
| highlightedIndex  | `number \| null`                                            | No       | `null`       | Zero-based point index to highlight declaratively. Enlarges the dot at that index, draws the crosshair, and dims all other dots. Set `null` to clear.                                                                            |
| tooltipSnippet    | `Snippet<[LineChartTooltipContext]>`                        | No       | `-`          | Custom tooltip. Receives `{x, points: [{name, y, color, label?}]}` with values for all series at the hovered X.                                                                                                                  |
| empty             | `Snippet`                                                   | No       | `-`          | Content rendered when all series are empty.                                                                                                                                                                                      |
| testId            | `string`                                                    | No       | `-`          | Value for the data-pw attribute on the chart container.                                                                                                                                                                          |
| classes           | `string`                                                    | No       | `-`          | CSS class string applied to the top-level element.                                                                                                                                                                               |
| sharedTooltip     | `boolean`                                                   | No       | auto         | One anchored tooltip listing every visible series at the hovered x position. Defaults to `true` for multi-series charts, `false` for single-series.                                                                              |
| interactiveLegend | `boolean`                                                   | No       | `false`      | Legend items become click/keyboard toggles for series visibility; hidden series are removed from the plot and the scales rescale to the remaining data.                                                                          |
| hideLegendBelow   | `number`                                                    | No       | `360`        | Hide the legend when the measured chart width is below this pixel value; `0` disables the behavior.                                                                                                                              |
| tooltipPortal     | `boolean`                                                   | No       | `false`      | Render the tooltip into `document.body` (`position: fixed`) so scroll/overflow ancestors never clip it.                                                                                                                          |

## Events

| Event        | Type                                                                                              | Description                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| onpointclick | `(event: { seriesIndex: number; pointIndex: number; point: LineChartDataPoint }) => void`         | Fires when the plot area is clicked with a hovered point.                                                              |
| onpointhover | `(event: { seriesIndex: number; pointIndex: number; point: LineChartDataPoint } \| null) => void` | Fires when hover moves to a new point or leaves the chart. `null` on leave.                                            |
| onchartready | `(api: ChartHighlightAPI) => void`                                                                | Called once after mount. Provides a `ChartHighlightAPI` for imperative `highlight(index\|null)` and `getCategories()`. |

## CSS Variables

In addition to the shared `--chart-*` variables (see BarChart docs), LineChart exposes:

| Variable                           | Default | CSS Property     | Description                                                  |
| ---------------------------------- | ------- | ---------------- | ------------------------------------------------------------ |
| `--linechart-dimmed-opacity`       | `0.2`   | opacity          | Opacity of non-hovered / non-highlighted series/points.      |
| `--linechart-hover-line-color`     | `#ccc`  | stroke           | Color of the vertical crosshair line (hover and highlight).  |
| `--linechart-hover-line-dash`      | `4 4`   | stroke-dasharray | Dash pattern of the crosshair.                               |
| `--linechart-value-color`          | `#333`  | fill             | Color of point value labels.                                 |
| `--linechart-value-font-size`      | `11px`  | font-size        | Font size of point value labels.                             |
| `--linechart-highlight-ring-color` | `#fff`  | stroke           | Ring (outline) stroke colour of an actively highlighted dot. |
| `--linechart-highlight-ring-width` | `2.5`   | stroke-width     | Ring stroke width of an actively highlighted dot.            |

## Dark mode

Chart colors resolve through CSS `light-dark()`. Set `color-scheme` on the chart's ancestor (or `:root`) so the correct side is chosen:

```css
:root {
  color-scheme: light;
}
[data-theme='dark'] {
  color-scheme: dark;
}
```

Every `--chart-*` / component token can still be overridden per theme; overrides always win over the built-in `light-dark()` fallbacks.

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
  /** Dashed stroke: true = '6 4', string = custom stroke-dasharray. */
  dash?: boolean | string;
};

type LineChartTooltipContext = {
  x: number;
  points: Array<{ name: string; y: number; color: string; label?: string }>;
};

type LineChartAreaGradient = {
  /** Colour at the top of the gradient (closest to the line). */
  from: string;
  /** Colour at the bottom of the gradient (at the baseline). */
  to: string;
};

// From @juspay/svelte-ui-components — also used by BarChart, DonutChart
type ChartHighlightAPI = {
  highlight: (index: number | null) => void;
  getCategories: () => string[];
  type: 'bar-chart' | 'line-chart' | 'donut-chart';
};
```

## Web Component

```html
<sui-line-chart
  series='[{"name":"Revenue","data":[{"x":1,"y":30},{"x":2,"y":45}]}]'
  show-area="true"
  show-dots="true"
  show-legend="false"
  test-id="my-line-chart"
></sui-line-chart>
```

Object/array props (`series`, `xDomain`, `yDomain`, `xAxisCategories`, `areaGradient`, callback props) must be set via JavaScript property assignment on the element, not as HTML attributes.
