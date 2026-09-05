<script lang="ts">
  import type {
    DualAxisBarChartProperties,
    DualAxisSeries,
    DualAxisTooltipContext
  } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';
  import ChartContainer from '$lib/_chart/ChartContainer.svelte';
  import Axis from '$lib/_chart/Axis.svelte';
  import ChartTooltip from '$lib/_chart/ChartTooltip.svelte';
  import Legend from '$lib/_chart/Legend.svelte';
  import {
    createBandScale,
    createLinearScale,
    niceLinearDomain,
    computeLinearTicks
  } from '$lib/_chart/scales';
  import { computeChartDimensions, computeAutoLayout } from '$lib/_chart/geometry';
  import { getColor } from '$lib/_chart/colors';
  import { formatNumber } from '$lib/_chart/format';
  import { roundedRectPath, linePath } from '$lib/_chart/paths';
  import type {
    LegendItem,
    TooltipData,
    LinearScale,
    BandScale,
    Point,
    TooltipAnchor
  } from '$lib/_chart/types';
  import { DEFAULT_CHART_CORNER_RADIUS, DEFAULT_CHART_MAX_HEIGHT } from '$lib/_chart/types';
  import { pointerPositionIn, dismissOnOutsidePointerDown } from '$lib/_chart/interactions';
  import { SvelteSet } from 'svelte/reactivity';

  // ── Per-instance uid for SVG <defs> ids ────────────────────────
  const uid = Math.random().toString(36).slice(2, 9);

  // ── Props ──────────────────────────────────────────────────────

  let {
    categories,
    series,
    leftAxis = {},
    rightAxis = {},
    showGridlines = true,
    showLegend = true,
    barRadius = DEFAULT_CHART_CORNER_RADIUS,
    barPadding = 0.25,
    aspectRatio = 16 / 9,
    maxHeight = DEFAULT_CHART_MAX_HEIGHT,
    minHeight = 0,
    minBarHeight = 2,
    margin,
    tooltipPortal = false,
    interactiveLegend = false,
    hideLegendBelow = 360,
    tooltipSnippet,
    onbarclick: onbarclickProp,
    onBarClick,
    testId,
    classes
  }: DualAxisBarChartProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onbarclick = $derived(
    resolveDeprecatedProp(
      'DualAxisBarChart',
      'onBarClick',
      'onbarclick',
      onBarClick,
      onbarclickProp
    )
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(onbarclick);
  });

  // ── State ──────────────────────────────────────────────────────

  let containerEl: HTMLDivElement | null = $state(null);
  let plotEl: HTMLDivElement | null = $state(null);
  let chartWidth = $state(0);
  let chartHeight = $state(0);
  let hoveredCategoryIndex = $state<number | null>(null);
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

  // ── Formatters ─────────────────────────────────────────────────

  const leftFormat = $derived(leftAxis.valueFormat ?? formatNumber);
  const rightFormat = $derived(rightAxis.valueFormat ?? formatNumber);

  /**
   * Computes the [min, max] domain for all series mapped to the given axis index,
   * then applies nice rounding. Returns [0, 1] for empty series.
   */
  const axisDomain = (axisIndex: 0 | 1): [number, number] => {
    const axisSeries = series.filter(
      (s, si) => s.yAxisIndex === axisIndex && !hiddenSeries.has(si)
    );
    if (axisSeries.length === 0) {
      return [0, 1];
    }
    const allValues = axisSeries.flatMap((s) => s.data);
    if (allValues.length === 0) {
      return [0, 1];
    }
    return niceLinearDomain(Math.min(0, ...allValues), Math.max(0, ...allValues));
  };

  const leftDomain: [number, number] = $derived(axisDomain(0));
  const rightDomain: [number, number] = $derived(axisDomain(1));

  // ── Layout — auto-sized margins from measured tick-label widths ─

  const yTickCount = $derived(Math.max(2, Math.min(6, Math.floor(chartHeight / 70))));

  const layout = $derived.by(() =>
    computeAutoLayout({
      width: chartWidth,
      height: chartHeight,
      yTickLabels: computeLinearTicks(leftDomain, yTickCount).map((t) => leftFormat(t)),
      y2TickLabels: computeLinearTicks(rightDomain, yTickCount).map((t) => rightFormat(t)),
      xTickLabels: categories,
      hasYAxisLabel: Boolean(leftAxis.title),
      hasY2AxisLabel: Boolean(rightAxis.title),
      base: { top: 24, right: 28, bottom: 40, left: 28 }
    })
  );

  // The margin prop stays an explicit per-side override on top of auto-sizing.
  const dims = $derived(
    computeChartDimensions(chartWidth, chartHeight, {
      top: margin?.top ?? layout.margin.top,
      right: margin?.right ?? layout.margin.right,
      bottom: margin?.bottom ?? layout.margin.bottom,
      left: margin?.left ?? layout.margin.left
    })
  );

  // ── Scales ─────────────────────────────────────────────────────

  const catScale: BandScale = $derived(
    createBandScale(categories, [0, dims.innerWidth], barPadding)
  );

  const leftScale: LinearScale = $derived(createLinearScale(leftDomain, [dims.innerHeight, 0]));
  const rightScale: LinearScale = $derived(createLinearScale(rightDomain, [dims.innerHeight, 0]));

  // ── Series color resolution ────────────────────────────────────

  const resolvedColor = (s: DualAxisSeries, si: number): string => s.color ?? getColor(si);

  // ── Column/bar geometry ────────────────────────────────────────

  /**
   * Groups series by axis so we can compute per-axis sub-band widths.
   * Within an axis group, series are ordered by their original index.
   */
  type AxisSeriesEntry = { series: DualAxisSeries; seriesIndex: number };

  const leftAxisSeries: AxisSeriesEntry[] = $derived(
    series
      .map((s, si) => ({ series: s, seriesIndex: si }))
      .filter(
        (entry) =>
          entry.series.yAxisIndex === 0 &&
          entry.series.type !== 'line' &&
          !hiddenSeries.has(entry.seriesIndex)
      )
  );

  const rightAxisSeries: AxisSeriesEntry[] = $derived(
    series
      .map((s, si) => ({ series: s, seriesIndex: si }))
      .filter(
        (entry) =>
          entry.series.yAxisIndex === 1 &&
          entry.series.type !== 'line' &&
          !hiddenSeries.has(entry.seriesIndex)
      )
  );

  const columnSeriesEntries: AxisSeriesEntry[] = $derived([...leftAxisSeries, ...rightAxisSeries]);

  /**
   * Total number of column/bar series that share the category band.
   * Line series float above and are not counted.
   */
  const columnCount: number = $derived(columnSeriesEntries.length);

  type BarShape = {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    seriesIndex: number;
    categoryIndex: number;
    value: number;
    path: string;
  };

  const bars: BarShape[] = $derived.by(() => {
    if (dims.innerWidth <= 0 || dims.innerHeight <= 0) {
      return [];
    }
    const result: BarShape[] = [];
    const subBandWidth = columnCount > 0 ? catScale.bandwidth / columnCount : catScale.bandwidth;
    const barW = Math.max(1, subBandWidth * 0.88);
    const barGap = (subBandWidth - barW) / 2;

    columnSeriesEntries.forEach((entry, subIndex) => {
      const scale = entry.series.yAxisIndex === 0 ? leftScale : rightScale;
      const color = resolvedColor(entry.series, entry.seriesIndex);
      const zeroY = scale(0);

      entry.series.data.forEach((value, catIdx) => {
        // A series longer than `categories` would index past the band scale and
        // emit NaN geometry; skip the surplus points defensively.
        if (catIdx >= categories.length) {
          return;
        }
        const bandStart = catScale(categories[catIdx]);
        const barX = bandStart + subIndex * subBandWidth + barGap;
        const valueY = scale(value);
        const barY = value >= 0 ? valueY : zeroY;
        const barHeight = Math.max(minBarHeight, Math.abs(valueY - zeroY));

        const path =
          value >= 0
            ? roundedRectPath(barX, barY, barW, barHeight, barRadius, barRadius, 0, 0)
            : roundedRectPath(barX, barY, barW, barHeight, 0, 0, barRadius, barRadius);

        result.push({
          x: barX,
          y: barY,
          width: barW,
          height: barHeight,
          color,
          seriesIndex: entry.seriesIndex,
          categoryIndex: catIdx,
          value,
          path
        });
      });
    });

    return result;
  });

  // ── Line series geometry ───────────────────────────────────────

  type LineSeries = {
    points: Point[];
    color: string;
    seriesIndex: number;
  };

  const lineSeriesData: LineSeries[] = $derived.by(() => {
    if (dims.innerWidth <= 0 || dims.innerHeight <= 0) {
      return [];
    }
    return series
      .map((s, si) => ({ series: s, seriesIndex: si }))
      .filter((entry) => entry.series.type === 'line' && !hiddenSeries.has(entry.seriesIndex))
      .map((entry) => {
        const scale = entry.series.yAxisIndex === 0 ? leftScale : rightScale;
        const color = resolvedColor(entry.series, entry.seriesIndex);
        const points: Point[] = [];
        entry.series.data.forEach((value, catIdx) => {
          // Mirror the bar guard: drop points past the category band to avoid NaN geometry.
          if (catIdx >= categories.length) {
            return;
          }
          points.push({
            x: catScale(categories[catIdx]) + catScale.bandwidth / 2,
            y: scale(value)
          });
        });
        return { points, color, seriesIndex: entry.seriesIndex };
      });
  });

  // ── Legend items ───────────────────────────────────────────────

  const legendItems: LegendItem[] = $derived(
    series.map((s, si) => ({
      label: s.name,
      color: resolvedColor(s, si),
      hidden: hiddenSeries.has(si)
    }))
  );

  // ── Tooltip ────────────────────────────────────────────────────

  const buildTooltipContext = (catIdx: number): DualAxisTooltipContext => ({
    category: categories[catIdx],
    categoryIndex: catIdx,
    points: series.map((s, si) => ({
      name: s.name,
      value: s.data[catIdx] ?? 0,
      color: resolvedColor(s, si),
      yAxisIndex: s.yAxisIndex,
      type: s.type ?? 'column'
    }))
  });

  const tooltipData: TooltipData | null = $derived.by(() => {
    if (hoveredCategoryIndex === null) {
      return null;
    }
    const catIdx = hoveredCategoryIndex;
    const category = categories[catIdx];
    const items = series
      .map((s, si) => ({ s, si }))
      .filter(({ si }) => !hiddenSeries.has(si))
      .map(({ s, si }) => {
        const fmt = s.yAxisIndex === 0 ? leftFormat : rightFormat;
        return {
          label: s.name,
          value: fmt(s.data[catIdx] ?? 0),
          color: resolvedColor(s, si)
        };
      });
    return { title: category, items };
  });

  // Category-anchored tooltip position: the topmost bar-top or line-dot y
  // across all visible series at the hovered category, matching the
  // Highcharts shared-tooltip anchor convention.
  const anchor = $derived.by<TooltipAnchor | null>(() => {
    if (hoveredCategoryIndex === null) {
      return null;
    }
    const catIdx = hoveredCategoryIndex;
    const ys: number[] = [];
    for (const bar of bars) {
      if (bar.categoryIndex === catIdx) {
        ys.push(bar.y);
      }
    }
    for (const ls of lineSeriesData) {
      const p = ls.points[catIdx];
      if (p) {
        ys.push(p.y);
      }
    }
    return {
      x: dims.margin.left + catScale(categories[catIdx]) + catScale.bandwidth / 2,
      y: dims.margin.top + (ys.length > 0 ? Math.min(...ys) : 0),
      side: 'top'
    };
  });

  // ── Axis tick formatters ───────────────────────────────────────

  const leftTickFormat = (tick: number | string): string =>
    leftFormat(typeof tick === 'string' ? parseFloat(tick) : tick);

  const rightTickFormat = (tick: number | string): string =>
    rightFormat(typeof tick === 'string' ? parseFloat(tick) : tick);

  // ── Hover target rectangles ────────────────────────────────────

  /**
   * Full-height invisible rectangles, one per category, used as hover targets.
   * This is simpler and more reliable than per-bar hit testing and matches the
   * Highcharts shared-tooltip UX where hovering anywhere in a column highlights
   * the entire category.
   */
  type HoverRect = { x: number; width: number; catIdx: number };

  const hoverRects: HoverRect[] = $derived(
    categories.map((_, catIdx) => ({
      x: catScale(categories[catIdx]),
      width: catScale.bandwidth,
      catIdx
    }))
  );

  function categoryAriaLabel(catIdx: number): string {
    const parts = series
      .map((s, si) => ({ s, si }))
      .filter(({ si }) => !hiddenSeries.has(si))
      .map(
        ({ s }) =>
          `${s.name} ${(s.yAxisIndex === 0 ? leftFormat : rightFormat)(s.data[catIdx] ?? 0)}`
      );
    return `${categories[catIdx]}: ${parts.join(', ')}`;
  }

  // ── Interactions ───────────────────────────────────────────────

  const trackMouse = (event: PointerEvent) => {
    const position = pointerPositionIn(plotEl, event);
    if (position !== null) {
      mouseX = position.x;
      mouseY = position.y;
    }
  };

  const handleCategoryEnter = (event: PointerEvent, catIdx: number) => {
    hoveredCategoryIndex = catIdx;
    trackMouse(event);
  };

  const handleFocus = (catIdx: number) => {
    hoveredCategoryIndex = catIdx;
  };

  const handleCategoryLeave = () => {
    hoveredCategoryIndex = null;
  };

  const handleCategoryClick = (catIdx: number) => {
    if (typeof onbarclick !== 'function') {
      return;
    }
    onbarclick({ categoryIndex: catIdx, context: buildTooltipContext(catIdx) });
  };

  const handleKeydown = (event: KeyboardEvent, catIdx: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCategoryClick(catIdx);
    }
  };

  // Touch taps have no pointerleave: dismiss when a pointerdown lands outside.
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    if (hoveredCategoryIndex === null) {
      return;
    }
    return dismissOnOutsidePointerDown(containerEl, () => {
      hoveredCategoryIndex = null;
    });
  });

  // ── Empty state ────────────────────────────────────────────────

  const isEmpty = $derived(
    series.length === 0 || categories.length === 0 || series.every((s) => s.data.length === 0)
  );
