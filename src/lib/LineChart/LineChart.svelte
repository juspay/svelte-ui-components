<script lang="ts">
  import type {
    LineChartDataPoint,
    LineChartProperties,
    LineChartTooltipContext
  } from './properties';
  import { DEFAULT_CHART_MAX_HEIGHT } from '$lib/_chart/types';
  import type { ChartHighlightAPI } from '$lib/_chart/highlight';
  import { onMount } from 'svelte';
  import ChartContainer from '$lib/_chart/ChartContainer.svelte';
  import Axis from '$lib/_chart/Axis.svelte';
  import ChartTooltip from '$lib/_chart/ChartTooltip.svelte';
  import Legend from '$lib/_chart/Legend.svelte';
  import { createLinearScale, niceLinearDomain, computeLinearTicks } from '$lib/_chart/scales';
  import { computeAutoLayout, joinByX } from '$lib/_chart/geometry';
  import { linePath, areaPath } from '$lib/_chart/paths';
  import { getColor } from '$lib/_chart/colors';
  import { formatNumber, defaultTickFormat } from '$lib/_chart/format';
  import { measureText } from '$lib/_chart/measure';
  import { resolvePointLabels } from '$lib/_chart/labels';
  import { formatSeriesAggregate } from '$lib/_chart/aggregate';
  import type { LegendItem, Point, TooltipAnchor } from '$lib/_chart/types';
  import { pointerPositionIn, dismissOnOutsidePointerDown } from '$lib/_chart/interactions';
  import { SvelteSet } from 'svelte/reactivity';

  // Per-instance ID for SVG gradient <linearGradient id> references. Initialised
  // inside onMount so the value is only ever generated on the client — avoids an
  // SSR hydration mismatch that would occur if Math.random() ran on both server
  // and client and produced different strings.
  let uid = $state('');

  // ── Props ──────────────────────────────────────────────────────

  let {
    series,
    curve = 'monotone',
    gradientFill = false,
    fillOpacity = 0.3,
    showArea = false,
    areaGradient,
    showDots = true,
    showValues = false,
    dotRadius = 4,
    strokeWidth = 2,
    showGridlines = true,
    showXAxis = true,
    showYAxis = true,
    showLegend = false,
    xDomain,
    yDomain,
    xAxisLabel,
    yAxisLabel,
    xAxisCategories,
    xTickFormat,
    yTickFormat,
    yIntegerTicks = false,
    aspectRatio = 16 / 9,
    minHeight = 0,
    maxHeight = DEFAULT_CHART_MAX_HEIGHT,
    tooltipSnippet,
    empty,
    sharedTooltip,
    interactiveLegend = false,
    hideLegendBelow = 360,
    tooltipPortal = false,
    highlightedIndex = null,
    onchartready,
    onpointclick,
    onpointhover,
    testId,
    classes
  }: LineChartProperties = $props();

  // ── State ──────────────────────────────────────────────────────

  let containerEl: HTMLDivElement | null = $state(null);
  let plotEl: HTMLDivElement | null = $state(null);
  let chartWidth = $state(0);
  let chartHeight = $state(0);
  // `x` is the shared column key from `joinByX` (a real x VALUE, not an array
  // index), and `si` is the series that owns the hovered marker within that
  // column. Joining by x (see below) is what lets two series with different
  // x coverage each contribute their own point to a shared hover column
  // instead of one series' array index being reused against another's data.
  //
  // `hovered` and `focused` are kept as two separate pieces of state rather
  // than one shared by both input sources: a pointer leaving a mark must
  // never erase that mark's focus, and a late/stale pointerleave -- which
  // real browsers fire *after* a focus event when focusing an off-screen
  // mark auto-scrolls the page under an unmoved cursor -- must not be able
  // to clobber the focus highlight either. See `pointerOrFocused` below for
  // the precedence between them.
  let hovered = $state<{ x: number; si: number } | null>(null);
  let focused = $state<{ x: number; si: number } | null>(null);
  // internalHighlight holds the index driven by the ChartHighlightAPI.highlight() call.
  // The effective highlighted index merges this with the prop-driven highlightedIndex.
  let internalHighlight = $state<number | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);
  const hiddenSeries = new SvelteSet<number>();

  function toggleSeries(index: number): void {
    if (hiddenSeries.has(index)) {
      hiddenSeries.delete(index);
    } else {
      hiddenSeries.add(index);
    }
  }

  // Shared-mode switch: one tooltip listing every visible series at the
  // hovered x. Defaults to true for multi-series charts.
  let shared = $derived(sharedTooltip ?? series.length > 1);

  // Effective highlighted index: the declarative prop takes precedence when it is a non-null
  // number; otherwise the imperative API value (internalHighlight) is used. This lets callers
  // mix both approaches — e.g. default to null so the API drives highlights, then override with
  // a specific prop value when a controlled index is needed.
  let effectiveHighlight = $derived(
    typeof highlightedIndex === 'number' ? highlightedIndex : internalHighlight
  );

  onMount(() => {
    uid = Math.random().toString(36).slice(2, 9);

    const api: ChartHighlightAPI = {
      type: 'line-chart',
      highlight: (index) => {
        internalHighlight = index;
      },
      getCategories: () => {
        if (xAxisCategories && xAxisCategories.length > 0) {
          return xAxisCategories;
        }
        // Fall back to the x-values of the longest series as string labels.
        const reference = series.reduce(
          (longest, s) => (s.data.length > longest.data.length ? s : longest),
          series[0] ?? { data: [] }
        );
        return reference.data.map((d) => String(d.x));
      }
    };

    onchartready?.(api);
  });

  // ── Layout ─────────────────────────────────────────────────────

  let isEmpty = $derived(series.length === 0 || series.every((s) => s.data.length === 0));

  let xExtent = $derived.by<[number, number]>(() => {
    if (xDomain) {
      return xDomain;
    }
    // Non-finite coordinates mark gap points in sparse series; they must not
    // poison the auto-domain (Math.min/max propagate NaN).
    const allX = series
      .filter((_, si) => !hiddenSeries.has(si))
      .flatMap((s) => s.data.map((d) => d.x))
      .filter((x) => Number.isFinite(x));
    if (allX.length === 0) {
      return [0, 1];
    }
    return niceLinearDomain(Math.min(...allX), Math.max(...allX));
  });
  let yExtent = $derived.by<[number, number]>(() => {
    if (yDomain) {
      return yDomain;
    }
    const allY = series
      .filter((_, si) => !hiddenSeries.has(si))
      .flatMap((s) => s.data.map((d) => d.y))
      .filter((y) => Number.isFinite(y));
    if (allY.length === 0) {
      return [0, 1];
    }
    return niceLinearDomain(Math.min(0, ...allY), Math.max(...allY));
  });

  // ── Category tick formatter ────────────────────────────────────

  // When xAxisCategories is supplied we build a formatter that maps the numeric
  // x-value (1-based index used in the data) to the corresponding category label.
  let resolvedXTickFormat = $derived.by(() => {
    if (xAxisCategories && xAxisCategories.length > 0) {
      const categories = xAxisCategories;
      return (value: number | string): string => {
        const numericValue = typeof value === 'string' ? parseFloat(value) : value;
        // x values are 1-based indices; category array is 0-based.
        const categoryIndex = Math.round(numericValue) - 1;
        return categories[categoryIndex] ?? String(value);
      };
    }
    return xTickFormat;
  });

  let yTickCount = $derived(Math.max(2, Math.min(6, Math.floor(chartHeight / 70))));
  // Capped at 6 per the design-system line-chart spec ("Max no. of ticks should be 6").
  let xTickCount = $derived(Math.max(2, Math.min(6, Math.floor(chartWidth / 90))));
  // Category positions are whole numbers — fractional tick steps would repeat labels.
  let xIntegerTicks = $derived(Boolean(xAxisCategories && xAxisCategories.length > 0));

  let layout = $derived.by(() => {
    const yFmt = yTickFormat ?? defaultTickFormat;
    const xFmt = resolvedXTickFormat ?? defaultTickFormat;
    return computeAutoLayout({
      width: chartWidth,
      height: chartHeight,
      yTickLabels: showYAxis ? computeLinearTicks(yExtent, yTickCount).map((t) => yFmt(t)) : [],
      xTickLabels: showXAxis
        ? computeLinearTicks(xExtent, xTickCount, xIntegerTicks).map((t) => xFmt(t))
        : [],
      hasYAxisLabel: Boolean(yAxisLabel) && showYAxis,
      hasXAxisLabel: Boolean(xAxisLabel) && showXAxis,
      base: { top: 20, right: 20, bottom: showXAxis ? 40 : 8, left: showYAxis ? 50 : 20 }
    });
  });
  let dims = $derived(layout);

  let xScale = $derived(createLinearScale(xExtent, [0, dims.innerWidth]));
  let yScale = $derived(createLinearScale(yExtent, [dims.innerHeight, 0]));

  let lines = $derived(
    series.map((s, si) => {
      const color = s.color ?? getColor(si);
      const points: Point[] = s.data.map((d) => ({ x: xScale(d.x), y: yScale(d.y) }));
      const finitePoints = points.filter(
        (point) => Number.isFinite(point.x) && Number.isFinite(point.y)
      );
      // Design-system contract: a series with a single data point renders as a
      // flat line at that y across the full plot width (a lone dot reads as a
      // glitch), while the point marker itself still renders at its true x.
      const isSinglePoint = finitePoints.length === 1;
      const pathPoints: Point[] = isSinglePoint
        ? [
            { x: 0, y: finitePoints[0].y },
            { x: dims.innerWidth, y: finitePoints[0].y }
          ]
        : points;
      return {
        color,
        points,
        dash: s.dash === true ? '6 4' : typeof s.dash === 'string' ? s.dash : null,
        path: linePath(pathPoints, isSinglePoint ? 'linear' : curve),
        areaD: areaPath(pathPoints, dims.innerHeight, isSinglePoint ? 'linear' : curve),
        hidden: hiddenSeries.has(si)
      };
    })
  );

  // Markers paint back-to-front so the first series ends up on top — see the
  // comment on the marker loop in the markup.
  let markerPaintOrder = $derived(lines.map((_line, index) => index).reverse());

  let legendItems = $derived<LegendItem[]>(
    series.map((s, i) => ({
      label: s.name,
      color: s.color ?? getColor(i),
      hidden: hiddenSeries.has(i),
      aggregateLabel: formatSeriesAggregate(
        s.data.map((d) => d.y),
        s.aggregate ?? 'none',
        s.aggregateFormat ?? yTickFormat ?? formatNumber
      )
    }))
  );

  // ── Cross-series alignment ──────────────────────────────

  // The ONE alignment contract for tooltip/hit-testing (and, via
  // computeStackedValues, stacking) — see `$lib/_chart/geometry`. For the
  // common case where every series already shares one x sequence this
  // produces exactly the old positional pairing, so nothing changes there.
  let joined = $derived(joinByX(series));
  let joinedByX = $derived(new Map(joined.map((row) => [row.x, row])));

  // ── Tooltip ────────────────────────────────────────────────────

  // Precedence: keyboard focus wins over pointer hover -- see the comment on
  // `focused`'s declaration. Hovering series A's mark while series B's mark
  // holds focus keeps B active; A regains hover feedback once focus moves
  // off it. Every derivation below reads this combined value rather than
  // `hovered` directly, so all of them agree on what "active" means.
  let pointerOrFocused = $derived(focused ?? hovered);

  let hoveredRow = $derived(
    pointerOrFocused === null ? null : (joinedByX.get(pointerOrFocused.x) ?? null)
  );
  let hoverLineX = $derived.by<number | null>(() => {
    if (pointerOrFocused === null) {
      return null;
    }
    const x = xScale(pointerOrFocused.x);
    // A non-finite pointerOrFocused.x cannot occur (joinByX excludes it), but a
    // degenerate scale (e.g. zero-width plot) can still project to NaN.
    return Number.isFinite(x) ? x : null;
  });

  // When a highlight index is active (imperative or prop), show the vertical
  // crosshair at that point even without a mouse hover.
  let highlightLineX = $derived.by<number | null>(() => {
    if (effectiveHighlight === null) {
      return null;
    }
    // Use the first VISIBLE series that has a point at this index.
    for (const line of lines) {
      if (line.hidden) {
        continue;
      }
      const point = line.points[effectiveHighlight];
      if (point && Number.isFinite(point.x)) {
        return point.x;
      }
    }
    return null;
  });

  let activeLineX = $derived(hoverLineX ?? highlightLineX);

  let tooltipContext = $derived.by<LineChartTooltipContext | null>(() => {
    if (pointerOrFocused === null || hoveredRow === null) {
      return null;
    }
    const row = hoveredRow;
    return {
      x: pointerOrFocused.x,
      points: series.map((s, si) => {
        // Each series contributes ITS OWN sample at this x column — not
        // whatever happens to sit at the anchor series' array index. A
        // series absent at this x (row.values[si] is null) reports 0,
        // matching the pre-fix fallback for a missing point.
        const entry = row.values[si];
        return {
          name: s.name,
          y: entry?.point.y ?? 0,
          color: s.color ?? getColor(si),
          label: entry?.point.label
        };
      })
    };
  });

  let tooltipData = $derived.by(() => {
    if (tooltipContext === null || hoveredRow === null) {
      return null;
    }
    const row = hoveredRow;
    const xLabel = resolvedXTickFormat
      ? resolvedXTickFormat(tooltipContext.x)
      : `x: ${formatNumber(tooltipContext.x)}`;
    return {
      title: xLabel,
      items: tooltipContext.points
        .map((p, si) => ({ p, si, entry: row.values[si] }))
        .filter(
          ({ si, entry }) =>
            !hiddenSeries.has(si) &&
            (shared || si === pointerOrFocused?.si) &&
            entry !== null &&
            // A gap point (non-finite y) has nothing to report in the tooltip.
            Number.isFinite(entry.point.y)
        )
        .map(({ p }) => ({ label: p.name, value: formatNumber(p.y), color: p.color }))
    };
  });

  // Highcharts hover halo: a translucent ring behind the active marker(s).
  let haloPoints = $derived.by(() => {
    if (pointerOrFocused === null || hoveredRow === null) {
      return [];
    }
    const row = hoveredRow;
    return lines.flatMap((line, si) => {
      if (line.hidden || (!shared && si !== pointerOrFocused!.si)) {
        return [];
      }
      // This series' OWN entry at the hovered column, projected through the
      // shared scales — not `line.points[pointerOrFocused.pi]`, which would be
      // this series' point at the ANCHOR series' array index.
      const entry = row.values[si];
      if (!entry || !Number.isFinite(entry.point.x) || !Number.isFinite(entry.point.y)) {
        return [];
      }
      const x = xScale(entry.point.x);
      const y = yScale(entry.point.y);
      return Number.isFinite(x) && Number.isFinite(y) ? [{ x, y, color: line.color }] : [];
    });
  });

  let anchor = $derived.by<TooltipAnchor | null>(() => {
    if (pointerOrFocused === null || haloPoints.length === 0) {
      return null;
    }
    return {
      x: haloPoints[0].x + dims.margin.left,
      y: Math.min(...haloPoints.map((p) => p.y)) + dims.margin.top,
      side: 'top'
    };
  });

  // ── Keyboard access & live status (family-wide contract; see
  //    docs/PieChart.md#keyboard-access) ─────────────────────────

  const instanceId = $props.id();
  const statusId = `line-status-${instanceId}`;

  // "Active" datum for announcement purposes, in the SAME precedence order
  // PieChart's own activeIndex/statusText already documents: direct
  // interaction (pointer hover or keyboard focus, both funnelled through
  // `hovered`) ahead of the declarative highlightedIndex prop / imperative
  // ChartHighlightAPI (effectiveHighlight) -- neither of which fires a focus
  // event of its own, so a live region is the only way either one reaches
  // assistive tech. AreaChart has no such non-focus-triggered highlight
  // path (no highlightedIndex prop, no ChartHighlightAPI), so it relies on
  // each mark's own aria-label alone, matching the family's majority
  // (Bar/DualAxisBar/Funnel/Sankey) -- this live region exists here for the
  // same reason it exists on PieChart, not as an inconsistency between the
  // two new charts.
  let activeDatum = $derived.by<{ si: number; point: LineChartDataPoint } | null>(() => {
    if (pointerOrFocused !== null && hoveredRow !== null) {
      const entry = hoveredRow.values[pointerOrFocused.si];
      return entry ? { si: pointerOrFocused.si, point: entry.point } : null;
    }
    if (effectiveHighlight !== null) {
      for (let si = 0; si < series.length; si++) {
        if (hiddenSeries.has(si)) {
          continue;
        }
        const point = series[si]?.data[effectiveHighlight];
        if (point) {
          return { si, point };
        }
      }
    }
    return null;
  });

  let statusText = $derived.by(() => {
    const active = activeDatum;
    if (active === null) {
      return '';
    }
    const name = focusPointLabel(active.point, active.point.x);

    // A SHARED tooltip shows every series at this x, so the live region has to
    // as well. `shared` defaults to true whenever there is more than one series,
    // so announcing only the focused one was the default configuration: a
    // sighted user saw "Revenue: 10" and "Cost: 5" while a screen-reader user
    // heard "Revenue: 10" alone -- the tooltip's whole comparison, which is the
    // reason a shared tooltip exists, silently withheld from the people who
    // cannot see it.
    const row = joinedByX.get(active.point.x);
    if (shared && series.length > 1 && row) {
      const parts = series
        .map((s, si) => ({ name: s.name, entry: row.values[si], si }))
        .filter((candidate) => !hiddenSeries.has(candidate.si) && candidate.entry !== null)
        .map((candidate) => `${candidate.name}: ${formatNumber(candidate.entry!.point.y)}`);
      if (parts.length > 0) {
        return `${name} — ${parts.join(', ')}`;
      }
    }

    const value = formatNumber(active.point.y);
    return series.length > 1
      ? `${name} — ${series[active.si]?.name ?? ''}: ${value}`
      : `${name}: ${value}`;
  });

  // ── Point labels ───────────────────────────────────────────────

  let pointLabelPlacements = $derived.by(() => {
    if (!showValues) {
      return [];
    }
    const plot = { width: dims.innerWidth, height: dims.innerHeight };
    const font = { size: 11 };
    return lines.map((line, si) =>
      line.hidden
        ? []
        : resolvePointLabels({
            points: line.points,
            labels: series[si].data.map((d) => measureText(formatNumber(d.y), font)),
            plot
          })
    );
  });

  // ── Highlight dim logic ────────────────────────────────────────

  // A point is "dimmed" when the highlight system is active (hover or
  // imperative highlight) and the point is not the active one. `pi` here is
  // always the series' OWN array index (as rendered), so the hover
  // comparison must go through that point's actual x value rather than
  // reusing `pi` as if it meant the same column in every series.
  const isDotDimmed = (si: number, pi: number): boolean => {
    if (shared) {
      if (pointerOrFocused !== null) {
        const dataX = series[si]?.data[pi]?.x ?? null;
        return dataX === null || pointerOrFocused.x !== dataX;
      }
      if (effectiveHighlight !== null) {
        return pi !== effectiveHighlight;
      }
      return false;
    }
    // Hover/focus interaction takes precedence over imperative highlight.
    if (pointerOrFocused !== null) {
      const dataX = series[si]?.data[pi]?.x ?? null;
      return pointerOrFocused.si !== si || dataX === null || pointerOrFocused.x !== dataX;
    }
    if (effectiveHighlight !== null) {
      return pi !== effectiveHighlight;
    }
    return false;
  };

  const isLineDimmed = (si: number): boolean => {
    if (shared) {
      return false;
    }
    if (pointerOrFocused !== null) {
      return pointerOrFocused.si !== si;
    }
    // When only a point index is highlighted (no series index), dim no lines.
    return false;
  };

  const isHighlightedDot = (si: number, pi: number): boolean => {
    if (pointerOrFocused !== null) {
      const dataX = series[si]?.data[pi]?.x ?? null;
      return pointerOrFocused.si === si && dataX !== null && pointerOrFocused.x === dataX;
    }
    if (effectiveHighlight !== null) {
      return pi === effectiveHighlight;
    }
    return false;
  };

  // AreaChart/LineChart are continuous series, not discrete categories like
  // Bar/Funnel/Pie/Sankey/DualAxisBar -- there is no fixed set of "marks" to
  // Tab through independent of data shape. The deliberate call here: each
  // rendered (series, point) pair is its own Tab stop, in series-then-point
  // DOM order, mirroring exactly what pointer hover already lands on via
  // findNearest -- so keyboard and mouse users reach the same set of
  // addressable data points, just via a different input.
  function focusPointLabel(point: LineChartDataPoint, x: number): string {
    if (point.label) {
      return point.label;
    }
    return resolvedXTickFormat ? resolvedXTickFormat(x) : formatNumber(x);
  }

  // Matches the family's per-mark "{name}: {value}" convention (Bar/Funnel/
  // Pie), extended with the "{name} — {series}: {value}" em-dash form for
  // multi-series charts -- BarChart's own tooltip already disambiguates
  // multi-series marks this way, but its aria-label omits the series name
  // (a gap found while extracting this contract, not repeated here).
  function focusAriaLabel(si: number, pi: number, x: number): string {
    const point = series[si]?.data[pi];
    const name = point ? focusPointLabel(point, x) : formatNumber(x);
    const value = formatNumber(point?.y ?? 0);
    return series.length > 1
      ? `${name} — ${series[si]?.name ?? ''}: ${value}`
      : `${name}: ${value}`;
  }

  // ── Interactions ───────────────────────────────────────────────

  const trackMouse = (e: PointerEvent): void => {
    const position = pointerPositionIn(plotEl, e);
    if (position !== null) {
      mouseX = position.x;
      mouseY = position.y;
    }
  };

  // Nearest hit-test over the SAME `joined` columns used for tooltip/halo —
  // one alignment contract, not a second position-based path. A column is
  // only eligible if some visible series actually has a finite value there,
  // so a shared gap column is skipped rather than reported as hoverable.
  const findNearest = (plotX: number, plotY: number): { x: number; si: number } | null => {
    let nearestRow: (typeof joined)[number] | null = null;
    let nearestXDist = Infinity;
    for (const row of joined) {
      const hasVisibleValue = row.values.some(
        (entry, si) => entry !== null && !hiddenSeries.has(si) && Number.isFinite(entry.point.y)
      );
      if (!hasVisibleValue) {
        continue;
      }
      const px = xScale(row.x);
      const dist = Math.abs(px - plotX);
      if (dist < nearestXDist) {
        nearestXDist = dist;
        nearestRow = row;
      }
    }
    if (nearestRow === null) {
      return null;
    }
    let nearestSi = -1;
    let nearestYDist = Infinity;
    for (let si = 0; si < series.length; si++) {
      if (hiddenSeries.has(si)) {
        continue;
      }
      const entry = nearestRow.values[si];
      if (!entry || !Number.isFinite(entry.point.y)) {
        continue;
      }
      const py = yScale(entry.point.y);
      const dist = Math.abs(py - plotY);
      if (dist < nearestYDist) {
        nearestYDist = dist;
        nearestSi = si;
      }
    }
    return nearestSi === -1 ? null : { x: nearestRow.x, si: nearestSi };
  };

  const sameMark = (
    a: { x: number; si: number } | null,
    b: { x: number; si: number } | null
  ): boolean => a !== null && b !== null && a.x === b.x && a.si === b.si;

  // onpointhover mirrors the combined pointer-or-focus mark (pointerOrFocused),
  // once per actual change -- e.g. a pointer leaving a mark that is still
  // keyboard-focused must not report a hover-cleared event for a highlight
  // that never went away. Shared by activatePointer/activateFocus/
  // handlePointerLeave/handleBlur so all four write paths agree on the same
  // dedup.
  let lastNotified: { x: number; si: number } | null = null;
  const notifyPointHover = (): void => {
    const next = pointerOrFocused;
    if (sameMark(next, lastNotified)) {
      return;
    }
    lastNotified = next;
    if (next === null) {
      onpointhover?.(null);
      return;
    }
    const entry = joinedByX.get(next.x)?.values[next.si];
    if (entry) {
      // pointIndex is this series' own array index (entry.index), not the
      // shared column key — the documented event contract is an index into
      // `series[seriesIndex].data`, which differs from other series' own
      // indices whenever their x coverage differs.
      onpointhover?.({ seriesIndex: next.si, pointIndex: entry.index, point: entry.point });
    }
  };

  // Pointer half of activation, used by handleOverlayMove. Skips the write
  // (not just the notify) when the mark hasn't changed, since
  // handleOverlayMove fires on every pointermove over the same mark.
  const activatePointer = (next: { x: number; si: number }): void => {
    if (!sameMark(hovered, next)) {
      hovered = next;
    }
    notifyPointHover();
  };

  // Focus half of activation, used by handleMarkFocus. See `focused`'s
  // declaration for why this writes separate state from activatePointer.
  const activateFocus = (next: { x: number; si: number }): void => {
    focused = next;
    notifyPointHover();
  };

  const handleOverlayMove = (e: PointerEvent): void => {
    trackMouse(e);
    const plotX = mouseX - dims.margin.left;
    const plotY = mouseY - dims.margin.top;
    const next = findNearest(plotX, plotY);
    if (next === null) {
      hovered = null;
      return;
    }
    activatePointer(next);
  };

  // Wired to the hover-overlay's pointerleave. Clears ONLY the hover half of
  // the state -- never `focused` -- so a late, stale pointerleave (see
  // `focused`'s declaration comment) cannot erase a mark's focus highlight.
  const handlePointerLeave = (): void => {
    if (hovered !== null) {
      hovered = null;
      notifyPointHover();
    }
  };

  // Keyboard mirror of pointer hover/click: focusing a mark activates it
  // exactly like the nearest-point hover search would (same tooltip/halo/
  // anchor/live-status state, via pointerOrFocused), blur mirrors
  // pointer-leave for the focus half, and Enter/Space invoke the same click
  // callback a pointer click would -- the Enter/Space-only contract every
  // one of the five existing charts uses (none of Bar/DualAxisBar/Funnel/
  // Pie/Sankey wires arrow keys, Home, End or Escape, so none are added
  // here either).
  const handleMarkFocus = (si: number, pi: number): void => {
    const point = series[si]?.data[pi];
    if (point) {
      activateFocus({ x: point.x, si });
    }
  };

  // Wired to the .focus-target circle's blur. Clears ONLY the focus half; a
  // pointer that happens to still be over the mark keeps it hovered.
  const handleBlur = (): void => {
    if (focused !== null) {
      focused = null;
      notifyPointHover();
    }
  };

  const handleMarkKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const handleClick = (): void => {
    if (pointerOrFocused === null) {
      return;
    }
    const entry = joinedByX.get(pointerOrFocused.x)?.values[pointerOrFocused.si];
    if (entry) {
      onpointclick?.({
        seriesIndex: pointerOrFocused.si,
        pointIndex: entry.index,
        point: entry.point
      });
    }
  };

  // Touch taps have no pointerleave: dismiss when a pointerdown lands outside.
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    if (hovered === null) {
      return;
    }
    return dismissOnOutsidePointerDown(containerEl, handlePointerLeave);
  });
