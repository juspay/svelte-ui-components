# PieChart

A responsive SVG pie/donut chart with slice hover highlighting, programmatic highlight control, an optional delta-change badge, custom labels, legend, and donut center content. When `innerRadius` is set, renders as a donut with optional content in the center hole via the `center` snippet. Supports a semi-circle (half-donut) layout via `semiCircle`, a tabular value legend via `legendShowValues`, and configurable percentage decimal places via `percentDecimals`. The `onchartready` callback delivers an imperative `ChartHighlightAPI` so external orchestrators (e.g. voice narration, dashboards) can drive slice highlights without touching component state; the `highlightedIndex` prop provides the same capability declaratively. A `changePercentage` prop renders a positioned `DeltaIndicator` badge at the top-right corner of the chart container, with `changeInvertColors` for lower-is-better metrics.

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

### Right-Side Legend, Capped

Place the value legend beside the chart instead of below it, and cap how many rows show at once. The remainder collapses behind a `+N more` control:

```svelte
<PieChart
  {data}
  innerRadius={0.6}
  showLegend
  legendShowValues
  legendPosition="right"
  legendMaxItems={5}
/>
```

By default that control expands the rest in place and toggles back to "Show less". If you already have somewhere better to put the overflow — a modal, a drawer, a linked report — pass `onlegendmore` and it takes over instead, so the legend does not also expand underneath your own UI:

```svelte
<script>
  let breakdownOpen = $state(false);
</script>

<PieChart
  {data}
  showLegend
  legendShowValues
  legendPosition="right"
  legendMaxItems={5}
  onlegendmore={() => (breakdownOpen = true)}
/>
```

Both are opt-in. Without `legendPosition`/`legendMaxItems` the legend renders below the chart with every row shown, exactly as before, and a cap that nothing exceeds renders no control at all.

### Delta Badge

Render a `DeltaIndicator` badge anchored to the top-right corner. Positive values appear green ↑, negative appear red ↓ by default. Use `changeInvertColors` for lower-is-better metrics (e.g. RTO rate, bounce rate).

```svelte
<!-- Revenue up 12.5% -->
<PieChart {data} changePercentage={12.5} />

<!-- RTO rate down 8% — good, so show green ↓ -->
<PieChart {data} changePercentage={-8} changeInvertColors />
```

### Programmatic Highlight — Declarative

Highlight a specific slice index via the `highlightedIndex` prop. The highlighted slice scales out; all others dim. Pass `null` to clear.

```svelte
<script>
  let highlighted = $state(0); // highlight Chrome
</script>

<PieChart {data} innerRadius={0.6} highlightedIndex={highlighted} />
```

### Programmatic Highlight — Imperative API

Use `onchartready` to receive a `ChartHighlightAPI` handle. Call `api.highlight(index)` / `api.highlight(null)` from external logic (voice narration, keyboard controls, dashboard orchestration).

```svelte
<script>
  import type { ChartHighlightAPI } from '@juspay/svelte-ui-components';

  let chartApi: ChartHighlightAPI | null = $state(null);
</script>

<PieChart
  {data}
  innerRadius={0.6}
  onchartready={(api) => {
    chartApi = api;
  }}
/>

<button onclick={() => chartApi?.highlight(0)}>Highlight Chrome</button>
<button onclick={() => chartApi?.highlight(null)}>Clear</button>
```

The `type` field on the returned API is always `'donut-chart'`, regardless of whether `innerRadius` is set.

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

### Keyboard access

Every slice is a focusable `role="button"` element (`tabindex="0"`), labelled with its
value via `aria-label`. `Tab`/`Shift+Tab` moves between slices in data order; `Enter` or
`Space` on a focused slice fires `onsliceclick`, the same event a pointer click fires.
Focusing a slice also highlights it, mirroring pointer hover — this is the same
family-wide contract used by BarChart, DualAxisBarChart and FunnelChart.

