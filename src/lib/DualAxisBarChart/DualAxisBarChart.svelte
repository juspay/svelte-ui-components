<script lang="ts">
  import type {
    DualAxisBarChartProperties,
    DualAxisSeries,
    DualAxisTooltipContext
  } from './properties';
  import ChartContainer from '$lib/_chart/ChartContainer.svelte';
  import Axis from '$lib/_chart/Axis.svelte';
  import ChartTooltip from '$lib/_chart/ChartTooltip.svelte';
  import Legend from '$lib/_chart/Legend.svelte';
  import { createBandScale, createLinearScale, niceLinearDomain } from '$lib/_chart/scales';
  import { computeChartDimensions } from '$lib/_chart/geometry';
  import { getColor } from '$lib/_chart/colors';
  import { formatNumber } from '$lib/_chart/format';
  import { roundedRectPath, linePath } from '$lib/_chart/paths';
  import type { LegendItem, TooltipData, LinearScale, BandScale, Point } from '$lib/_chart/types';

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
    barRadius = 3,
    barPadding = 0.25,
    aspectRatio = 16 / 9,
    tooltipSnippet,
    onbarclick,
    testId,
    classes
  }: DualAxisBarChartProperties = $props();

  // ── State ──────────────────────────────────────────────────────

  let containerEl: HTMLDivElement | null = $state(null);
  let chartWidth = $state(0);
  let chartHeight = $state(0);
  let hoveredCategoryIndex = $state<number | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);

  // ── Formatters ─────────────────────────────────────────────────

  const leftFormat = $derived(leftAxis.valueFormat ?? formatNumber);
  const rightFormat = $derived(rightAxis.valueFormat ?? formatNumber);

  // ── Layout — wider right margin to accommodate right-axis labels ─

  const dims = $derived(
    computeChartDimensions(chartWidth, chartHeight, { top: 24, right: 56, bottom: 40, left: 56 })
  );

  // ── Scales ─────────────────────────────────────────────────────

  const catScale: BandScale = $derived(
    createBandScale(categories, [0, dims.innerWidth], barPadding)
  );

  /**
   * Computes the [min, max] domain for all series mapped to the given axis index,
   * then applies nice rounding. Returns [0, 1] for empty series.
   */
  const axisDomain = (axisIndex: 0 | 1): [number, number] => {
    const axisSeries = series.filter((s) => s.yAxisIndex === axisIndex);
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
      .filter((entry) => entry.series.yAxisIndex === 0 && entry.series.type !== 'line')
  );

  const rightAxisSeries: AxisSeriesEntry[] = $derived(
    series
      .map((s, si) => ({ series: s, seriesIndex: si }))
      .filter((entry) => entry.series.yAxisIndex === 1 && entry.series.type !== 'line')
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
        const barHeight = Math.max(2, Math.abs(valueY - zeroY));

        const path = roundedRectPath(barX, barY, barW, barHeight, barRadius, barRadius, 0, 0);

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
      .filter((entry) => entry.series.type === 'line')
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
    series.map((s, si) => ({ label: s.name, color: resolvedColor(s, si) }))
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
    const items = series.map((s, si) => {
      const fmt = s.yAxisIndex === 0 ? leftFormat : rightFormat;
      return {
        label: s.name,
        value: fmt(s.data[catIdx] ?? 0),
        color: resolvedColor(s, si)
      };
    });
    return { title: category, items };
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

  // ── Interactions ───────────────────────────────────────────────

  const trackMouse = (event: MouseEvent) => {
    if (containerEl === null) {
      return;
    }
    const rect = containerEl.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
  };

  const handleCategoryEnter = (event: MouseEvent, catIdx: number) => {
    hoveredCategoryIndex = catIdx;
    trackMouse(event);
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

  // ── Empty state ────────────────────────────────────────────────

  const isEmpty = $derived(
    series.length === 0 || categories.length === 0 || series.every((s) => s.data.length === 0)
  );
</script>

<div
  class="dual-axis-bar-chart {classes ?? ''}"
  bind:this={containerEl}
  data-pw={typeof testId === 'string' ? testId : null}
>
  {#if !isEmpty}
    {#if showLegend}
      <Legend items={legendItems} position="top" />
    {/if}

    <ChartContainer bind:width={chartWidth} bind:height={chartHeight} {aspectRatio}>
      <g transform="translate({dims.margin.left}, {dims.margin.top})">
        <!-- Left Y-axis (index 0) -->
        <Axis
          orientation="left"
          scale={leftScale}
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
            showGridlines={false}
            tickFormat={rightTickFormat}
            classes={rightAxis.color ? `axis-right-colored` : ''}
          />
        </g>

        <!-- X-axis at bottom -->
        <g transform="translate(0, {dims.innerHeight})">
          <Axis orientation="bottom" scale={catScale} showGridlines={false} />
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
              stroke="var(--dual-axis-dot-stroke, #fff)"
              stroke-width="var(--dual-axis-dot-stroke-width, 1.5)"
              aria-label="{categories[ptIdx]}: {series[ls.seriesIndex]?.data[ptIdx] ?? 0}"
              role="img"
            />
          {/each}
        {/each}

        <!-- Invisible per-category hover targets (full inner height) -->
        {#each hoverRects as hr (hr.catIdx)}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <rect
            class="hover-target"
            x={hr.x}
            y={0}
            width={hr.width}
            height={dims.innerHeight}
            fill="transparent"
            data-category-index={hr.catIdx}
            onmouseenter={(event) => handleCategoryEnter(event, hr.catIdx)}
            onmousemove={trackMouse}
            onmouseleave={handleCategoryLeave}
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

    <!-- Tooltip -->
    {#if typeof tooltipSnippet === 'function' && hoveredCategoryIndex !== null}
      <div class="chart-tooltip-slot" style="left: {mouseX + 12}px; top: {mouseY - 12}px;">
        {@render tooltipSnippet(buildTooltipContext(hoveredCategoryIndex))}
      </div>
    {:else}
      <ChartTooltip data={tooltipData} {mouseX} {mouseY} />
    {/if}
  {:else}
    <div class="chart-empty">No data available.</div>
  {/if}
</div>

<style>
  .dual-axis-bar-chart {
    width: 100%;
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

  .hover-guideline {
    stroke: var(--dual-axis-guideline-color, #aaa);
    stroke-width: var(--dual-axis-guideline-width, 1);
    stroke-dasharray: var(--dual-axis-guideline-dash, 4 3);
    pointer-events: none;
    opacity: 0.6;
  }

  .axis-title {
    fill: var(--chart-axis-label-color, #333);
    font-size: var(--chart-axis-label-font-size, 11px);
    font-family: var(--chart-font-family, inherit);
    font-weight: 500;
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