</script>

<div
  class="line-chart {classes ?? ''}"
  bind:this={containerEl}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#if isEmpty && typeof empty === 'function'}
    <div class="chart-empty">{@render empty()}</div>
  {:else}
    <!-- Mirrors the tooltip's own text for every activation path (pointer,
         keyboard focus, declarative highlightedIndex, imperative
         ChartHighlightAPI) -- see statusText. -->
    <div class="sr-only" role="status" aria-live="polite" id={statusId} data-pw="line-status">
      {statusText}
    </div>

    {#if showLegend && series.length > 1 && (chartWidth === 0 || hideLegendBelow === 0 || chartWidth >= hideLegendBelow)}
      {#if interactiveLegend}
        <Legend items={legendItems} position="top" onToggle={toggleSeries} />
      {:else}
        <Legend items={legendItems} position="top" />
      {/if}
    {/if}

    <div class="chart-plot" bind:this={plotEl}>
      <ChartContainer
        bind:width={chartWidth}
        bind:height={chartHeight}
        {aspectRatio}
        {minHeight}
        {maxHeight}
      >
        {#if gradientFill || showArea}
          <defs>
            {#each lines as line, si (si)}
              {#if gradientFill}
                <linearGradient
                  id="line-grad-{uid}-{si}"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2={dims.innerHeight}
                  gradientUnits="userSpaceOnUse"
                >
                  <!-- The gradient top stop is fillOpacity + 0.3 (clamped to 1), giving a richer
                     anchor at the top that fades to transparent at the bottom. This intentionally
                     exceeds the base fillOpacity so that gradient-fill areas appear more vivid
                     than a flat solid-fill at fillOpacity alone. -->
                  <stop
                    offset="0%"
                    stop-color={line.color}
                    stop-opacity={Math.min(
                      (pointerOrFocused?.si === si ? fillOpacity + 0.2 : fillOpacity) + 0.3,
                      1
                    )}
                  />
                  <stop offset="100%" stop-color={line.color} stop-opacity={0} />
                </linearGradient>
              {/if}
              {#if showArea}
                <linearGradient
                  id="line-area-{uid}-{si}"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2={dims.innerHeight}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop
                    offset="0%"
                    stop-color={areaGradient ? areaGradient.from : line.color}
                    stop-opacity={areaGradient ? 1 : 0.35}
                  />
                  <stop
                    offset="100%"
                    stop-color={areaGradient ? areaGradient.to : line.color}
                    stop-opacity={areaGradient ? 1 : 0}
                  />
                </linearGradient>
              {/if}
            {/each}
          </defs>
        {/if}
        <g transform="translate({dims.margin.left}, {dims.margin.top})">
          {#if showYAxis}
            <Axis
              orientation="left"
              scale={yScale}
              tickCount={yTickCount}
              integerTicks={yIntegerTicks}
              {showGridlines}
              gridlineLength={dims.innerWidth}
              label={yAxisLabel}
              tickFormat={yTickFormat}
            />
          {/if}
          {#if showXAxis}
            <g transform="translate(0, {dims.innerHeight})">
              <Axis
                orientation="bottom"
                scale={xScale}
                tickCount={xTickCount}
                integerTicks={xIntegerTicks}
                rotateTicks={layout.xRotate}
                tickEvery={layout.xEvery}
                labelOffset={layout.xLabelOffset}
                label={xAxisLabel}
                tickFormat={resolvedXTickFormat}
              />
            </g>
          {/if}

          {#each haloPoints as hp, i (i)}
            <circle
              class="dot-halo"
              cx={hp.x}
              cy={hp.y}
              r={dotRadius + 6}
              fill={hp.color}
              data-pw={`dot-halo-${i}`}
              testID={`dot-halo-${i}`}
            />
          {/each}

          {#each lines as line, si (si)}
            {#if !line.hidden}
              {#if showArea}
                <path
                  class="line-area-fill"
                  class:dimmed={isLineDimmed(si)}
                  d={line.areaD}
                  fill="url(#line-area-{uid}-{si})"
                />
              {:else if gradientFill}
                <path
                  class="line-area-fill"
                  class:dimmed={pointerOrFocused !== null && pointerOrFocused.si !== si}
                  d={line.areaD}
                  fill="url(#line-grad-{uid}-{si})"
                />
              {/if}
              <path
                class="line-path"
                class:dimmed={isLineDimmed(si)}
                d={line.path}
                stroke={line.color}
                stroke-width={strokeWidth}
                stroke-dasharray={line.dash}
                fill="none"
              />
              {#if showValues && pointLabelPlacements[si]}
                {#each line.points as _point, pi (pi)}
                  {@const pl = pointLabelPlacements[si][pi]}
                  {#if pl?.visible && Number.isFinite(pl.x) && Number.isFinite(pl.y)}
                    <text
                      class="point-value"
                      x={pl.x}
                      y={pl.y}
                      text-anchor="middle"
                      dominant-baseline={pl.dominantBaseline}
                      >{formatNumber(series[si].data[pi].y)}</text
                    >
                  {/if}
                {/each}
              {/if}
            {/if}
          {/each}

          <!--
            Point markers are painted after every line, and in REVERSE series
            order. Two series that share a value put their markers on identical
            coordinates, and SVG has no z-index — whichever is written last wins.
            Painting forwards meant the last series in the array hid the first,
            so a chart passed [primary, comparison] lost the primary series'
            marker wherever the two periods happened to agree, most visibly at
            the first bucket. Reversing here makes the FIRST series win, which is
            the one a reader is looking at; the legend keeps its original order
            because it is derived from `series`, not from this loop.
          -->
          {#each markerPaintOrder as si (si)}
            {@const line = lines[si]}
            {#if !line.hidden}
              {#if line.points.length === 1 && !showDots && Number.isFinite(line.points[0].x) && Number.isFinite(line.points[0].y)}
                <circle
                  class="single-point"
                  class:dimmed={isLineDimmed(si)}
                  cx={line.points[0].x}
                  cy={line.points[0].y}
                  r={dotRadius * 1.5}
                  fill={line.color}
                />
              {/if}
              {#if showDots}
                {#each line.points as point, pi (pi)}
                  <!-- Gap points (non-finite) render no marker. -->
                  {#if Number.isFinite(point.x) && Number.isFinite(point.y)}
                    <circle
                      class="dot"
                      class:dimmed={isDotDimmed(si, pi)}
                      class:highlighted={isHighlightedDot(si, pi)}
                      cx={point.x}
                      cy={point.y}
                      r={isHighlightedDot(si, pi) ? dotRadius * 1.5 : dotRadius}
                      fill={line.color}
                    />
                  {/if}
                {/each}
              {/if}
            {/if}
          {/each}

          <!-- Always rendered (independent of showDots), in natural series
               order (paint order doesn't matter -- these stay transparent
               until :focus-visible): one Tab stop per data point, giving
               keyboard users the same per-point targets pointer hover
               already reaches via findNearest. -->
          {#each lines as line, si (si)}
            {#if !line.hidden}
              {#each line.points as point, pi (pi)}
                {@const raw = series[si]?.data[pi]}
                {#if raw && Number.isFinite(point.x) && Number.isFinite(point.y)}
                  <!-- `onclick` as well as `onkeydown`, matching all five sibling
                       charts, which put both on the same element. Assistive
                       technology commonly realises its "activate control" gesture
                       as a click DISPATCHED AT the focused node rather than as a
                       raw keydown, so a mark carrying only `onkeydown` is
                       reachable and announceable and still cannot be activated by
                       the very users the focus target exists for.
                       `pointer-events: none` does not block this: it suppresses
                       hit-testing for real pointer input -- which is what keeps
                       mouse hover flowing to the overlay underneath -- while a
                       dispatched click still fires a listener on the element. -->
                  <circle
                    class="focus-target"
                    cx={point.x}
                    cy={point.y}
                    r={6}
                    tabindex="0"
                    role="button"
                    aria-label={focusAriaLabel(si, pi, raw.x)}
                    aria-describedby={statusId}
                    onfocus={() => handleMarkFocus(si, pi)}
                    onblur={handleBlur}
                    onkeydown={handleMarkKeydown}
                    onclick={handleClick}
                  />
                {/if}
              {/each}
            {/if}
          {/each}

          {#if activeLineX !== null}
            <line
              class="hover-line"
              x1={activeLineX}
              x2={activeLineX}
              y1={0}
              y2={dims.innerHeight}
            />
          {/if}

          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <rect
            class="hover-overlay"
            x={0}
            y={0}
            width={dims.innerWidth}
            height={dims.innerHeight}
            fill="transparent"
            data-pw="hover-overlay"
            testID="hover-overlay"
            onpointermove={handleOverlayMove}
            onpointerleave={handlePointerLeave}
            onclick={handleClick}
          />
        </g>
      </ChartContainer>

      {#if typeof tooltipSnippet === 'function'}
        <ChartTooltip
          data={tooltipData}
          {mouseX}
          {mouseY}
          {anchor}
          portal={tooltipPortal}
          originEl={plotEl}
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
          originEl={plotEl}
        />
      {/if}
    </div>
  {/if}
</div>

<style>
  .line-chart {
    width: 100%;
    position: relative;
  }
  .chart-plot {
    position: relative;
  }
  .line-area-fill {
    transition:
      fill-opacity var(--chart-transition-duration, var(--motion-duration, 0.2s))
        var(--chart-transition-easing, var(--motion-easing, ease)),
      opacity var(--chart-transition-duration, var(--motion-duration, 0.2s))
        var(--chart-transition-easing, var(--motion-easing, ease));
    pointer-events: none;
  }
  .line-area-fill.dimmed {
    opacity: var(--linechart-dimmed-opacity, 0.2);
  }
  .line-path {
    transition: opacity var(--chart-transition-duration, var(--motion-duration, 0.2s))
      var(--chart-transition-easing, var(--motion-easing, ease));
    stroke-linecap: round;
    stroke-linejoin: round;
    pointer-events: none;
  }
  .line-path.dimmed {
    opacity: var(--linechart-dimmed-opacity, 0.2);
  }
  .single-point {
    pointer-events: none;
  }
  .single-point.dimmed {
    opacity: var(--linechart-dimmed-opacity, 0.2);
  }
  .dot {
    transition:
      r var(--chart-transition-duration, var(--motion-duration, 0.2s))
        var(--chart-transition-easing, var(--motion-easing, ease)),
      opacity var(--chart-transition-duration, var(--motion-duration, 0.2s))
        var(--chart-transition-easing, var(--motion-easing, ease));
    stroke: var(--chart-dot-stroke, light-dark(#fff, #111827));
    stroke-width: 2;
    pointer-events: none;
  }
  .dot.dimmed {
    opacity: var(--linechart-dimmed-opacity, 0.2);
  }
  .dot.highlighted {
    stroke: var(--linechart-highlight-ring-color, light-dark(#fff, #111827));
    stroke-width: var(--linechart-highlight-ring-width, 2.5);
  }
  .dot-halo {
    opacity: 0.25;
    pointer-events: none;
  }
  .focus-target {
    fill: transparent;
    pointer-events: none;
  }
  .focus-target:focus-visible {
    outline: 2px solid var(--chart-axis-label-color, light-dark(#333, #e5e7eb));
    outline-offset: 1px;
  }
  /* Standard visually-hidden recipe (matches PieChart's own .sr-only): present
     for assistive tech, removed from layout and the visual canvas. */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border-width: 0;
  }
  .point-value {
    fill: var(--linechart-value-color, light-dark(#333, #e5e7eb));
    font-size: var(--linechart-value-font-size, 11px);
    font-family: var(--chart-font-family, inherit);
    pointer-events: none;
  }
  .hover-line {
    stroke: var(--linechart-hover-line-color, light-dark(#ccc, #4b5563));
    stroke-width: 1;
    stroke-dasharray: var(--linechart-hover-line-dash, 4 4);
    pointer-events: none;
  }
  .hover-overlay {
    cursor: crosshair;
  }
  .chart-empty {
    padding: var(--chart-empty-padding, 32px 24px);
    color: var(--chart-empty-color, light-dark(#9ca3af, #6b7280));
    text-align: center;
  }
</style>
