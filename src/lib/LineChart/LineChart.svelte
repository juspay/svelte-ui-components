<script lang="ts">
  import type { LineChartProperties, LineChartTooltipContext } from './properties';
  import { DEFAULT_CHART_MAX_HEIGHT } from '$lib/_chart/types';
  import type { ChartHighlightAPI } from '$lib/_chart/highlight';
  import { onMount } from 'svelte';
  import ChartContainer from '$lib/_chart/ChartContainer.svelte';
  import Axis from '$lib/_chart/Axis.svelte';
  import ChartTooltip from '$lib/_chart/ChartTooltip.svelte';
  import Legend from '$lib/_chart/Legend.svelte';
  import { createLinearScale, niceLinearDomain, computeLinearTicks } from '$lib/_chart/scales';
  import { computeAutoLayout } from '$lib/_chart/geometry';
  import { linePath, areaPath } from '$lib/_chart/paths';
  import { getColor } from '$lib/_chart/colors';
  import { formatNumber, defaultTickFormat } from '$lib/_chart/format';
  import { measureText } from '$lib/_chart/measure';
  import { resolvePointLabels } from '$lib/_chart/labels';
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
    onChartReady,
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
  let hovered = $state<{ si: number; pi: number } | null>(null);
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

    onChartReady?.(api);
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
      hidden: hiddenSeries.has(i)
    }))
  );

  // ── Tooltip ────────────────────────────────────────────────────

  let hoveredPoint = $derived(
    hovered === null ? null : (series[hovered.si]?.data[hovered.pi] ?? null)
  );

  let hoverLineX = $derived.by<number | null>(() => {
    if (hovered === null) {
      return null;
    }
    const x = lines[hovered.si]?.points[hovered.pi]?.x ?? null;
    // A gap point (non-finite) anchors no crosshair.
    return x !== null && Number.isFinite(x) ? x : null;
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
    if (hovered === null || hoveredPoint === null) {
      return null;
    }
    return {
      x: hoveredPoint.x,
      points: series.map((s, si) => {
        const p = s.data[hovered!.pi];
        return {
          name: s.name,
          y: p?.y ?? 0,
          color: s.color ?? getColor(si),
          label: p?.label
        };
      })
    };
  });

  let tooltipData = $derived.by(() => {
    if (tooltipContext === null) {
      return null;
    }
    const xLabel = resolvedXTickFormat
      ? resolvedXTickFormat(tooltipContext.x)
      : `x: ${formatNumber(tooltipContext.x)}`;
    return {
      title: xLabel,
      items: tooltipContext.points
        .map((p, si) => ({ p, si }))
        .filter(
          ({ si }) =>
            !hiddenSeries.has(si) &&
            (shared || si === hovered?.si) &&
            series[si]?.data[hovered!.pi] != null &&
            // A gap point (non-finite y) has nothing to report in the tooltip.
            Number.isFinite(series[si].data[hovered!.pi].y)
        )
        .map(({ p }) => ({ label: p.name, value: formatNumber(p.y), color: p.color }))
    };
  });

  // Highcharts hover halo: a translucent ring behind the active marker(s).
  let haloPoints = $derived.by(() => {
    if (hovered === null) {
      return [];
    }
    return lines.flatMap((line, si) => {
      if (line.hidden || (!shared && si !== hovered!.si)) {
        return [];
      }
      const p = line.points[hovered!.pi];
      // A gap point (non-finite) has no marker, so it gets no halo either.
      return p && Number.isFinite(p.x) && Number.isFinite(p.y)
        ? [{ x: p.x, y: p.y, color: line.color }]
        : [];
    });
  });

  let anchor = $derived.by<TooltipAnchor | null>(() => {
    if (hovered === null || haloPoints.length === 0) {
      return null;
    }
    return {
      x: haloPoints[0].x + dims.margin.left,
      y: Math.min(...haloPoints.map((p) => p.y)) + dims.margin.top,
      side: 'top'
    };
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

  // A point index is "dimmed" when the highlight system is active (hover or
  // imperative highlight) and the point is not the active one.
  const isDotDimmed = (si: number, pi: number): boolean => {
    if (shared) {
      if (hovered !== null) {
        return hovered.pi !== pi;
      }
      if (effectiveHighlight !== null) {
        return pi !== effectiveHighlight;
      }
      return false;
    }
    // Hover interaction takes precedence over imperative highlight.
    if (hovered !== null) {
      return hovered.si !== si || hovered.pi !== pi;
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
    if (hovered !== null) {
      return hovered.si !== si;
    }
    // When only a point index is highlighted (no series index), dim no lines.
    return false;
  };

  const isHighlightedDot = (si: number, pi: number): boolean => {
    if (hovered !== null) {
      return hovered.si === si && hovered.pi === pi;
    }
    if (effectiveHighlight !== null) {
      return pi === effectiveHighlight;
    }
    return false;
  };

  // ── Interactions ───────────────────────────────────────────────

  const trackMouse = (e: PointerEvent): void => {
    const position = pointerPositionIn(plotEl, e);
    if (position !== null) {
      mouseX = position.x;
      mouseY = position.y;
    }
  };

  const findNearest = (plotX: number, plotY: number): { si: number; pi: number } | null => {
    if (series.length === 0) {
      return null;
    }
    // Use the longest VISIBLE series as the index reference so hover still works
    // when the first series is empty or shorter than the others, and never
    // anchors to a series the user has toggled off via the legend.
    const visibleEntries = series
      .map((s, si) => ({ s, si }))
      .filter((entry) => !hiddenSeries.has(entry.si));
    if (visibleEntries.length === 0) {
      return null;
    }
    const referenceEntry = visibleEntries.reduce((a, b) =>
      b.s.data.length > a.s.data.length ? b : a
    );
    const reference = referenceEntry.s.data;
    if (reference.length === 0) {
      return null;
    }
    let nearestPi = 0;
    let nearestXDist = Infinity;
    for (let i = 0; i < reference.length; i++) {
      // Gap points (non-finite) are not hoverable — NaN distances would never
      // win the comparison, but skipping keeps nearestPi from defaulting to one.
      if (!Number.isFinite(reference[i].x) || !Number.isFinite(reference[i].y)) {
        continue;
      }
      const px = xScale(reference[i].x);
      const dist = Math.abs(px - plotX);
      if (dist < nearestXDist) {
        nearestXDist = dist;
        nearestPi = i;
      }
    }
    // The reference series is visible and owns nearestPi by construction, so
    // it's a safe default if no other visible series' point is nearer in y.
    let nearestSi = referenceEntry.si;
    let nearestYDist = Infinity;
    for (let si = 0; si < series.length; si++) {
      if (hiddenSeries.has(si)) {
        continue;
      }
      const p = series[si].data[nearestPi];
      if (!p) {
        continue;
      }
      const py = yScale(p.y);
      const dist = Math.abs(py - plotY);
      if (dist < nearestYDist) {
        nearestYDist = dist;
        nearestSi = si;
      }
    }
    return { si: nearestSi, pi: nearestPi };
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
    if (hovered === null || hovered.si !== next.si || hovered.pi !== next.pi) {
      hovered = next;
      const point = series[next.si].data[next.pi];
      onpointhover?.({ seriesIndex: next.si, pointIndex: next.pi, point });
    }
  };

  const handleLeave = (): void => {
    if (hovered !== null) {
      hovered = null;
      onpointhover?.(null);
    }
  };

  const handleClick = (): void => {
    if (hovered === null) {
      return;
    }
    const point = series[hovered.si]?.data[hovered.pi];
    if (point) {
      onpointclick?.({ seriesIndex: hovered.si, pointIndex: hovered.pi, point });
    }
  };

  // Touch taps have no pointerleave: dismiss when a pointerdown lands outside.
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    if (hovered === null) {
      return;
    }
    return dismissOnOutsidePointerDown(containerEl, handleLeave);
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
                      (hovered?.si === si ? fillOpacity + 0.2 : fillOpacity) + 0.3,
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
                  class:dimmed={hovered !== null && hovered.si !== si}
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
            onpointerleave={handleLeave}
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
      fill-opacity var(--chart-transition-duration, 0.2s) ease,
      opacity var(--chart-transition-duration, 0.2s) ease;
    pointer-events: none;
  }
  .line-area-fill.dimmed {
    opacity: var(--linechart-dimmed-opacity, 0.2);
  }
  .line-path {
    transition: opacity var(--chart-transition-duration, 0.2s) ease;
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
      r var(--chart-transition-duration, 0.2s) ease,
      opacity var(--chart-transition-duration, 0.2s) ease;
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