A single `role="status" aria-live="polite"` region (visually hidden, `aria-describedby`
on every slice) announces the focused or highlighted slice's label, value and
percentage, so a screen-reader user gets the exact figures a pointer-hover tooltip
shows without needing to see the tooltip. It updates for every highlight path — pointer
hover, keyboard focus, declarative `highlightedIndex`, and imperative
`ChartHighlightAPI.highlight()` — so it is never the one path pointer-only hover leaves
uncovered.

### Synchronized legend recipe

`showLegend` (without `legendShowValues`) renders a legend built on the same
highlighting used by slice hover and `highlightedIndex`/`ChartHighlightAPI` — pointer,
focus, and programmatic activation all drive one `hoveredIndex`/`highlightedIndex`/
`programmaticIndex` precedence chain (pointer or keyboard interaction wins while active,
falling back to the declarative prop, falling back to the imperative API), so the chart
and its legend can never show two different slices highlighted at once.

Hovering or focusing a legend row highlights the matching slice; clicking a row fires
`onsliceclick`, exactly as clicking the slice itself would. This is deliberately **not**
a visibility toggle — no row can hide its slice, and no `aria-pressed` state is
reported, because toggling what's drawn and highlighting a datum are different actions.
(Compare BarChart/DualAxisBarChart's series legend, which _does_ use `onToggle`/
`aria-pressed` — because hiding a whole series is the action that legend performs.)

Because a legend row is keyed by position, not by a caller-held id, an external legend
built on `ChartHighlightAPI.getCategories()` should not cache the index a category first
had — a `topN` aggregation, filter, or reorder shifts indices. Re-resolve the id against
the current category list right before every `highlight()` call:

```js
// categories = api.getCategories(), captured fresh from onchartready right before use
const index = categories.indexOf('Chrome');
api.highlight(index === -1 ? null : index);
```

Treat "not found" (filtered out, or folded into an aggregate bucket) as "clear the
highlight" — call `highlight(null)`, never `highlight(-1)`. This lookup is what backs
PieChart's own built-in synced legend internally (`resolveLegendIndex` in the shared
`Legend.svelte`); it is one line because the whole recipe is "look the id up again, on
every call, against the chart's current category list" — there is no state to keep in
sync, so there is nothing to fall out of sync.

### Tooltip portal

Pass `tooltipPortal` to render the tooltip into the chart's own root (its shadow root
when hosted as a custom element, `document.body` otherwise) with `position: fixed`,
clamped to the viewport, instead of positioned inside the chart's own DOM subtree. Use
it when the chart sits inside a container with `overflow: hidden`/`scroll` that would
otherwise clip the tooltip:

```svelte
<div style="overflow: hidden; max-height: 300px;">
  <PieChart {data} tooltipPortal />
</div>
```

`tooltipPortal` only changes where the tooltip wrapper renders — it has no effect on
`tooltipSnippet`'s content, so a custom tooltip snippet keeps working unchanged.

### Label overflow & collisions

Slice labels (`showLabels` / `showValues`) are laid out defensively so a crowded pie never renders
overlapping text:

- Each label is truncated against its real rendered width (canvas-measured, SSR-safe fallback) to
  the horizontal room the chart actually has at that label's position.
- Labels that would collide are dropped, larger slices winning; `labelPosition="inside"` labels are
  also dropped when their wedge is thinner than one text line.
- Every dropped or truncated label keeps its full text on the slice tooltip and `aria-label`.

## Invalid values

A slice value that is not a real number (`NaN`, `Infinity`, `-Infinity`)
**contributes 0** to the total. The slice is still present — keeping its
index, its colour and its legend entry — but occupies zero angle, exactly as
an explicit `0` would. It is not dropped, because a pie slice is positioned by
the angles of its neighbours, so removing one would renumber the rest.

Every other slice keeps its correct angle, and the remaining percentages still
sum to 100%.

