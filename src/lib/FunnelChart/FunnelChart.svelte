<script lang="ts">
  import { onMount } from 'svelte';
  import type { FunnelChartProperties, FunnelStage } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';
  import ChartContainer from '$lib/_chart/ChartContainer.svelte';
  import ChartTooltip from '$lib/_chart/ChartTooltip.svelte';
  import { getColor, getContrastColor } from '$lib/_chart/colors';
  import { formatNumber, formatPercent } from '$lib/_chart/format';
  import { measureText, readCssVarPx } from '$lib/_chart/measure';
  import { truncateToWidth } from '$lib/_chart/labels';
  import { pointerPositionIn, dismissOnOutsidePointerDown } from '$lib/_chart/interactions';
  import { DEFAULT_CHART_CORNER_RADIUS, DEFAULT_CHART_MAX_HEIGHT } from '$lib/_chart/types';

  // ── Props ──────────────────────────────────────────────────────

  let {
    data,
    stageColors,
    connectorColor = 'var(--funnel-chart-connector-color, light-dark(#BDFFFB, #164e4a))',
    slopeWidth = 10,
    onHoverExpand = 10,
    showValueLabels = true,
    valueFormat,
    aspectRatio = 16 / 9,
    maxHeight = DEFAULT_CHART_MAX_HEIGHT,
    minHeight = 0,
    radius = DEFAULT_CHART_CORNER_RADIUS,
    tooltipPortal = false,
    testId,
    classes,
    empty,
    onstageclick: onstageclickProp,
    onStageClick,
    onstagehover: onstagehoverProp,
    onStageHover
  }: FunnelChartProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onstageclick = $derived(
    resolveDeprecatedProp(
      'FunnelChart',
      'onStageClick',
      'onstageclick',
      onStageClick,
      onstageclickProp
    )
  );
  const onstagehover = $derived(
    resolveDeprecatedProp(
      'FunnelChart',
      'onStageHover',
      'onstagehover',
      onStageHover,
      onstagehoverProp
    )
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(onstageclick, onstagehover);
  });

  // ── State ──────────────────────────────────────────────────────

  let containerEl: HTMLDivElement | null = $state(null);
  let plotEl: HTMLDivElement | null = $state(null);
  let chartWidth = $state(0);
  let chartHeight = $state(0);
  let hoveredIndex = $state<number | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);
  let labelFontSize = $state(11);
  let valueFontSize = $state(11);

  onMount(() => {
    labelFontSize = readCssVarPx(containerEl, '--funnel-chart-label-font-size', 11);
    valueFontSize = readCssVarPx(containerEl, '--funnel-chart-value-font-size', 11);
  });

  // ── Derived geometry ───────────────────────────────────────────

  const MARGIN_TOP = 32;
  const MARGIN_RIGHT = 8;
  const MARGIN_BOTTOM = 8;
  const MARGIN_LEFT = 8;

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

  /** Vertical band reserved above the bars for the category label, sized to the actual font. */
  let labelAreaHeight = $derived(Math.ceil(labelFontSize * 1.2) + 10);

  /** Available height for the bars themselves (below the category labels). */
  let barAreaHeight = $derived(Math.max(0, innerHeight - labelAreaHeight));

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
    return labelAreaHeight + (barAreaHeight - h) / 2;
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

  // ── Label fitting ──────────────────────────────────────────────

  let labelFont = $derived({ size: labelFontSize });
  let valueFont = $derived({ size: valueFontSize });

  function categoryLabel(stage: FunnelStage): string {
    return truncateToWidth(stage.category, Math.max(0, stageColumnWidth - 4), labelFont);
  }

  /** Highcharts crop chain for in-bar labels: full "value | pct" → "pct" → hidden. */
  function valueLabel(stage: FunnelStage, bh: number): string {
    const full = formatLabel(stage);
    const fullSize = measureText(full, valueFont);
    if (bh >= fullSize.height + 4 && stageColumnWidth >= fullSize.width + 8) {
      return full;
    }
    const compact = formatPercent(stage.value, maxValue);
    const compactSize = measureText(compact, valueFont);
    if (bh >= compactSize.height + 4 && stageColumnWidth >= compactSize.width + 8) {
      return compact;
    }
    return '';
  }

  const contrastOutline = (fill: string): string =>
    getContrastColor(fill) === '#000000' ? '#ffffff' : '#000000';

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

  // Narrows an event's currentTarget to Element without an `as` cast (repo
  // lint bans type assertions outside test files).
  const targetElement = (e: Event): Element | null =>
    e.currentTarget instanceof Element ? e.currentTarget : null;

  function trackMouse(event: PointerEvent) {
    const position = pointerPositionIn(plotEl, event);
    if (position !== null) {
      mouseX = position.x;
      mouseY = position.y;
    }
  }

  function handleEnter(event: PointerEvent, index: number) {
    hoveredIndex = index;
    trackMouse(event);
    const stage = data[index] ?? null;
    if (stage !== null) {
      onstagehover?.({ index, stage });
    }
  }

  function handleFocus(e: FocusEvent, index: number) {
    hoveredIndex = index;
    const el = targetElement(e);
    if (plotEl !== null && el !== null) {
      const r = el.getBoundingClientRect();
      const c = plotEl.getBoundingClientRect();
      mouseX = r.left + r.width / 2 - c.left;
      mouseY = r.top - c.top;
    }
    const stage = data[index] ?? null;
    if (stage !== null) {
      onstagehover?.({ index, stage });
    }
  }

  function handleLeave() {
    hoveredIndex = null;
    onstagehover?.(null);
  }

  function handleKeydown(e: KeyboardEvent, index: number) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(index);
    }
  }

  // Touch taps have no pointerleave: dismiss when a pointerdown lands outside.
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    if (hoveredIndex === null) {
      return;
    }
    return dismissOnOutsidePointerDown(containerEl, handleLeave);
  });

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
  testID={typeof testId === 'string' ? testId : null}
