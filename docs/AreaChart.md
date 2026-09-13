# AreaChart

A responsive SVG area chart for visualizing volume under a trend. Supports multiple series with regular stacking, 100% (normalized) stacking, configurable fill opacity, gradient fill, data labels, hover overlay with crosshair, and custom tooltips. Shares the same curve types (including the `'spline'` alias) and axis options as LineChart.

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

### Negative Values in a Stack

A negative y-value in a stacked series contributes a **zero-height**
segment, not a negative one — it does not invert the stack or pull the
baseline for the series above it below 0. The segment is still present in
the stack (unlike a gap, which contributes no segment at all); it is just
flat at that column.

```svelte
<script>
  const series = [
    {
      name: 'Revenue',
      data: [
        { x: 1, y: 100 },
        { x: 2, y: 100 }
      ]
    },
    {
      name: 'Returns',
      // x=2 goes negative -- its segment renders flush with Revenue's top
      // edge (zero height) rather than dipping the stack below it.
      data: [
        { x: 1, y: 20 },
        { x: 2, y: -40 }
      ]
    }
  ];
</script>

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

### Multi-Series Alignment

Series are joined by their **x value**, not by array position: a shorter,
offset, reordered or duplicate-x series never has another series' sample
attributed to its column. Hover, the tooltip, and (in `stacked` /
`stackNormalize` mode) the stack itself all read from this same alignment —
there is no separate, position-based path. For the common case where every
series already shares one x sequence this reproduces the exact positional
pairing you'd expect.

```svelte
<script>
  const series = [
    {
      name: 'This week',
      data: [
        { x: 1, y: 10 },
        { x: 2, y: 20 }
      ]
    },
    {
      name: 'Last week',
      // Different x coverage -- hovering at x=2 reads THIS series' own
      // sample at x=2 (200), not whatever sits at array index 1.
      data: [
        { x: 2, y: 200 },
        { x: 3, y: 300 }
      ]
    }
  ];
</script>

<AreaChart {series} />
```

### Sparse Series — Gap Points

A data point with a non-finite y (`NaN`) marks a **gap**, exactly like
LineChart: the area/line breaks around it and resumes at the next finite
point, instead of one poisoned SVG path — or, before this fix, one `NaN`
feeding straight into the auto-domain's `Math.min`/`Math.max` and turning
the whole y-axis (every series, not just the gapped one) into `NaN`. Gap
points render no marker, no data label, are skipped by hover/crosshair/
tooltip, and are excluded from the auto-computed axis domains.

In `stacked`/`stackNormalize` mode, a gap contributes **no segment and no
baseline shift** at that column — a series with a gap does not force a
zero-height slice into the stack, and does not add a fabricated 0 into the
column's total.

```svelte
<script>
  const series = [
    {
      name: 'Sales',
      // Jun 3 had no data -- the area gaps over x=3 and resumes at x=4.
      data: [
        { x: 1, y: 120 },
        { x: 2, y: 180 },
        { x: 3, y: NaN },
        { x: 4, y: 150 }
      ]
    }
  ];
</script>