This is worth stating because the pre-enforcement failure was not confined to
the offending slice. The shared `total` is the denominator for _all_ labels,
so a single `NaN` made **every** slice's percentage render as literal `NaN%`
— in the values legend, in the tooltip, and in the `aria-live` status region
— while the slices themselves became invalid SVG paths and vanished. See
[Chart Input Policy](./CHART_INPUT_POLICY.md#why-a-non-finite-value-is-never-just-one-bad-point).

## Props

| Prop               | Type                               | Required | Default      | Description                                                                                                                                                                                                                                                           |
| ------------------ | ---------------------------------- | -------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| data               | `PieChartSlice[]`                  | Yes      | `-`          | Array of `{label, value, color?}`. Each item becomes one slice. Slice angle is proportional to value.                                                                                                                                                                 |
| innerRadius        | `number`                           | No       | `0`          | Inner radius as a fraction of outer radius (0-1). `0` renders a pie; `>0` renders a donut.                                                                                                                                                                            |
| padAngle           | `number`                           | No       | `0.02`       | Angular gap between slices in radians.                                                                                                                                                                                                                                |
| showLabels         | `boolean`                          | No       | `false`      | Whether to render slice labels (either inside or outside depending on `labelPosition`).                                                                                                                                                                               |
| showValues         | `boolean`                          | No       | `false`      | Whether to render the slice percentage as a label.                                                                                                                                                                                                                    |
| labelPosition      | `'inside' \| 'outside'`            | No       | `'outside'`  | Where to render slice labels.                                                                                                                                                                                                                                         |
| showLegend         | `boolean`                          | No       | `false`      | Whether to render a legend above the chart.                                                                                                                                                                                                                           |
| startAngle         | `number`                           | No       | `-Math.PI/2` | Starting angle in radians. Default starts at 12 o'clock position.                                                                                                                                                                                                     |
| aspectRatio        | `number`                           | No       | `1`          | Width-to-height ratio. `1` produces a circular container.                                                                                                                                                                                                             |
| valueFormat        | `(value: number) => string`        | No       | abbreviated  | Formatter for slice values in the default tooltip.                                                                                                                                                                                                                    |
| tooltipSnippet     | `Snippet<[PieChartSlice, number]>` | No       | `-`          | Custom tooltip content. Receives the hovered slice and its index.                                                                                                                                                                                                     |
| tooltipPortal      | `boolean`                          | No       | `false`      | Render the tooltip into the chart's own root (shadow root, or `document.body`) with `position: fixed`, clamped to the viewport, instead of positioned inside the chart. Use inside an `overflow: hidden`/`scroll` container. No effect on `tooltipSnippet`'s content. |
| center             | `Snippet`                          | No       | `-`          | Content rendered inside the donut hole (only when `innerRadius > 0`). Rendered via SVG `foreignObject`.                                                                                                                                                               |
| empty              | `Snippet`                          | No       | `-`          | Content rendered when `data` is empty or all values are zero.                                                                                                                                                                                                         |
| semiCircle         | `boolean`                          | No       | `false`      | Render as a semi-circle (half-pie/donut). Arc spans the top 180°. Aspect ratio defaults to 2:1.                                                                                                                                                                       |
| legendShowValues   | `boolean`                          | No       | `false`      | When `showLegend` is also true, renders a tabular legend with formatted values and percentages per slice.                                                                                                                                                             |
| legendPosition     | `'bottom' \| 'right'`              | No       | `'bottom'`   | Where the `legendShowValues` list sits. `'bottom'` keeps today's below-chart placement; `'right'` renders it as a column beside the chart. Only affects the values legend — `showLegend` without `legendShowValues` still renders the plain top legend.               |
| legendMaxItems     | `number`                           | No       | `-`          | Show at most this many legend rows, followed by a `+N more` control. Omitted (the default) shows every row with no control. A cap that is not exceeded renders no control either.                                                                                     |
| onlegendmore       | `() => void`                       | No       | `-`          | Called when `+N more` is activated. Providing it **suppresses** the built-in in-place expansion, so a consumer opening their own modal does not also get the list expanding underneath it.                                                                            |
| percentDecimals    | `number`                           | No       | `0`          | Decimal places used for percentage formatting in on-arc labels (`showValues`) and the legend value column.                                                                                                                                                            |
| onchartready       | `(api: ChartHighlightAPI) => void` | No       | `-`          | Called once on mount with the imperative highlight API. Use `api.highlight(index)` to highlight a slice and `api.highlight(null)` to clear. `api.type` is always `'donut-chart'`.                                                                                     |
| highlightedIndex   | `number \| null`                   | No       | `null`       | Declarative highlight: the index of the slice to highlight. The highlighted slice scales out and all others dim. Pass `null` or omit to clear. Mouse hover takes priority when active.                                                                                |
| changePercentage   | `number`                           | No       | `-`          | When provided, renders a `DeltaIndicator` badge at the top-right of the chart container showing the percentage change. Positive values appear green ↑, negative appear red ↓ by default.                                                                              |
| changeInvertColors | `boolean`                          | No       | `false`      | Swap the up/down colors on the delta badge for lower-is-better metrics (e.g. RTO rate, bounce rate).                                                                                                                                                                  |
| testId             | `string`                           | No       | `-`          | Value for the data-pw attribute on the chart container.                                                                                                                                                                                                               |
| classes            | `string`                           | No       | `-`          | CSS class string applied to the top-level element.                                                                                                                                                                                                                    |

## Events

| Event        | Type                                                               | Description                                           |
| ------------ | ------------------------------------------------------------------ | ----------------------------------------------------- |
| onsliceclick | `(event: { index: number; slice: PieChartSlice }) => void`         | Fires when a slice is clicked.                        |
| onslicehover | `(event: { index: number; slice: PieChartSlice } \| null) => void` | Fires on slice hover enter or leave. `null` on leave. |

## CSS Variables

In addition to the shared `--chart-*` variables (see BarChart docs), PieChart exposes:

| Variable                                | Default                  | CSS Property   | Description                                                                                                                                                  |
| --------------------------------------- | ------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--piechart-stroke-color`               | `#fff`                   | stroke         | Color of the stroke between slices.                                                                                                                          |
| `--piechart-stroke-width`               | `2`                      | stroke-width   | Width of the stroke between slices.                                                                                                                          |
| `--chart-transition-duration`           | `0.2s`                   | transition     | Duration of the slice transform/opacity transitions (hover, highlight). Shared across this library's chart family.                                           |
| `--chart-font-family`                   | `inherit`                | font-family    | Font family for chart text (empty-state message and legend). Shared across the chart family.                                                                 |
| `--chart-empty-padding`                 | `32px 24px`              | padding        | Padding around the empty-state message shown when `data` has no slices.                                                                                      |
| `--chart-empty-color`                   | `#9ca3af`                | color          | Text color of the empty-state message.                                                                                                                       |
| `--chart-legend-swatch-size`            | `12px`                   | width / height | Size of each legend row's color swatch.                                                                                                                      |
| `--chart-legend-font-size`              | `12px`                   | font-size      | Font size of legend labels.                                                                                                                                  |
| `--chart-legend-color`                  | `#333`                   | color          | Text color of legend labels.                                                                                                                                 |
| `--piechart-hover-scale`                | `1.05`                   | transform      | Scale factor applied to the highlighted (hovered or programmatic) slice.                                                                                     |
| `--piechart-dimmed-opacity`             | `0.3`                    | opacity        | Opacity of non-highlighted slices when any slice is active.                                                                                                  |
| `--piechart-label-color`                | `#333`                   | fill           | Color of slice labels.                                                                                                                                       |
| `--piechart-label-font-size`            | `12px`                   | font-size      | Font size of slice labels.                                                                                                                                   |
| `--piechart-semi-aspect-ratio`          | `2`                      | —              | Aspect ratio (width÷height) used when `semiCircle` is true and `aspectRatio` prop is not set.                                                                |
| `--piechart-delta-top`                  | `8px`                    | top            | Top offset of the delta badge overlay.                                                                                                                       |
| `--piechart-delta-right`                | `8px`                    | right          | Right offset of the delta badge overlay.                                                                                                                     |
| `--piechart-legend-gap`                 | `8px`                    | gap            | Row gap in the `legendShowValues` table.                                                                                                                     |
| `--piechart-legend-padding`             | `12px 0 0 0`             | padding        | Padding on the `legendShowValues` container.                                                                                                                 |
| `--piechart-legend-label-min-width`     | `120px`                  | min-width      | Minimum width of the label column in the `legendShowValues` table; aligns value columns across rows.                                                         |
| `--piechart-legend-value-min-width`     | `60px`                   | min-width      | Minimum width of the value column; combined with `text-align: right` for tabular alignment.                                                                  |
| `--piechart-legend-value-font-size`     | `12px`                   | font-size      | Font size of the value column text in the `legendShowValues` table.                                                                                          |
| `--piechart-legend-value-color`         | `#333`                   | color          | Text color of the value column in the `legendShowValues` table.                                                                                              |
| `--piechart-legend-column-gap`          | `16px`                   | gap            | Gap between the chart and the legend when `legendPosition="right"`.                                                                                          |
| `--piechart-legend-column-max-width`    | `50%`                    | max-width      | Upper bound on the legend column's width when `legendPosition="right"`, so a long label cannot starve the chart.                                             |
| `--piechart-legend-column-padding`      | `0`                      | padding        | Padding on the legend list when `legendPosition="right"` (the below-chart placement keeps `--piechart-legend-padding`).                                      |
| `--piechart-legend-more-color`          | `#2563eb`                | color          | Text color of the `+N more` control.                                                                                                                         |
| `--piechart-legend-more-font-size`      | `12px`                   | font-size      | Font size of the `+N more` control.                                                                                                                          |
| `--piechart-legend-more-margin-top`     | `8px`                    | margin-top     | Space between the last legend row and the `+N more` control.                                                                                                 |
| `--piechart-legend-more-padding`        | `2px 4px`                | padding        | Padding on the `+N more` control.                                                                                                                            |
| `--piechart-legend-row-gap`             | `6px`                    | gap            | Inline gap between swatch, label, and value within each legend row.                                                                                          |
| `--piechart-legend-swatch-radius`       | `2px`                    | border-radius  | Border radius of the color swatch in each legend row.                                                                                                        |
| `--chart-transition-easing`             | `ease`                   | transition     | Easing curve of the slice transform/opacity transitions (hover, highlight). Falls back through `--motion-easing`. Shared across this library's chart family. |
| `--piechart-slice-focus-outline`        | `2px solid currentColor` | outline        | Focus ring drawn on a keyboard-focused slice.                                                                                                                |
| `--piechart-slice-focus-outline-offset` | `2px`                    | outline-offset | Offset of the keyboard-focus ring on a slice.                                                                                                                |

The expander's keyboard focus ring uses `--piechart-legend-more-focus-outline` (default `2px solid currentColor`, with a `2px` outline offset).

With `onlegendmore`, the control is an action button, not a disclosure: it does not claim an `aria-expanded` state or a dialog destination that the callback may not use. Consumers own accessibility and focus management for any UI their callback opens.

The delta badge is themeable via the `DeltaIndicator` CSS variables (e.g. `--delta-indicator-positive-color`, `--delta-indicator-negative-color`, `--delta-indicator-font-size`).

## Type Reference

```typescript
import type { ChartHighlightAPI } from '@juspay/svelte-ui-components';

type PieChartSlice = {
  label: string;
  value: number;
  color?: string;
};

// Returned by onChartReady:
type ChartHighlightAPI = {
  highlight: (index: number | null) => void;
  getCategories: () => string[];
  type: 'donut-chart'; // always 'donut-chart' for PieChart
};
```

## Utility: formatNumberIndian

`formatNumberIndian` is exported from the library root and formats a number in the Indian denomination system (Cr / L / K), useful as a `valueFormat` callback:

```svelte
<script>
  import { PieChart, formatNumberIndian } from '@juspay/svelte-ui-components';
</script>

<PieChart {data} valueFormat={formatNumberIndian} legendShowValues percentDecimals={1} />
```

Thresholds: ≥ 1 Cr (10 million) → `"1.5Cr"`, ≥ 1 L (100 thousand) → `"2.3L"`, ≥ 1 K (1 thousand) → `"4.7K"`, otherwise `toLocaleString('en-IN')`.

## Web Component

`sui-pie-chart` is registered by the web-component bundle:

```html
<script type="module" src="@juspay/svelte-ui-components/wc"></script>

<sui-pie-chart show-legend legend-show-values legend-position="right" legend-max-items="5">
</sui-pie-chart>

<script>
  document.querySelector('sui-pie-chart').data = [
    { label: 'UPI', value: 62 },
    { label: 'Cards', value: 21 },
    { label: 'Netbanking', value: 9 }
  ];
</script>
```

**Scalar props are kebab-case attributes**, coerced to their declared type: `inner-radius`, `pad-angle`, `show-labels`, `show-values`, `label-position`, `show-legend`, `start-angle`, `aspect-ratio`, `max-height`, `min-height`, `semi-circle`, `legend-show-values`, `legend-position`, `legend-max-items`, `percent-decimals`, `highlighted-index`, `change-percentage`, `change-invert-colors`, `test-id`, `classes`. Booleans are presence-based, so `show-legend` is on and removing the attribute turns it off.

**Everything else is a JS property**, because arrays, objects and functions cannot cross the HTML-attribute boundary:

```js
const chart = document.querySelector('sui-pie-chart');
chart.data = slices;
chart.valueFormat = (value) => `₹${value}`;
chart.onsliceclick = ({ index, slice }) => console.log(index, slice.label);
chart.onlegendmore = () => openBreakdownDrawer();
chart.onchartready = (api) => narrator.attach(api);
```

### Web Component Events

`onlegendmore`, `onchartready`, `onsliceclick`, and `onslicehover` are available as JS properties,
and each also dispatches a same-named DOM custom event (bubbles, composed) for a consumer who only
calls `addEventListener` — `chartready`'s detail is the chart API, `sliceclick`'s and
`slicehover`'s are `{ index, slice }` (`slicehover`'s may be `null` when the pointer leaves every
slice), `legendmore`'s carries no detail:

