<script lang="ts">
  import type { LineChartProperties, LineChartTooltipContext } from './properties';
  import { onMount } from 'svelte';
  import ChartContainer from '$lib/_chart/ChartContainer.svelte';
  import Axis from '$lib/_chart/Axis.svelte';
  import ChartTooltip from '$lib/_chart/ChartTooltip.svelte';
  import Legend from '$lib/_chart/Legend.svelte';
  import { createLinearScale, niceLinearDomain } from '$lib/_chart/scales';
  import { computeChartDimensions } from '$lib/_chart/geometry';
  import { linePath, areaPath } from '$lib/_chart/paths';
  import { getColor } from '$lib/_chart/colors';
  import { formatNumber } from '$lib/_chart/format';
  import type { LegendItem, Point } from '$lib/_chart/types';

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
    xTickFormat,
    yTickFormat,
    aspectRatio = 16 / 9,
    tooltipSnippet,
    empty,
    onpointclick,
    onpointhover,
    testId,
    classes
  }: LineChartProperties = $props();

  // ── State ──────────────────────────────────────────────────────

  let containerEl: HTMLDivElement | null = $state(null);
  let chartWidth = $state(0);
  let chartHeight = $state(0);
  let hovered = $state<{ si: number; pi: number } | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);

  onMount(() => {
    uid = Math.random().toString(36).slice(2, 9);
  });

  // ── Layout ─────────────────────────────────────────────────────

  let dims = $derived(computeChartDimensions(chartWidth, chartHeight));

  let isEmpty = $derived(series.length === 0 || series.every((s) => s.data.length === 0));

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
    const allY = series.flatMap((s) => s.data.map((d) => d.y));
    if (allY.length === 0) {
      return [0, 1];
    }
    return niceLinearDomain(Math.min(0, ...allY), Math.max(...allY));
  });

  let xScale = $derived(createLinearScale(xExtent, [0, dims.innerWidth]));
  let yScale = $derived(createLinearScale(yExtent, [dims.innerHeight, 0]));

  let lines = $derived(
    series.map((s, si) => {
      const color = s.color ?? getColor(si);
      const points: Point[] = s.data.map((d) => ({ x: xScale(d.x), y: yScale(d.y) }));
      return {
        color,
        points,
        path: linePath(points, curve),
        areaD: areaPath(points, dims.innerHeight, curve)
      };
    })
  );

  let legendItems = $derived<LegendItem[]>(
    series.map((s, i) => ({ label: s.name, color: s.color ?? getColor(i) }))
  );

  // ── Tooltip ────────────────────────────────────────────────────

  let hoveredPoint = $derived(
    hovered === null ? null : (series[hovered.si]?.data[hovered.pi] ?? null)
  );

  let hoverLineX = $derived(
    hovered === null ? null : (lines[hovered.si]?.points[hovered.pi]?.x ?? null)
  );

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
    return {
      title: xTickFormat ? xTickFormat(tooltipContext.x) : `x: ${formatNumber(tooltipContext.x)}`,
      items: tooltipContext.points.map((p) => ({
        label: p.name,
        value: formatNumber(p.y),
        color: p.color
      }))
    };
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
    for (let si = 0; si < series.length; si++) {
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
  }

  function handleOverlayMove(e: MouseEvent) {
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
</script>

<div
  class="line-chart {classes ?? ''}"
  bind:this={containerEl}
  data-pw={typeof testId === 'string' ? testId : null}
>
  {#if isEmpty && typeof empty === 'function'}
    <div class="chart-empty">{@render empty()}</div>
  {:else}
    {#if showLegend && series.length > 1}
      <Legend items={legendItems} position="top" />
    {/if}

    <ChartContainer bind:width={chartWidth} bind:height={chartHeight} {aspectRatio}>
      {#if gradientFill}
        <defs>
          {#each lines as line, si (si)}
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
          {/each}
        </defs>
      {/if}
      <g transform="translate({dims.margin.left}, {dims.margin.top})">
        {#if showYAxis}
          <Axis
            orientation="left"
            scale={yScale}
            {showGridlines}
            gridlineLength={dims.innerWidth}
            label={yAxisLabel}
            tickFormat={yTickFormat}
          />
        {/if}
        {#if showXAxis}
          <g transform="translate(0, {dims.innerHeight})">
            <Axis orientation="bottom" scale={xScale} label={xAxisLabel} tickFormat={xTickFormat} />
          </g>
        {/if}

        {#each lines as line, si (si)}
          {#if gradientFill}
            <path
              class="line-area-fill"
              class:dimmed={hovered !== null && hovered.si !== si}
              d={line.areaD}
              fill="url(#line-grad-{uid}-{si})"
            />
          {/if}
          <path
            class="line-path"
            class:dimmed={hovered !== null && hovered.si !== si}
            d={line.path}
            stroke={line.color}
            stroke-width={strokeWidth}
            fill="none"
          />
          {#if line.points.length === 1 && !showDots}
            <circle
              class="single-point"
              class:dimmed={hovered !== null && hovered.si !== si}
              cx={line.points[0].x}
              cy={line.points[0].y}
              r={dotRadius * 1.5}
              fill={line.color}
            />
          {/if}
          {#if showDots}
            {#each line.points as point, pi (pi)}
              <circle
                class="dot"
                class:dimmed={hovered !== null && hovered.si !== si}
                cx={point.x}
                cy={point.y}
                r={hovered?.si === si && hovered?.pi === pi ? dotRadius * 1.5 : dotRadius}
                fill={line.color}
              />
            {/each}
          {/if}
          {#if showValues}
            {#each line.points as point, pi (pi)}
              <text
                class="point-value"
                x={point.x}
                y={point.y - 8}
                text-anchor="middle"
                dominant-baseline="auto">{formatNumber(series[si].data[pi].y)}</text
              >
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
          onmousemove={handleOverlayMove}
          onmouseleave={handleLeave}
          onclick={handleClick}
        />
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
  .line-chart {
    width: 100%;
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
    stroke: var(--chart-background, #fff);
    stroke-width: 2;
    pointer-events: none;
  }
  .dot.dimmed {
    opacity: var(--linechart-dimmed-opacity, 0.2);
  }
  .point-value {
    fill: var(--linechart-value-color, #333);
    font-size: var(--linechart-value-font-size, 11px);
    font-family: var(--chart-font-family, inherit);
    pointer-events: none;
  }
  .hover-line {
    stroke: var(--linechart-hover-line-color, #ccc);
    stroke-width: 1;
    stroke-dasharray: var(--linechart-hover-line-dash, 4 4);
    pointer-events: none;
  }
  .hover-overlay {
    cursor: crosshair;
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
