import type {
  Margin,
  ChartDimensions,
  PieSliceLayout,
  ComputedSankeyNode,
  ComputedSankeyLink,
  StackedPoint
} from './types';
import { measureText, type FontSpec } from './measure';
import { thinTicks } from './labels';

export function computeChartDimensions(
  width: number,
  height: number,
  margin: Partial<Margin> = {}
): ChartDimensions {
  const m: Margin = {
    top: margin.top ?? 20,
    right: margin.right ?? 20,
    bottom: margin.bottom ?? 40,
    left: margin.left ?? 50
  };
  return {
    width,
    height,
    margin: m,
    innerWidth: Math.max(0, width - m.left - m.right),
    innerHeight: Math.max(0, height - m.top - m.bottom)
  };
}

export type AutoLayoutInput = {
  width: number;
  height: number;
  yTickLabels: string[];
  xTickLabels: string[];
  y2TickLabels?: string[];
  font?: FontSpec;
  hasXAxisLabel?: boolean;
  hasYAxisLabel?: boolean;
  hasY2AxisLabel?: boolean;
  base?: Partial<Margin>;
};

export type AutoLayout = ChartDimensions & {
  xRotate: boolean;
  xEvery: number;
  /**
   * Baseline y for the bottom-axis title, already inside the reserved title
   * band — pass straight to Axis.labelOffset, no extra padding needed.
   */
  xLabelOffset: number;
};

// Offset from the axis line to the tick-label text (Axis.svelte TICK_SIZE + 4).
const TICK_PAD = 10;
// Vertical space reserved for a rotated/horizontal axis title.
const TITLE_BAND = 18;
// Cap on how deep rotated x labels may grow the bottom margin (long labels crop).
const MAX_ROTATED_DEPTH = 72;

/**
 * Measured, Highcharts-style margins: gutters grow to fit formatted tick labels
 * (instead of clipping) and the bottom axis rotates/thins its labels when the
 * per-category step is too narrow. Order matters to avoid feedback loops:
 * left/right derive from label text only, then innerWidth decides x rotation,
 * then bottom derives from the rotation outcome.
 */
export function computeAutoLayout(input: AutoLayoutInput): AutoLayout {
  const font = input.font ?? { size: 11 };
  const labelHeight = font.size * 1.2;

  const widthOf = (labels: string[]): number =>
    labels.reduce((max, t) => Math.max(max, measureText(t, font).width), 0);

  const left = Math.max(
    input.base?.left ?? 0,
    input.yTickLabels.length > 0
      ? Math.ceil(widthOf(input.yTickLabels)) +
          TICK_PAD +
          6 +
          (input.hasYAxisLabel ? TITLE_BAND : 0)
      : 0
  );

  const xWidths = input.xTickLabels.map((t) => measureText(t, font).width);
  const maxXWidth = xWidths.reduce((m, w) => Math.max(m, w), 0);
  const y2Width =
    typeof input.y2TickLabels !== 'undefined' && input.y2TickLabels.length > 0
      ? Math.ceil(widthOf(input.y2TickLabels)) +
        TICK_PAD +
        6 +
        (input.hasY2AxisLabel ? TITLE_BAND : 0)
      : 0;
  // Right gutter: the right axis when present, else half the last x label so
  // edge labels don't clip.
  const right = Math.max(input.base?.right ?? 0, y2Width, Math.ceil(maxXWidth / 2) + 8);

  const innerWidth = Math.max(0, input.width - left - right);
  const step = input.xTickLabels.length > 0 ? innerWidth / input.xTickLabels.length : innerWidth;
  const { rotate, every } =
    input.xTickLabels.length > 0
      ? thinTicks({ labelWidths: xWidths, labelHeight, step })
      : { rotate: false, every: 1 };

  const rotatedDepth = rotate
    ? Math.min(MAX_ROTATED_DEPTH, Math.ceil(maxXWidth * Math.SQRT1_2))
    : 0;
  const xLabelDepth =
    input.xTickLabels.length > 0 ? TICK_PAD + (rotate ? rotatedDepth : Math.ceil(labelHeight)) : 0;
  const bottom = Math.max(
    input.base?.bottom ?? 0,
    xLabelDepth + 6 + (input.hasXAxisLabel ? TITLE_BAND : 0)
  );
  const top = Math.max(input.base?.top ?? 0, Math.ceil(labelHeight / 2) + 8);

  const dims = computeChartDimensions(input.width, input.height, { top, right, bottom, left });
  return { ...dims, xRotate: rotate, xEvery: every, xLabelOffset: xLabelDepth + TITLE_BAND };
}

