# SankeyChart

A responsive SVG Sankey diagram for visualizing flows between nodes. Automatically positions nodes into columns via topological ordering and iterative relaxation. Link widths are proportional to flow values. Hovering highlights all connected nodes and dims unrelated ones (opt-out via `disableDimOnHover`). Supports a configurable minimum link/node thickness (`minLinkWidth`) so tiny flows remain visible, and a horizontal label offset (`dataLabelOffsetX`) for fine-grained spacing between node bars and their text labels.

## Usage

```svelte
<script>
  import { SankeyChart } from '@juspay/svelte-ui-components';

  const nodes = [
    { id: 'source-a', label: 'Source A' },
    { id: 'source-b', label: 'Source B' },
    { id: 'process-1', label: 'Process 1' },
    { id: 'output', label: 'Output' }
  ];

  const links = [
    { source: 'source-a', target: 'process-1', value: 40 },
    { source: 'source-b', target: 'process-1', value: 30 },
    { source: 'process-1', target: 'output', value: 70 }
  ];
</script>

<SankeyChart {nodes} {links} />
```

### With Flow Values

```svelte
<SankeyChart {nodes} {links} showValues />
```

### Custom Node Colors

```svelte
<script>
  const nodes = [
    { id: 'a', label: 'A', color: '#4285f4' },
    { id: 'b', label: 'B', color: '#34a853' }
  ];
</script>
```

### Column Labels

```svelte
<SankeyChart {nodes} {links} columnLabels={['Input', 'Processing', 'Output']} />
```

### Custom Node Colors via Resolver

```svelte
<script>
  const resolveColor = (id, label) => {
    if (id.startsWith('error-')) return '#ef4444';
    return null; // fall through to default palette
  };
</script>

<SankeyChart {nodes} {links} nodeColorResolver={resolveColor} />
```

### Minimum Link Width — keep tiny flows visible

Use `minLinkWidth` to ensure flows with very small values still render as a visible band rather than collapsing to a sub-pixel line. Particularly useful for dense payment-flow diagrams where failure rates are small fractions of the total.

```svelte
<SankeyChart {nodes} {links} minLinkWidth={3} />
```

### Data Label Offset — breathing room between nodes and labels

`dataLabelOffsetX` shifts every node label further away from (positive) or closer to (negative) its node bar. Lighthouse uses `30` for dense diagrams.

```svelte
<SankeyChart {nodes} {links} dataLabelOffsetX={30} />
```

### Disable Dim on Hover — all nodes stay at full opacity

When you want the overall flow structure to remain fully readable while the user inspects one node, set `disableDimOnHover`. All nodes and links stay at their normal opacity regardless of hover state.

```svelte
<SankeyChart {nodes} {links} disableDimOnHover />
```

### Custom Tooltip

```svelte
<SankeyChart {nodes} {links}>
  {#snippet tooltipSnippet(context)}
    <div style="background: #333; color: white; padding: 8px; border-radius: 4px;">
      {#if context.type === 'node'}
        <strong>{context.node.label ?? context.node.id}</strong>: {context.value}
      {:else}
        <!-- sourceLabel, targetLabel, percentage are always set by the chart at runtime -->
        <strong>{context.sourceLabel} → {context.targetLabel}</strong>:
        {context.link.value} ({context.percentage?.toFixed(2)}% of source)
      {/if}
    </div>
  {/snippet}
</SankeyChart>
```

### Empty State

```svelte
<SankeyChart nodes={[]} links={[]}>
  {#snippet empty()}
    <p>No flow data available.</p>
  {/snippet}
</SankeyChart>
```

### Label overflow & collisions

Node labels are laid out defensively so a crowded chart never renders overlapping text:

- Labels are truncated with a width-aware estimate (per character class, not a flat average), so
  uppercase-heavy labels cannot run under a neighbouring column's bars. Middle columns also budget
  for `dataLabelOffsetX`.
- Within each column, when two node centres sit closer than one label line, the smaller-value
  node's label is dropped entirely rather than overlapping.
- Any truncated or dropped label keeps its full text available via the node's hover `<title>`
  tooltip.

## Props

