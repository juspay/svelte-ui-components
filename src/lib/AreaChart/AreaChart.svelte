<script lang="ts">
  import type {
    AreaChartDataPoint,
    AreaChartProperties,
    AreaChartTooltipContext
  } from './properties';
  import { onMount } from 'svelte';
  import ChartContainer from '$lib/_chart/ChartContainer.svelte';
  import Axis from '$lib/_chart/Axis.svelte';
  import ChartTooltip from '$lib/_chart/ChartTooltip.svelte';
  import Legend from '$lib/_chart/Legend.svelte';
  import { createLinearScale, niceLinearDomain, computeLinearTicks } from '$lib/_chart/scales';
  import { computeAutoLayout, computeStackedValues, joinByX } from '$lib/_chart/geometry';
  import { linePath, areaPath } from '$lib/_chart/paths';
  import { getColor } from '$lib/_chart/colors';
  import { formatNumber, formatPercent, defaultTickFormat } from '$lib/_chart/format';
  import { measureText } from '$lib/_chart/measure';
  import { resolvePointLabels } from '$lib/_chart/labels';
  import { pointerPositionIn, dismissOnOutsidePointerDown } from '$lib/_chart/interactions';
  import { formatSeriesAggregate } from '$lib/_chart/aggregate';
  import type { LegendItem, Point, TooltipAnchor } from '$lib/_chart/types';
  import { DEFAULT_CHART_MAX_HEIGHT } from '$lib/_chart/types';

  // ── Props ──────────────────────────────────────────────────────

  // Per-instance ID for SVG gradient <linearGradient id> references. Initialised
  // inside onMount so the value is only ever generated on the client — avoids an
  // SSR hydration mismatch that would occur if Math.random() ran on both server
  // and client and produced different strings.
  let uid = $state('');

  let {
    series,
    curve = 'monotone',
    stacked = false,
    stackNormalize = false,
    fillOpacity = 0.3,
    gradientFill = false,
    showDots = false,
    showLine = true,
    showValues = false,
    strokeWidth = 2,
    showGridlines = true,
    showXAxis = true,
    showYAxis = true,
    showLegend = false,
    xDomain,
    yDomain,
    xAxisLabel,
    yAxisLabel,
    xTickFormat,
    yTickFormat,
    aspectRatio = 16 / 9,
    minHeight = 0,
    maxHeight = DEFAULT_CHART_MAX_HEIGHT,
    tooltipSnippet,
    empty,
    tooltipPortal = false,
    onpointhover,
    onpointclick,
    testId,
    classes
  }: AreaChartProperties = $props();

  // ── State ──────────────────────────────────────────────────────

  let containerEl: HTMLDivElement | null = $state(null);
  let plotEl: HTMLDivElement | null = $state(null);
  let chartWidth = $state(0);
  let chartHeight = $state(0);
  // `x` is the shared column key from `joinByX` (a real x VALUE, not an array
  // index); `si` is the series that owns the hovered marker within that
  // column. See the note on `joined` below.
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
  let mouseX = $state(0);
  let mouseY = $state(0);

  onMount(() => {
    uid = Math.random().toString(36).slice(2, 9);
  });

  // ── Layout ─────────────────────────────────────────────────────

  let isStacked = $derived(stacked || stackNormalize);
  let isEmpty = $derived(series.length === 0 || series.every((s) => s.data.length === 0));

  // ── Cross-series alignment ──────────────────────────────

  // The ONE alignment contract for tooltip/hit-testing/normalization — see
  // `$lib/_chart/geometry`. For the common case where every series already
  // shares one x sequence this reproduces the old positional pairing.
  let joined = $derived(joinByX(series));
  let joinedByX = $derived(new Map(joined.map((row) => [row.x, row])));

  // Sum of every series' (clamped-non-negative) value actually present at x —
  // used by both stackNormalize's percent conversion and its tooltip/label
  // total. Built on `joined` rather than a per-index sum, so a shorter/offset
  // series never has its neighbour's total column attributed to it
  // (index-based totals produced a >100% overshoot because two unrelated
  // x's got summed together).
  function columnTotalAtX(x: number): number {
    const row = joinedByX.get(x);
    if (!row) {
      return 0;
    }
    return row.values.reduce(
      (sum, entry) =>
        sum + (entry && Number.isFinite(entry.point.y) ? Math.max(0, entry.point.y) : 0),
      0
    );
  }

  let normalizedSeries = $derived.by(() => {
    if (!stackNormalize) {
      return series.map((s) => s.data);
    }
    return series.map((s) =>
      s.data.map((d) => {
        const total = columnTotalAtX(d.x);
        return {
          x: d.x,
          // A gap (non-finite y) stays non-finite rather than being coerced
          // to a fabricated 0% — "absent" and "zero" are not the same
          // value, and computeStackedValues (below) already treats a
          // non-finite y as "no segment here", not "an empty segment".
          y: !Number.isFinite(d.y) ? NaN : total > 0 ? (Math.max(0, d.y) / total) * 100 : 0,
          label: d.label
        };
      })
    );
  });

  let xExtent = $derived.by<[number, number]>(() => {
    if (xDomain) {
      return xDomain;
    }
    // Non-finite x/y mark gap points; they must not poison the
    // auto-domain the way a bare Math.min/max over every value would.
    const allX = series.flatMap((s) => s.data.map((d) => d.x)).filter((x) => Number.isFinite(x));
    if (allX.length === 0) {
      return [0, 1];
    }
    return niceLinearDomain(Math.min(...allX), Math.max(...allX));
  });
  let yExtent = $derived.by<[number, number]>(() => {
    if (yDomain) {
      return yDomain;
    }
    if (stackNormalize) {
      return [0, 100];
    }
    if (isStacked) {
      const topValues = computeStackedValues(normalizedSeries)
        .flatMap((s) => s.map((p) => p.y1))
        .filter((y) => Number.isFinite(y));
      if (topValues.length === 0) {
        return [0, 1];
      }
      return niceLinearDomain(0, Math.max(...topValues));
    }
    const allY = series.flatMap((s) => s.data.map((d) => d.y)).filter((y) => Number.isFinite(y));
    if (allY.length === 0) {
      return [0, 1];
    }
    return niceLinearDomain(Math.min(0, ...allY), Math.max(...allY));
  });

  let yTickCount = $derived(Math.max(2, Math.min(6, Math.floor(chartHeight / 70))));
  let xTickCount = $derived(Math.max(2, Math.min(8, Math.floor(chartWidth / 90))));

  let layout = $derived.by(() => {
    const yFmt = yTickFormat ?? defaultTickFormat;
    const xFmt = xTickFormat ?? defaultTickFormat;
    return computeAutoLayout({
      width: chartWidth,
      height: chartHeight,
      yTickLabels: showYAxis ? computeLinearTicks(yExtent, yTickCount).map((t) => yFmt(t)) : [],
      xTickLabels: showXAxis ? computeLinearTicks(xExtent, xTickCount).map((t) => xFmt(t)) : [],
      hasYAxisLabel: Boolean(yAxisLabel) && showYAxis,
      hasXAxisLabel: Boolean(xAxisLabel) && showXAxis,
      base: { top: 20, right: 20, bottom: showXAxis ? 40 : 8, left: showYAxis ? 50 : 20 }
    });
  });
  let dims = $derived(layout);

  let xScale = $derived(createLinearScale(xExtent, [0, dims.innerWidth]));
  let yScale = $derived(createLinearScale(yExtent, [dims.innerHeight, 0]));

  let areas = $derived.by(() => {
    if (isStacked) {
      const stackedVals = computeStackedValues(normalizedSeries);
      return stackedVals.map((seg, si) => {
        const color = series[si].color ?? getColor(si);
        const top: Point[] = seg.map((p) => ({ x: xScale(p.x), y: yScale(p.y1) }));
        const bot: Point[] = seg.map((p) => ({ x: xScale(p.x), y: yScale(p.y0) })).reverse();
        const topD = linePath(top, curve);
        const botD = linePath(bot, curve);
        const areaD =
          topD + ` L ${bot[0].x} ${bot[0].y}` + botD.replace(/^M [^ ]+ [^ ]+/, '') + ' Z';
        // computeStackedValues compacts OUT any x where this series has no
        // finite sample, so `seg`'s own array index no longer lines up with
        // series[si].data once a series has a gap or different x coverage
        // than its neighbours (see joinByX's doc comment above `joined`). A
        // focusable mark's aria-label and its hover/click payload both need
        // the REAL series[si].data element, not this compacted array's
        // position -- recover it through the same by-x join every other
        // lookup in this file already goes through, rather than inventing a
        // second index scheme that could drift out of sync with it.
        const xs = seg.map((p) => p.x);
        const dataIndices = xs.map((x) => joinedByX.get(x)?.values[si]?.index ?? -1);
        return { color, points: top, xs, dataIndices, areaD, lineD: topD };
      });
    }
    return series.map((s, si) => {
      const color = s.color ?? getColor(si);
      const points: Point[] = s.data.map((d) => ({ x: xScale(d.x), y: yScale(d.y) }));
      return {
        color,
        points,
        xs: s.data.map((d) => d.x),
        dataIndices: s.data.map((_d, pi) => pi),
        areaD: areaPath(points, dims.innerHeight, curve),
        lineD: linePath(points, curve)
      };
    });
  });

  let legendItems = $derived<LegendItem[]>(
    series.map((s, i) => ({
      label: s.name,
      color: s.color ?? getColor(i),
      aggregateLabel: formatSeriesAggregate(
        s.data.map((d) => d.y),
        s.aggregate ?? 'none',
        s.aggregateFormat ?? yTickFormat ?? formatNumber
      )
    }))
  );

  // ── Tooltip ────────────────────────────────────────────────────

  // Precedence: keyboard focus wins over pointer hover -- see the comment on
  // `focused`'s declaration. Hovering series A's mark while series B's mark
  // holds focus keeps B active; A regains hover feedback once focus moves
  // off it. Every derivation below (row lookup, hover line, anchor, tooltip)
  // reads this combined value rather than `hovered` directly, so all of them
  // agree on what "active" means.
  let pointerOrFocused = $derived(focused ?? hovered);

  let hoveredRow = $derived(
    pointerOrFocused === null ? null : (joinedByX.get(pointerOrFocused.x) ?? null)
  );

  let hoverLineX = $derived.by<number | null>(() => {
    if (pointerOrFocused === null) {
      return null;
    }
    const x = xScale(pointerOrFocused.x);
    return Number.isFinite(x) ? x : null;
  });

  // Anchors the tooltip to the focused/hovered mark's own rendered position
  // (area.points), not a re-derivation of it -- in `stacked` mode that is
  // the TOP of that series' segment (where its dot/focus-ring actually
  // sits), not the raw un-stacked value's own y. This is the same
  // deliberate stacked-mode approximation docs/AreaChart.md already
  // documents for hover tie-breaks: the tooltip's VALUE is unaffected
  // either way, only where the tooltip visually anchors.
  let anchor = $derived.by<TooltipAnchor | null>(() => {
    if (pointerOrFocused === null) {
      return null;
    }
    const area = areas[pointerOrFocused.si];
    const pi = area?.xs.indexOf(pointerOrFocused.x) ?? -1;
    if (!area || pi === -1) {
      return null;
    }
    const point = area.points[pi];
    return Number.isFinite(point.x) && Number.isFinite(point.y)
      ? { x: point.x + dims.margin.left, y: point.y + dims.margin.top, side: 'top' }
      : null;
  });

  let tooltipContext = $derived.by<AreaChartTooltipContext | null>(() => {
    if (pointerOrFocused === null || hoveredRow === null) {
      return null;
    }
    const row = hoveredRow;
    return {
      x: pointerOrFocused.x,
      points: series.map((s, si) => {
        // Each series contributes ITS OWN sample at this x column — not
        // whatever sits at the hovered/anchor series' array index.
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
    const title = xTickFormat
      ? xTickFormat(tooltipContext.x)
      : `x: ${formatNumber(tooltipContext.x)}`;
    // A series absent at this x, or with a gap (non-finite y) here, has
    // nothing to report — showing "0" would read as a measured zero rather
    // than "no data" (absent/zero/invalid are not synonyms).
    const visible = tooltipContext.points
      .map((p, si) => ({ p, entry: row.values[si] }))
      .filter(({ entry }) => entry !== null && Number.isFinite(entry.point.y));
    if (stackNormalize) {
      const columnTotal = columnTotalAtX(tooltipContext.x);
      return {
        title,
        items: visible.map(({ p }) => ({
          label: p.name,
          value: formatPercent(Math.max(0, p.y), columnTotal),
          color: p.color
        }))
      };
    }
    return {
      title,
      items: visible.map(({ p }) => ({
        label: p.name,
        value: formatNumber(p.y),
        color: p.color
      }))
    };
  });

  // ── Point labels ───────────────────────────────────────────────

  function pointDisplayValue(si: number, pi: number): string {
    const point = series[si]?.data[pi];
    const y = point?.y ?? 0;
    if (stackNormalize) {
      const columnTotal = point ? columnTotalAtX(point.x) : 0;
      return formatPercent(Math.max(0, y), columnTotal);
    }
    return formatNumber(y);
  }

  let pointLabelPlacements = $derived.by(() => {
    if (!showValues) {
      return [];
    }
    const plot = { width: dims.innerWidth, height: dims.innerHeight };
    const font = { size: 11 };
    return areas.map((area, si) =>
      resolvePointLabels({
        points: area.points,
        labels: series[si].data.map((d, pi) => measureText(pointDisplayValue(si, pi), font)),
        plot
      })
    );
  });

  // ── Keyboard access (family-wide contract, see docs/PieChart.md#keyboard-access) ─

  // AreaChart/LineChart are continuous series, not discrete categories like
  // Bar/Funnel/Pie/Sankey/DualAxisBar -- there is no fixed set of "marks" to
  // Tab through independent of data shape. The deliberate call here: each
  // rendered (series, point) pair is its own Tab stop, in series-then-point
  // DOM order, mirroring exactly what pointer hover already lands on via
  // findNearest -- so keyboard and mouse users reach the same set of
  // addressable data points, just via a different input.
  function focusPointLabel(point: AreaChartDataPoint, x: number): string {
    if (point.label) {
      return point.label;
    }
    return xTickFormat ? xTickFormat(x) : formatNumber(x);
  }

  // Matches the family's per-mark "{name}: {value}" convention (Bar/Funnel/
  // Pie), extended with the "{name} — {series}: {value}" em-dash form for
  // multi-series charts -- BarChart's own tooltip already disambiguates
  // multi-series marks this way, but its aria-label omits the series name
  // (a gap found while extracting this contract, not repeated here).
  function focusAriaLabel(si: number, dataIndex: number, x: number): string {
    const point = series[si]?.data[dataIndex];
    const name = point ? focusPointLabel(point, x) : formatNumber(x);
    const value = pointDisplayValue(si, dataIndex);
    return series.length > 1 ? `${name} — ${series[si].name}: ${value}` : `${name}: ${value}`;
  }

  // ── Interactions ───────────────────────────────────────────────

  function trackMouse(e: PointerEvent) {
    const position = pointerPositionIn(plotEl, e);
    if (position !== null) {
      mouseX = position.x;
      mouseY = position.y;
    }
  }

  // Nearest hit-test over the SAME `joined` columns used for tooltip/
  // normalization — one alignment contract, not a second position-based
  // path. A column is only eligible if some series actually has a finite
  // value there (a shared gap column is not hoverable).
  function findNearest(plotX: number, plotY: number): { x: number; si: number } | null {
    let nearestRow: (typeof joined)[number] | null = null;
    let nearestXDist = Infinity;
    for (const row of joined) {
      const hasValue = row.values.some((entry) => entry !== null && Number.isFinite(entry.point.y));
      if (!hasValue) {
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
    // Nearest by each series' OWN (non-cumulative) value in y-space. In
    // stacked mode this is a deliberate simplification of the previous
    // "nearest by rendered/stacked pixel" tie-break — see docs/AreaChart.md —
    // the value shown for the hovered x is unaffected either way; only which
    // series' marker wins a close proximity call can differ.
    let nearestSi = -1;
    let nearestYDist = Infinity;
    for (let si = 0; si < series.length; si++) {
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
  }

  function sameMark(a: { x: number; si: number } | null, b: { x: number; si: number } | null) {
    return a !== null && b !== null && a.x === b.x && a.si === b.si;
  }

  // onpointhover mirrors the combined pointer-or-focus mark (pointerOrFocused),
  // once per actual change -- e.g. a pointer leaving a mark that is still
  // keyboard-focused must not report a hover-cleared event for a highlight
  // that never went away. Shared by activatePointer/activateFocus/
  // handlePointerLeave/handleBlur so all four write paths agree on the same
  // dedup.
  let lastNotified: { x: number; si: number } | null = null;
  function notifyPointHover() {
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
      // pointIndex is this series' own array index, matching the
      // documented event contract even when series' x coverage differs.
      onpointhover?.({ seriesIndex: next.si, pointIndex: entry.index, point: entry.point });
    }
  }

  // Pointer half of activation, used by handleOverlayMove. Skips the write
  // (not just the notify) when the mark hasn't changed, since
  // handleOverlayMove fires on every pointermove over the same mark.
  function activatePointer(next: { x: number; si: number }) {
    if (!sameMark(hovered, next)) {
      hovered = next;
    }
    notifyPointHover();
  }

  // Focus half of activation, used by handleMarkFocus. See `focused`'s
  // declaration for why this writes separate state from activatePointer.
  function activateFocus(next: { x: number; si: number }) {
    focused = next;
    notifyPointHover();
  }

  function handleOverlayMove(e: PointerEvent) {
    trackMouse(e);
    const plotX = mouseX - dims.margin.left;
    const plotY = mouseY - dims.margin.top;
    const next = findNearest(plotX, plotY);
    if (next === null) {
      hovered = null;
      return;
    }
    activatePointer(next);
  }

  // Wired to the hover-overlay's pointerleave. Clears ONLY the hover half of
  // the state -- never `focused` -- so a late, stale pointerleave (see
  // `focused`'s declaration comment) cannot erase a mark's focus highlight.
  function handlePointerLeave() {
    if (hovered !== null) {
      hovered = null;
      notifyPointHover();
    }
  }

  // Keyboard mirror of pointer hover/click: focusing a mark activates it
  // exactly like the nearest-point hover search would (same tooltip/
  // highlight/anchor state, via pointerOrFocused), blur mirrors pointer-leave
  // for the focus half, and Enter/Space invoke the same click callback a
  // pointer click would -- the Enter/Space-only contract every one of the
  // five existing charts uses (none of Bar/DualAxisBar/Funnel/Pie/Sankey
  // wires arrow keys, Home, End or Escape, so none are added here either).
  function handleMarkFocus(x: number, si: number) {
    activateFocus({ x, si });
  }

  // Wired to the .focus-target circle's blur. Clears ONLY the focus half; a
  // pointer that happens to still be over the mark keeps it hovered.
  function handleBlur() {
    if (focused !== null) {
      focused = null;
      notifyPointHover();
    }
  }

  function handleMarkKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  function handleClick() {
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
  }

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
  class="area-chart {classes ?? ''}"
  bind:this={containerEl}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#if isEmpty && typeof empty === 'function'}
    <div class="chart-empty">{@render empty()}</div>
  {:else}
    {#if showLegend && series.length > 1}
      <Legend items={legendItems} position="top" />
    {/if}

    <div class="chart-plot" bind:this={plotEl}>
      <ChartContainer
        bind:width={chartWidth}
        bind:height={chartHeight}
        {aspectRatio}
        {minHeight}
        {maxHeight}
      >
        {#if gradientFill}
          <!-- <defs> must be a direct child of <svg> (SVG root), not inside a transformed <g>.
             gradientUnits="userSpaceOnUse" with y1/y2 in the inner coordinate space (0..innerHeight)
             correctly spans the full chart height regardless of how thin each band is. -->
          <defs>
            {#each areas as area, si (si)}
              <linearGradient
                id="area-grad-{uid}-{si}"
                x1="0"
                y1="0"
                x2="0"
                y2={dims.innerHeight}
                gradientUnits="userSpaceOnUse"
              >
                <!-- The gradient top stop is fillOpacity + 0.3 (clamped to 1), giving a richer
                   anchor at the top that fades to transparent at the bottom. This intentionally
                   exceeds the base fillOpacity so that gradient-fill areas appear more vivid
                   than their solid-fill counterparts (where fill-opacity equals fillOpacity). -->
                <stop
                  offset="0%"
                  stop-color={area.color}
                  stop-opacity={Math.min(
                    (pointerOrFocused?.si === si ? fillOpacity + 0.2 : fillOpacity) + 0.3,
                    1
                  )}
                />
                <stop offset="100%" stop-color={area.color} stop-opacity={0} />
              </linearGradient>
            {/each}
          </defs>
        {/if}
        <g transform="translate({dims.margin.left}, {dims.margin.top})">
          {#if showYAxis}
            <Axis
              orientation="left"
              scale={yScale}
              tickCount={yTickCount}
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
                rotateTicks={layout.xRotate}
                tickEvery={layout.xEvery}
                labelOffset={layout.xLabelOffset}
                label={xAxisLabel}
                tickFormat={xTickFormat}
              />
            </g>
          {/if}

          {#each areas as area, si (si)}
            <path
              class="area-fill"
              class:dimmed={pointerOrFocused !== null && pointerOrFocused.si !== si}
              d={area.areaD}
              fill={gradientFill ? `url(#area-grad-${uid}-${si})` : area.color}
              fill-opacity={gradientFill
                ? 1
                : pointerOrFocused?.si === si
                  ? fillOpacity + 0.2
                  : fillOpacity}
            />
            {#if showLine}
              <path
                class="area-line"
                class:dimmed={pointerOrFocused !== null && pointerOrFocused.si !== si}
                d={area.lineD}
                stroke={area.color}
                stroke-width={strokeWidth}
                fill="none"
              />
            {/if}
            {#if area.points.length === 1 && !showDots && Number.isFinite(area.points[0].x) && Number.isFinite(area.points[0].y)}
              <circle
                class="single-point"
                class:dimmed={pointerOrFocused !== null && pointerOrFocused.si !== si}
                cx={area.points[0].x}
                cy={area.points[0].y}
                r={6}
                fill={area.color}
              />
            {/if}
            {#if showDots}
              {#each area.points as point, pi (pi)}
                <!-- Gap points (non-finite) render no marker. -->
                {#if Number.isFinite(point.x) && Number.isFinite(point.y)}
                  <circle
                    class="dot"
                    cx={point.x}
                    cy={point.y}
                    r={pointerOrFocused !== null &&
                    pointerOrFocused.si === si &&
                    hoverLineX !== null &&
                    point.x === hoverLineX
                      ? 6
                      : 3}
                    fill={area.color}
                  />
                {/if}
              {/each}
            {/if}
            {#if showValues && pointLabelPlacements[si]}
              {#each area.points as _point, pi (pi)}
                {@const pl = pointLabelPlacements[si][pi]}
                {#if pl?.visible && Number.isFinite(pl.x) && Number.isFinite(pl.y)}
                  <text
                    class="point-value"
                    x={pl.x}
                    y={pl.y}
                    text-anchor="middle"
                    dominant-baseline={pl.dominantBaseline}>{pointDisplayValue(si, pi)}</text
                  >
                {/if}
              {/each}
            {/if}

            <!-- Always rendered (independent of showDots): one Tab stop per
                 data point, transparent until :focus-visible. Sits under the
                 hover-overlay rect below (paint order = DOM order here), so
                 pointer hit-testing is untouched -- this layer exists only
                 to give keyboard users the same per-point targets pointer
                 hover already reaches via findNearest. -->
            {#each area.points as point, pi (pi)}
              {#if Number.isFinite(point.x) && Number.isFinite(point.y)}
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
                  aria-label={focusAriaLabel(si, area.dataIndices[pi], area.xs[pi])}
                  onfocus={() => handleMarkFocus(area.xs[pi], si)}
                  onblur={handleBlur}
                  onkeydown={handleMarkKeydown}
                  onclick={handleClick}
                />
              {/if}
            {/each}
          {/each}

          {#if hoverLineX !== null}
            <line class="hover-line" x1={hoverLineX} x2={hoverLineX} y1={0} y2={dims.innerHeight} />
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
  .area-chart {
    width: 100%;
    position: relative;
  }
  .chart-plot {
    position: relative;
  }
  .area-fill {
    transition:
      fill-opacity
        var(--chart-transition-duration, var(--duration-base, var(--motion-duration, 0.2s)))
        var(--chart-transition-easing, var(--motion-easing, ease)),
      opacity var(--chart-transition-duration, var(--duration-base, var(--motion-duration, 0.2s)))
        var(--chart-transition-easing, var(--motion-easing, ease));
    pointer-events: none;
  }
  .area-fill.dimmed {
    opacity: var(--areachart-dimmed-opacity, 0.1);
  }
  .area-line {
    transition: opacity
      var(--chart-transition-duration, var(--duration-base, var(--motion-duration, 0.2s)))
      var(--chart-transition-easing, var(--motion-easing, ease));
    stroke-linecap: round;
    stroke-linejoin: round;
    pointer-events: none;
  }
  .area-line.dimmed {
    opacity: var(--areachart-dimmed-opacity, 0.1);
  }
  .single-point {
    pointer-events: none;
  }
  .single-point.dimmed {
    opacity: var(--areachart-dimmed-opacity, 0.1);
  }
  .dot {
    transition:
      r var(--chart-transition-duration, var(--duration-base, var(--motion-duration, 0.2s)))
        var(--chart-transition-easing, var(--motion-easing, ease)),
      opacity var(--chart-transition-duration, var(--duration-base, var(--motion-duration, 0.2s)))
        var(--chart-transition-easing, var(--motion-easing, ease));
    stroke: var(--chart-dot-stroke, light-dark(#fff, #111827));
    stroke-width: 2;
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
  .point-value {
    fill: var(--areachart-value-color, light-dark(#333, #e5e7eb));
    font-size: var(--areachart-value-font-size, 11px);
    font-family: var(--chart-font-family, inherit);
    pointer-events: none;
  }
  .hover-line {
    stroke: var(
      --areachart-hover-line-color,
      var(--linechart-hover-line-color, light-dark(#ccc, #4b5563))
    );
    stroke-width: 1;
    stroke-dasharray: var(--areachart-hover-line-dash, var(--linechart-hover-line-dash, 4 4));
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