<AreaChart {series} />
```

See [Chart Input Policy](./CHART_INPUT_POLICY.md) for the full table of
input shapes (empty, all-zero, single point, null/NaN/Infinity, negative
values, reordered times, and unknown `stackNormalize` totals) and how each
one renders across both LineChart and AreaChart, plus the calendar-axis
limitation and why `NaN` cannot survive a JSON round trip.

### Stacked-Mode Hover Tie-Break

When two series' rendered areas are very close together at the hovered x,
the nearest-series calculation compares each series' own **raw y value** at
that x — not its rendered/stacked pixel position. The stacked visual
position is a sum of everything below it, so "nearest by stacked pixel"
would make a hover call depend on which series happen to sit underneath,
not on which series' actual value is closest to the pointer. The tooltip's
displayed value is unaffected either way; only which series' marker "wins" a
close-proximity hover can differ from a purely pixel-distance comparison.

### Keyboard access

Every rendered data point is a focusable `role="button"` element (`tabindex="0"`),
labelled via `aria-label` with its resolved name (`label`, else the formatted x value)
and value — `"{name}: {value}"` for a single series, `"{name} — {series}: {value}"` when
there is more than one, matching the tooltip's own multi-series disambiguation.
`Tab`/`Shift+Tab` moves through points in series order, then point order within each
series. `Enter` or `Space` on a focused point fires `onpointclick`, the same event a
pointer click fires. Focusing a point also activates it exactly as pointer hover does —
same tooltip content, same anchor position — through the one `activate()` function both
input paths share, so keyboard and pointer users can never see the two drift apart. This
is the same family-wide keyboard/tooltip contract implemented by BarChart,
DualAxisBarChart, FunnelChart, PieChart and SankeyChart — see
[PieChart's "Keyboard access" section](./PieChart.md#keyboard-access) for the full
contract.

AreaChart is a continuous series rather than a fixed set of categories, so "the marks to
Tab through" is a deliberate choice rather than a given: each **rendered (series, point)
pair** is its own stop, in the same order pointer hover's nearest-point search already
uses — keyboard and pointer users reach the same addressable data, just via different
input.

Unlike LineChart, AreaChart has no live `role="status"` region. That is a direct
consequence of its prop surface, not a weaker announcement story: PieChart's live region
(and LineChart's, added alongside this contract) exists specifically because those
charts expose a highlight that can change **without** a focus event — a declarative
`highlightedIndex` prop or an imperative `ChartHighlightAPI`. AreaChart has neither, so
every state change assistive tech needs to know about already happens through a focus
event, and each point's own `aria-label` covers it — matching the family's majority
(BarChart, DualAxisBarChart, FunnelChart and SankeyChart also rely on `aria-label` alone).

### Legend Aggregates

**The aggregate sits beside the legend control, never inside it.** When the
legend is interactive (`interactiveLegend`), each entry is a toggle button, and
every bit of text inside a button becomes part of its accessible name. Rendering
the figure inside the toggle would make that name change whenever the data does
— `Revenue $6,500` one load, something else the next. A name that moves breaks
voice-control targeting, breaks any consumer test matching it exactly (Testing
Library's `getByRole` matches the whole string by default), and announces a
figure as the control's identity rather than as information about the series.

So the button is named by its series alone, the aggregate is its sibling, and
clicking the figure does not toggle the series.

Set `aggregate` on a series to show a computed value beside its legend label. Omitted (or `'none'`),
the default, shows nothing — the legend renders exactly as before. The aggregate is always computed
over that series' own points, even when `stacked` is `true` — it is never the per-category stack
total. Every kind, `sum` included, skips non-finite `y` values rather than treating them as zero
(this only changes the result for `'average'`, which shrinks its denominator, and `'min'`/`'max'`,
which an absent point can never set); an aggregate over zero real points renders nothing rather
than `NaN` or a fabricated `0`, `sum` included. `aggregateFormat` defaults to `yTickFormat`.

```svelte
<AreaChart
  series={[
    { name: 'Direct', data: [...], aggregate: 'sum', aggregateFormat: (v) => `${v} visits` },
    { name: 'Organic', data: [...], aggregate: 'average' }
  ]}
  stacked
  showLegend
