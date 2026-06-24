<script lang="ts">
  import { onMount } from 'svelte';
  import type { PieChartProperties } from './properties';
  import ChartContainer from '$lib/_chart/ChartContainer.svelte';
  import ChartTooltip from '$lib/_chart/ChartTooltip.svelte';
  import Legend from '$lib/_chart/Legend.svelte';
  import DeltaIndicator from '../DeltaIndicator/DeltaIndicator.svelte';
  import { arcPath } from '$lib/_chart/paths';
  import { computePieLayout } from '$lib/_chart/geometry';
  import { getColor } from '$lib/_chart/colors';
  import { formatNumber } from '$lib/_chart/format';
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
    aspectRatio,
    valueFormat,
    tooltipSnippet,
    center,
    empty,
    onsliceclick,
    onslicehover,
    testId,
    classes,
    semiCircle = false,
    legendShowValues = false,
    percentDecimals = 0,
    onChartReady,
    highlightedIndex = null,
    changePercentage,
    changeInvertColors = false
  }: PieChartProperties = $props();

  // ── State ──────────────────────────────────────────────────────

  let containerEl: HTMLDivElement | null = $state(null);
  let chartWidth = $state(0);
  let chartHeight = $state(0);
  let hoveredIndex = $state<number | null>(null);
  let programmaticIndex = $state<number | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);

  // ── Highlight API ──────────────────────────────────────────────

  // Aspect ratio read from the --piechart-semi-aspect-ratio CSS variable on mount.
  let semiAspectRatioCssVar = $state(2);

  onMount(() => {
    onChartReady?.({
      highlight: (index) => {
        programmaticIndex = index;
      },
      getCategories: () => data.map((d) => d.label),
      type: 'donut-chart'
    });

    if (typeof window !== 'undefined' && containerEl !== null) {
      const rawValue = getComputedStyle(containerEl)
        .getPropertyValue('--piechart-semi-aspect-ratio')
        .trim();
      const parsed = parseFloat(rawValue);
      if (!Number.isNaN(parsed) && parsed > 0) {
        semiAspectRatioCssVar = parsed;
      }
    }
  });

  // ── Active index ───────────────────────────────────────────────
  // Precedence: mouse hover > declarative highlightedIndex prop > imperative API.

  let activeIndex = $derived<number | null>(hoveredIndex ?? highlightedIndex ?? programmaticIndex);

  // ── Layout ─────────────────────────────────────────────────────

  let format = $derived(valueFormat ?? formatNumber);
  let total = $derived(data.reduce((sum, d) => sum + Math.max(0, d.value), 0));
  let pctFormat = $derived.by(
    () =>
      (v: number): string =>
        total === 0 ? '0%' : ((v / total) * 100).toFixed(percentDecimals) + '%'
  );
  let isEmpty = $derived(data.length === 0 || total === 0);

  // When semiCircle is true the effective aspect ratio is driven by:
  // 1. The explicit `aspectRatio` prop (highest priority — always wins).
  // 2. The `--piechart-semi-aspect-ratio` CSS variable (consumer CSS override).
  // 3. The hardcoded default of 2 (width:height = 2:1).
  // For a full circle the caller-provided `aspectRatio` or a square (1:1) default is used.
  let effectiveAspectRatio = $derived(aspectRatio ?? (semiCircle ? semiAspectRatioCssVar : 1));

  let cx = $derived(chartWidth / 2);
  // For a half-donut the SVG origin sits at the bottom of the drawing area so
  // arcs radiate upward into the top half of the viewBox.
  let cy = $derived(semiCircle ? chartHeight : chartHeight / 2);
  let outerR = $derived(
    semiCircle
      ? Math.max(10, chartWidth / 2 - (showLabels && labelPosition === 'outside' ? 40 : 10))
      : Math.max(10, Math.min(cx, cy) - (showLabels && labelPosition === 'outside' ? 40 : 10))
  );
  let innerR = $derived(innerRadius > 0 ? outerR * Math.min(0.95, innerRadius) : 0);

  let slices = $derived.by(() => {
    // For a full circle layout start at the caller-provided startAngle.
    // For semi-circle: compute a full-circle layout anchored at -PI/2, then
    // remap each angle so the entire sweep is compressed into PI radians
    // (the top-half arc from -PI/2 to PI/2).
    const layoutStartAngle = semiCircle ? -Math.PI / 2 : startAngle;
    const rawSlices = computePieLayout(data, layoutStartAngle, padAngle);

    return rawSlices.map((s) => {
      let mappedStart = s.startAngle;
      let mappedEnd = s.endAngle;
      let mappedMid = s.midAngle;

      if (semiCircle) {
        // The raw layout spans [-PI/2, -PI/2 + 2*PI]. We compress it to
        // [-PI/2, PI/2] by halving the angular distance from -PI/2.
        const origin = -Math.PI / 2;
        mappedStart = origin + (s.startAngle - origin) / 2;
        mappedEnd = origin + (s.endAngle - origin) / 2;
        mappedMid = origin + (s.midAngle - origin) / 2;
      }

      const color = s.color ?? data[s.index]?.color ?? getColor(s.index);
      const labelR = labelPosition === 'outside' ? outerR + 16 : (innerR + outerR) / 2;
      return {
        ...s,
        startAngle: mappedStart,
        endAngle: mappedEnd,
        midAngle: mappedMid,
        color,
        path: arcPath(0, 0, innerR, outerR, mappedStart, mappedEnd),
        labelX: labelR * Math.cos(mappedMid),
        labelY: labelR * Math.sin(mappedMid)
      };
    });
  });

  let legendItems = $derived<LegendItem[]>(
    data.map((d, i) => ({ label: d.label, color: d.color ?? getColor(i) }))
  );

  let centerBoxSize = $derived(innerR > 0 ? Math.max(0, innerR * 1.3) : 0);

  // The foreignObject for the center snippet is positioned relative to the <g>
  // origin (which is at cx, cy in SVG space). The box is always centred on
  // the translated origin: for a full circle that is the geometric centre, and
  // for a semiCircle the <g> origin sits at the chord line (bottom of the arc),
  // so the snippet is centred on the chord as specified.
  let centerFOY = $derived(-centerBoxSize / 2);

  // ── Tooltip ────────────────────────────────────────────────────

  // Tooltip visibility tracks hover only. activeIndex also covers declarative/imperative
  // highlights, but those arrive without mouse coordinates, so a tooltip driven by them
  // would render at the top-left (mouseX/mouseY still 0). Highlight styling uses
  // activeIndex; the tooltip stays gated on hoveredIndex.
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
          value: `${format(s.value)} (${pctFormat(s.value)})`,
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
    {#if showLegend && !legendShowValues}
      <Legend items={legendItems} position="top" />
    {/if}

    <ChartContainer
      bind:width={chartWidth}
      bind:height={chartHeight}
      aspectRatio={effectiveAspectRatio}
    >
      <g transform="translate({cx}, {cy})">
        {#each slices as slice (slice.index)}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <path
            class="slice"
            class:hovered={activeIndex === slice.index}
            class:dimmed={activeIndex !== null && activeIndex !== slice.index}
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
                {pctFormat(slice.value)}{/if}
            </text>
          {/if}
        {/each}

        {#if innerR > 0 && typeof center === 'function' && centerBoxSize > 0}
          <foreignObject
            x={-centerBoxSize / 2}
            y={centerFOY}
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

    {#if typeof changePercentage === 'number'}
      <div class="pie-delta-badge">
        <DeltaIndicator value={changePercentage} invertColors={changeInvertColors} />
      </div>
    {/if}

    {#if showLegend && legendShowValues}
      <ul class="pie-legend-values">
        {#each data as d, i (i)}
          <li class="pie-legend-row">
            <span class="pie-legend-swatch" style="background: {d.color ?? getColor(i)}"></span>
            <span class="pie-legend-label">{d.label}</span>
            <span class="pie-legend-value">
              {format(d.value)}&nbsp;{pctFormat(d.value)}
            </span>
          </li>
        {/each}
      </ul>
    {/if}

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
  .pie-delta-badge {
    position: absolute;
    top: var(--piechart-delta-top, 8px);
    right: var(--piechart-delta-right, 8px);
    z-index: 2;
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
  .pie-legend-values {
    display: flex;
    flex-direction: column;
    gap: var(--piechart-legend-gap, 8px);
    padding: var(--piechart-legend-padding, 12px 0 0 0);
    font-family: var(--chart-font-family, inherit);
    list-style: none;
    margin: 0;
  }
  .pie-legend-row {
    display: flex;
    align-items: center;
    gap: var(--piechart-legend-row-gap, 6px);
  }
  .pie-legend-swatch {
    display: inline-block;
    width: var(--chart-legend-swatch-size, 12px);
    height: var(--chart-legend-swatch-size, 12px);
    border-radius: var(--piechart-legend-swatch-radius, 2px);
    flex-shrink: 0;
  }
  .pie-legend-label {
    font-size: var(--chart-legend-font-size, 12px);
    color: var(--chart-legend-color, #333);
    min-width: var(--piechart-legend-label-min-width, 120px);
  }
  .pie-legend-value {
    margin-left: auto;
    font-size: var(--piechart-legend-value-font-size, 12px);
    color: var(--piechart-legend-value-color, #333);
    min-width: var(--piechart-legend-value-min-width, 60px);
    text-align: right;
  }
</style>
