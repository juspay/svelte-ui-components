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
<FunnelChart
  data={stages}
  valueFormat={(value) => value.toLocaleString()}
/>
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

## Props

| Prop            | Type                                              | Required | Default                               | Description                                                                                                                                       |
| --------------- | ------------------------------------------------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| data            | `FunnelStage[]`                                   | Yes      | –                                     | Ordered array of `{ category, value }` stage objects. Stages are rendered left-to-right; the tallest bar corresponds to the maximum value.         |
| stageColors     | `string[]`                                        | No       | chart palette                         | Fill color for each stage bar, index-matched to `data`. Unspecified entries fall back to the shared chart palette.                                 |
| connectorColor  | `string`                                          | No       | `#BDFFFB`                             | Fill color for the trapezoidal connector shapes between consecutive stages.                                                                        |
| slopeWidth      | `number`                                          | No       | `10`                                  | Horizontal width (SVG units) of each slope connector. Larger values produce steeper visual drops.                                                  |
| onHoverExpand   | `number`                                          | No       | `10`                                  | Extra vertical pixels added symmetrically to the hovered stage bar. Set to `0` to disable.                                                        |
| showValueLabels | `boolean`                                         | No       | `true`                                | Whether to render the value and percentage label centred inside each stage bar.                                                                    |
| valueFormat     | `(value: number, max: number) => string`          | No       | `"<value>  \|  <pct>%"`              | Custom formatter for in-bar labels. Receives the stage value and the maximum value across all stages.                                              |
| aspectRatio     | `number`                                          | No       | `16 / 9`                              | Width-to-height ratio passed to `ChartContainer`. Controls the chart's height relative to its container width.                                     |
| testId          | `string`                                          | No       | –                                     | Value for the `data-pw` attribute on the chart root element.                                                                                      |
| classes         | `string`                                          | No       | –                                     | CSS class string applied to the chart root element. Useful for scoping CSS-variable overrides.                                                     |
| empty           | `Snippet`                                         | No       | –                                     | Content rendered when `data` is empty or all values are zero.                                                                                     |

## Events

| Event        | Type                                                                   | Description                                                                 |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| onstageclick | `(event: { index: number; stage: FunnelStage }) => void`               | Fires when the user clicks a stage bar. Receives the index and stage data.  |
| onstagehover | `(event: { index: number; stage: FunnelStage } \| null) => void`       | Fires on stage hover and leave. Receives `null` when the pointer leaves.    |

## CSS Variables

Override these custom properties to theme the component.

| Variable                               | Default                     | CSS Property     | Description                                                   |
| -------------------------------------- | --------------------------- | ---------------- | ------------------------------------------------------------- |
| `--chart-background`                   | `transparent`               | background       | Background color of the chart container.                      |
| `--chart-font-family`                  | `inherit`                   | font-family      | Font family for all chart text.                               |
| `--chart-transition-duration`          | `0.2s`                      | transition       | Duration of hover and expand transitions.                     |
| `--chart-tooltip-background`           | `rgba(0,0,0,0.85)`          | background       | Background of the default tooltip.                            |
| `--chart-tooltip-color`                | `#fff`                      | color            | Text color of the default tooltip.                            |
| `--chart-tooltip-font-size`            | `12px`                      | font-size        | Font size of tooltip content.                                 |
| `--chart-tooltip-padding`              | `8px 12px`                  | padding          | Inner padding of the tooltip.                                 |
| `--chart-tooltip-border-radius`        | `4px`                       | border-radius    | Border radius of the tooltip.                                 |
| `--chart-tooltip-shadow`               | `0 2px 8px rgba(0,0,0,0.2)` | box-shadow       | Shadow on the tooltip.                                        |
| `--chart-empty-padding`                | `32px 24px`                 | padding          | Padding around the empty state content.                       |
| `--chart-empty-color`                  | `#9ca3af`                   | color            | Text color of the empty state.                                |
| `--funnel-chart-connector-color`       | `#BDFFFB`                   | fill             | Default fill for trapezoidal connector shapes.                |
| `--funnel-chart-label-color`           | `#666`                      | fill             | Color of the category labels above each stage bar.            |
| `--funnel-chart-label-font-size`       | `11px`                      | font-size        | Font size of category labels.                                 |
| `--funnel-chart-value-color`           | `#fff`                      | fill             | Color of the value/percentage labels inside bars.             |
| `--funnel-chart-value-font-size`       | `11px`                      | font-size        | Font size of in-bar value labels.                             |
| `--funnel-chart-bar-hover-opacity`     | `1`                         | opacity          | Opacity of the hovered stage bar.                             |
| `--funnel-chart-bar-dimmed-opacity`    | `0.35`                      | opacity          | Opacity of non-hovered bars when another stage is hovered.    |

## Type Reference

```typescript
type FunnelStage = {
  value: number;
  category: string;
};
```

## Web Component

```html
<sui-funnel-chart></sui-funnel-chart>

<script>
  const chart = document.querySelector('sui-funnel-chart');
  chart.data = [
    { category: 'Visit', value: 12000 },
    { category: 'Cart', value: 4200 },
    { category: 'Purchase', value: 980 }
  ];
  chart.stageColors = ['#4e79a7', '#f28e2b', '#59a14f'];
  chart.showValueLabels = true;
  chart.addEventListener('onstageclick', (e) => console.log(e.detail));
</script>
```

All props are exposed as web component properties. Array and object props (`data`, `stageColors`, `valueFormat`, `onstageclick`, `onstagehover`) must be set via JavaScript property assignment, not HTML attributes.
