<script lang="ts">
  import type { PieChartProperties } from './properties';
  import ChartContainer from '$lib/_chart/ChartContainer.svelte';
  import ChartTooltip from '$lib/_chart/ChartTooltip.svelte';
  import Legend from '$lib/_chart/Legend.svelte';
  import { arcPath } from '$lib/_chart/paths';
  import { computePieLayout } from '$lib/_chart/geometry';
  import { getColor } from '$lib/_chart/colors';
  import { formatNumber, formatPercent } from '$lib/_chart/format';
  import type { LegendItem } from '$lib/_chart/types';

  // ── Props ──────────────────────────────────────────────────────

  let {
    data,
    innerRadius = 0,
    padAngle = 0.02,
    showLabels = false,
    showValues = false,
    labelPosition = 'outside',
    showLegend = false,
    startAngle = -Math.PI / 2,
    aspectRatio = 1,
    valueFormat,
    tooltipSnippet,
    center,
    empty,
    onsliceclick,
    onslicehover,
    testId,
    classes
  }: PieChartProperties = $props();

  // ── State ──────────────────────────────────────────────────────

  let containerEl: HTMLDivElement | null = $state(null);
  let chartWidth = $state(0);
  let chartHeight = $state(0);
  let hoveredIndex = $state<number | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);

  // ── Layout ─────────────────────────────────────────────────────

  let format = $derived(valueFormat ?? formatNumber);
  let total = $derived(data.reduce((sum, d) => sum + Math.max(0, d.value), 0));
  let isEmpty = $derived(data.length === 0 || total === 0);

  let cx = $derived(chartWidth / 2);
  let cy = $derived(chartHeight / 2);
  let outerR = $derived(
    Math.max(10, Math.min(cx, cy) - (showLabels && labelPosition === 'outside' ? 40 : 10))
  );
  let innerR = $derived(innerRadius > 0 ? outerR * Math.min(0.95, innerRadius) : 0);

  let slices = $derived(
    computePieLayout(data, startAngle, padAngle).map((s) => {
      const color = s.color ?? data[s.index]?.color ?? getColor(s.index);
      const labelR = labelPosition === 'outside' ? outerR + 16 : (innerR + outerR) / 2;
      return {
        ...s,
        color,
        path: arcPath(0, 0, innerR, outerR, s.startAngle, s.endAngle),
        labelX: labelR * Math.cos(s.midAngle),
        labelY: labelR * Math.sin(s.midAngle)
      };
    })
  );

  let legendItems = $derived<LegendItem[]>(
    data.map((d, i) => ({ label: d.label, color: d.color ?? getColor(i) }))
  );

  let centerBoxSize = $derived(innerR > 0 ? Math.max(0, innerR * 1.3) : 0);

  // ── Tooltip ────────────────────────────────────────────────────

  let tooltipData = $derived.by(() => {
    if (hoveredIndex === null || !slices[hoveredIndex]) {
      return null;
    }
    const s = slices[hoveredIndex];
    return {
      title: s.label,
      items: [
        {
          label: s.label,
          value: `${format(s.value)} (${formatPercent(s.value, total)})`,
          color: s.color
        }
      ]
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

  function handleEnter(e: MouseEvent, i: number) {
    hoveredIndex = i;
    trackMouse(e);
    onslicehover?.({ index: i, slice: data[i] });
  }

  function handleLeave() {
    hoveredIndex = null;
    onslicehover?.(null);
  }
</script>

<div
  class="pie-chart {classes ?? ''}"
  bind:this={containerEl}
  data-pw={typeof testId === 'string' ? testId : null}
>
  {#if isEmpty && typeof empty === 'function'}
    <div class="chart-empty">{@render empty()}</div>
  {:else}
    {#if showLegend}
      <Legend items={legendItems} position="top" />
    {/if}

    <ChartContainer bind:width={chartWidth} bind:height={chartHeight} {aspectRatio}>
      <g transform="translate({cx}, {cy})">
        {#each slices as slice (slice.index)}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <path
            class="slice"
            class:hovered={hoveredIndex === slice.index}
            class:dimmed={hoveredIndex !== null && hoveredIndex !== slice.index}
            d={slice.path}
            fill={slice.color}
            aria-label="{slice.label}: {format(slice.value)}"
            onmouseenter={(e) => handleEnter(e, slice.index)}
            onmousemove={trackMouse}
            onmouseleave={handleLeave}
            onclick={() => onsliceclick?.({ index: slice.index, slice: data[slice.index] })}
          />
          {#if showLabels || showValues}
            <text
              class="slice-label"
              class:label-outside={labelPosition === 'outside'}
              x={slice.labelX}
              y={slice.labelY}
              text-anchor="middle"
              dominant-baseline="middle"
            >
              {#if showLabels}{slice.label}{/if}
              {#if showValues}
                {formatPercent(slice.value, total)}{/if}
            </text>
          {/if}
        {/each}

        {#if innerR > 0 && typeof center === 'function' && centerBoxSize > 0}
          <foreignObject
            x={-centerBoxSize / 2}
            y={-centerBoxSize / 2}
            width={centerBoxSize}
            height={centerBoxSize}
          >
            <div class="pie-center-content" xmlns="http://www.w3.org/1999/xhtml">
              {@render center()}
            </div>
          </foreignObject>
        {/if}
      </g>
    </ChartContainer>

    {#if typeof tooltipSnippet === 'function' && hoveredIndex !== null && data[hoveredIndex]}
      <div class="chart-tooltip-slot" style="left: {mouseX + 12}px; top: {mouseY - 12}px;">
        {@render tooltipSnippet(data[hoveredIndex], hoveredIndex)}
      </div>
    {:else}
      <ChartTooltip data={tooltipData} {mouseX} {mouseY} />
    {/if}
  {/if}
</div>

<style>
  .pie-chart {
    width: 100%;
    position: relative;
  }
  .slice {
    stroke: var(--piechart-stroke-color, #fff);
    stroke-width: var(--piechart-stroke-width, 2);
    transition:
      transform var(--chart-transition-duration, 0.2s) ease,
      opacity var(--chart-transition-duration, 0.2s) ease;
    transform-origin: 0 0;
    cursor: pointer;
  }
  .slice.hovered {
    transform: scale(var(--piechart-hover-scale, 1.05));
    opacity: 1;
  }
  .slice.dimmed {
    opacity: var(--piechart-dimmed-opacity, 0.3);
  }
  .slice-label {
    fill: var(--piechart-label-color, #333);
    font-size: var(--piechart-label-font-size, 12px);
    font-family: var(--chart-font-family, inherit);
    pointer-events: none;
  }
  .slice-label.label-outside {
    fill: var(--piechart-label-color, #555);
  }
  .pie-center-content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
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
