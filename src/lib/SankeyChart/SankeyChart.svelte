<script lang="ts">
  import type { SankeyChartProperties, SankeyTooltipContext } from './properties';
  import ChartContainer from '$lib/_chart/ChartContainer.svelte';
  import ChartTooltip from '$lib/_chart/ChartTooltip.svelte';
  import { computeSankeyLayout } from '$lib/_chart/geometry';
  import { getColor } from '$lib/_chart/colors';
  import { formatNumber } from '$lib/_chart/format';
  import { SvelteSet } from 'svelte/reactivity';

  // ── Props ──────────────────────────────────────────────────────

  let {
    nodes,
    links,
    nodeWidth = 16,
    nodePadding = 8,
    iterations = 6,
    showValues = false,
    showLabels = true,
    aspectRatio = 16 / 9,
    valueFormat,
    tooltipSnippet,
    empty,
    onnodeclick,
    onlinkclick,
    onnodehover,
    onlinkhover,
    testId,
    classes
  }: SankeyChartProperties = $props();

  // ── State ──────────────────────────────────────────────────────

  let containerEl: HTMLDivElement | null = $state(null);
  let chartWidth = $state(0);
  let chartHeight = $state(0);
  let hoveredNode = $state<string | null>(null);
  let hoveredLink = $state<{ source: string; target: string } | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);

  // ── Layout ─────────────────────────────────────────────────────

  let format = $derived(valueFormat ?? formatNumber);
  let isEmpty = $derived(nodes.length === 0);
  const MARGIN = 40;
  let layout = $derived(
    computeSankeyLayout(
      nodes,
      links,
      Math.max(0, chartWidth - MARGIN * 2),
      Math.max(0, chartHeight - MARGIN * 2),
      nodeWidth,
      nodePadding,
      iterations
    )
  );

  let connectedNodes = $derived.by(() => {
    if (hoveredNode !== null) {
      const connected = new SvelteSet<string>([hoveredNode]);
      for (const l of links) {
        if (l.source === hoveredNode || l.target === hoveredNode) {
          connected.add(l.source);
          connected.add(l.target);
        }
      }
      return connected;
    }
    if (hoveredLink !== null) {
      return new SvelteSet([hoveredLink.source, hoveredLink.target]);
    }
    return null;
  });

  // ── Tooltip ────────────────────────────────────────────────────

  let tooltipData = $derived.by(() => {
    if (hoveredNode !== null) {
      const n = layout.nodes.find((nd) => nd.id === hoveredNode);
      if (!n) {
        return null;
      }
      return {
        title: n.label,
        items: [
          {
            label: 'Total flow',
            value: format(n.value),
            color: n.color ?? getColor(layout.nodes.indexOf(n))
          }
        ]
      };
    }
    if (hoveredLink !== null) {
      const l = links.find(
        (lk) => lk.source === hoveredLink!.source && lk.target === hoveredLink!.target
      );
      if (!l) {
        return null;
      }
      return {
        title: `${nodes.find((n) => n.id === l.source)?.label ?? l.source} → ${nodes.find((n) => n.id === l.target)?.label ?? l.target}`,
        items: [{ label: 'Flow', value: format(l.value) }]
      };
    }
    return null;
  });

  let tooltipContext = $derived.by<SankeyTooltipContext | null>(() => {
    if (hoveredNode !== null) {
      const n = findNode(hoveredNode);
      const computed = layout.nodes.find((nd) => nd.id === hoveredNode);
      if (!n || !computed) {
        return null;
      }
      return { type: 'node', node: n, value: computed.value };
    }
    if (hoveredLink !== null) {
      const l = findLink(hoveredLink.source, hoveredLink.target);
      if (!l) {
        return null;
      }
      return { type: 'link', link: l };
    }
    return null;
  });

  // ── Interactions ───────────────────────────────────────────────

  function trackMouse(e: MouseEvent) {
    if (containerEl === null) {
      return;
    }
    const rect = containerEl.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }

  function isLinkHighlighted(source: string, target: string): boolean {
    if (hoveredLink !== null) {
      return source === hoveredLink.source && target === hoveredLink.target;
    }
    if (hoveredNode !== null) {
      return source === hoveredNode || target === hoveredNode;
    }
    return false;
  }

  function findNode(id: string) {
    return nodes.find((n) => n.id === id);
  }

  function findLink(source: string, target: string) {
    return links.find((l) => l.source === source && l.target === target);
  }

  function handleNodeEnter(e: MouseEvent, id: string) {
    hoveredNode = id;
    trackMouse(e);
    const orig = findNode(id);
    if (orig) {
      onnodehover?.({ node: orig });
    }
  }

  function handleNodeLeave() {
    hoveredNode = null;
    onnodehover?.(null);
  }

  function handleNodeClick(id: string) {
    const orig = findNode(id);
    if (orig) {
      onnodeclick?.({ node: orig });
    }
  }

  function handleLinkEnter(e: MouseEvent, source: string, target: string) {
    hoveredLink = { source, target };
    trackMouse(e);
    const orig = findLink(source, target);
    if (orig) {
      onlinkhover?.({ link: orig });
    }
  }

  function handleLinkLeave() {
    hoveredLink = null;
    onlinkhover?.(null);
  }

  function handleLinkClick(source: string, target: string) {
    const orig = findLink(source, target);
    if (orig) {
      onlinkclick?.({ link: orig });
    }
  }