</script>

<div
  class="dual-axis-bar-chart {classes ?? ''}"
  bind:this={containerEl}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#if !isEmpty}
    {#if showLegend && (chartWidth === 0 || hideLegendBelow === 0 || chartWidth >= hideLegendBelow)}
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
        {maxHeight}
        {minHeight}
      >
        <g transform="translate({dims.margin.left}, {dims.margin.top})">
          <!-- Left Y-axis (index 0) -->
          <Axis
            orientation="left"
            scale={leftScale}
            tickCount={yTickCount}
            {showGridlines}
            gridlineLength={dims.innerWidth}
            tickFormat={leftTickFormat}
            classes={leftAxis.color ? `axis-left-colored` : ''}
          />

          <!-- Right Y-axis (index 1) — positioned at innerWidth -->
          <g transform="translate({dims.innerWidth}, 0)">
            <Axis
              orientation="right"
              scale={rightScale}
              tickCount={yTickCount}
              showGridlines={false}
              tickFormat={rightTickFormat}
              classes={rightAxis.color ? `axis-right-colored` : ''}
            />
          </g>

          <!-- X-axis at bottom -->
          <g transform="translate(0, {dims.innerHeight})">
            <Axis
              orientation="bottom"
              scale={catScale}
              rotateTicks={layout.xRotate}
              tickEvery={layout.xEvery}
              showGridlines={false}
            />
          </g>

          <!-- Axis titles -->
          {#if leftAxis.title}
            <text
              class="axis-title axis-title-left"
              transform="translate({-dims.margin.left + 12}, {dims.innerHeight / 2}) rotate(-90)"
              text-anchor="middle"
              style={leftAxis.color ? `fill: ${leftAxis.color}` : ''}
            >
              {leftAxis.title}
            </text>
          {/if}
          {#if rightAxis.title}
            <text
              class="axis-title axis-title-right"
              transform="translate({dims.innerWidth + dims.margin.right - 12}, {dims.innerHeight /
                2}) rotate(90)"
              text-anchor="middle"
              style={rightAxis.color ? `fill: ${rightAxis.color}` : ''}
            >
              {rightAxis.title}
            </text>
          {/if}

          <!-- Column/bar shapes -->
          {#each bars as bar, barIdx (barIdx)}
            <path
              class="bar-shape"
              class:bar-hovered={hoveredCategoryIndex === bar.categoryIndex}
              class:bar-dimmed={hoveredCategoryIndex !== null &&
                hoveredCategoryIndex !== bar.categoryIndex}
              d={bar.path}
              fill={bar.color}
              aria-label="{categories[bar.categoryIndex]}: {bar.value}"
              role="img"
            />
          {/each}

          <!-- Line series drawn above columns -->
          {#each lineSeriesData as ls, lsi (lsi)}
            {#if ls.points.length >= 2}
              <path
                class="line-series"
                d={linePath(ls.points, 'monotone')}
                stroke={ls.color}
                fill="none"
              />
            {/if}
            <!-- Line dots -->
            {#each ls.points as pt, ptIdx (ptIdx)}
              <circle
                class="line-dot"
                class:dot-hovered={hoveredCategoryIndex === ptIdx}
                class:dot-dimmed={hoveredCategoryIndex !== null && hoveredCategoryIndex !== ptIdx}
                cx={pt.x}
                cy={pt.y}
                r={hoveredCategoryIndex === ptIdx ? 6 : 4}
                fill={ls.color}
                style="stroke: var(--dual-axis-dot-stroke, light-dark(#fff, #111827)); stroke-width: var(--dual-axis-dot-stroke-width, 1.5);"
                aria-label="{categories[ptIdx]}: {series[ls.seriesIndex]?.data[ptIdx] ?? 0}"
                role="img"
              />
            {/each}
          {/each}

          <!-- Invisible per-category hover targets (full inner height) -->
          {#each hoverRects as hr (hr.catIdx)}
            <rect
              class="hover-target"
              x={hr.x}
              y={0}
              width={hr.width}
              height={dims.innerHeight}
              fill="transparent"
              data-pw={`hover-target-${hr.catIdx}`}
              testID={`hover-target-${hr.catIdx}`}
              data-category-index={hr.catIdx}
              tabindex="0"
              role="button"
              aria-label={categoryAriaLabel(hr.catIdx)}
              onpointerenter={(event) => handleCategoryEnter(event, hr.catIdx)}
              onpointermove={trackMouse}
              onpointerleave={handleCategoryLeave}
              onfocus={() => handleFocus(hr.catIdx)}
              onblur={handleCategoryLeave}
              onkeydown={(event) => handleKeydown(event, hr.catIdx)}
              onclick={() => handleCategoryClick(hr.catIdx)}
            />
          {/each}

          <!-- Hover vertical guideline -->
          {#if hoveredCategoryIndex !== null}
            {@const guideX = catScale(categories[hoveredCategoryIndex]) + catScale.bandwidth / 2}
            <line class="hover-guideline" x1={guideX} x2={guideX} y1={0} y2={dims.innerHeight} />
          {/if}
        </g>

        <!-- SVG defs id namespace anchor (keeps uid live in reactive graph) -->
        <defs>
          <marker id="{uid}-anchor" />
        </defs>
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
            {#if hoveredCategoryIndex !== null}
              {@render tooltipSnippet(buildTooltipContext(hoveredCategoryIndex))}
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
  {:else}
    <div class="chart-empty">No data available.</div>
  {/if}
</div>

<style>
  .dual-axis-bar-chart {
    width: 100%;
    position: relative;
  }

  .chart-plot {
    position: relative;
  }

  .bar-shape {
    transition: opacity var(--chart-transition-duration, 0.2s) ease;
    cursor: pointer;
  }

  .bar-hovered {
    opacity: var(--dual-axis-bar-hover-opacity, 1);
  }

  .bar-dimmed {
    opacity: var(--dual-axis-bar-dimmed-opacity, 0.3);
  }

  .line-series {
    stroke-width: var(--dual-axis-line-stroke-width, 2);
    stroke-linecap: round;
    stroke-linejoin: round;
    pointer-events: none;
  }

  .line-dot {
    transition:
      r var(--chart-transition-duration, 0.2s) ease,
      opacity var(--chart-transition-duration, 0.2s) ease;
    cursor: pointer;
  }

  .dot-dimmed {
    opacity: var(--dual-axis-bar-dimmed-opacity, 0.3);
  }

  .hover-target {
    cursor: pointer;
  }

  .hover-target:focus-visible {
    outline: 2px solid var(--chart-axis-label-color, light-dark(#333, #e5e7eb));
    outline-offset: -2px;
  }

  .hover-guideline {
    stroke: var(--dual-axis-guideline-color, light-dark(#aaa, #4b5563));
    stroke-width: var(--dual-axis-guideline-width, 1);
    stroke-dasharray: var(--dual-axis-guideline-dash, 4 3);
    pointer-events: none;
    opacity: 0.6;
  }

  .axis-title {
    fill: var(--chart-axis-label-color, light-dark(#333, #e5e7eb));
    font-size: var(--chart-axis-label-font-size, 11px);
    font-family: var(--chart-font-family, inherit);
    font-weight: 500;
  }

  .chart-empty {
    padding: var(--chart-empty-padding, 32px 24px);
    color: var(--chart-empty-color, light-dark(#9ca3af, #6b7280));
    text-align: center;
  }
</style>