>
  {#if isEmpty && typeof empty === 'function'}
    <div class="chart-empty">{@render empty()}</div>
  {:else}
    <div class="chart-plot" bind:this={plotEl}>
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
              y={labelAreaHeight - 6}
              text-anchor="middle"
              dominant-baseline="auto">{categoryLabel(stage)}</text
            >

            <!-- Stage bar -->
            <rect
              class="funnel-bar"
              class:funnel-bar-hovered={hoveredIndex === index}
              class:funnel-bar-dimmed={hoveredIndex !== null && hoveredIndex !== index}
              x={bx}
              y={by}
              data-pw={`funnel-bar-${index}`}
              testID={`funnel-bar-${index}`}
              width={stageColumnWidth}
              height={bh}
              fill={color}
              rx={radius}
              aria-label="{stage.category}: {formatLabel(stage)}"
              onpointerenter={(event) => handleEnter(event, index)}
              onpointermove={trackMouse}
              onpointerleave={handleLeave}
              onfocus={(e) => handleFocus(e, index)}
              onblur={handleLeave}
              onkeydown={(e) => handleKeydown(e, index)}
              onclick={() => handleClick(index)}
              tabindex="0"
              role="button"
            />

            <!-- Value label centred inside the bar -->
            {#if showValueLabels}
              {@const vl = valueLabel(stage, bh)}
              {#if vl !== ''}
                <text
                  class="funnel-value-label"
                  x={labelX}
                  y={by + bh / 2}
                  text-anchor="middle"
                  dominant-baseline="middle"
                  style="fill: var(--funnel-chart-value-color, {getContrastColor(
                    color
                  )}); stroke: {contrastOutline(color)};"
                  pointer-events="none">{vl}</text
                >
              {/if}
            {/if}
          {/each}

          <!-- Trapezoidal connectors between stages -->
          {#each data as _stage, index (index)}
            {#if index < data.length - 1}
              <polygon
                class="funnel-connector"
                points={connectorPoints(index)}
                style="fill: {connectorColor}"
                pointer-events="none"
              />
            {/if}
          {/each}
        </g>
      </ChartContainer>

      <ChartTooltip data={tooltipData} {mouseX} {mouseY} portal={tooltipPortal} originEl={plotEl} />
    </div>
  {/if}
</div>

<style>
  .funnel-chart {
    width: 100%;
  }

  .chart-plot {
    position: relative;
  }

  .funnel-category-label {
    fill: var(--funnel-chart-label-color, light-dark(#666, #9ca3af));
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

  .funnel-bar:focus-visible {
    outline: 2px solid var(--chart-axis-label-color, light-dark(#333, #e5e7eb));
    outline-offset: 1px;
  }

  .funnel-value-label {
    font-size: var(--funnel-chart-value-font-size, 11px);
    font-family: var(--chart-font-family, inherit);
    paint-order: stroke;
    stroke-width: 2px;
    stroke-opacity: 0.35;
    stroke-linejoin: round;
  }

  .funnel-connector {
    transition: d var(--chart-transition-duration, 0.2s) ease;
  }

  .chart-empty {
    padding: var(--chart-empty-padding, 32px 24px);
    color: var(--chart-empty-color, light-dark(#9ca3af, #6b7280));
    text-align: center;
  }
</style>
