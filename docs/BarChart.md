# BarChart

A responsive SVG bar chart for comparing categorical values. Supports vertical and horizontal orientations, single or multi-series data (grouped/stacked), value labels, custom colors per data point, hover tooltips, click events, declarative and imperative bar highlighting, first-point normalisation across series, top-N clipping with overflow aggregation, and a graphics-free legend/label-only rendering mode. Zero external dependencies — built from pure SVG with CSS custom property theming.

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

### Declarative Highlight

Set `highlightedIndex` to a zero-based category index to emphasise that bar and dim the others. Set to `null` to clear.

```svelte
<script>
  let highlighted = $state(2);
</script>

<BarChart {data} highlightedIndex={highlighted} />
<button onclick={() => (highlighted = null)}>Clear highlight</button>
```

### Imperative Highlight via `onchartready`

Receive a `ChartHighlightAPI` handle on mount to drive highlighting from outside the chart (e.g. synchronised with a voice narrator or a sibling component). The handle's `type` is always `'bar-chart'`.

```svelte
<script>
  import type { ChartHighlightAPI } from '@juspay/svelte-ui-components';

  let chartApi: ChartHighlightAPI | null = null;

  const handleReady = (api: ChartHighlightAPI) => {
    chartApi = api;
  };

  const highlightSecond = () => chartApi?.highlight(1);
  const clear = () => chartApi?.highlight(null);
</script>

<BarChart {data} onchartready={handleReady} />
<button onclick={highlightSecond}>Highlight Feb</button>
<button onclick={clear}>Clear</button>
```

### Normalise to First Point

Each series' values are expressed as a percentage of its own first data point (baseline = 100). Useful when comparing relative growth across series with very different starting magnitudes.

```svelte
<BarChart {series} normaliseToFirstPoint groupMode="grouped" showLegend showValues />
```

### Top-N Clipping

Show only the top `topN` bars individually and aggregate the remainder into a single overflow bar.

```svelte
<BarChart {data} topN={5} overflowLabel="Everything else" showValues />
```

### Hide Bar Graphics

Render axes, gridlines, and legend without drawing any bar rectangles — useful for label-only or legend-only companion views.

```svelte
<BarChart {data} hideBarGraphics showXAxis showYAxis />
```

## Props