/>
```

## Props

| Prop           | Type                                                        | Required | Default      | Description                                                                                                                                                                                                                                                                                                                                              |
| -------------- | ----------------------------------------------------------- | -------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| series         | `AreaChartSeries[]`                                         | Yes      | `-`          | Array of `{name, data, color?, aggregate?, aggregateFormat?}`. Each series renders as a filled area. `aggregate` (`'sum' \| 'average' \| 'min' \| 'max' \| 'none'`, default `'none'`) shows a computed value beside the legend label, always per-series even when `stacked`; `aggregateFormat` defaults to `yTickFormat`. See "Legend Aggregates" below. |
| curve          | `'linear' \| 'monotone' \| 'spline' \| 'step' \| 'natural'` | No       | `'monotone'` | Interpolation between points. `'spline'` is an alias for `'monotone'`.                                                                                                                                                                                                                                                                                   |
| gradientFill   | `boolean`                                                   | No       | `false`      | When true, replaces flat fill-opacity with a vertical gradient fading from `fillOpacity+0.3` at the top to transparent at the bottom.                                                                                                                                                                                                                    |
| stacked        | `boolean`                                                   | No       | `false`      | Whether to stack series vertically. Bottom series provides the baseline for the next.                                                                                                                                                                                                                                                                    |
| stackNormalize | `boolean`                                                   | No       | `false`      | When true with `stacked`, normalizes each column to 100%. Y axis becomes 0-100 percent scale.                                                                                                                                                                                                                                                            |
| fillOpacity    | `number`                                                    | No       | `0.3`        | Opacity of area fill (0-1). Hovered series gets `+0.2` boost.                                                                                                                                                                                                                                                                                            |
| showDots       | `boolean`                                                   | No       | `false`      | Whether to render dots at each data point.                                                                                                                                                                                                                                                                                                               |
| showLine       | `boolean`                                                   | No       | `true`       | Whether to draw the outline on top of the area fill.                                                                                                                                                                                                                                                                                                     |
| showValues     | `boolean`                                                   | No       | `false`      | Whether to render text labels with the y-value at each data point.                                                                                                                                                                                                                                                                                       |
| strokeWidth    | `number`                                                    | No       | `2`          | Width of the outline stroke in pixels.                                                                                                                                                                                                                                                                                                                   |
| showGridlines  | `boolean`                                                   | No       | `true`       | Whether to show gridlines across the Y axis.                                                                                                                                                                                                                                                                                                             |
| showXAxis      | `boolean`                                                   | No       | `true`       | Whether to render the X axis.                                                                                                                                                                                                                                                                                                                            |
| showYAxis      | `boolean`                                                   | No       | `true`       | Whether to render the Y axis.                                                                                                                                                                                                                                                                                                                            |
| showLegend     | `boolean`                                                   | No       | `false`      | Whether to render the legend. Only shown when there are multiple series.                                                                                                                                                                                                                                                                                 |
| xDomain        | `[number, number]`                                          | No       | auto         | Fixed `[min, max]` for the X axis.                                                                                                                                                                                                                                                                                                                       |
| yDomain        | `[number, number]`                                          | No       | auto         | Fixed `[min, max]` for the Y axis. Overrides auto-normalization in `stackNormalize` mode.                                                                                                                                                                                                                                                                |
| xAxisLabel     | `string`                                                    | No       | `-`          | Text label below the X axis.                                                                                                                                                                                                                                                                                                                             |
| yAxisLabel     | `string`                                                    | No       | `-`          | Text label beside the Y axis.                                                                                                                                                                                                                                                                                                                            |
| xTickFormat    | `(value: number \| string) => string`                       | No       | abbreviated  | Formatter for X axis tick labels.                                                                                                                                                                                                                                                                                                                        |
| yTickFormat    | `(value: number \| string) => string`                       | No       | abbreviated  | Formatter for Y axis tick labels.                                                                                                                                                                                                                                                                                                                        |
| aspectRatio    | `number`                                                    | No       | `16/9`       | Width-to-height ratio.                                                                                                                                                                                                                                                                                                                                   |
| tooltipSnippet | `Snippet<[AreaChartTooltipContext]>`                        | No       | `-`          | Custom tooltip. Receives `{x, points: [{name, y, color, label?}]}` with values for all series at the hovered X.                                                                                                                                                                                                                                          |
| empty          | `Snippet`                                                   | No       | `-`          | Content rendered when all series are empty.                                                                                                                                                                                                                                                                                                              |
| testId         | `string`                                                    | No       | `-`          | Value for the data-pw attribute on the chart container.                                                                                                                                                                                                                                                                                                  |
| classes        | `string`                                                    | No       | `-`          | CSS class string applied to the top-level element.                                                                                                                                                                                                                                                                                                       |
| minHeight      | `number`                                                    | No       | `0`          | Lower bound (px) on the rendered chart height.                                                                                                                                                                                                                                                                                                           |
| maxHeight      | `number`                                                    | No       | `420`        | Upper bound (px) on the rendered chart height.                                                                                                                                                                                                                                                                                                           |
| tooltipPortal  | `boolean`                                                   | No       | `false`      | Render the tooltip into `document.body` (`position: fixed`) so scroll/overflow ancestors never clip it.                                                                                                                                                                                                                                                  |

## Events

| Event        | Type                                                                                              | Description                                        |
| ------------ | ------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| onpointclick | `(event: { seriesIndex: number; pointIndex: number; point: AreaChartDataPoint }) => void`         | Fires when the plot area is clicked.               |
| onpointhover | `(event: { seriesIndex: number; pointIndex: number; point: AreaChartDataPoint } \| null) => void` | Fires when hover moves or leaves. `null` on leave. |

## CSS Variables

In addition to the shared `--chart-*` variables (see BarChart docs), AreaChart exposes:

| Variable                       | Default | CSS Property     | Description                                                                                                        |
| ------------------------------ | ------- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `--areachart-dimmed-opacity`   | `0.1`   | opacity          | Opacity of non-hovered series when hovering.                                                                       |
| `--areachart-value-color`      | `#333`  | fill             | Color of point value labels.                                                                                       |
| `--areachart-value-font-size`  | `11px`  | font-size        | Font size of point value labels.                                                                                   |
| `--areachart-hover-line-color` | `-`     | stroke           | Color of the hover crosshair line. Falls back to `--linechart-hover-line-color`, then `light-dark(#ccc, #4b5563)`. |
| `--areachart-hover-line-dash`  | `-`     | stroke-dasharray | Dash pattern for the hover crosshair line. Falls back to `--linechart-hover-line-dash`, then `4 4`.                |

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

