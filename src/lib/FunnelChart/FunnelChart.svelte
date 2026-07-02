<script lang="ts">
  import type { FunnelChartProperties, FunnelStage } from './properties';
  import ChartContainer from '$lib/_chart/ChartContainer.svelte';
  import ChartTooltip from '$lib/_chart/ChartTooltip.svelte';
  import { getColor } from '$lib/_chart/colors';
  import { formatNumber, formatPercent } from '$lib/_chart/format';
  import { DEFAULT_CHART_CORNER_RADIUS, DEFAULT_CHART_MAX_HEIGHT } from '$lib/_chart/types';

  // ── Props ──────────────────────────────────────────────────────

  let {
    data,
    stageColors,
    connectorColor = 'var(--funnel-chart-connector-color, #BDFFFB)',
    slopeWidth = 10,
    onHoverExpand = 10,
    showValueLabels = true,
    valueFormat,
    aspectRatio = 16 / 9,
    maxHeight = DEFAULT_CHART_MAX_HEIGHT,
    minHeight = 0,
    radius = DEFAULT_CHART_CORNER_RADIUS,
    testId,
    classes,
    empty,
    onstageclick,
    onstagehover
  }: FunnelChartProperties = $props();

  // ── State ──────────────────────────────────────────────────────

  let containerEl: HTMLDivElement | null = $state(null);
  let chartWidth = $state(0);
  let chartHeight = $state(0);
  let hoveredIndex = $state<number | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);

  // ── Derived geometry ───────────────────────────────────────────

  const MARGIN_TOP = 32;
  const MARGIN_RIGHT = 8;
  const MARGIN_BOTTOM = 8;
  const MARGIN_LEFT = 8;
  const LABEL_AREA_HEIGHT = 24;

  let innerWidth = $derived(Math.max(0, chartWidth - MARGIN_LEFT - MARGIN_RIGHT));
  let innerHeight = $derived(Math.max(0, chartHeight - MARGIN_TOP - MARGIN_BOTTOM));

  let maxValue = $derived.by(() => {
    if (data.length === 0) {
      return 1;
    }
    let max = 0;
    for (const stage of data) {
      if (stage.value > max) {
        max = stage.value;
      }
    }
    return max === 0 ? 1 : max;
  });

  // The documented contract treats an all-zero dataset as empty (it would otherwise
  // render meaningless min-height bars), so fold that into the empty check.
  let isEmpty = $derived(data.length === 0 || data.every((stage) => stage.value === 0));

  /**
   * Computes the total horizontal space consumed by slope connectors.
   * There are (data.length - 1) connectors, each slopeWidth wide.
   */
  let totalSlopeSpace = $derived(Math.max(0, data.length - 1) * slopeWidth);

  /**
   * Width of each stage bar column in SVG user units.
   * All stages share the same column width; the visual narrowing comes from the bar
   * height being proportional to value/max, not from the column width.
   */
  let stageColumnWidth = $derived(
    data.length === 0 ? 0 : Math.max(1, (innerWidth - totalSlopeSpace) / data.length)
  );

  /** Available height for the bars themselves (below the category labels). */
  let barAreaHeight = $derived(Math.max(0, innerHeight - LABEL_AREA_HEIGHT));

  /**
   * Resolve the fill color for a stage. Uses explicitly-provided `stageColors` array
   * first, falls back to the shared chart palette via `getColor`.
   */
  function resolveStageColor(index: number): string {
    const explicit = stageColors?.[index];
    if (typeof explicit === 'string' && explicit.length > 0) {
      return explicit;
    }
    return getColor(index);
  }

  /**
   * Compute the SVG x-offset for the left edge of a stage column (including slope offsets
   * for preceding connectors). Each connector occupies `slopeWidth` units horizontally so
   * consecutive stage rectangles do not overlap.
   */
  function stageX(index: number): number {
    return index * (stageColumnWidth + slopeWidth);
  }

  /**
   * Bar height for a given stage value, proportional to value/maxValue.
   * Clamped to at least 2px so zero-value stages remain visible.
   */
  function barHeight(stageValue: number, expandPixels: number = 0): number {
    return Math.max(2, (stageValue / maxValue) * barAreaHeight + expandPixels);
  }

  /**
   * Vertical y-offset that centres the bar vertically within the bar area.
   * `expandPixels` is added symmetrically (half-top, half-bottom) on hover.
   */
  function barY(stageValue: number, expandPixels: number = 0): number {
    const h = barHeight(stageValue, expandPixels);
    return LABEL_AREA_HEIGHT + (barAreaHeight - h) / 2;
  }

  /**
   * Build an SVG polygon `points` string for the trapezoidal connector between stage
   * `index` and `index + 1`. The trapezoid fills the slopeWidth gap between two adjacent
   * bars, matching the top and bottom edges of both bars.
   */
  function connectorPoints(index: number): string {
    const currentStage = data[index] ?? null;
    const nextStage = data[index + 1] ?? null;
    if (currentStage === null || nextStage === null) {
      return '';
    }

    const expandCurrent = hoveredIndex === index ? onHoverExpand : 0;
    const expandNext = hoveredIndex === index + 1 ? onHoverExpand : 0;

    const x1 = stageX(index) + stageColumnWidth;
    const y1Top = barY(currentStage.value, expandCurrent);
    const y1Bot = y1Top + barHeight(currentStage.value, expandCurrent);

    const x2 = stageX(index + 1);
    const y2Top = barY(nextStage.value, expandNext);
    const y2Bot = y2Top + barHeight(nextStage.value, expandNext);

    return `${x1},${y1Top} ${x1},${y1Bot} ${x2},${y2Bot} ${x2},${y2Top}`;
  }

  /**
   * Format the in-bar label. Uses a consumer-supplied `valueFormat` when provided,
   * otherwise renders `"<value> | <pct>%"`.
   */
  function formatLabel(stage: FunnelStage): string {
    if (typeof valueFormat === 'function') {
      return valueFormat(stage.value, maxValue);
    }
    const pct = formatPercent(stage.value, maxValue);
    return `${formatNumber(stage.value)}  |  ${pct}`;
  }

  // ── Tooltip ────────────────────────────────────────────────────

  let tooltipData = $derived.by(() => {
    if (hoveredIndex === null) {
      return null;
    }
    const stage = data[hoveredIndex] ?? null;
    if (stage === null) {
      return null;
    }
    return {
      title: stage.category,
      items: [
        {
          label: stage.category,
          value: formatLabel(stage),
          color: resolveStageColor(hoveredIndex)
        }
      ]
    };
  });

  // ── Interaction ────────────────────────────────────────────────

  function trackMouse(event: MouseEvent) {
    if (containerEl === null) {
      return;
    }
    const rect = containerEl.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
  }

  function handleEnter(event: MouseEvent, index: number) {
    hoveredIndex = index;
    trackMouse(event);
    const stage = data[index] ?? null;
    if (stage !== null) {
      onstagehover?.({ index, stage });
    }
  }

  function handleLeave() {
    hoveredIndex = null;
    onstagehover?.(null);
  }

  function handleClick(index: number) {
    const stage = data[index] ?? null;
    if (stage !== null) {
      onstageclick?.({ index, stage });
    }
  }
