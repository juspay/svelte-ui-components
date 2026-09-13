# FunnelChart

A horizontal funnel chart built entirely from pure SVG — no external charting library required. Each stage renders as a rectangle whose height is proportional to its value relative to the maximum stage, and consecutive stages are joined by trapezoidal connector polygons that visually convey the drop-off between steps. Supports per-stage color overrides, custom value-and-percentage labels, hover expansion, click/hover events, and full CSS-variable theming.

## Usage

```svelte
<script>
  import { FunnelChart } from '@juspay/svelte-ui-components';

  const stages = [
    { category: 'Visit', value: 12000 },
    { category: 'Product View', value: 8400 },
    { category: 'Add to Cart', value: 4200 },
    { category: 'Checkout', value: 2100 },
    { category: 'Purchase', value: 980 }
  ];
</script>

<FunnelChart data={stages} />
```

### Custom Stage Colors

```svelte
<FunnelChart
  data={stages}
  stageColors={['#8EE3F6', '#79E2E9', '#82DEE4', '#87E3D3', '#78CDBE']}
  connectorColor="#BDFFFB"
/>
```

### Custom Value Format

```svelte
<FunnelChart data={stages} valueFormat={(value) => value.toLocaleString()} />
```

### Hide Value Labels

```svelte
<FunnelChart data={stages} showValueLabels={false} />
```

### Wider Connectors

```svelte
<FunnelChart data={stages} slopeWidth={24} />
```

### Disable Hover Expansion

```svelte
<FunnelChart data={stages} onHoverExpand={0} />
```

### Events

```svelte
<FunnelChart
  data={stages}
  onstageclick={({ index, stage }) => console.log('clicked', stage.category, index)}
  onstagehover={(event) => console.log('hovered', event?.stage.category ?? 'none')}
/>
```

### Empty State

```svelte
<FunnelChart data={[]}>
  {#snippet empty()}
    <p>No funnel data available.</p>
  {/snippet}
</FunnelChart>
```

### Keyboard access