| Prop               | Type                                                    | Required | Default     | Description                                                                                                                                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| nodes              | `SankeyNode[]`                                          | Yes      | `-`         | Array of `{id, label?, color?}`. Each node becomes a vertical bar.                                                                                                                                                                                                                                      |
| links              | `SankeyLink[]`                                          | Yes      | `-`         | Array of `{source, target, value, color?}`. Each link becomes a curved band between nodes.                                                                                                                                                                                                              |
| nodeWidth          | `number`                                                | No       | `16`        | Width of each node bar in pixels.                                                                                                                                                                                                                                                                       |
| nodePadding        | `number`                                                | No       | `8`         | Vertical space between nodes in the same column.                                                                                                                                                                                                                                                        |
| iterations         | `number`                                                | No       | `6`         | Number of relaxation passes to minimize link crossings. Higher = better layout but slower.                                                                                                                                                                                                              |
| showValues         | `boolean`                                               | No       | `false`     | Whether to append the total flow value to each node label.                                                                                                                                                                                                                                              |
| showLabels         | `boolean`                                               | No       | `true`      | Whether to render node labels.                                                                                                                                                                                                                                                                          |
| aspectRatio        | `number`                                                | No       | `16/9`      | Width-to-height ratio.                                                                                                                                                                                                                                                                                  |
| valueFormat        | `(value: number) => string`                             | No       | abbreviated | Formatter for flow values.                                                                                                                                                                                                                                                                              |
| tooltipSnippet     | `Snippet<[SankeyTooltipContext]>`                       | No       | `-`         | Custom tooltip. Receives `{type: 'node', node, value}` on node hover, or `{type: 'link', link, sourceLabel, targetLabel, percentage}` on link hover. `sourceLabel`/`targetLabel` are pre-resolved human-readable names; `percentage` is the link's share of the source node's total flow (0–100, 2 dp). |
| empty              | `Snippet`                                               | No       | `-`         | Content rendered when `nodes` is empty.                                                                                                                                                                                                                                                                 |
| testId             | `string`                                                | No       | `-`         | Value for the data-pw attribute on the chart container.                                                                                                                                                                                                                                                 |
| classes            | `string`                                                | No       | `-`         | CSS class string applied to the top-level element.                                                                                                                                                                                                                                                      |
| columnLabels       | `string[]`                                              | No       | `-`         | Labels rendered above each column (index 0 = first column). Positioned above the chart area, centered on the column midpoint.                                                                                                                                                                           |
| nodeColorResolver  | `(id: string, label: string \| null) => string \| null` | No       | `-`         | Called for each node and also for link strokes (links inherit the source node's resolved colour). Return a CSS colour string to override the default palette, or `null` to fall through. `label` is `null` when the node has no label.                                                                  |
| minLinkWidth       | `number`                                                | No       | `1`         | Minimum rendered thickness (px) for any link or node bar. Tiny flows that would otherwise collapse to sub-pixel widths remain at this thickness so they stay visually discoverable. Lighthouse uses `2`–`3` for dense payment-flow diagrams.                                                            |
| dataLabelOffsetX   | `number`                                                | No       | `0`         | Horizontal offset in pixels applied to every node data-label, relative to the default position. Positive values push the label further away from the node bar; negative values pull it closer. Lighthouse uses `30` to create breathing room in dense diagrams.                                         |
| disableDimOnHover  | `boolean`                                               | No       | `false`     | When `true`, hovering a node does not dim unrelated nodes — all nodes and links remain at full opacity. Useful for dense diagrams where the standard dim effect makes the overall flow structure hard to read.                                                                                           |

## Events

| Event       | Type                                            | Description                   |
| ----------- | ----------------------------------------------- | ----------------------------- |
| onnodeclick | `(event: { node: SankeyNode }) => void`         | Fires when a node is clicked. |
| onlinkclick | `(event: { link: SankeyLink }) => void`         | Fires when a link is clicked. |
| onnodehover | `(event: { node: SankeyNode } \| null) => void` | Fires on node hover or leave. |
| onlinkhover | `(event: { link: SankeyLink } \| null) => void` | Fires on link hover or leave. |

## CSS Variables

In addition to the shared `--chart-*` variables (see BarChart docs), SankeyChart exposes:

| Variable                       | Default | CSS Property | Description                                          |
| ------------------------------ | ------- | ------------ | ---------------------------------------------------- |
| `--sankey-dimmed-opacity`      | `0.15`  | opacity      | Opacity of non-connected nodes/labels when hovering. Has no effect when `disableDimOnHover` is `true`. |
| `--sankey-label-color`         | `#333`  | fill         | Color of node labels.                                |
| `--sankey-label-font-size`     | `12px`  | font-size    | Font size of node labels.                            |
| `--sankey-col-label-color`     | `#666`  | fill         | Color of column header labels (`columnLabels` prop). |
| `--sankey-col-label-font-size` | `11px`  | font-size    | Font size of column header labels.                   |

## Type Reference

```typescript
type SankeyNode = {
  id: string;
  label?: string;
  color?: string;
};

type SankeyLink = {
  source: string;
  target: string;
  value: number;
  color?: string;
};

type SankeyTooltipContext =
  | { type: 'node'; node: SankeyNode; value: number }
  | {
      type: 'link';
      link: SankeyLink;
      /** Human-readable label of the source node (falls back to node id when label is undefined). Always present at runtime. */
      sourceLabel?: string;
      /** Human-readable label of the target node (falls back to node id when label is undefined). Always present at runtime. */
      targetLabel?: string;
      /** link.value as a percentage of the source node's total outgoing value (0–100, rounded to 2 dp). Always present at runtime. */
      percentage?: number;
    };
```

The `tooltipSnippet` prop receives a `SankeyTooltipContext`. In the `'link'` branch, `sourceLabel` and `targetLabel` are pre-resolved human-readable names (falling back to the node id when no `label` is set), and `percentage` gives the link's share of the source node's total flow as a 0–100 value rounded to two decimal places.

> **Additive / backward-compatible:** The `'link'` branch of `SankeyTooltipContext` gained three new optional fields — `sourceLabel`, `targetLabel`, and `percentage`. They are always populated at runtime by the chart. Existing consumer code that typed a variable as `{ type: 'link'; link: SankeyLink }` continues to compile without changes. Accessing the new fields requires adding `sourceLabel?: string`, `targetLabel?: string`, and `percentage?: number` (or widening to `SankeyTooltipContext`) in the consumer's type annotation.
