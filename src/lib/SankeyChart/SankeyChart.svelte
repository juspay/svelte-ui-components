<script lang="ts">
  import type { SankeyChartProperties, SankeyTooltipContext } from './properties';
  import ChartContainer from '$lib/_chart/ChartContainer.svelte';
  import ChartTooltip from '$lib/_chart/ChartTooltip.svelte';
  import { computeSankeyLayout } from '$lib/_chart/geometry';
  import { getColor } from '$lib/_chart/colors';
  import { formatNumber } from '$lib/_chart/format';
  import { DEFAULT_CHART_CORNER_RADIUS } from '$lib/_chart/types';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';

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
    radius = DEFAULT_CHART_CORNER_RADIUS,
    maxHeight = Infinity,
    valueFormat,
    tooltipSnippet,
    empty,
    onnodeclick,
    onlinkclick,
    onnodehover,
    onlinkhover,
    testId,
    classes,
    columnLabels,
    nodeColorResolver,
    minLinkWidth = 1,
    dataLabelOffsetX = 0,
    disableDimOnHover = false
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
      iterations,
      minLinkWidth
    )
  );

  /**
   * Pre-computed colour map for all nodes. Keyed by node id. Computed once per layout
   * change rather than re-running find() + indexOf() for every link on every render.
   *
   * Note: nodeColorResolver also controls link stroke colours (links inherit source-node
   * colour), not just node fill colours. See Props docs for full description.
   */
  let nodeColorMap = $derived.by(() => {
    const map = new SvelteMap<string, string>();
    for (let ni = 0; ni < layout.nodes.length; ni++) {
      const node = layout.nodes[ni];
      const color = node.color ?? nodeColorResolver?.(node.id, node.label ?? null) ?? getColor(ni);
      map.set(node.id, color);
    }
    return map;
  });

  // Column count and width — used by columnLabels rendering
  let columnCount = $derived(
    layout.nodes.length > 0 ? Math.max(...layout.nodes.map((n) => n.column)) + 1 : 0
  );
  let colWidth = $derived(
    columnCount <= 1
      ? Math.max(0, chartWidth - MARGIN * 2)
      : (Math.max(0, chartWidth - MARGIN * 2) - nodeWidth) / (columnCount - 1)
  );

  // Node labels render alongside their bar; long labels used to overflow into the
  // next column and collide. Clip each to the horizontal room its column actually
  // has and append an ellipsis (the full text stays available via the node tooltip).
  const LABEL_CHAR_PX = 7.2; // ≈ 0.6em at the 12px default label size
  const truncateLabel = (text: string, column: number): string => {
    const available =
      column === 0
        ? MARGIN + 16
        : column === columnCount - 1
          ? Math.max(colWidth, MARGIN + 24)
          : Math.max(0, colWidth - nodeWidth - 12);
    const maxChars = Math.floor(available / LABEL_CHAR_PX);
    // No usable room — hide the label rather than force text that would overflow;
    // the full text is still reachable via the node's <title> on hover.
    if (maxChars < 3) {
      return '';
    }
    return text.length > maxChars ? text.slice(0, maxChars - 1) + '…' : text;
  };

  // ── Helpers ────────────────────────────────────────────────────

  /** Percentage of source node's total value carried by a link (0–100, 2 dp). */
  const computeLinkPct = (sourceId: string, linkValue: number): number => {
    const sourceNode = layout.nodes.find((nd) => nd.id === sourceId);
    if (!sourceNode) {
      return 0;
    }
    const sourceTotal = sourceNode.value;
    return sourceTotal > 0 ? Math.round((linkValue / sourceTotal) * 10000) / 100 : 0;
  };

  let connectedNodes = $derived.by(() => {
    if (disableDimOnHover) {
      return null;
    }
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

  /**
   * Pre-computed link tooltip data for the currently hovered link. Computed once and shared
   * by both `tooltipData` and `tooltipContext` to avoid running the O(n) percentage lookup
   * twice on every hover state change.
   */
  let hoveredLinkCache = $derived.by(() => {
    if (hoveredLink === null) {
      return null;
    }
    const l = links.find(
      (lk) => lk.source === hoveredLink!.source && lk.target === hoveredLink!.target
    );
    if (!l) {
      return null;
    }
    const sourceLabelText = nodes.find((nd) => nd.id === l.source)?.label ?? l.source;
    const targetLabelText = nodes.find((nd) => nd.id === l.target)?.label ?? l.target;
    const pct = computeLinkPct(l.source, l.value);
    return { link: l, sourceLabel: sourceLabelText, targetLabel: targetLabelText, percentage: pct };
  });

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
    if (hoveredLinkCache !== null) {
      const { link: l, sourceLabel, targetLabel, percentage: pct } = hoveredLinkCache;
      return {
        title: `${sourceLabel} → ${targetLabel}`,
        items: [
          { label: 'Flow', value: format(l.value) },
          { label: 'of source', value: `${pct.toFixed(2)}%` }
        ]
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
    if (hoveredLinkCache !== null) {
      const { link: l, sourceLabel, targetLabel, percentage: pct } = hoveredLinkCache;
      return {
        type: 'link',
        link: l,
        sourceLabel,
        targetLabel,
        percentage: pct
      };
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
    <ChartContainer bind:width={chartWidth} bind:height={chartHeight} {aspectRatio} {maxHeight}>
      <g transform="translate({MARGIN}, {MARGIN})">
        {#if columnLabels != null && columnLabels.length > 0}
          {#each columnLabels.slice(0, columnCount) as label, ci (ci)}
            <text
              class="sankey-col-label"
              x={ci * colWidth + nodeWidth / 2}
              y={-8}
              text-anchor="middle"
              dominant-baseline="auto">{label}</text
            >
          {/each}
        {/if}

        {#each layout.links as link, i (i)}
          {@const highlighted = isLinkHighlighted(link.source, link.target)}
          {@const dimmed =
            !disableDimOnHover && (hoveredNode !== null || hoveredLink !== null) && !highlighted}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <path
            class="sankey-link"
            d={link.path}
            fill="none"
            stroke={link.color ?? nodeColorMap.get(link.source) ?? getColor(0)}
            stroke-width={Math.max(minLinkWidth, link.width)}
            stroke-opacity={highlighted ? 0.7 : dimmed ? 0.08 : 0.4}
            onmouseenter={(e) => handleLinkEnter(e, link.source, link.target)}
            onmousemove={trackMouse}
            onmouseleave={handleLinkLeave}
            onclick={() => handleLinkClick(link.source, link.target)}
          />
        {/each}

        {#each layout.nodes as node, ni (ni)}
          {@const color = nodeColorMap.get(node.id) ?? getColor(ni)}
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
            rx={radius}
            ry={radius}
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
              x={node.column === 0
                ? node.x - 6 - dataLabelOffsetX
                : node.x + node.width + 6 + dataLabelOffsetX}
              y={node.y + node.height / 2}
              text-anchor={node.column === 0 ? 'end' : 'start'}
              dominant-baseline="middle"
              >{truncateLabel(
                showValues ? `${node.label} (${format(node.value)})` : node.label,
                node.column
              )}<title>{showValues ? `${node.label} (${format(node.value)})` : node.label}</title
              ></text
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
  .sankey-col-label {
    fill: var(--sankey-col-label-color, #666);
    font-size: var(--sankey-col-label-font-size, 11px);
    font-family: var(--chart-font-family, inherit);
    pointer-events: none;
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