## Web Component

`sui-area-chart` is registered by the web-component bundle. AreaChart's tooltip
can portal to `document.body` via `tooltipPortal`, which used to make every
chart with that option unsafe to wrap — a portalled node kept its shadow-scoped
`svelte-*` class and lost every rule behind it. `ChartTooltip` now resolves its
portal destination from the node's own root instead of hardcoding
`document.body`, so `sui-area-chart` ships one.

```html
<script type="module" src="@juspay/svelte-ui-components/wc"></script>

<sui-area-chart show-dots show-values stacked stack-normalize show-legend></sui-area-chart>

<script>
  const chart = document.querySelector('sui-area-chart');
  chart.series = [
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
  chart.xTickFormat = (v) => `Day ${v}`;
  chart.onpointhover = (event) => {
    if (event) {
      console.log(event.seriesIndex, event.pointIndex, event.point);
    }
  };
</script>
```

Arrays, objects and functions — `series`, `xDomain`, `yDomain`, `xTickFormat`,
`yTickFormat` and both callback props — must be assigned as JavaScript
properties. They cannot cross the HTML-attribute boundary.

### Web Component Events

`onpointhover` and `onpointclick` are available as JS properties, and each also dispatches a
same-named DOM custom event (bubbles, composed) for a consumer who only calls
`addEventListener` — the detail is the same value the JS-property callback receives:
`{ seriesIndex, pointIndex, point }`, or `null` for `pointhover` when the pointer leaves every
point:

```js
const chart = document.querySelector('sui-area-chart');
chart.addEventListener('pointclick', (e) => select(e.detail.point));
chart.addEventListener('pointhover', (e) => setHovered(e.detail?.point ?? null));
```

### Slots

| Slot    | Replaces                                          |
| ------- | ------------------------------------------------- |
| `empty` | The empty state shown when every series is empty. |

Supply it only when you mean to: with no `empty` slot the component falls
through to its own chart frame (legend, axes, hover overlay), and an empty slot
would replace that frame with a blank box.

> **Svelte-only:** `tooltipSnippet` (receives `AreaChartTooltipContext`) takes
> an argument, so it cannot be expressed as a named slot: a Web Component
> `<slot>` projects markup and does not forward Svelte snippet parameters, so
> the hovered `{x, points}` would be silently dropped. Use the Svelte component
> directly when you need a custom tooltip.
