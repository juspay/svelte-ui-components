# SankeyChart

A responsive SVG Sankey diagram for visualizing flows between nodes. Automatically positions nodes into columns via topological ordering and iterative relaxation. Link widths are proportional to flow values. Hovering highlights all connected nodes and dims unrelated ones.

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

### Custom Tooltip

```svelte
<SankeyChart {nodes} {links}>
  {#snippet tooltipSnippet(context)}
    <div style="background: #333; color: white; padding: 8px; border-radius: 4px;">
      {#if context.type === 'node'}
        <strong>{context.node.label ?? context.node.id}</strong>: {context.value}
      {:else}
        <strong>{context.link.source} → {context.link.target}</strong>: {context.link.value}
      {/if}
    </div>
  {/snippet}
</SankeyChart>
```

## Props

| Prop           | Type                                      | Required | Default      | Description                                                                                                    |
| -------------- | ----------------------------------------- | -------- | ------------ | -------------------------------------------------------------------------------------------------------------- |
| nodes          | `SankeyNode[]`                            | Yes      | `-`          | Array of `{id, label?, color?}`. Each node becomes a vertical bar.                                             |
| links          | `SankeyLink[]`                            | Yes      | `-`          | Array of `{source, target, value, color?}`. Each link becomes a curved band between nodes.                     |
| nodeWidth      | `number`                                  | No       | `16`         | Width of each node bar in pixels.                                                                              |
| nodePadding    | `number`                                  | No       | `8`          | Vertical space between nodes in the same column.                                                               |
| iterations     | `number`                                  | No       | `6`          | Number of relaxation passes to minimize link crossings. Higher = better layout but slower.                     |
| showValues     | `boolean`                                 | No       | `false`      | Whether to append the total flow value to each node label.                                                     |
| showLabels     | `boolean`                                 | No       | `true`       | Whether to render node labels.                                                                                 |
| aspectRatio    | `number`                                  | No       | `16/9`       | Width-to-height ratio.                                                                                         |
| valueFormat    | `(value: number) => string`               | No       | abbreviated  | Formatter for flow values.                                                                                     |
| tooltipSnippet | `Snippet<[SankeyTooltipContext]>`         | No       | `-`          | Custom tooltip. Receives `{type: 'node', node, value}` or `{type: 'link', link}`.                              |
| empty          | `Snippet`                                 | No       | `-`          | Content rendered when `nodes` is empty.                                                                        |
| testId         | `string`                                  | No       | `-`          | Value for the data-pw attribute on the chart container.                                                        |
| classes        | `string`                                  | No       | `-`          | CSS class string applied to the top-level element.                                                             |

## Events

| Event          | Type                                         | Description                                      |
| -------------- | -------------------------------------------- | ------------------------------------------------ |
| onnodeclick    | `(event: { node: SankeyNode }) => void`      | Fires when a node is clicked.                    |
| onlinkclick    | `(event: { link: SankeyLink }) => void`      | Fires when a link is clicked.                    |
| onnodehover    | `(event: { node: SankeyNode } \| null) => void` | Fires on node hover or leave.                |
| onlinkhover    | `(event: { link: SankeyLink } \| null) => void` | Fires on link hover or leave.                |

## CSS Variables

In addition to the shared `--chart-*` variables (see BarChart docs), SankeyChart exposes:

| Variable                            | Default   | CSS Property     | Description                                               |
| ----------------------------------- | --------- | ---------------- | --------------------------------------------------------- |
| `--sankey-dimmed-opacity`           | `0.15`    | opacity          | Opacity of non-connected nodes/labels when hovering.      |
| `--sankey-label-color`              | `#333`    | fill             | Color of node labels.                                     |
| `--sankey-label-font-size`          | `12px`    | font-size        | Font size of node labels.                                 |

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
  | { type: 'link'; link: SankeyLink };
```
