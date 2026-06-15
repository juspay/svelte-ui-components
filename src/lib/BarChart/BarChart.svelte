<script lang="ts">
  import type { BarChartProperties } from './properties';
  import ChartContainer from '$lib/_chart/ChartContainer.svelte';
  import Axis from '$lib/_chart/Axis.svelte';
  import ChartTooltip from '$lib/_chart/ChartTooltip.svelte';
  import Legend from '$lib/_chart/Legend.svelte';
  import { createBandScale, createLinearScale, niceLinearDomain } from '$lib/_chart/scales';
  import { computeChartDimensions } from '$lib/_chart/geometry';
  import { getColor } from '$lib/_chart/colors';
  import { formatNumber } from '$lib/_chart/format';
  import type { LegendItem, BarRect } from '$lib/_chart/types';

  // ── Props ──────────────────────────────────────────────────────

  let {
    data,
    series,
    groupMode = 'grouped',
    orientation = 'vertical',
    showValues = false,
    showGridlines = true,
    showXAxis = true,
    showYAxis = true,
    showLegend = false,
    barPadding = 0.2,
    barRadius = 4,
    aspectRatio = 16 / 9,
    xAxisLabel,
    yAxisLabel,
    yDomain,
    valueFormat,
    tooltipSnippet,
    empty,
    onbarclick,
    onbarhover,
    testId,
    classes
  }: BarChartProperties = $props();

  // ── State ──────────────────────────────────────────────────────

  let containerEl: HTMLDivElement | null = $state(null);
  let chartWidth = $state(0);
  let chartHeight = $state(0);
  let hovered = $state<{ si: number; pi: number } | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);

  // ── Layout ─────────────────────────────────────────────────────

  let format = $derived(valueFormat ?? formatNumber);
  let isVertical = $derived(orientation === 'vertical');
  let dims = $derived(computeChartDimensions(chartWidth, chartHeight));

  let isMulti = $derived(Array.isArray(series) && series.length > 0);
  let resolvedSeries = $derived(isMulti ? series! : [{ name: '', data: data ?? [] }]);

  let labels = $derived.by(() => {
    const first = resolvedSeries[0]?.data ?? [];
    return first.map((d) => d.label);
  });

  let yExtent = $derived.by<[number, number]>(() => {
    if (yDomain) {
      return yDomain;
    }
    if (isMulti && groupMode === 'stacked') {
      const totalsPerLabel = labels.map((_, i) =>
        resolvedSeries.reduce((sum, s) => sum + Math.max(0, s.data[i]?.value ?? 0), 0)
      );
      return niceLinearDomain(0, Math.max(0, ...totalsPerLabel));
    }
    const all = resolvedSeries.flatMap((s) => s.data.map((d) => d.value));
    if (all.length === 0) {
      return [0, 1];
    }
    return niceLinearDomain(Math.min(0, ...all), Math.max(0, ...all));
  });

  let catScale = $derived(
    createBandScale(labels, isVertical ? [0, dims.innerWidth] : [0, dims.innerHeight], barPadding)
  );
  let valScale = $derived(
    createLinearScale(yExtent, isVertical ? [dims.innerHeight, 0] : [0, dims.innerWidth])
  );

  let bars = $derived.by<BarRect[]>(() => {
    const zeroPos = valScale(0);
    const result: BarRect[] = [];

    if (isMulti && groupMode === 'grouped') {
      const subBand = catScale.bandwidth / resolvedSeries.length;
      for (let si = 0; si < resolvedSeries.length; si++) {
        const s = resolvedSeries[si];
        const seriesColor = s.color ?? getColor(si);
        for (let pi = 0; pi < s.data.length; pi++) {
          const d = s.data[pi];
          const catPos = catScale(d.label) + si * subBand;
          const valPos = valScale(d.value);
          const color = d.color ?? seriesColor;
          result.push(
            isVertical
              ? {
                  x: catPos,
                  y: d.value >= 0 ? valPos : zeroPos,
                  width: Math.max(1, subBand * 0.9),
                  height: Math.max(2, Math.abs(valPos - zeroPos)),
                  color,
                  si,
                  pi,
                  dataPoint: d,
                  seriesName: s.name
                }
              : {
                  x: d.value >= 0 ? zeroPos : valPos,
                  y: catPos,
                  width: Math.max(2, Math.abs(valPos - zeroPos)),
                  height: Math.max(1, subBand * 0.9),
                  color,
                  si,
                  pi,
                  dataPoint: d,
                  seriesName: s.name
                }
          );
        }
      }
    } else if (isMulti && groupMode === 'stacked') {
      const stackBase = new Array(labels.length).fill(0);
      for (let si = 0; si < resolvedSeries.length; si++) {
        const s = resolvedSeries[si];
        const seriesColor = s.color ?? getColor(si);
        for (let pi = 0; pi < s.data.length; pi++) {
          const d = s.data[pi];
          const val = Math.max(0, d.value);
          const y0 = stackBase[pi];
          const y1 = y0 + val;
          stackBase[pi] = y1;
          const color = d.color ?? seriesColor;
          if (isVertical) {
            result.push({
              x: catScale(d.label),
              y: valScale(y1),
              width: catScale.bandwidth,
              height: Math.max(0, valScale(y0) - valScale(y1)),
              color,
              si,
              pi,
              dataPoint: d,
              seriesName: s.name
            });
          } else {
            result.push({
              x: valScale(y0),
              y: catScale(d.label),
              width: Math.max(0, valScale(y1) - valScale(y0)),
              height: catScale.bandwidth,
              color,
              si,
              pi,
              dataPoint: d,
              seriesName: s.name
            });
          }
        }
      }
    } else {
      const singleSeries = resolvedSeries[0];
      for (let pi = 0; pi < singleSeries.data.length; pi++) {
        const d = singleSeries.data[pi];
        const catPos = catScale(d.label);
        const valPos = valScale(d.value);
        const color = d.color ?? getColor(pi);
        result.push(
          isVertical
            ? {
                x: catPos,
                y: d.value >= 0 ? valPos : zeroPos,
                width: catScale.bandwidth,
                height: Math.max(2, Math.abs(valPos - zeroPos)),
                color,
                si: 0,
                pi,
                dataPoint: d,
                seriesName: singleSeries.name
              }
            : {
                x: d.value >= 0 ? zeroPos : valPos,
                y: catPos,
                width: Math.max(2, Math.abs(valPos - zeroPos)),
                height: catScale.bandwidth,
                color,
                si: 0,
                pi,
                dataPoint: d,
                seriesName: singleSeries.name
              }
        );
      }
    }
    return result;
  });

  let legendItems = $derived<LegendItem[]>(
    isMulti ? resolvedSeries.map((s, i) => ({ label: s.name, color: s.color ?? getColor(i) })) : []
  );

  let isEmpty = $derived(resolvedSeries.every((s) => s.data.length === 0) || labels.length === 0);

  // ── Tooltip ────────────────────────────────────────────────────

  let tooltipData = $derived.by(() => {
    if (hovered === null) {
      return null;
    }
    const bar = bars.find((b) => b.si === hovered!.si && b.pi === hovered!.pi);
    if (!bar) {
      return null;
    }
    const title = isMulti ? `${bar.dataPoint.label} — ${bar.seriesName}` : bar.dataPoint.label;
    return {
      title,
      items: [{ label: bar.dataPoint.label, value: format(bar.dataPoint.value), color: bar.color }]
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

  function handleEnter(e: MouseEvent, bar: BarRect) {
    hovered = { si: bar.si, pi: bar.pi };
    trackMouse(e);
    onbarhover?.({ index: bar.pi, dataPoint: bar.dataPoint });
  }

  function handleLeave() {
    hovered = null;
    onbarhover?.(null);
  }

  function handleClick(bar: BarRect) {
    onbarclick?.({ index: bar.pi, dataPoint: bar.dataPoint });
  }

  function hoveredBar() {
    return hovered === null
      ? null
      : (bars.find((b) => b.si === hovered!.si && b.pi === hovered!.pi) ?? null);
  }
</script>

<div
  class="bar-chart {classes ?? ''}"
  bind:this={containerEl}
  data-pw={typeof testId === 'string' ? testId : null}
>
  {#if isEmpty && typeof empty === 'function'}
    <div class="chart-empty">{@render empty()}</div>
  {:else}
    {#if isMulti && showLegend}
      <Legend items={legendItems} position="top" />
    {/if}

    <ChartContainer bind:width={chartWidth} bind:height={chartHeight} {aspectRatio}>
      <g transform="translate({dims.margin.left}, {dims.margin.top})">
        {#if showYAxis}
          <Axis
            orientation="left"
            scale={isVertical ? valScale : catScale}
            {showGridlines}
            gridlineLength={dims.innerWidth}
            label={yAxisLabel}
          />
        {/if}
        {#if showXAxis}
          <g transform="translate(0, {dims.innerHeight})">
            <Axis
              orientation="bottom"
              scale={isVertical ? catScale : valScale}
              showGridlines={!isVertical && showGridlines}
              gridlineLength={dims.innerHeight}
              label={xAxisLabel}
            />
          </g>
        {/if}

        {#each bars as bar, i (i)}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <rect
            class="bar"
            class:hovered={hovered?.si === bar.si && hovered?.pi === bar.pi}
            class:dimmed={hovered !== null && (hovered.si !== bar.si || hovered.pi !== bar.pi)}
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            rx={barRadius}
            ry={barRadius}
            fill={bar.color}
            aria-label="{bar.dataPoint.label}: {format(bar.dataPoint.value)}"
            onmouseenter={(e) => handleEnter(e, bar)}
            onmousemove={trackMouse}
            onmouseleave={handleLeave}
            onclick={() => handleClick(bar)}
          />
          {#if showValues && !(isMulti && groupMode === 'stacked')}
            <text
              class="bar-value"
              x={isVertical ? bar.x + bar.width / 2 : bar.x + bar.width + 4}
              y={isVertical ? bar.y - 4 : bar.y + bar.height / 2}
              text-anchor={isVertical ? 'middle' : 'start'}
              dominant-baseline={isVertical ? 'auto' : 'middle'}>{format(bar.dataPoint.value)}</text
            >
          {/if}
        {/each}
      </g>
    </ChartContainer>

    {#if typeof tooltipSnippet === 'function' && hoveredBar()}
      {@const hb = hoveredBar()}
      {#if hb}
        <div class="chart-tooltip-slot" style="left: {mouseX + 12}px; top: {mouseY - 12}px;">
          {@render tooltipSnippet(hb.dataPoint, hb.pi)}
        </div>
      {/if}
    {:else}
      <ChartTooltip data={tooltipData} {mouseX} {mouseY} />
    {/if}
  {/if}
</div>

<style>
  .bar-chart {
    width: 100%;
    position: relative;
  }
  .bar {
    transition: opacity var(--chart-transition-duration, 0.2s) ease;
    cursor: pointer;
  }
  .bar.hovered {
    opacity: var(--barchart-bar-hover-opacity, 1);
  }
  .bar.dimmed {
    opacity: var(--barchart-bar-dimmed-opacity, 0.3);
  }
  .bar-value {
    fill: var(--barchart-value-color, #333);
    font-size: var(--barchart-value-font-size, 11px);
    font-family: var(--chart-font-family, inherit);
    pointer-events: none;
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
