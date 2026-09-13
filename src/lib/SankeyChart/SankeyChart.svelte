<script lang="ts">
  import type { SankeyChartProperties, SankeyTooltipContext } from './properties';
  import ChartContainer from '$lib/_chart/ChartContainer.svelte';
  import ChartTooltip from '$lib/_chart/ChartTooltip.svelte';
  import { computeSankeyLayout } from '$lib/_chart/geometry';
  import { getColor } from '$lib/_chart/colors';
  import { formatNumber } from '$lib/_chart/format';
  import { measureText, readCssVarPx } from '$lib/_chart/measure';
  import { pointerPositionIn, dismissOnOutsidePointerDown } from '$lib/_chart/interactions';
  import { truncateToWidth } from '$lib/_chart/labels';
  import {
    DEFAULT_CHART_CORNER_RADIUS,
    DEFAULT_CHART_MAX_HEIGHT,
    type TooltipAnchor
  } from '$lib/_chart/types';
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
    maxHeight = DEFAULT_CHART_MAX_HEIGHT,
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
    disableDimOnHover = false,
    firstColumnLabelSide = 'left',
    lastColumnLabelSide = 'right',
    marginX = 40,
    tooltipPortal = false
  }: SankeyChartProperties = $props();

  // ── State ──────────────────────────────────────────────────────

  let containerEl: HTMLDivElement | null = $state(null);
  let chartWidth = $state(0);
  let chartHeight = $state(0);
  // `hoveredNode`/`hoveredLink` (pointer) and `focusedNode`/`focusedLink`
  // (keyboard) are kept as separate state rather than one pair shared by
  // both input sources: a pointer leaving a node/link must never erase that
  // node/link's focus, and a late/stale pointerleave -- which real browsers
  // fire *after* a focus event when focusing an off-screen node/link
  // auto-scrolls the page under an unmoved cursor -- must not be able to
  // clobber the focus highlight either. See `activeNode`/`activeLink` below
  // for the precedence between them, and `anchor` (in Interactions) for how
  // the tooltip re-locates the right element off of these ids alone.
  let hoveredNode = $state<string | null>(null);
  let focusedNode = $state<string | null>(null);
  let hoveredLink = $state<{ source: string; target: string } | null>(null);
  let focusedLink = $state<{ source: string; target: string } | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);

  // Precedence: keyboard focus wins over pointer hover, on whichever of
  // node/link actually holds it -- a focused node stays active even while
  // the pointer hovers an unrelated link (and vice versa). Nodes and links
  // are mutually exclusive DOM targets, so within one tier (focus, then
  // hover) at most one of activeNode/activeLink is ever non-null.
  let activeNode = $derived(focusedLink !== null ? null : (focusedNode ?? hoveredNode));
  let activeLink = $derived(focusedNode !== null ? null : (focusedLink ?? hoveredLink));

  // ── Layout ─────────────────────────────────────────────────────

  let format = $derived(valueFormat ?? formatNumber);
  let isEmpty = $derived(nodes.length === 0);
  const MARGIN = 40;

  // Real text measurement via the shared canvas-backed helper (exact on the
  // client, 0.6em/char heuristic under SSR/tests). Character estimates used
  // to both over-reserve the right label gutter (dead canvas) and under-budget
  // uppercase-heavy labels (text sliding under the next column's bars).
  // Weight and family are part of the spec: a 700-weight label is measurably
  // wider than a 400 one, and the app's rendered font rarely matches the
  // measurement default — budgets must be computed at the rendered style or
  // borderline labels truncate (or overflow) for no visible reason.
  // Family only enters the spec once the document's fonts have loaded: measuring
  // a not-yet-loaded webfont silently measures its fallback (usually wider) and
  // the width cache would pin that stale value under the loaded font's key.
  // Until then the measurement default applies — same behaviour as before.
  // One-shot promise subscription at init (browser only) — nothing to tear
  // down, and the $state write re-derives every measurement consumer.
  let fontsLoaded = $state(typeof document !== 'undefined' && document.fonts?.status === 'loaded');
  if (typeof document !== 'undefined' && document.fonts?.status !== 'loaded') {
    document.fonts?.ready.then(() => {
      fontsLoaded = true;
    });
  }
  let chartFontFamily = $derived(
    fontsLoaded && containerEl ? getComputedStyle(containerEl).fontFamily : null
  );
  let labelFont = $derived({
    size: containerEl ? readCssVarPx(containerEl, '--sankey-label-font-size', 12) : 12,
    weight: containerEl ? readCssVarPx(containerEl, '--sankey-label-font-weight', 400) : 400,
    family: chartFontFamily
  });
  let colLabelFont = $derived({
    size: containerEl ? readCssVarPx(containerEl, '--sankey-col-label-font-size', 11) : 11,
    weight: containerEl ? readCssVarPx(containerEl, '--sankey-col-label-font-weight', 400) : 400,
    family: chartFontFamily
  });
  // A label's rendered line box measures ≈1.33em across common font stacks;
  // two label centres closer than this overlap visibly. Derived from the
  // tokened size so consumers that scale labels keep honest de-collision.
  let labelLinePx = $derived(Math.ceil(labelFont.size * 1.33));

  // Final-column labels render to the RIGHT of their node; the bare 40px margin is
  // nowhere near enough for real funnel labels ("PARTIALLY_FAILED (1,234)"), so they
  // used to run past the svg edge and clip. Reserve a capped gutter sized from the
  // sink-node labels (sinks are what land in the final column) and lay the diagram
  // out in the remaining width instead.
  // With `lastColumnLabelSide: 'left'` sink labels render inside the plot over
  // the incoming ribbons (mirroring the first column's 'right' mode), so no
  // right gutter is reserved and the diagram runs to the right edge.
  let lastColumnLabelGutter = $derived.by(() => {
    if (lastColumnLabelSide === 'left' || !showLabels || nodes.length === 0 || chartWidth <= 0) {
      return 0;
    }
    const sourceIds = new Set(links.map((link) => link.source));
    const sinkLabels = nodes
      .filter((node) => !sourceIds.has(node.id))
      .map((node) => node.label ?? node.id);
    if (sinkLabels.length === 0) {
      return 0;
    }
    const longestPx =
      Math.max(...sinkLabels.map((label) => measureText(label, labelFont).width)) +
      (showValues ? measureText(' (999,999)', labelFont).width : 0);
    const wanted = longestPx + 10 + dataLabelOffsetX;
    // Cap the reservation so labels can never squeeze the diagram below 3/4 width,
    // and floor at 0 — a negative dataLabelOffsetX must not inflate the plot
    // past the right margin.
    return Math.max(0, Math.min(chartWidth * 0.25, wanted));
  });

  // First-column labels render to the LEFT of their node, anchored `end` into the
  // left margin. The bare 40px margin is nowhere near enough for real source labels
  // ("SESSIONS", "Source A", "START") — they truncate to a few characters and, once
  // the room falls below an ellipsis, vanish entirely. Mirror the sink gutter:
  // reserve a capped left gutter sized from the source-node labels (sources are what
  // land in the first column) and shift the diagram right by it.
  // With `firstColumnLabelSide: 'right'` the labels render over the outgoing
  // ribbons like every other column, so no gutter is reserved at all and the
  // diagram gains that width.
  let firstColumnLabelGutter = $derived.by(() => {
    if (firstColumnLabelSide === 'right' || !showLabels || nodes.length === 0 || chartWidth <= 0) {
      return 0;
    }
    const targetIds = new Set(links.map((link) => link.target));
    const sourceLabels = nodes
      .filter((node) => !targetIds.has(node.id))
      .map((node) => node.label ?? node.id);
    if (sourceLabels.length === 0) {
      return 0;
    }
    const longestPx =
      Math.max(...sourceLabels.map((label) => measureText(label, labelFont).width)) +
      (showValues ? measureText(' (999,999)', labelFont).width : 0);
    const wanted = longestPx + 10 + dataLabelOffsetX;
    // Same 25% cap and 0 floor as the sink gutter so the two together can never
    // starve the diagram, and a negative dataLabelOffsetX can't push past the margin.
    return Math.max(0, Math.min(chartWidth * 0.25, wanted));
  });

  let plotWidth = $derived(
    Math.max(0, chartWidth - marginX * 2 - firstColumnLabelGutter - lastColumnLabelGutter)
  );
  let plotHeight = $derived(Math.max(0, chartHeight - MARGIN * 2));
  let layout = $derived(
    computeSankeyLayout(
      nodes,
      links,
      plotWidth,
      plotHeight,
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
    columnCount <= 1 ? plotWidth : (plotWidth - nodeWidth) / (columnCount - 1)
  );

  // Node labels render alongside their bar; long labels used to overflow into the
  // next column and collide. Clip each to the horizontal room its column actually
  // has and append an ellipsis (the full text stays available via the node tooltip).
  // The final column's room is the reserved right gutter (plus the margin), NOT
  // colWidth — budgeting it at colWidth is what used to let edge labels clip.
  // Column headers are centred over columns that narrow as the label gutter and
  // column count grow; untruncated they collide into one unreadable run. Clip to
  // the column pitch with an ellipsis — the full text stays on the <title>.
  const truncateColumnLabel = (text: string): string => {
    return truncateToWidth(text, Math.max(0, colWidth - 6), colLabelFont);
  };

  // Column headers centre on their column's bar; at tight horizontal margins an
  // edge header (e.g. a long last-column title) would otherwise paint past the
  // svg boundary. Clamp each header's centre so its rendered text stays on the
  // canvas — a no-op at the default margins.
  const columnLabelX = (columnIndex: number, label: string): number => {
    const center = columnIndex * colWidth + nodeWidth / 2;
    const textWidth = measureText(truncateColumnLabel(label), colLabelFont).width;
    const canvasLeft = -(marginX + firstColumnLabelGutter) + 2;
    const canvasRight = plotWidth + lastColumnLabelGutter + marginX - 2;
    const min = canvasLeft + textWidth / 2;
    const max = canvasRight - textWidth / 2;
    // Text wider than the whole canvas keeps its centre; the colWidth-based
    // truncation budget makes that unreachable in practice.
    return max < min ? center : Math.min(Math.max(center, min), max);
  };

  // Which side of its bar a node's label renders on. First and last columns are
  // configurable (`firstColumnLabelSide` / `lastColumnLabelSide`); in a
  // single-column chart the first-column setting wins.
  const labelOnLeft = (column: number): boolean =>
    (column === 0 && firstColumnLabelSide === 'left') ||
    (column === columnCount - 1 && column !== 0 && lastColumnLabelSide === 'left');

  const truncateLabel = (text: string, column: number): string => {
    // Middle columns must budget for dataLabelOffsetX too: the label starts at
    // node.x + nodeWidth + 6 + dataLabelOffsetX, so the room before the next
    // column's bar shrinks by the same offset. Omitting it let "fitting"
    // labels run under the neighbouring column's node rect.
    // First-column labels anchor `end` at node.x - 6 - offset with node.x = 0.
    // The diagram is shifted right by firstColumnLabelGutter, so the room to the
    // SVG's left edge is that gutter plus the base margin, minus the inset —
    // symmetric with the last column's sink-gutter budget below.
    const available =
      column === 0 && firstColumnLabelSide === 'left'
        ? Math.max(0, firstColumnLabelGutter + marginX - 6 - dataLabelOffsetX)
        : column === columnCount - 1 && lastColumnLabelSide === 'right'
          ? Math.max(0, lastColumnLabelGutter + marginX - 6 - dataLabelOffsetX)
          : Math.max(0, colWidth - nodeWidth - 12 - dataLabelOffsetX);
    // No usable room — hide the label rather than force text that would overflow;
    // the full text is still reachable via the node's <title> on hover.
    return truncateToWidth(text, available, labelFont);
  };

  // Vertical label de-collision: labels sit at each node's centre-y, so two
  // small stacked nodes in a crowded column render their 12px labels on top of
  // each other. Per column, walk labels top-to-bottom and drop the label of
  // the smaller-value node whenever two centres come closer than one label
  // line — the hidden label's text stays reachable via the node's <title>.
  let collidingLabels = $derived.by(() => {
    const hidden = new SvelteSet<string>();
    if (!showLabels) {
      return hidden;
    }
    const byColumn = new SvelteMap<number, typeof layout.nodes>();
    for (const node of layout.nodes) {
      const bucket = byColumn.get(node.column);
      if (bucket) {
        bucket.push(node);
      } else {
        byColumn.set(node.column, [node]);
      }
    }
    for (const columnNodes of byColumn.values()) {
      const sorted = [...columnNodes].sort((a, b) => a.y + a.height / 2 - (b.y + b.height / 2));
      let lastKept: (typeof sorted)[number] | null = null;
      for (const node of sorted) {
        if (lastKept === null) {
          lastKept = node;
          continue;
        }
        const centerGap = node.y + node.height / 2 - (lastKept.y + lastKept.height / 2);
        if (centerGap < labelLinePx) {
          if (node.value > lastKept.value) {
            hidden.add(lastKept.id);
            lastKept = node;
          } else {
            hidden.add(node.id);
          }
        } else {
          lastKept = node;
        }
      }
    }
    return hidden;
  });

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
    if (activeNode !== null) {
      const connected = new SvelteSet<string>([activeNode]);
      for (const l of links) {
        if (l.source === activeNode || l.target === activeNode) {
          connected.add(l.source);
          connected.add(l.target);
        }
      }
      return connected;
    }
    if (activeLink !== null) {
      return new SvelteSet([activeLink.source, activeLink.target]);
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
    if (activeLink === null) {
      return null;
    }
    const l = links.find(
      (lk) => lk.source === activeLink!.source && lk.target === activeLink!.target
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
    if (activeNode !== null) {
      const n = layout.nodes.find((nd) => nd.id === activeNode);
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
    if (activeNode !== null) {
      const n = findNode(activeNode);
      const computed = layout.nodes.find((nd) => nd.id === activeNode);
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
  // Family-wide contract shared with BarChart/FunnelChart/DualAxisBarChart:
  // pointer hover and keyboard focus feed SEPARATE state (see hoveredNode/
  // focusedNode/hoveredLink/focusedLink above), read together as one "direct
  // interaction" tier via activeNode/activeLink. Enter/Space on a focused
  // node or link invokes the same click callback a pointer click would.

  function trackMouse(e: MouseEvent) {
    const position = pointerPositionIn(containerEl, e);
    if (position !== null) {
      mouseX = position.x;
      mouseY = position.y;
    }
  }

  // Anchor from the live element's own rect (not SVG-space math), so the two
  // nested margin/gutter transforms this chart applies never need reproducing
  // here -- same technique BarChart/FunnelChart/DualAxisBarChart use.
  function anchorFromElement(el: Element): TooltipAnchor | null {
    if (containerEl === null) {
      return null;
    }
    const r = el.getBoundingClientRect();
    const c = containerEl.getBoundingClientRect();
    return { x: r.left + r.width / 2 - c.left, y: r.top - c.top, side: 'top' };
  }

  // Re-locates the live element for an id via its data-node-id/data-link-*
  // attribute (added to the elements below) rather than a ref captured at
  // enter/focus time -- `anchor` can become active through a path with no
  // event of its own to capture from (e.g. focus blurring off a node while
  // the pointer already rests, unmoved, over a different one), so it always
  // needs to be able to look the current element up fresh.
  function findNodeElement(id: string): Element | null {
    if (containerEl === null) {
      return null;
    }
    for (const el of containerEl.querySelectorAll('.sankey-node')) {
      if (el.getAttribute('data-node-id') === id) {
        return el;
      }
    }
    return null;
  }

  function findLinkElement(source: string, target: string): Element | null {
    if (containerEl === null) {
      return null;
    }
    for (const el of containerEl.querySelectorAll('.sankey-link')) {
      if (
        el.getAttribute('data-link-source') === source &&
        el.getAttribute('data-link-target') === target
      ) {
        return el;
      }
    }
    return null;
  }

  let anchor = $derived.by<TooltipAnchor | null>(() => {
    if (activeNode !== null) {
      const el = findNodeElement(activeNode);
      return el ? anchorFromElement(el) : null;
    }
    if (activeLink !== null) {
      const el = findLinkElement(activeLink.source, activeLink.target);
      return el ? anchorFromElement(el) : null;
    }
    return null;
  });

  function isLinkHighlighted(source: string, target: string): boolean {
    if (activeLink !== null) {
      return source === activeLink.source && target === activeLink.target;
    }
    if (activeNode !== null) {
      return source === activeNode || target === activeNode;
    }
    return false;
  }

  function findNode(id: string) {
    return nodes.find((n) => n.id === id);
  }

  function findLink(source: string, target: string) {
    return links.find((l) => l.source === source && l.target === target);
  }

  /** Resolved display label for a node id, from the computed layout (falls back to the id). */
  function resolveNodeLabel(id: string): string {
    return layout.nodes.find((n) => n.id === id)?.label ?? id;
  }

  // onnodehover mirrors the combined pointer-or-focus node (activeNode),
  // once per actual change -- e.g. a pointer leaving a node that is still
  // keyboard-focused must not report a hover-cleared event for a highlight
  // that never went away.
  let lastNotifiedNode: string | null = null;
  function notifyNodeHover() {
    const next = activeNode;
    if (next === lastNotifiedNode) {
      return;
    }
    lastNotifiedNode = next;
    const orig = next === null ? null : findNode(next);
    onnodehover?.(orig ? { node: orig } : null);
  }

  function sameLink(
    a: { source: string; target: string } | null,
    b: { source: string; target: string } | null
  ): boolean {
    if (a === null || b === null) {
      return a === b;
    }
    return a.source === b.source && a.target === b.target;
  }

  // onlinkhover mirrors the combined pointer-or-focus link (activeLink),
  // once per actual change -- same dedup rationale as notifyNodeHover.
  let lastNotifiedLink: { source: string; target: string } | null = null;
  function notifyLinkHover() {
    const next = activeLink;
    if (sameLink(next, lastNotifiedLink)) {
      return;
    }
    lastNotifiedLink = next;
    const orig = next === null ? null : findLink(next.source, next.target);
    onlinkhover?.(orig ? { link: orig } : null);
  }

  function handleNodeEnter(e: MouseEvent, id: string) {
    hoveredNode = id;
    trackMouse(e);
    notifyNodeHover();
  }

  function handleNodeFocus(id: string) {
    focusedNode = id;
    notifyNodeHover();
  }

  // Wired to a node's mouseleave. Clears ONLY the hover half -- never
  // `focusedNode` -- so a late, stale mouseleave (see `hoveredNode`'s
  // declaration comment) cannot erase a node's focus highlight.
  function handleNodeLeave() {
    hoveredNode = null;
    notifyNodeHover();
  }

  // Wired to a node's blur. Clears ONLY the focus half; a pointer that
  // happens to still be over the node keeps it hovered.
  function handleNodeBlur() {
    focusedNode = null;
    notifyNodeHover();
  }

  function handleNodeClick(id: string) {
    const orig = findNode(id);
    if (orig) {
      onnodeclick?.({ node: orig });
    }
  }

  function handleNodeKeydown(e: KeyboardEvent, id: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNodeClick(id);
    }
  }

  function handleLinkEnter(e: MouseEvent, source: string, target: string) {
    hoveredLink = { source, target };
    trackMouse(e);
    notifyLinkHover();
  }

  function handleLinkFocus(source: string, target: string) {
    focusedLink = { source, target };
    notifyLinkHover();
  }

  // Wired to a link's mouseleave. Clears ONLY the hover half -- never
  // `focusedLink` -- for the same reason handleNodeLeave spares focusedNode.
  function handleLinkLeave() {
    hoveredLink = null;
    notifyLinkHover();
  }

  // Wired to a link's blur. Clears ONLY the focus half; a pointer that
  // happens to still be over the link keeps it hovered.
  function handleLinkBlur() {
    focusedLink = null;
    notifyLinkHover();
  }

  function handleLinkClick(source: string, target: string) {
    const orig = findLink(source, target);
    if (orig) {
      onlinkclick?.({ link: orig });
    }
  }

  function handleLinkKeydown(e: KeyboardEvent, source: string, target: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLinkClick(source, target);
    }
  }

  // Touch taps have no pointerleave: dismiss when a pointerdown lands
  // outside. Clears only the hover half of each pair -- a real pointerdown
  // outside a focused element blurs it natively (see handleNodeBlur /
  // handleLinkBlur), matching PieChart/AreaChart/LineChart's identical
  // hover-only scope for this effect.
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    if (hoveredNode === null && hoveredLink === null) {
      return;
    }
    return dismissOnOutsidePointerDown(containerEl, () => {
      hoveredNode = null;
      hoveredLink = null;
      notifyNodeHover();
      notifyLinkHover();
    });
  });
</script>

<div
  class="sankey-chart {classes ?? ''}"
  bind:this={containerEl}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#if isEmpty && typeof empty === 'function'}
    <div class="chart-empty">{@render empty()}</div>
  {:else}
    <ChartContainer bind:width={chartWidth} bind:height={chartHeight} {aspectRatio} {maxHeight}>
      <g transform="translate({marginX + firstColumnLabelGutter}, {MARGIN})">
        <!-- Optional backdrop panel behind the diagram (--sankey-plot-background,
             transparent by default). Spans exactly the plot: first column's bars
             to last column's bars, header row excluded. -->
        <rect class="sankey-plot-bg" x={0} y={0} width={plotWidth} height={plotHeight} />
        {#if columnLabels != null && columnLabels.length > 0}
          {#each columnLabels.slice(0, columnCount) as label, ci (ci)}
            <text
              class="sankey-col-label"
              x={columnLabelX(ci, label)}
              y={-8}
              text-anchor="middle"
              dominant-baseline="auto">{truncateColumnLabel(label)}<title>{label}</title></text
            >
          {/each}
        {/if}

        {#each layout.links as link, i (i)}
          {@const highlighted = isLinkHighlighted(link.source, link.target)}
          {@const dimmed =
            !disableDimOnHover && (activeNode !== null || activeLink !== null) && !highlighted}
          <path
            class="sankey-link"
            data-link-source={link.source}
            data-link-target={link.target}
            d={link.path}
            fill="none"
            stroke={link.color ?? nodeColorMap.get(link.source) ?? getColor(0)}
            stroke-width={Math.max(minLinkWidth, link.width)}
            stroke-opacity={highlighted ? 0.7 : dimmed ? 0.08 : 0.4}
            tabindex="0"
            role="button"
            aria-label="{resolveNodeLabel(link.source)} to {resolveNodeLabel(link.target)}: {format(
              link.value
            )}"
            onmouseenter={(e) => handleLinkEnter(e, link.source, link.target)}
            onmousemove={trackMouse}
            onmouseleave={handleLinkLeave}
            onfocus={() => handleLinkFocus(link.source, link.target)}
            onblur={handleLinkBlur}
            onkeydown={(e) => handleLinkKeydown(e, link.source, link.target)}
            onclick={() => handleLinkClick(link.source, link.target)}
          />
        {/each}

        {#each layout.nodes as node, ni (ni)}
          {@const color = nodeColorMap.get(node.id) ?? getColor(ni)}
          {@const dimmed = connectedNodes !== null && !connectedNodes.has(node.id)}
          <rect
            class="sankey-node"
            class:node-dimmed={dimmed}
            data-node-id={node.id}
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            rx={radius}
            ry={radius}
            fill={color}
            tabindex="0"
            role="button"
            aria-label="{node.label}: {format(node.value)}"
            onmouseenter={(e) => handleNodeEnter(e, node.id)}
            onmousemove={trackMouse}
            onmouseleave={handleNodeLeave}
            onfocus={() => handleNodeFocus(node.id)}
            onblur={handleNodeBlur}
            onkeydown={(e) => handleNodeKeydown(e, node.id)}
            onclick={() => handleNodeClick(node.id)}
          />
        {/each}

        <!-- Labels render in a second pass, after every node rect: within one
             interleaved loop a label could be over-painted by a later column's
             bar whenever the width estimate ran short. -->
        {#if showLabels}
          {#each layout.nodes as node, ni (ni)}
            {@const dimmed = connectedNodes !== null && !connectedNodes.has(node.id)}
            {#if !collidingLabels.has(node.id)}
              <text
                class="sankey-label"
                class:node-dimmed={dimmed}
                x={labelOnLeft(node.column)
                  ? node.x - 6 - dataLabelOffsetX
                  : node.x + node.width + 6 + dataLabelOffsetX}
                y={node.y + node.height / 2}
                text-anchor={labelOnLeft(node.column) ? 'end' : 'start'}
                dominant-baseline="middle"
                >{truncateLabel(
                  showValues ? `${node.label} (${format(node.value)})` : node.label,
                  node.column
                )}<title>{showValues ? `${node.label} (${format(node.value)})` : node.label}</title
                ></text
              >
            {/if}
          {/each}
        {/if}
      </g>
    </ChartContainer>

    {#if typeof tooltipSnippet === 'function'}
      <ChartTooltip
        data={tooltipData}
        {mouseX}
        {mouseY}
        {anchor}
        portal={tooltipPortal}
        originEl={containerEl}
        unstyled
      >
        {#snippet content()}
          {#if tooltipContext !== null}
            {@render tooltipSnippet(tooltipContext)}
          {/if}
        {/snippet}
      </ChartTooltip>
    {:else}
      <ChartTooltip
        data={tooltipData}
        {mouseX}
        {mouseY}
        {anchor}
        portal={tooltipPortal}
        originEl={containerEl}
      />
    {/if}
  {/if}
</div>

<style>
  .sankey-chart {
    width: 100%;
    position: relative;
  }
  .sankey-plot-bg {
    fill: var(--sankey-plot-background, transparent);
    pointer-events: none;
  }
  .sankey-link {
    transition: stroke-opacity var(--chart-transition-duration, var(--motion-duration, 0.2s))
      var(--chart-transition-easing, var(--motion-easing, ease));
    cursor: pointer;
  }
  .sankey-link:focus-visible {
    outline: var(--sankey-focus-outline, 2px solid currentColor);
    outline-offset: var(--sankey-focus-outline-offset, 2px);
  }
  .sankey-node {
    transition: opacity var(--chart-transition-duration, var(--motion-duration, 0.2s))
      var(--chart-transition-easing, var(--motion-easing, ease));
    cursor: pointer;
  }
  .sankey-node:focus-visible {
    outline: var(--sankey-focus-outline, 2px solid currentColor);
    outline-offset: var(--sankey-focus-outline-offset, 2px);
  }
  .sankey-node.node-dimmed {
    opacity: var(--sankey-dimmed-opacity, 0.15);
  }
  .sankey-label {
    fill: var(--sankey-label-color, #333);
    font-size: var(--sankey-label-font-size, 12px);
    font-weight: var(--sankey-label-font-weight, 400);
    font-family: var(--chart-font-family, inherit);
    /* Highcharts-style text outline: node labels render over link ribbons, so
       a halo in the chart's background colour keeps them legible at any flow
       density. Off (transparent / 0) by default. */
    paint-order: stroke;
    stroke: var(--sankey-label-halo-color, transparent);
    stroke-width: var(--sankey-label-halo-width, 0);
    stroke-linejoin: round;
    pointer-events: none;
    transition: opacity var(--chart-transition-duration, var(--motion-duration, 0.2s))
      var(--chart-transition-easing, var(--motion-easing, ease));
  }
  .sankey-col-label {
    fill: var(--sankey-col-label-color, #666);
    font-size: var(--sankey-col-label-font-size, 11px);
    font-weight: var(--sankey-col-label-font-weight, 400);
    font-family: var(--chart-font-family, inherit);
    pointer-events: none;
  }
  .sankey-label.node-dimmed {
    opacity: var(--sankey-dimmed-opacity, 0.15);
  }
  .chart-empty {
    padding: var(--chart-empty-padding, 32px 24px);
    color: var(--chart-empty-color, #9ca3af);
    text-align: center;
  }
</style>