| Prop                  | Type                                   | Required | Default      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------- | -------------------------------------- | -------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| data                  | `BarChartDataPoint[]`                  | No       | `-`          | Array of `{label, value, range?, color?, valueLabel?}` for a single series. Provide either `data` or `series`. Each data point maps to one bar. `range` enables floating/range bars (`[low, high]`). `color` accepts a plain color string, a pattern fill, or a gradient fill (`BarFill`). A non-empty `valueLabel` renders verbatim as that bar's value label, overriding the default `valueFormat(value)` output; an empty string (`''`) is treated the same as an absent field and falls back to `valueFormat(value)`. |
| series                | `BarChartSeries[]`                     | No       | `-`          | Array of `{name, data, color?}` for multi-series charts. When provided, overrides `data`. `color` accepts a plain color string, a pattern fill, or a gradient fill (`BarFill`).                                                                                                                                                                                                                                                                                                                                           |
| groupMode             | `'grouped' \| 'stacked'`               | No       | `'grouped'`  | Layout mode for multi-series. `grouped` places bars side-by-side; `stacked` stacks them.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| orientation           | `'vertical' \| 'horizontal'`           | No       | `'vertical'` | Bar orientation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| showValues            | `boolean`                              | No       | `false`      | Whether to render the numeric value as a text label at the end of each bar. Disabled in stacked mode.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| showGridlines         | `boolean`                              | No       | `true`       | Whether to show dashed gridlines across the value axis.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| showXAxis             | `boolean`                              | No       | `true`       | Whether to render the X axis (ticks, labels, axis line).                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| showYAxis             | `boolean`                              | No       | `true`       | Whether to render the Y axis.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| showLegend            | `boolean`                              | No       | `false`      | Whether to render the legend above the chart. Only applies when `series` is provided.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| barPadding            | `number`                               | No       | `0.2`        | Space between bars as a fraction of bar width (0 = no gaps, 0.5 = half-width gaps).                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| barRadius             | `number`                               | No       | `4`          | Corner radius of each bar in pixels.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| aspectRatio           | `number`                               | No       | `16/9`       | Width-to-height ratio for the chart.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| xAxisLabel            | `string`                               | No       | `-`          | Text label shown below the X axis.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| yAxisLabel            | `string`                               | No       | `-`          | Text label shown beside the Y axis (rotated 90°).                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| yDomain               | `[number, number]`                     | No       | auto         | Fixed `[min, max]` for the value axis.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| valueFormat           | `(value: number) => string`            | No       | abbreviated  | Formatter for bar values. Default abbreviates with K/M/B suffixes.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| stackNormalize        | `boolean`                              | No       | `false`      | Normalises stacked values to 100%. Applies only when `groupMode="stacked"`. Appends `%` to value labels unless `valueFormat` is supplied.                                                                                                                                                                                                                                                                                                                                                                                 |
| scrollable            | `boolean`                              | No       | `false`      | Wraps the chart in a horizontally-scrollable container. Use with `minBandWidth` to keep bars readable.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| minBandWidth          | `number`                               | No       | `48`         | Minimum pixel width per category band when `scrollable` is `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| marginX               | `number`                               | No       | auto         | Fixed horizontal inset (px) between the svg edges and the plot, overriding the auto layout's left/right margins. Use for edge-to-edge funnels where tick-label padding leaves dead space beside the first/last bars; short category labels recommended (long edge labels may clip).                                                                                                                                                                                                                                       |
| onchartready          | `(api: ChartHighlightAPI) => void`     | No       | `-`          | Called once on mount with an imperative highlight handle. Use `api.highlight(index)` to emphasise a bar; `api.highlight(null)` clears. `api.getCategories()` returns the ordered label list. `api.type` is always `'bar-chart'`.                                                                                                                                                                                                                                                                                          |
| highlightedIndex      | `number \| null`                       | No       | `null`       | Declarative highlight: the bar at this zero-based index is shown at full opacity; all others are dimmed. Overrides any index set via `onchartready`. Set to `null` to show all bars normally.                                                                                                                                                                                                                                                                                                                             |
| normaliseToFirstPoint | `boolean`                              | No       | `false`      | When `true`, each series' values are expressed as a percentage of that series' own first data point (baseline = 100). Series whose first point is zero are left unchanged.                                                                                                                                                                                                                                                                                                                                                |
| topN                  | `number`                               | No       | `-`          | Keep only the top `topN` bars by value (descending). The remaining bars are summed into one overflow bar labelled by `overflowLabel`. Has no effect when the chart already has `topN` or fewer bars.                                                                                                                                                                                                                                                                                                                      |
| overflowLabel         | `string`                               | No       | `"Other"`    | Label for the aggregated overflow bar produced by `topN`. Has no effect when `topN` is not set.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| hideBarGraphics       | `boolean`                              | No       | `false`      | When `true`, bar rectangles are not drawn. Axis labels, gridlines, and the legend remain visible.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| tooltipSnippet        | `Snippet<[BarChartDataPoint, number]>` | No       | `-`          | Custom tooltip content. Receives the hovered data point and its index. Replaces the default tooltip.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| empty                 | `Snippet`                              | No       | `-`          | Content rendered when `data` is empty.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| renderOverlay         | `Snippet<[BarChartRenderContext]>`     | No       | `-`          | Escape-hatch snippet rendered inside the SVG transform group after all bars. Receives `{ innerWidth, innerHeight, margin }`.                                                                                                                                                                                                                                                                                                                                                                                              |
| testId                | `string`                               | No       | `-`          | Value for the `data-pw` attribute on the chart container.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| classes               | `string`                               | No       | `-`          | CSS class string applied to the top-level element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| interactiveLegend     | `boolean`                              | No       | `false`      | Legend items become click/keyboard toggles for series visibility; hidden series are removed from the plot and the scales rescale to the remaining data.                                                                                                                                                                                                                                                                                                                                                                   |
| hideLegendBelow       | `number`                               | No       | `360`        | Hide the legend when the measured chart width is below this pixel value; `0` disables the behavior.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| tooltipPortal         | `boolean`                              | No       | `false`      | Render the tooltip into `document.body` (`position: fixed`) so scroll/overflow ancestors never clip it.                                                                                                                                                                                                                                                                                                                                                                                                                   |

### Bar corner rounding

Grouped and single bars round only their **value end** (per the design-system bar spec): a vertical
bar rounds its top corners (bottom when the value is negative), a horizontal bar its right corners
(left when negative), and floating `[low, high]` range bars round both ends. This keeps a backdrop
or track bar behind the value bar from peeking through notches at the baseline corners (the old
all-corner `rx` rounding). Stacked bars keep their existing outer-end-only rounding.

## Events

| Event      | Type                                                                       | Description                                                           |
| ---------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| onbarclick | `(event: { index: number; dataPoint: BarChartDataPoint }) => void`         | Fires when a bar is clicked. Receives the bar's index and data point. |
| onbarhover | `(event: { index: number; dataPoint: BarChartDataPoint } \| null) => void` | Fires when the user hovers over or leaves a bar. `null` on leave.     |

## CSS Variables

Override these custom properties to theme the component.

| Variable                             | Default                     | CSS Property     | Description                                                               |
| ------------------------------------ | --------------------------- | ---------------- | ------------------------------------------------------------------------- |
| `--chart-background`                 | `transparent`               | background       | Background color of the chart container.                                  |
| `--chart-font-family`                | `inherit`                   | font-family      | Font family for all chart text.                                           |
| `--chart-transition-duration`        | `0.2s`                      | transition       | Duration of hover transitions.                                            |
| `--chart-axis-color`                 | `#666`                      | stroke, fill     | Color of axis lines, tick marks, and tick labels.                         |
| `--chart-axis-stroke-width`          | `1`                         | stroke-width     | Width of axis lines and tick marks.                                       |
| `--chart-axis-font-size`             | `11px`                      | font-size        | Font size of tick labels.                                                 |
| `--chart-axis-label-color`           | `#333`                      | fill             | Color of axis labels (xAxisLabel, yAxisLabel).                            |
| `--chart-axis-label-font-size`       | `12px`                      | font-size        | Font size of axis labels.                                                 |
| `--chart-gridline-color`             | `#e0e0e0`                   | stroke           | Color of gridlines.                                                       |
| `--chart-gridline-opacity`           | `0.5`                       | stroke-opacity   | Opacity of gridlines.                                                     |
| `--chart-gridline-dash`              | `4 4`                       | stroke-dasharray | Dash pattern for gridlines.                                               |
| `--chart-tooltip-background`         | `rgba(0,0,0,0.85)`          | background       | Background of default tooltip.                                            |
| `--chart-tooltip-color`              | `#fff`                      | color            | Text color of default tooltip.                                            |
| `--chart-tooltip-font-size`          | `12px`                      | font-size        | Font size of tooltip content.                                             |
| `--chart-tooltip-padding`            | `8px 12px`                  | padding          | Inner padding of tooltip.                                                 |
| `--chart-tooltip-border-radius`      | `4px`                       | border-radius    | Border radius of tooltip.                                                 |
| `--chart-tooltip-shadow`             | `0 2px 8px rgba(0,0,0,0.2)` | box-shadow       | Shadow on the tooltip.                                                    |
| `--chart-legend-gap`                 | `16px`                      | gap              | Space between legend items.                                               |
| `--chart-legend-font-size`           | `12px`                      | font-size        | Font size of legend labels.                                               |
| `--chart-legend-swatch-size`         | `12px`                      | width, height    | Size of color swatches in the legend.                                     |
| `--chart-legend-color`               | `#333`                      | color            | Color of legend text.                                                     |
| `--chart-empty-padding`              | `32px 24px`                 | padding          | Padding around the empty state content.                                   |
| `--chart-empty-color`                | `#9ca3af`                   | color            | Text color of empty state default.                                        |
| `--barchart-bar-hover-opacity`       | `1`                         | opacity          | Opacity of the hovered bar.                                               |
| `--barchart-bar-highlighted-opacity` | `1`                         | opacity          | Opacity of a bar emphasised via `highlightedIndex` or `onchartready`.     |
| `--barchart-bar-dimmed-opacity`      | `0.3`                       | opacity          | Opacity of non-highlighted / non-hovered bars when a highlight is active. |
| `--barchart-value-color`             | `#333`                      | fill             | Color of value labels.                                                    |
| `--barchart-value-font-size`         | `11px`                      | font-size        | Font size of value labels.                                                |
| `--barchart-value-font-weight`       | `600`                       | font-weight      | Font weight of value labels.                                              |
| `--barchart-scroll-area-height`      | `auto`                      | height           | Fixed height of the scroll area when `scrollable` is `true`.              |

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
import type { ChartHighlightAPI } from '@juspay/svelte-ui-components';

type ChartHighlightAPI = {
  highlight: (index: number | null) => void;
  getCategories: () => string[];
  type: 'bar-chart' | 'line-chart' | 'donut-chart';
};

type BarChartDataPoint = {
  label: string;
  value: number;
  range?: [number, number];
  color?: BarFill;
  valueLabel?: string;
};

type BarChartSeries = {
  name: string;
  data: BarChartDataPoint[];
  color?: BarFill;
};
```

## Web Component

```html
<script type="module" src="svelte-ui-components.js"></script>

<sui-bar-chart
  aspect-ratio="2"
  show-values
  top-n="5"
  overflow-label="Other"
  test-id="revenue-chart"
></sui-bar-chart>

<script>
  const chart = document.querySelector('sui-bar-chart');
  chart.data = [
    { label: 'Jan', value: 4200 },
    { label: 'Feb', value: 3800 },
    { label: 'Mar', value: 5100 }
  ];
  // Imperative highlight via onChartReady
  chart.onchartready = (api) => {
    api.highlight(1); // highlight Feb
  };
</script>
```