</script>

<div
  class="sankey-chart {classes ?? ''}"
  bind:this={containerEl}
  data-pw={typeof testId === 'string' ? testId : null}
>
  {#if isEmpty && typeof empty === 'function'}
    <div class="chart-empty">{@render empty()}</div>
  {:else}
    <ChartContainer bind:width={chartWidth} bind:height={chartHeight} {aspectRatio}>
      <g transform="translate({MARGIN}, {MARGIN})">
        {#each layout.links as link, i (i)}
          {@const highlighted = isLinkHighlighted(link.source, link.target)}
          {@const dimmed = (hoveredNode !== null || hoveredLink !== null) && !highlighted}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <path
            class="sankey-link"
            d={link.path}
            fill="none"
            stroke={link.color ?? getColor(layout.nodes.findIndex((n) => n.id === link.source))}
            stroke-width={Math.max(1, link.width)}
            stroke-opacity={highlighted ? 0.7 : dimmed ? 0.08 : 0.4}
            onmouseenter={(e) => handleLinkEnter(e, link.source, link.target)}
            onmousemove={trackMouse}
            onmouseleave={handleLinkLeave}
            onclick={() => handleLinkClick(link.source, link.target)}
          />
        {/each}

        {#each layout.nodes as node, ni (ni)}
          {@const color = node.color ?? getColor(ni)}
          {@const dimmed = connectedNodes !== null && !connectedNodes.has(node.id)}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <rect
            class="sankey-node"
            class:node-dimmed={dimmed}
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            rx={2}
            ry={2}
            fill={color}
            onmouseenter={(e) => handleNodeEnter(e, node.id)}
            onmousemove={trackMouse}
            onmouseleave={handleNodeLeave}
            onclick={() => handleNodeClick(node.id)}
          />
          {#if showLabels}
            <text
              class="sankey-label"
              class:node-dimmed={dimmed}
              x={node.column === 0 ? node.x - 6 : node.x + node.width + 6}
              y={node.y + node.height / 2}
              text-anchor={node.column === 0 ? 'end' : 'start'}
              dominant-baseline="middle"
              >{node.label}{#if showValues}
                ({format(node.value)}){/if}</text
            >
          {/if}
        {/each}
      </g>
    </ChartContainer>

    {#if typeof tooltipSnippet === 'function' && tooltipContext !== null}
      <div class="chart-tooltip-slot" style="left: {mouseX + 12}px; top: {mouseY - 12}px;">
        {@render tooltipSnippet(tooltipContext)}
      </div>
    {:else}
      <ChartTooltip data={tooltipData} {mouseX} {mouseY} />
    {/if}
  {/if}
</div>

<style>
  .sankey-chart {
    width: 100%;
    position: relative;
  }
  .sankey-link {
    transition: stroke-opacity var(--chart-transition-duration, 0.2s) ease;
    cursor: pointer;
  }
  .sankey-node {
    transition: opacity var(--chart-transition-duration, 0.2s) ease;
    cursor: pointer;
  }
  .sankey-node.node-dimmed {
    opacity: var(--sankey-dimmed-opacity, 0.15);
  }
  .sankey-label {
    fill: var(--sankey-label-color, #333);
    font-size: var(--sankey-label-font-size, 12px);
    font-family: var(--chart-font-family, inherit);
    pointer-events: none;
    transition: opacity var(--chart-transition-duration, 0.2s) ease;
  }
  .sankey-label.node-dimmed {
    opacity: var(--sankey-dimmed-opacity, 0.15);
  }
  .chart-tooltip-slot {
    position: absolute;
    z-index: 10;
    pointer-events: none;
  }
  .chart-empty {
    padding: var(--chart-empty-padding, 32px 24px);
    color: var(--chart-empty-color, #9ca3af);
    text-align: center;
  }
</style>
