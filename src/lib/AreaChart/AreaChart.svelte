<script lang="ts">
  import type { AreaChartProperties, AreaChartTooltipContext } from './properties';
  import { onMount } from 'svelte';
  import ChartContainer from '$lib/_chart/ChartContainer.svelte';
  import Axis from '$lib/_chart/Axis.svelte';
  import ChartTooltip from '$lib/_chart/ChartTooltip.svelte';
  import Legend from '$lib/_chart/Legend.svelte';
  import { createLinearScale, niceLinearDomain, computeLinearTicks } from '$lib/_chart/scales';
  import { computeAutoLayout, computeStackedValues } from '$lib/_chart/geometry';
  import { linePath, areaPath } from '$lib/_chart/paths';
  import { getColor } from '$lib/_chart/colors';
  import { formatNumber, formatPercent, defaultTickFormat } from '$lib/_chart/format';
  import { measureText } from '$lib/_chart/measure';
  import { resolvePointLabels } from '$lib/_chart/labels';
  import { pointerPositionIn, dismissOnOutsidePointerDown } from '$lib/_chart/interactions';
  import type { LegendItem, Point } from '$lib/_chart/types';
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
  let hovered = $state<{ si: number; pi: number } | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);

  onMount(() => {
    uid = Math.random().toString(36).slice(2, 9);
  });

  // ── Layout ─────────────────────────────────────────────────────

  let isStacked = $derived(stacked || stackNormalize);
  let isEmpty = $derived(series.length === 0 || series.every((s) => s.data.length === 0));

  let normalizedSeries = $derived.by(() => {
    if (!stackNormalize) {
      return series.map((s) => s.data);
    }
    const totals = series[0]?.data.map((_, i) =>
      series.reduce((sum, s) => sum + Math.max(0, s.data[i]?.y ?? 0), 0)
    );
    return series.map((s) =>
      s.data.map((d, i) => ({
        x: d.x,
        y: totals && totals[i] > 0 ? (Math.max(0, d.y) / totals[i]) * 100 : 0,
        label: d.label
      }))
    );
  });

  let xExtent = $derived.by<[number, number]>(() => {
    if (xDomain) {
      return xDomain;
    }
    const allX = series.flatMap((s) => s.data.map((d) => d.x));
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
      const topValues = computeStackedValues(normalizedSeries).flatMap((s) => s.map((p) => p.y1));
      if (topValues.length === 0) {
        return [0, 1];
      }
      return niceLinearDomain(0, Math.max(...topValues));
    }
    const allY = series.flatMap((s) => s.data.map((d) => d.y));
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
        return { color, points: top, areaD, lineD: topD };
      });
    }
    return series.map((s, si) => {
      const color = s.color ?? getColor(si);
      const points: Point[] = s.data.map((d) => ({ x: xScale(d.x), y: yScale(d.y) }));
      return {
        color,
        points,
        areaD: areaPath(points, dims.innerHeight, curve),
        lineD: linePath(points, curve)
      };
    });
  });

  let legendItems = $derived<LegendItem[]>(
    series.map((s, i) => ({ label: s.name, color: s.color ?? getColor(i) }))
  );

  // ── Tooltip ────────────────────────────────────────────────────

  let hoverLineX = $derived(
    hovered === null ? null : (areas[hovered.si]?.points[hovered.pi]?.x ?? null)
  );

  let tooltipContext = $derived.by<AreaChartTooltipContext | null>(() => {
    if (hovered === null) {
      return null;
    }
    const hp = series[hovered.si]?.data[hovered.pi];
    if (!hp) {
      return null;
    }
    return {
      x: hp.x,
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
    const title = xTickFormat
      ? xTickFormat(tooltipContext.x)
      : `x: ${formatNumber(tooltipContext.x)}`;
    if (stackNormalize) {
      const pi = hovered?.pi ?? 0;
      const columnTotal = series.reduce((sum, s) => sum + Math.max(0, s.data[pi]?.y ?? 0), 0);
      return {
        title,
        items: tooltipContext.points.map((p) => ({
          label: p.name,
          value: formatPercent(Math.max(0, p.y), columnTotal),
          color: p.color
        }))
      };
    }
    return {
      title,
      items: tooltipContext.points.map((p) => ({
        label: p.name,
        value: formatNumber(p.y),
        color: p.color
      }))
    };
  });

  // ── Point labels ───────────────────────────────────────────────

  function pointDisplayValue(si: number, pi: number): string {
    const y = series[si]?.data[pi]?.y ?? 0;
    if (stackNormalize) {
      const columnTotal = series.reduce((sum, s) => sum + Math.max(0, s.data[pi]?.y ?? 0), 0);
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

  // ── Interactions ───────────────────────────────────────────────

  function trackMouse(e: PointerEvent) {
    const position = pointerPositionIn(plotEl, e);
    if (position !== null) {
      mouseX = position.x;
      mouseY = position.y;
    }
  }

  function findNearest(plotX: number, plotY: number): { si: number; pi: number } | null {
    if (series.length === 0) {
      return null;
    }
    // Use the longest series as the index reference so hover still works when
    // the first series is empty or shorter than the others.
    const reference = series.reduce((a, b) => (b.data.length > a.data.length ? b : a)).data;
    if (reference.length === 0) {
      return null;
    }
    let nearestPi = 0;
    let nearestXDist = Infinity;
    for (let i = 0; i < reference.length; i++) {
      const px = xScale(reference[i].x);
      const dist = Math.abs(px - plotX);
      if (dist < nearestXDist) {
        nearestXDist = dist;
        nearestPi = i;
      }
    }
    let nearestSi = 0;
    let nearestYDist = Infinity;
    for (let si = 0; si < areas.length; si++) {
      const p = areas[si].points[nearestPi];
      if (!p) {
        continue;
      }
      const dist = Math.abs(p.y - plotY);
      if (dist < nearestYDist) {
        nearestYDist = dist;
        nearestSi = si;
      }
    }
    return { si: nearestSi, pi: nearestPi };
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
    if (hovered === null || hovered.si !== next.si || hovered.pi !== next.pi) {
      hovered = next;
      const point = series[next.si].data[next.pi];
      onpointhover?.({ seriesIndex: next.si, pointIndex: next.pi, point });
    }
  }

  function handleLeave() {
    if (hovered !== null) {
      hovered = null;
      onpointhover?.(null);
    }
  }

  function handleClick() {
    if (hovered === null) {
      return;
    }
    const point = series[hovered.si]?.data[hovered.pi];
    if (point) {
      onpointclick?.({ seriesIndex: hovered.si, pointIndex: hovered.pi, point });
    }
  }

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
                    (hovered?.si === si ? fillOpacity + 0.2 : fillOpacity) + 0.3,
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
              class:dimmed={hovered !== null && hovered.si !== si}
              d={area.areaD}
              fill={gradientFill ? `url(#area-grad-${uid}-${si})` : area.color}
              fill-opacity={gradientFill ? 1 : hovered?.si === si ? fillOpacity + 0.2 : fillOpacity}
            />
            {#if showLine}
              <path
                class="area-line"
                class:dimmed={hovered !== null && hovered.si !== si}
                d={area.lineD}
                stroke={area.color}
                stroke-width={strokeWidth}
                fill="none"
              />
            {/if}
            {#if area.points.length === 1 && !showDots}
              <circle
                class="single-point"
                class:dimmed={hovered !== null && hovered.si !== si}
                cx={area.points[0].x}
                cy={area.points[0].y}
                r={6}
                fill={area.color}
              />
            {/if}
            {#if showDots}
              {#each area.points as point, pi (pi)}
                <circle
                  class="dot"
                  cx={point.x}
                  cy={point.y}
                  r={hovered?.si === si && hovered?.pi === pi ? 6 : 3}
                  fill={area.color}
                />
              {/each}
            {/if}
            {#if showValues && pointLabelPlacements[si]}
              {#each area.points as _point, pi (pi)}
                {@const pl = pointLabelPlacements[si][pi]}
                {#if pl?.visible}
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
      fill-opacity var(--chart-transition-duration, 0.2s) ease,
      opacity var(--chart-transition-duration, 0.2s) ease;
    pointer-events: none;
  }
  .area-fill.dimmed {
    opacity: var(--areachart-dimmed-opacity, 0.1);
  }
  .area-line {
    transition: opacity var(--chart-transition-duration, 0.2s) ease;
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
      r var(--chart-transition-duration, 0.2s) ease,
      opacity var(--chart-transition-duration, 0.2s) ease;
    stroke: var(--chart-dot-stroke, light-dark(#fff, #111827));
    stroke-width: 2;
    pointer-events: none;
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
