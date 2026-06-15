import type {
  Margin,
  ChartDimensions,
  PieSliceLayout,
  ComputedSankeyNode,
  ComputedSankeyLink,
  StackedPoint
} from './types';

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
  iterations: number = 6
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

  // Initialize y positions
  const nodeY = new Map<string, number>();
  const nodeH = new Map<string, number>();
  for (const [, ids] of columnGroups) {
    const totalValue = ids.reduce((s, id) => s + (nodeValues.get(id) ?? 0), 0);
    const availableHeight = height - (ids.length - 1) * nodePadding;
    let y = 0;
    for (const id of ids) {
      const val = nodeValues.get(id) ?? 0;
      const h =
        totalValue > 0 ? (val / totalValue) * availableHeight : availableHeight / ids.length;
      nodeY.set(id, y);
      nodeH.set(id, Math.max(1, h));
      y += h + nodePadding;
    }
  }

  // Iterative relaxation (upstream pass)
  for (let iter = 0; iter < iterations; iter++) {
    for (const [, ids] of columnGroups) {
      for (const id of ids) {
        const deps = incoming.get(id) ?? [];
        if (deps.length > 0) {
          const weightedY =
            deps.reduce((s, d) => {
              const sy = nodeY.get(d.source) ?? 0;
              const sh = nodeH.get(d.source) ?? 0;
              return s + (sy + sh / 2) * d.value;
            }, 0) / deps.reduce((s, d) => s + d.value, 0);
          nodeY.set(id, Math.max(0, weightedY - (nodeH.get(id) ?? 0) / 2));
        }
      }
      // Resolve overlaps
      ids.sort((a, b) => (nodeY.get(a) ?? 0) - (nodeY.get(b) ?? 0));
      let y = 0;
      for (const id of ids) {
        const cy = nodeY.get(id) ?? 0;
        if (cy < y) {
          nodeY.set(id, y);
        }
        y = (nodeY.get(id) ?? 0) + (nodeH.get(id) ?? 0) + nodePadding;
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

  // Build computed links with Bezier paths
  const sourceOffsets = new Map<string, number>();
  const targetOffsets = new Map<string, number>();
  for (const n of nodes) {
    sourceOffsets.set(n.id, nodeY.get(n.id) ?? 0);
    targetOffsets.set(n.id, nodeY.get(n.id) ?? 0);
  }

  const computedLinks: ComputedSankeyLink[] = links.map((l) => {
    const sourceNode = nodeById.get(l.source);
    const targetNode = nodeById.get(l.target);
    const sVal = nodeValues.get(l.source) ?? 1;
    const sourceH = nodeH.get(l.source) ?? 0;
    const linkWidth = Math.max(1, (l.value / Math.max(sVal, 1)) * sourceH);

    const sx = (sourceNode?.x ?? 0) + nodeWidth;
    const sy = (sourceOffsets.get(l.source) ?? 0) + linkWidth / 2;
    const tx = targetNode?.x ?? 0;
    const ty = (targetOffsets.get(l.target) ?? 0) + linkWidth / 2;

    sourceOffsets.set(l.source, (sourceOffsets.get(l.source) ?? 0) + linkWidth);
    targetOffsets.set(l.target, (targetOffsets.get(l.target) ?? 0) + linkWidth);

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