```js
const chart = document.querySelector('sui-pie-chart');
chart.addEventListener('legendmore', () => openBreakdownDrawer());
chart.addEventListener('chartready', (e) => e.detail.highlight(2));
chart.addEventListener('sliceclick', (e) => select(e.detail.slice.label));
chart.addEventListener('slicehover', (e) => setHovered(e.detail?.slice ?? null));
```

**`center` and `empty` are slots**, not properties — a plain-HTML consumer cannot construct a Svelte snippet:

```html
<sui-pie-chart inner-radius="0.6">
  <div slot="center"><strong>₹4.2Cr</strong></div>
  <span slot="empty">No transactions in this period</span>
</sui-pie-chart>
```

Leaving a slot empty keeps the component's own default, so an unslotted element still renders the built-in empty state rather than a blank box.

`tooltipSnippet` has no slot equivalent. It is called with `(slice, index)`, and a slot cannot receive those arguments, so it stays available only to Svelte consumers.

> **Correction.** Revisions of this page before `4.12` documented `<sui-pie-chart>` while no wrapper existed — there was no `PieChart.wc.svelte` and no `customElements.define('sui-pie-chart', …)`, so the element never upgraded and the markup rendered nothing. If you followed that section and saw an empty space, this is why. The wrapper described above is the real one.

> **Svelte-only:** `tooltipSnippet` (receives `PieChartSlice, number`) takes arguments, so it cannot be expressed as a named slot on `<sui-pie-chart>`: a Web Component `<slot>` projects markup, it does not forward Svelte snippet parameters, so the slice and index would be silently dropped. Use the Svelte component directly when you need a custom tooltip.
