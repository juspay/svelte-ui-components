# DualAxisBarChart

A pure-SVG dual-axis chart with two completely independent Y-axes — left (`yAxisIndex: 0`) and right (`yAxisIndex: 1`) — sharing one categorical X-axis. Each series independently declares its axis and render type (`'column'` or `'line'`), making it ideal for comparing metrics at very different scales (e.g. absolute revenue vs. percentage CTR) within the same chart. Built entirely with the shared `_chart` primitives (ChartContainer, Axis, ChartTooltip, Legend, scales) — zero external dependencies.

## Usage

```svelte
<script>
  import { DualAxisBarChart } from '@juspay/svelte-ui-components';

  const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  const series = [
    {
      name: 'Revenue ($)',
      data: [42000, 38500, 51200, 46800, 58300, 62100],
      yAxisIndex: 0,
      type: 'column',
      color: '#4e79a7'
    },
    {
      name: 'CTR (%)',
      data: [3.2, 2.8, 4.1, 3.7, 4.8, 5.2],
      yAxisIndex: 1,
      type: 'line',
      color: '#f28e2b'
    }
  ];
</script>

<DualAxisBarChart
  {categories}
  {series}
  leftAxis={{ title: 'Revenue ($)', color: '#4e79a7' }}
  rightAxis={{ title: 'CTR (%)', color: '#f28e2b', valueFormat: (v) => `${v.toFixed(1)}%` }}
/>
```

### Two Column Series on Different Axes

```svelte
<DualAxisBarChart
  {categories}
  series={[
    { name: 'Orders', data: [120, 98, 143, 131, 165, 182], yAxisIndex: 0, type: 'column' },
    { name: 'AOV ($)', data: [350, 393, 358, 357, 353, 341], yAxisIndex: 1, type: 'column' }
  ]}
  leftAxis={{ title: 'Orders' }}
  rightAxis={{ title: 'AOV ($)', valueFormat: (v) => `$${v.toFixed(0)}` }}
/>
```

### Custom Tooltip

```svelte
<DualAxisBarChart {categories} {series}>
  {#snippet tooltipSnippet(ctx)}
    <div style="background:#222; color:#fff; padding:8px 12px; border-radius:6px;">
      <strong>{ctx.category}</strong>
      {#each ctx.points as pt}
        <div style="display:flex; gap:8px; align-items:center;">
          <span style="background:{pt.color}; width:8px; height:8px; border-radius:2px;"></span>
          {pt.name}: <strong>{pt.value}</strong>
        </div>
      {/each}
    </div>
  {/snippet}
</DualAxisBarChart>
```

### Click Handler

```svelte
<DualAxisBarChart
  {categories}
  {series}
  onbarclick={(event) => {
    console.log('clicked category', event.context.category);
    console.log('all points', event.context.points);
  }}
/>
```

## Props