Every stage bar is a focusable `role="button"` element that mirrors pointer hover on
focus and fires its click event on `Enter`/`Space` — the same family-wide keyboard/
tooltip contract shared with BarChart, DualAxisBarChart, PieChart and SankeyChart. See
[PieChart's "Keyboard access" and "Synchronized legend recipe" sections](./PieChart.md#keyboard-access)
for the full contract.

## Props

| Prop            | Type                                     | Required | Default                        | Description                                                                                                                                                                 |
| --------------- | ---------------------------------------- | -------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| data            | `FunnelStage[]`                          | Yes      | –                              | Ordered array of `{ category, value }` stage objects. Stages are rendered left-to-right; the tallest bar corresponds to the maximum value.                                  |
| stageColors     | `string[]`                               | No       | chart palette                  | Fill color for each stage bar, index-matched to `data`. Unspecified entries fall back to the shared chart palette.                                                          |
| connectorColor  | `string`                                 | No       | `light-dark(#BDFFFB, #164e4a)` | Fill color for the trapezoidal connector shapes between consecutive stages. The default resolves per color scheme via CSS `light-dark()`.                                   |
| slopeWidth      | `number`                                 | No       | `10`                           | Horizontal width (SVG units) of each slope connector. Larger values produce steeper visual drops.                                                                           |
| onHoverExpand   | `number`                                 | No       | `10`                           | Extra vertical pixels added symmetrically to the hovered stage bar. Set to `0` to disable.                                                                                  |
| radius          | `number`                                 | No       | `4`                            | Corner radius on each stage bar in pixels.                                                                                                                                  |
| maxHeight       | `number`                                 | No       | `420`                          | Upper bound (px) on the rendered chart height.                                                                                                                              |
| minHeight       | `number`                                 | No       | `0`                            | Lower bound (px) on the rendered chart height.                                                                                                                              |
| showValueLabels | `boolean`                                | No       | `true`                         | Whether to render the value and percentage label centred inside each stage bar.                                                                                             |
| valueFormat     | `(value: number, max: number) => string` | No       | `"<value>  \|  <pct>%"`        | Custom formatter for in-bar labels. Receives the stage value and the maximum value across all stages.                                                                       |
| aspectRatio     | `number`                                 | No       | `16 / 9`                       | Width-to-height ratio passed to `ChartContainer`. Controls the chart's height relative to its container width.                                                              |
| testId          | `string`                                 | No       | –                              | Value for the `data-pw` attribute on the chart root element.                                                                                                                |
| classes         | `string`                                 | No       | –                              | CSS class string applied to the chart root element. Useful for scoping CSS-variable overrides.                                                                              |
| empty           | `Snippet`                                | No       | –                              | Content rendered when `data` is empty or all values are zero.                                                                                                               |
| tooltipPortal   | `boolean`                                | No       | `false`                        | Render the tooltip into the chart's own root (shadow root, or `document.body`) with `position: fixed`, clamped to the viewport, so scroll/overflow ancestors never clip it. |

## Events

| Event        | Type                                                             | Description                                                                |
| ------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| onstageclick | `(event: { index: number; stage: FunnelStage }) => void`         | Fires when the user clicks a stage bar. Receives the index and stage data. |
| onstagehover | `(event: { index: number; stage: FunnelStage } \| null) => void` | Fires on stage hover and leave. Receives `null` when the pointer leaves.   |

## CSS Variables

Override these custom properties to theme the component.

| Variable                            | Default                        | CSS Property  | Description                                                                                  |
| ----------------------------------- | ------------------------------ | ------------- | -------------------------------------------------------------------------------------------- |
| `--chart-background`                | `transparent`                  | background    | Background color of the chart container.                                                     |
| `--chart-font-family`               | `inherit`                      | font-family   | Font family for all chart text.                                                              |
| `--chart-transition-duration`       | `0.2s`                         | transition    | Duration of hover and expand transitions.                                                    |
| `--chart-tooltip-background`        | `rgba(0,0,0,0.85)`             | background    | Background of the default tooltip.                                                           |
| `--chart-tooltip-color`             | `#fff`                         | color         | Text color of the default tooltip.                                                           |
| `--chart-tooltip-font-size`         | `12px`                         | font-size     | Font size of tooltip content.                                                                |
| `--chart-tooltip-padding`           | `8px 12px`                     | padding       | Inner padding of the tooltip.                                                                |
| `--chart-tooltip-border-radius`     | `4px`                          | border-radius | Border radius of the tooltip.                                                                |
| `--chart-tooltip-shadow`            | `0 2px 8px rgba(0,0,0,0.2)`    | box-shadow    | Shadow on the tooltip.                                                                       |
| `--chart-empty-padding`             | `32px 24px`                    | padding       | Padding around the empty state content.                                                      |
| `--chart-axis-label-color`          | `light-dark(#333, #e5e7eb)`    | outline       | Focus outline colour on a keyboard-focused stage bar.                                        |
| `--chart-empty-color`               | `#9ca3af`                      | color         | Text color of the empty state.                                                               |
| `--funnel-chart-connector-color`    | `light-dark(#BDFFFB, #164e4a)` | fill          | Default fill for trapezoidal connector shapes.                                               |
| `--funnel-chart-label-color`        | `#666`                         | fill          | Color of the category labels above each stage bar.                                           |
| `--funnel-chart-label-font-size`    | `11px`                         | font-size     | Font size of category labels.                                                                |
| `--funnel-chart-value-color`        | auto (contrast)                | fill          | Overrides the automatic per-stage contrast color of the value/percentage labels inside bars. |
| `--funnel-chart-value-font-size`    | `11px`                         | font-size     | Font size of in-bar value labels.                                                            |
| `--funnel-chart-bar-hover-opacity`  | `1`                            | opacity       | Opacity of the hovered stage bar.                                                            |
| `--funnel-chart-bar-dimmed-opacity` | `0.35`                         | opacity       | Opacity of non-hovered bars when another stage is hovered.                                   |
| `--chart-transition-easing`         | `ease`                         | transition    | Easing curve of hover and expand transitions. Falls back through `--motion-easing`.          |

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
type FunnelStage = {
  value: number;
  category: string;
};
```

## Web Component

`sui-funnel-chart` is registered by the web-component bundle. `FunnelChart`
portals its tooltip via `tooltipPortal`, and a portalled node keeps its
shadow-scoped styles because `ChartTooltip` resolves the portal destination
from the node's own root (`getRootNode()`) instead of hardcoding
`document.body`.

```html
<script type="module" src="@juspay/svelte-ui-components/wc"></script>

<sui-funnel-chart show-value-labels connector-color="#BDFFFB" slope-width="24"></sui-funnel-chart>

<script>
  const chart = document.querySelector('sui-funnel-chart');
  chart.data = [
    { category: 'Visit', value: 12000 },
    { category: 'Product View', value: 8400 },
    { category: 'Add to Cart', value: 4200 },
    { category: 'Checkout', value: 2100 },
    { category: 'Purchase', value: 980 }
  ];
  chart.valueFormat = (value) => value.toLocaleString();
  chart.onstageclick = ({ index, stage }) => console.log('clicked', stage.category, index);
</script>
```

**Scalar props are kebab-case attributes**, coerced to their declared type:
`connector-color`, `slope-width`, `on-hover-expand`, `show-value-labels`,
`aspect-ratio`, `max-height`, `min-height`, `radius`, `tooltip-portal`, `test-id`,
`classes`. Booleans are presence-based, so `show-value-labels` is on by default and
adding `show-value-labels="false"` does not turn it off — remove the attribute
instead.

**Everything else is a JS property**, because arrays, objects and functions cannot
cross the HTML-attribute boundary:

```js
const chart = document.querySelector('sui-funnel-chart');
chart.data = stages;
chart.stageColors = ['#8EE3F6', '#79E2E9', '#82DEE4', '#87E3D3', '#78CDBE'];
chart.valueFormat = (value, max) => `${value} of ${max}`;
chart.onstageclick = ({ index, stage }) => console.log(index, stage.category);
chart.onstagehover = (event) => console.log(event?.stage.category ?? 'none');
```

Assigning `onstageclick` and `onstagehover` as properties, as above, still works
exactly as shown. Each also dispatches a same-named DOM event with `detail` set to
the same argument the property callback receives (`null` for `onstagehover` when
the pointer leaves a stage), so `addEventListener` works too:

```js
chart.addEventListener('stageclick', (e) => console.log(e.detail.index, e.detail.stage.category));
chart.addEventListener('stagehover', (e) => console.log(e.detail?.stage.category ?? 'none'));
```

### Slots

| Slot    | Replaces                                                                   |
| ------- | -------------------------------------------------------------------------- |
| `empty` | The empty state shown when `data` is empty or every stage's value is zero. |

Supply it only when you mean to: with no `empty` slot the component falls through
to its own chart frame, and an empty slot would replace that frame with a blank box.

> **Svelte-only:** unlike `SankeyChart` and `PieChart`, `FunnelChart` has no
> `tooltipSnippet` (or any other tooltip-customizing prop) — it always renders
> `ChartTooltip`'s built-in markup. There is no parameterized snippet here for a
> `<slot>` to drop the arguments of, and nothing for a Web Component consumer to
> lose by using `<sui-funnel-chart>` instead of the Svelte component.