// ── Pie layout ──────────────────────────────────────────────────

export function computePieLayout(
  data: Array<{ label: string; value: number; color?: string }>,
  startAngle: number = -Math.PI / 2,
  padAngle: number = 0
): PieSliceLayout[] {
  const total = data.reduce((sum, d) => sum + Math.max(0, d.value), 0);
  if (total === 0) {
    return [];
  }

  const slices: PieSliceLayout[] = [];
  let angle = startAngle;

  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const val = Math.max(0, d.value);
    const sliceAngle = (val / total) * Math.PI * 2;
    const start = angle + padAngle / 2;
    const end = angle + sliceAngle - padAngle / 2;
    slices.push({
      index: i,
      startAngle: start,
      endAngle: end,
      midAngle: (start + end) / 2,
      value: val,
      percentage: (val / total) * 100,
      label: d.label,
      color: d.color
    });
    angle += sliceAngle;
  }

  return slices;
}

// ── Sankey layout ───────────────────────────────────────────────

export function computeSankeyLayout(
  nodes: Array<{ id: string; label?: string; color?: string }>,
  links: Array<{ source: string; target: string; value: number; color?: string }>,
  width: number,
  height: number,
  nodeWidth: number = 16,
  nodePadding: number = 8,
  iterations: number = 6,
  minLinkWidth: number = 1
): { nodes: ComputedSankeyNode[]; links: ComputedSankeyLink[] } {
  if (nodes.length === 0) {
    return { nodes: [], links: [] };
  }

  // Build adjacency
  const outgoing = new Map<string, Array<{ target: string; value: number }>>();
  const incoming = new Map<string, Array<{ source: string; value: number }>>();
  for (const n of nodes) {
    outgoing.set(n.id, []);
    incoming.set(n.id, []);
  }
  for (const l of links) {
    outgoing.get(l.source)?.push({ target: l.target, value: l.value });
    incoming.get(l.target)?.push({ source: l.source, value: l.value });
  }

  // Assign columns via topological ordering
  const columns = new Map<string, number>();
  const visited = new Set<string>();
  function assignColumn(id: string): number {
    if (columns.has(id)) {
      return columns.get(id)!;
    }
    if (visited.has(id)) {
      return 0;
    }
    visited.add(id);
    const deps = incoming.get(id) ?? [];
    const col = deps.length === 0 ? 0 : Math.max(...deps.map((d) => assignColumn(d.source) + 1));
    columns.set(id, col);
    return col;
  }
  for (const n of nodes) {
    assignColumn(n.id);
  }

  const maxCol = Math.max(0, ...columns.values());

  // Compute node values (max of incoming/outgoing)
  const nodeValues = new Map<string, number>();
  for (const n of nodes) {
    const outVal = (outgoing.get(n.id) ?? []).reduce((s, l) => s + l.value, 0);
    const inVal = (incoming.get(n.id) ?? []).reduce((s, l) => s + l.value, 0);
    nodeValues.set(n.id, Math.max(outVal, inVal));
  }

  // Group nodes by column
  const columnGroups = new Map<number, string[]>();
  for (const n of nodes) {
    const col = columns.get(n.id) ?? 0;
    if (!columnGroups.has(col)) {
      columnGroups.set(col, []);
    }
    columnGroups.get(col)!.push(n.id);
  }

  const colWidth = maxCol === 0 ? 0 : (width - nodeWidth) / maxCol;
  const columnPadding = new Map<number, number>();

  // Initialize y positions
  const nodeY = new Map<string, number>();
  const nodeH = new Map<string, number>();
  for (const [col, ids] of columnGroups) {
    const totalValue = ids.reduce((s, id) => s + (nodeValues.get(id) ?? 0), 0);
    const gapCount = ids.length - 1;
    const availableHeight = height - gapCount * nodePadding;
    const renderedHeights = ids.map((id) => {
      const val = nodeValues.get(id) ?? 0;
      const h =
        totalValue > 0 ? (val / totalValue) * availableHeight : availableHeight / ids.length;
      return Math.max(minLinkWidth, h);
    });

    const sumRendered = renderedHeights.reduce((s, h) => s + h, 0);
    const paddingBudget = gapCount > 0 ? (height - sumRendered) / gapCount : 0;
    const effectivePadding = Math.max(0, Math.min(nodePadding, paddingBudget));
    const scale = sumRendered > height && sumRendered > 0 ? height / sumRendered : 1;
    columnPadding.set(col, effectivePadding);

    let y = 0;
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      const renderedH = renderedHeights[index] * scale;
      nodeY.set(id, y);
      nodeH.set(id, renderedH);
      y += renderedH + effectivePadding;
    }
  }

  // Iterative relaxation (upstream pass)
  for (let iter = 0; iter < iterations; iter++) {
    for (const [col, ids] of columnGroups) {
      const padding = columnPadding.get(col) ?? nodePadding;
      for (const id of ids) {
        const deps = incoming.get(id) ?? [];
        const totalDepValue = deps.reduce((s, d) => s + d.value, 0);
        // Only re-centre against incoming links when they carry positive volume.
        // With all-zero weights the division yielded NaN, which propagated to
        // every node position and collapsed the chart; keep the initial y instead.
        if (totalDepValue > 0) {
          const weightedY =
            deps.reduce((s, d) => {
              const sy = nodeY.get(d.source) ?? 0;
              const sh = nodeH.get(d.source) ?? 0;
              return s + (sy + sh / 2) * d.value;
            }, 0) / totalDepValue;
          nodeY.set(id, Math.max(0, weightedY - (nodeH.get(id) ?? 0) / 2));
        }
      }
      let y = 0;
      for (const id of ids) {
        const cy = nodeY.get(id) ?? 0;
        if (cy < y) {
          nodeY.set(id, y);
        }
        y = (nodeY.get(id) ?? 0) + (nodeH.get(id) ?? 0) + padding;
      }

      // Resolve overlaps: pull back up from the bottom. The push-down pass
      // above only ever grows a column's block downward, so a fan-out whose
      // members share a weighted target centre drifts past the column's
      // height budget column-to-column instead of staying level. Sweep from
      // the last node up, clamping each node's bottom edge to the running
      // boundary, mirroring d3-sankey's bidirectional resolveCollisions.
      let bottomBoundary = height;
      for (let index = ids.length - 1; index >= 0; index--) {
        const id = ids[index];
        const nodeBottom = (nodeY.get(id) ?? 0) + (nodeH.get(id) ?? 0);
        if (nodeBottom > bottomBoundary) {
          nodeY.set(id, bottomBoundary - (nodeH.get(id) ?? 0));
        }
        bottomBoundary = (nodeY.get(id) ?? 0) - padding;
      }

      // Re-centre the column's node group within [0, height]: once overlaps
      // are resolved, anchor the block at the midpoint of its remaining
      // slack rather than leaving it wherever the top-down/bottom-up sweeps
      // happened to land it, so a cluster sharing a weighted centre reads as
      // centred on that target instead of stacked toward one edge.
      const firstId = ids[0];
      const lastId = ids[ids.length - 1];
      const groupTop = nodeY.get(firstId) ?? 0;
      const groupBottom = (nodeY.get(lastId) ?? 0) + (nodeH.get(lastId) ?? 0);
      const idealGroupTop = Math.max(0, (height - (groupBottom - groupTop)) / 2);
      const recentreShift = idealGroupTop - groupTop;
      if (recentreShift !== 0) {
        for (const id of ids) {
          nodeY.set(id, (nodeY.get(id) ?? 0) + recentreShift);
        }
      }
    }
  }

  // Build computed nodes
  const computedNodes: ComputedSankeyNode[] = nodes.map((n) => ({
    id: n.id,
    label: n.label ?? n.id,
    x: (columns.get(n.id) ?? 0) * colWidth,
    y: nodeY.get(n.id) ?? 0,
    width: nodeWidth,
    height: nodeH.get(n.id) ?? 0,
    value: nodeValues.get(n.id) ?? 0,
    color: n.color,
    column: columns.get(n.id) ?? 0
  }));

  const nodeById = new Map(computedNodes.map((n) => [n.id, n]));

  const linkKey = (l: { source: string; target: string }): string => `${l.source} ${l.target}`;
  const linkWidths = new Map<string, number>();
  for (const l of links) {
    const sVal = nodeValues.get(l.source) ?? 1;
    const sourceH = nodeH.get(l.source) ?? 0;
    linkWidths.set(linkKey(l), Math.max(minLinkWidth, (l.value / Math.max(sVal, 1)) * sourceH));
  }
  const linkSy = new Map<string, number>();
  const linkTy = new Map<string, number>();

  const bySource = new Map<string, typeof links>();
  const byTarget = new Map<string, typeof links>();
  for (const l of links) {
    if (!bySource.has(l.source)) {
      bySource.set(l.source, []);
    }
    bySource.get(l.source)!.push(l);
    if (!byTarget.has(l.target)) {
      byTarget.set(l.target, []);
    }
    byTarget.get(l.target)!.push(l);
  }
  for (const [source, group] of bySource) {
    group.sort((a, b) => (nodeY.get(a.target) ?? 0) - (nodeY.get(b.target) ?? 0));
    let offset = nodeY.get(source) ?? 0;
    for (const l of group) {
      const w = linkWidths.get(linkKey(l)) ?? 0;
      linkSy.set(linkKey(l), offset + w / 2);
      offset += w;
    }
  }
  for (const [target, group] of byTarget) {
    group.sort((a, b) => (nodeY.get(a.source) ?? 0) - (nodeY.get(b.source) ?? 0));
    let offset = nodeY.get(target) ?? 0;
    for (const l of group) {
      const w = linkWidths.get(linkKey(l)) ?? 0;
      linkTy.set(linkKey(l), offset + w / 2);
      offset += w;
    }
  }

  const computedLinks: ComputedSankeyLink[] = links.map((l) => {
    const sourceNode = nodeById.get(l.source);
    const targetNode = nodeById.get(l.target);
    const linkWidth = linkWidths.get(linkKey(l)) ?? minLinkWidth;

    const sx = (sourceNode?.x ?? 0) + nodeWidth;
    const sy = linkSy.get(linkKey(l)) ?? 0;
    const tx = targetNode?.x ?? 0;
    const ty = linkTy.get(linkKey(l)) ?? 0;

    const midX = (sx + tx) / 2;
    const path = `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;

    return {
      source: l.source,
      target: l.target,
      value: l.value,
      color: l.color,
      sourceX: sx,
      sourceY: sy,
      targetX: tx,
      targetY: ty,
      width: linkWidth,
      path
    };
  });

  return { nodes: computedNodes, links: computedLinks };
}

// ── Stacked values ──────────────────────────────────────────────

export function computeStackedValues(
  seriesData: Array<Array<{ x: number; y: number }>>
): StackedPoint[][] {
  if (seriesData.length === 0) {
    return [];
  }

  const stacked: StackedPoint[][] = [];
  const baselines = new Map<number, number>();

  for (const series of seriesData) {
    const stackedSeries: StackedPoint[] = [];
    for (const point of series) {
      const base = baselines.get(point.x) ?? 0;
      stackedSeries.push({ x: point.x, y0: base, y1: base + point.y });
      baselines.set(point.x, base + point.y);
    }
    stacked.push(stackedSeries);
  }

  return stacked;
}