</script>

<div
  class="funnel-chart {classes ?? ''}"
  bind:this={containerEl}
  data-pw={typeof testId === 'string' ? testId : null}
>
  {#if isEmpty && typeof empty === 'function'}
    <div class="chart-empty">{@render empty()}</div>
  {:else}
    <ChartContainer
      bind:width={chartWidth}
      bind:height={chartHeight}
      {aspectRatio}
      {maxHeight}
      {minHeight}
    >
      <g transform="translate({MARGIN_LEFT}, {MARGIN_TOP})">
        <!-- Stage bars and category labels -->
        {#each data as stage, index (index)}
          {@const expand = hoveredIndex === index ? onHoverExpand : 0}
          {@const bh = barHeight(stage.value, expand)}
          {@const by = barY(stage.value, expand)}
          {@const bx = stageX(index)}
          {@const color = resolveStageColor(index)}
          {@const labelX = bx + stageColumnWidth / 2}

          <!-- Category label above the bar -->
          <text
            class="funnel-category-label"
            x={labelX}
            y={LABEL_AREA_HEIGHT - 6}
            text-anchor="middle"
            dominant-baseline="auto">{stage.category}</text
          >

          <!-- Stage bar -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <rect
            class="funnel-bar"
            class:funnel-bar-hovered={hoveredIndex === index}
            class:funnel-bar-dimmed={hoveredIndex !== null && hoveredIndex !== index}
            x={bx}
            y={by}
            width={stageColumnWidth}
            height={bh}
            fill={color}
            rx={radius}
            aria-label="{stage.category}: {formatLabel(stage)}"
            onmouseenter={(event) => handleEnter(event, index)}
            onmousemove={trackMouse}
            onmouseleave={handleLeave}
            onclick={() => handleClick(index)}
          />

          <!-- Value label centred inside the bar -->
          {#if showValueLabels}
            <text
              class="funnel-value-label"
              x={labelX}
              y={by + bh / 2}
              text-anchor="middle"
              dominant-baseline="middle"
              pointer-events="none">{formatLabel(stage)}</text
            >
          {/if}
        {/each}

        <!-- Trapezoidal connectors between stages -->
        {#each data as _stage, index (index)}
          {#if index < data.length - 1}
            <polygon
              class="funnel-connector"
              points={connectorPoints(index)}
              fill={connectorColor}
              pointer-events="none"
            />
          {/if}
        {/each}
      </g>
    </ChartContainer>

    <ChartTooltip data={tooltipData} {mouseX} {mouseY} />
  {/if}
</div>

<style>
  .funnel-chart {
    width: 100%;
    position: relative;
  }

  .funnel-category-label {
    fill: var(--funnel-chart-label-color, #666);
    font-size: var(--funnel-chart-label-font-size, 11px);
    font-family: var(--chart-font-family, inherit);
    pointer-events: none;
  }

  .funnel-bar {
    transition:
      opacity var(--chart-transition-duration, 0.2s) ease,
      y var(--chart-transition-duration, 0.2s) ease,
      height var(--chart-transition-duration, 0.2s) ease;
    cursor: pointer;
  }

  .funnel-bar-hovered {
    opacity: var(--funnel-chart-bar-hover-opacity, 1);
  }

  .funnel-bar-dimmed {
    opacity: var(--funnel-chart-bar-dimmed-opacity, 0.35);
  }

  .funnel-value-label {
    fill: var(--funnel-chart-value-color, #fff);
    font-size: var(--funnel-chart-value-font-size, 11px);
    font-family: var(--chart-font-family, inherit);
  }

  .funnel-connector {
    transition: d var(--chart-transition-duration, 0.2s) ease;
  }

  .chart-empty {
    padding: var(--chart-empty-padding, 32px 24px);
    color: var(--chart-empty-color, #9ca3af);
    text-align: center;
  }
</style>