| Prop              | Type                                | Required | Default                                        | Description                                                                                                                                                                 |
| ----------------- | ----------------------------------- | -------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| categories        | `string[]`                          | Yes      | —                                              | Ordered category labels for the shared X-axis (e.g. `['Jan', 'Feb', 'Mar']`). All series `data` arrays must have the same length as `categories`.                           |
| series            | `DualAxisSeries[]`                  | Yes      | —                                              | Array of series descriptors. Each series declares `yAxisIndex` (0=left, 1=right), `data` values, an optional render `type`, and an optional `color`.                        |
| leftAxis          | `DualAxisConfig`                    | No       | `{}`                                           | Configuration for the left (primary) Y-axis. Accepts `title`, `color`, and `valueFormat`.                                                                                   |
| rightAxis         | `DualAxisConfig`                    | No       | `{}`                                           | Configuration for the right (secondary) Y-axis. Accepts `title`, `color`, and `valueFormat`.                                                                                |
| showGridlines     | `boolean`                           | No       | `true`                                         | Whether to render dashed horizontal gridlines from the left-axis ticks.                                                                                                     |
| showLegend        | `boolean`                           | No       | `true`                                         | Whether to render the shared series legend above the chart.                                                                                                                 |
| barRadius         | `number`                            | No       | `3`                                            | Corner radius of column/bar shapes in pixels.                                                                                                                               |
| barPadding        | `number`                            | No       | `0.25`                                         | Padding between category bands as a fraction of band width (0–1).                                                                                                           |
| aspectRatio       | `number`                            | No       | `16/9`                                         | Width-to-height ratio for the chart. Passed to ChartContainer's ResizeObserver sizing.                                                                                      |
| tooltipSnippet    | `Snippet<[DualAxisTooltipContext]>` | No       | —                                              | Custom tooltip content rendered on hover. Receives a `DualAxisTooltipContext` with the hovered category and all series values. Replaces the default tooltip.                |
| testId            | `string`                            | No       | —                                              | Value for the `data-pw` attribute on the root element for test targeting.                                                                                                   |
| classes           | `string`                            | No       | —                                              | Extra CSS class string on the root `<div>`. Useful for applying scoped CSS variable overrides.                                                                              |
| minBarHeight      | `number`                            | No       | `2`                                            | Minimum rendered bar height in pixels. Set `0` so an all-zero/dormant series renders nothing (e.g. to show an empty state instead of indistinguishable 2px baseline stubs). |
| maxHeight         | `number`                            | No       | `420`                                          | Upper bound (px) on the rendered chart height, so the aspect-ratio-derived height can't balloon on wide surfaces.                                                           |
| minHeight         | `number`                            | No       | `0`                                            | Lower bound (px) on the rendered chart height.                                                                                                                              |
| margin            | `{ top?; right?; bottom?; left? }`  | No       | `{ top: 24, right: 56, bottom: 40, left: 56 }` | Override plot margins (px) for axis titles/labels, merged over the defaults. Widen `left`/`right` for long currency tick labels in narrow containers.                       |
| tooltipPortal     | `boolean`                           | No       | `false`                                        | Render the hover tooltip on `document.body` with `position: fixed` viewport coords so it is not clipped by an `overflow`/scroll ancestor (e.g. a scrollable sheet).         |
| interactiveLegend | `boolean`                           | No       | `false`                                        | Legend items become click/keyboard toggles for series visibility; hidden series are removed from the plot and the scales rescale to the remaining data.                     |
| hideLegendBelow   | `number`                            | No       | `360`                                          | Hide the legend when the measured chart width is below this pixel value; `0` disables the behavior.                                                                         |

## Events

| Event      | Type                                                                          | Description                                                                                               |
| ---------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| onbarclick | `(event: { categoryIndex: number; context: DualAxisTooltipContext }) => void` | Fires when the user clicks anywhere within a category column. Provides the index and full series context. |

## Type Reference

```typescript
type DualAxisSeries = {
  /** Display name shown in legend and tooltip. */
  name: string;
  /** Numeric values — one per category. */
  data: number[];
  /** Which Y-axis: 0 = left, 1 = right. */
  yAxisIndex: 0 | 1;
  /** Optional CSS color. Falls back to the default palette. */
  color?: string;
  /**
   * Render type for this series.
   * 'column' — vertical bars (default).
   * 'line'   — line with dots drawn above the column layer.
   */
  type?: 'column' | 'line';
};

type DualAxisConfig = {
  /** Label rendered above the axis line. */
  title?: string;
  /** CSS color for the axis title text. */
  color?: string;
  /** Custom tick formatter. Receives a raw number, returns display string. */
  valueFormat?: (value: number) => string;
};

type DualAxisTooltipContext = {
  /** The hovered category label. */
  category: string;
  /** Zero-based index of the hovered category. */
  categoryIndex: number;
  /** All series values for this category. */
  points: Array<{
    name: string;
    value: number;
    color: string;
    yAxisIndex: 0 | 1;
    type: 'column' | 'line';
  }>;
};
```

## CSS Variables

Override these custom properties to theme the component.

