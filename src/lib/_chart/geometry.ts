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

// Pie/funnel/sankey are value-accumulating charts: per docs/CHART_INPUT_POLICY.md
// a negative contribution has no visual meaning and is a 0 contribution, and
// (per computeStackedValues' precedent for this file) the same treatment is
// extended to non-finite values here rather than excluding them as a gap --
// unlike LineChart/AreaChart, a pie slice has no x-position to drop and
// omitting a data row would shift every later slice's array index instead of
// just rendering that one slice as zero-size. Exported so PieChart.svelte's
// independent total (feeds isEmpty and the percentage denominator) can't drift
// from this one -- two copies of an unguarded reduce is exactly how the
// original defect stayed invisible in half the places it needed the guard.
export const pieSliceValue = (value: number): number =>
  Number.isFinite(value) && value > 0 ? value : 0;

export function computePieLayout(
  data: Array<{ label: string; value: number; color?: string }>,
  startAngle: number = -Math.PI / 2,
  padAngle: number = 0
): PieSliceLayout[] {
  const total = data.reduce((sum, d) => sum + pieSliceValue(d.value), 0);
  if (total === 0) {
    return [];
  }

  const slices: PieSliceLayout[] = [];
  let angle = startAngle;

  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const val = pieSliceValue(d.value);
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
  rawLinks: Array<{ source: string; target: string; value: number; color?: string }>,
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

  // Single choke point: every downstream read of a link's value -- adjacency,
  // node heights, the relaxation loop's weighted centring, link widths, and
  // the returned links themselves -- goes through this sanitized array, not
  // the raw prop. A non-finite value that reached any one of those sites was
  // enough to broadcast NaN to the whole diagram (the per-column recentre
  // step below spreads one node's NaN to every node sharing its column, and
  // the relaxation loop then carries that into every downstream column too),
  // so guarding only the site that happened to be probed was not sufficient.
  // Zero-contribution, not gap-exclusion: matches computeStackedValues'
  // precedent for this file (see pieSliceValue above) since a link has no
  // x-position to drop the way a LineChart/AreaChart gap point does.
  const links = rawLinks.map((l) =>
    Number.isFinite(l.value) && l.value >= 0 ? l : { ...l, value: 0 }
  );

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

  // Global px-per-value scale (d3-sankey's `ky`): the tightest column — least
  // height left after node gaps — sets one scale for the whole diagram, so a
  // given value renders the same height in every column. The previous layout
  // stretched every column to fill the full plot height, which gave each
  // column its own scale; link widths (sized at the source column's scale)
  // then overflowed target nodes laid out at a smaller scale, and the ribbon
  // stacks spilled below the bottom node row.
  let pxPerValue = Number.POSITIVE_INFINITY;
  for (const ids of columnGroups.values()) {
    const totalValue = ids.reduce((s, id) => s + (nodeValues.get(id) ?? 0), 0);
    const availableHeight = height - (ids.length - 1) * nodePadding;
    if (totalValue > 0 && availableHeight > 0) {
      pxPerValue = Math.min(pxPerValue, availableHeight / totalValue);
    }
  }
  if (!Number.isFinite(pxPerValue)) {
    // Nothing carries volume in any column, so every bar collapses to the
    // minimum. Two different inputs land here: genuinely all-zero data, and
    // a graph where every link was non-finite/negative and sanitized to 0
    // above -- both reduce to the same "no volume anywhere" state, and the
    // same minimum-width fallback is the correct degenerate render for
    // either one (never NaN), so they do not need to stay distinguishable.
    pxPerValue = 0;
  }

  const linkRenderWidth = (value: number): number => Math.max(minLinkWidth, value * pxPerValue);

  // Initialize y positions. A node must be at least as tall as its thicker
  // side's rendered link stack: every ribbon is clamped to minLinkWidth, so a
  // node fanning into many near-zero links would otherwise be shorter than the
  // inflated stack attached to it.
  const nodeY = new Map<string, number>();
  const nodeH = new Map<string, number>();
  for (const [col, ids] of columnGroups) {
    const gapCount = ids.length - 1;
    const renderedHeights = ids.map((id) => {
      const outStack = (outgoing.get(id) ?? []).reduce(
        (s, link) => s + linkRenderWidth(link.value),
        0
      );
      const inStack = (incoming.get(id) ?? []).reduce(
        (s, link) => s + linkRenderWidth(link.value),
        0
      );
      return Math.max(minLinkWidth, (nodeValues.get(id) ?? 0) * pxPerValue, outStack, inStack);
    });

    const sumRendered = renderedHeights.reduce((s, h) => s + h, 0);
    const paddingBudget = gapCount > 0 ? (height - sumRendered) / gapCount : 0;
    const effectivePadding = Math.max(0, Math.min(nodePadding, paddingBudget));
    columnPadding.set(col, effectivePadding);

    let y = 0;
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      nodeY.set(id, y);
      nodeH.set(id, renderedHeights[index]);
      y += renderedHeights[index] + effectivePadding;
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

  // The separator is written as the ESCAPE `\u0000`, not as a raw NUL byte. A
  // literal NUL in the source makes the whole file binary to every text tool:
  // `file` reports it as data, `grep` stops reporting matches in it, and a
  // review diff renders it as unviewable. This file carried one from the commit
  // that added the Sankey layout, and it silently hid `computeStackedValues`
  // from a repo-wide grep. The runtime string is identical either way -- a NUL
  // is still the delimiter, because it is the one character a node id cannot
  // contain, which is the whole reason it was chosen.
  const linkKey = (l: { source: string; target: string }): string => `${l.source}\u0000${l.target}`;
  // Link widths use the same global scale as node heights, so each node's link
  // stack fills its bar exactly and never runs past its bottom edge.
  const linkWidths = new Map<string, number>();
  for (const l of links) {
    linkWidths.set(linkKey(l), linkRenderWidth(l.value));
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

// ── Cross-series X alignment ──────────────────────────────────────

/**
 * Minimal shape `joinByX` needs from a data point. `label` stays optional so
 * both `LineChartDataPoint` and `AreaChartDataPoint` satisfy it structurally
 * without either chart importing the other's types.
 */
export type JoinableXPoint = { x: number; y: number; label?: string };

export type JoinableXSeries<P extends JoinableXPoint = JoinableXPoint> = {
  data: ReadonlyArray<P>;
};

export type JoinedXValue<P extends JoinableXPoint = JoinableXPoint> = {
  /** Index of `point` within that series' own `data` array (last-wins, see below). */
  index: number;
  point: P;
};

export type JoinedXRow<P extends JoinableXPoint = JoinableXPoint> = {
  x: number;
  /**
   * One slot per input series, in the same order as `seriesList`. `null`
   * marks a series with no sample at this x -- an absence, never a fabricated
   * zero. A gap point (finite x, non-finite y) still gets a slot here; callers
   * that must skip gaps check `Number.isFinite(value.point.y)` themselves.
   */
  values: ReadonlyArray<JoinedXValue<P> | null>;
};

/**
 * Aligns multiple series by their x VALUE instead of by array position, so a
 * shorter, offset, reordered or duplicate-x series never has another
 * series' sample attributed to its column (array-position joins silently
 * draw series B's 3rd point at series A's 3rd x instead of B's own x).
 *
 * One row is produced per distinct finite x across all series, sorted
 * ascending -- callers do not need to pre-sort their data. Non-finite x
 * (an unusual, distinct case from a gap's non-finite Y) cannot be placed in
 * a column at all and is excluded from the join.
 *
 * Duplicate x within a single series: the LAST matching point wins. This
 * matches `computeStackedValues` below (which is built on this same join)
 * and avoids privileging an arbitrary "first sample" when a caller's array
 * isn't time-ordered.
 *
 * This is the ONE alignment contract shared by tooltip context, hit-testing
 * and stacking/normalization -- there is no second, position-based path for
 * the common case where every series already shares one x sequence: with
 * aligned input this produces exactly the positional pairing callers relied
 * on before, because "nearest by x" and "same index" agree when the x's
 * already match one-for-one.
 */
export function joinByX<P extends JoinableXPoint>(
  seriesList: ReadonlyArray<JoinableXSeries<P>>
): JoinedXRow<P>[] {
  const perSeriesByX = seriesList.map((series) => {
    const byX = new Map<number, JoinedXValue<P>>();
    series.data.forEach((point, index) => {
      if (Number.isFinite(point.x)) {
        byX.set(point.x, { index, point });
      }
    });
    return byX;
  });

  const allX = new Set<number>();
  for (const byX of perSeriesByX) {
    for (const x of byX.keys()) {
      allX.add(x);
    }
  }

  return [...allX]
    .sort((a, b) => a - b)
    .map((x) => ({
      x,
      values: perSeriesByX.map((byX) => byX.get(x) ?? null)
    }));
}

// ── Stacked values ──────────────────────────────────────────────

export function computeStackedValues(
  seriesData: Array<Array<{ x: number; y: number }>>
): StackedPoint[][] {
  if (seriesData.length === 0) {
    return [];
  }

  // Built on joinByX -- the same by-x alignment used for tooltip/hit-testing
  // -- rather than a second, independent accumulation. A series absent at a
  // given x (including a NaN-gap point there) contributes no segment and no
  // baseline shift at that column, instead of a fabricated zero-height slice
  // or a NaN that would poison every series stacked above it.
  const rows = joinByX(seriesData.map((data) => ({ data })));
  const stacked: StackedPoint[][] = seriesData.map(() => []);

  for (const row of rows) {
    let base = 0;
    for (let si = 0; si < seriesData.length; si++) {
      const entry = row.values[si];
      if (entry === null || !Number.isFinite(entry.point.y)) {
        continue;
      }
      // A negative contributes ZERO height, it does not subtract.
      //
      // docs/CHART_INPUT_POLICY.md has always said so -- "a negative
      // contribution to a stack or a percent-of-total does not have a
      // well-defined visual meaning (a slice cannot have negative height), so it
      // is treated as a 0 contribution rather than inverting the stack" -- and
      // the clamp existed only in AreaChart's normalized path, behind
      // `stackNormalize`. Plain `stacked: true` renders through here, where
      // `base + y` let a negative REDUCE the baseline for every series above it.
      //
      // It was invisible rather than merely wrong: AreaChart's stacked y-domain
      // starts at 0, so the inverted segment had nowhere to be drawn and landed
      // at pixel 510 of a 340px plot -- off the bottom of the chart entirely.
      //
      // The segment is still pushed, with zero height, rather than skipped:
      // skipping means "this series has no point at this x", which is what a gap
      // already means, and would silently drop the series from the column.
      const contribution = Math.max(0, entry.point.y);
      const y1 = base + contribution;
      stacked[si].push({ x: row.x, y0: base, y1 });
      base = y1;
    }
  }

  return stacked;
}
