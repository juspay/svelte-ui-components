<script lang="ts">
  import type { AreaChartProperties, AreaChartTooltipContext } from './properties';
  import ChartContainer from '$lib/_chart/ChartContainer.svelte';
  import Axis from '$lib/_chart/Axis.svelte';
  import ChartTooltip from '$lib/_chart/ChartTooltip.svelte';
  import Legend from '$lib/_chart/Legend.svelte';
  import { createLinearScale, niceLinearDomain } from '$lib/_chart/scales';
  import { computeChartDimensions, computeStackedValues } from '$lib/_chart/geometry';
  import { linePath, areaPath } from '$lib/_chart/paths';
  import { getColor } from '$lib/_chart/colors';
  import { formatNumber } from '$lib/_chart/format';
  import type { LegendItem, Point } from '$lib/_chart/types';

  // ── Props ──────────────────────────────────────────────────────

  let {
    series,
    curve = 'monotone',
    stacked = false,
    stackNormalize = false,
    fillOpacity = 0.3,
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
    tooltipSnippet,
    empty,
    onpointhover,
    onpointclick,
    testId,
    classes
  }: AreaChartProperties = $props();

  // ── State ──────────────────────────────────────────────────────

  let containerEl: HTMLDivElement | null = $state(null);
  let chartWidth = $state(0);
  let chartHeight = $state(0);
  let hovered = $state<{ si: number; pi: number } | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);

  // ── Layout ─────────────────────────────────────────────────────

  let dims = $derived(computeChartDimensions(chartWidth, chartHeight));
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
    return {
      title: `x: ${formatNumber(tooltipContext.x)}`,
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
  class="area-chart {classes ?? ''}"
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

        {#each areas as area, si (si)}
          <path
            class="area-fill"
            class:dimmed={hovered !== null && hovered.si !== si}
            d={area.areaD}
            fill={area.color}
            fill-opacity={hovered?.si === si ? fillOpacity + 0.2 : fillOpacity}
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
          {#if showValues}
            {#each area.points as point, pi (pi)}
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
  .area-chart {
    width: 100%;
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
  .dot {
    transition:
      r var(--chart-transition-duration, 0.2s) ease,
      opacity var(--chart-transition-duration, 0.2s) ease;
    stroke: var(--chart-background, #fff);
    stroke-width: 2;
    pointer-events: none;
  }
  .point-value {
    fill: var(--areachart-value-color, #333);
    font-size: var(--areachart-value-font-size, 11px);
    font-family: var(--chart-font-family, inherit);
    pointer-events: none;
  }
  .hover-line {
    stroke: var(--linechart-hover-line-color, #ccc);
    stroke-width: 1;
    stroke-dasharray: 4 4;
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