| Variable                         | Default                     | CSS Property     | Description                                       |
| -------------------------------- | --------------------------- | ---------------- | ------------------------------------------------- |
| `--chart-background`             | `transparent`               | background       | Background color of the chart container.          |
| `--chart-font-family`            | `inherit`                   | font-family      | Font family for all chart text.                   |
| `--chart-transition-duration`    | `0.2s`                      | transition       | Duration of hover/opacity transitions.            |
| `--chart-axis-color`             | `#666`                      | stroke, fill     | Color of axis lines, tick marks, and tick labels. |
| `--chart-axis-stroke-width`      | `1`                         | stroke-width     | Width of axis lines and tick marks.               |
| `--chart-axis-font-size`         | `11px`                      | font-size        | Font size of axis tick labels.                    |
| `--chart-axis-label-color`       | `#333`                      | fill             | Color of axis title text.                         |
| `--chart-axis-label-font-size`   | `11px`                      | font-size        | Font size of axis title labels.                   |
| `--chart-gridline-color`         | `#e0e0e0`                   | stroke           | Color of horizontal gridlines.                    |
| `--chart-gridline-opacity`       | `0.5`                       | stroke-opacity   | Opacity of gridlines.                             |
| `--chart-gridline-dash`          | `4 4`                       | stroke-dasharray | Dash pattern for gridlines.                       |
| `--chart-tooltip-background`     | `rgba(0,0,0,0.85)`          | background       | Background of the default tooltip.                |
| `--chart-tooltip-color`          | `#fff`                      | color            | Text color of the default tooltip.                |
| `--chart-tooltip-font-size`      | `12px`                      | font-size        | Font size of tooltip content.                     |
| `--chart-tooltip-padding`        | `8px 12px`                  | padding          | Inner padding of the default tooltip.             |
| `--chart-tooltip-border-radius`  | `4px`                       | border-radius    | Border radius of the default tooltip.             |
| `--chart-tooltip-shadow`         | `0 2px 8px rgba(0,0,0,0.2)` | box-shadow       | Box shadow on the default tooltip.                |
| `--chart-legend-gap`             | `16px`                      | gap              | Space between legend items.                       |
| `--chart-legend-font-size`       | `12px`                      | font-size        | Font size of legend labels.                       |
| `--chart-legend-swatch-size`     | `12px`                      | width, height    | Size of color swatches in the legend.             |
| `--chart-legend-color`           | `#333`                      | color            | Color of legend text.                             |
| `--dual-axis-bar-hover-opacity`  | `1`                         | opacity          | Opacity of bars in the hovered category.          |
| `--dual-axis-bar-dimmed-opacity` | `0.3`                       | opacity          | Opacity of bars outside the hovered category.     |
| `--dual-axis-line-stroke-width`  | `2`                         | stroke-width     | Stroke width of line series paths.                |
| `--dual-axis-dot-stroke`         | `#fff`                      | stroke           | Stroke color around line series dots.             |
| `--dual-axis-dot-stroke-width`   | `1.5`                       | stroke-width     | Stroke width of line series dots.                 |
| `--dual-axis-guideline-color`    | `#aaa`                      | stroke           | Color of the vertical hover guideline.            |
| `--dual-axis-guideline-width`    | `1`                         | stroke-width     | Width of the vertical hover guideline.            |
| `--dual-axis-guideline-dash`     | `4 3`                       | stroke-dasharray | Dash pattern of the vertical hover guideline.     |
| `--chart-empty-padding`          | `32px 24px`                 | padding          | Padding around the empty-state message.           |
| `--chart-empty-color`            | `#9ca3af`                   | color            | Text color of the empty-state message.            |

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

## Web Component

```html
<sui-dual-axis-bar-chart
  test-id="my-chart"
  show-gridlines="true"
  show-legend="true"
></sui-dual-axis-bar-chart>
<script>
  const chart = document.querySelector('sui-dual-axis-bar-chart');
  chart.categories = ['Jan', 'Feb', 'Mar'];
  chart.series = [
    { name: 'Revenue', data: [100, 200, 150], yAxisIndex: 0, type: 'column' },
    { name: 'CTR', data: [3.2, 4.1, 3.7], yAxisIndex: 1, type: 'line' }
  ];
  chart.leftAxis = { title: 'Revenue ($)' };
  chart.rightAxis = { title: 'CTR (%)', valueFormat: (v) => `${v.toFixed(1)}%` };
</script>
```
