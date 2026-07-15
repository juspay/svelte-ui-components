<script lang="ts">
  import { onMount } from 'svelte';
  import type {
    BarChartProperties,
    BarChartRenderContext,
    BarFill,
    BarFillGradient,
    BarFillPattern
  } from './properties';
  import type { ChartHighlightAPI } from '../_chart/highlight';
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
  import { computeAutoLayout } from '$lib/_chart/geometry';
  import { getColor, getContrastColor } from '$lib/_chart/colors';
  import { formatNumber } from '$lib/_chart/format';
  import { roundedRectPath } from '$lib/_chart/paths';
  import { measureText, readCssVarPx } from '$lib/_chart/measure';
  import {
    resolveEndLabel,
    resolveInsideLabel,
    placedLabelRect,
    dropOverlapping
  } from '$lib/_chart/labels';
  import type { LegendItem, BarRect } from '$lib/_chart/types';
  import { DEFAULT_CHART_CORNER_RADIUS, DEFAULT_CHART_MAX_HEIGHT } from '$lib/_chart/types';
  import type { TooltipAnchor } from '$lib/_chart/types';
  import { pointerPositionIn, dismissOnOutsidePointerDown } from '$lib/_chart/interactions';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';

  // ── Per-instance uid prefix for <defs> ids (A1-3) ─────────────
  // Derived at module scope per the library uid pattern (e.g. AreaChart
  // feat/linechart-gradient line 17) to prevent id collision across multiple
  // BarChart instances on the same page.
  const uid = Math.random().toString(36).slice(2, 9);

  /** Returns the plain CSS fallback color for any BarFill (used for legend, aria-label). */
  function fallbackColor(fill: BarFill, index: number): string {
    if (typeof fill === 'string') {
      return fill;
    }
    if ('pattern' in fill) {
      return fill.pattern.color ?? getColor(index);
    }
    // gradient: use first stop color as fallback
    const firstStop = fill.gradient.stops[0];
    return firstStop?.color ?? getColor(index);
  }

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
    barRadius = DEFAULT_CHART_CORNER_RADIUS,
    aspectRatio = 16 / 9,
    maxHeight = DEFAULT_CHART_MAX_HEIGHT,
    minHeight = 0,
    xAxisLabel,
    yAxisLabel,
    yDomain,
    valueFormat,
    stackNormalize = false,
    scrollable = false,
    minBandWidth = 48,
    tooltipSnippet,
    empty,
    renderOverlay,
    onChartReady,
    highlightedIndex = null,
    normaliseToFirstPoint = false,
    topN,
    overflowLabel = 'Other',
    hideBarGraphics = false,
    interactiveLegend = false,
    hideLegendBelow = 360,
    tooltipPortal = false,
    onbarclick,
    onbarhover,
    testId,
    classes
  }: BarChartProperties = $props();

  // ── State ──────────────────────────────────────────────────────

  let containerEl: HTMLDivElement | null = $state(null);
  let plotEl: HTMLDivElement | null = $state(null);
  let chartWidth = $state(0);
  let chartHeight = $state(0);
  let hovered = $state<{ si: number; pi: number } | null>(null);
  let mouseX = $state(0);
  let mouseY = $state(0);
  let anchor = $state<TooltipAnchor | null>(null);
  let valueFontSize = $state(14);
  /** Internal tracking for the imperative highlight API (onChartReady). */
  let apiHighlightedIndex = $state<number | null>(null);
  const hiddenSeries = new SvelteSet<number>();

  // ── onMount: emit ChartHighlightAPI via onChartReady ──────────

  onMount(() => {
    valueFontSize = readCssVarPx(containerEl, '--barchart-value-font-size', 14);
    if (typeof onChartReady !== 'function') {
      return;
    }
    const api: ChartHighlightAPI = {
      highlight: (index) => {
        apiHighlightedIndex = index;
      },
      getCategories: () => labels,
      type: 'bar-chart'
    };
    onChartReady(api);
  });

  // ── Layout ─────────────────────────────────────────────────────

  let format = $derived(valueFormat ?? formatNumber);
  let isVertical = $derived(orientation === 'vertical');

  let isMulti = $derived(Array.isArray(series) && series.length > 0);

  // ── Raw resolved series (before transformations) ──────────────

  let rawSeries = $derived(isMulti ? series! : [{ name: '', data: data ?? [] }]);

  // ── normaliseToFirstPoint transformation ──────────────────────

  /**
   * When normaliseToFirstPoint is true, each value is expressed as a
   * percentage of the series' first data point's value (baseline = 100).
   * Series whose first point is zero are left unchanged to avoid division
   * by zero.
   */
  let normalisedSeries = $derived.by(() => {
    if (!normaliseToFirstPoint) {
      return rawSeries;
    }
    return rawSeries.map((s) => {
      const baseline = s.data[0]?.value ?? 0;
      if (baseline === 0) {
        return s;
      }
      return {
        ...s,
        data: s.data.map((d) => ({
          ...d,
          value: (d.value / baseline) * 100
        }))
      };
    });
  });

  // ── topN transformation ────────────────────────────────────────

  /**
   * Clips to the top N bars (by first-series value, descending) and aggregates
   * the rest into a single overflow bar. Operates on each series in parallel so
   * the same category ordering is preserved across series.
   * Only applies in non-multi or single-series mode (groupMode-agnostic:
   * works by reordering labels, not by touching multi-series stacking).
   */
  let resolvedSeries = $derived.by(() => {
    if (topN == null || normalisedSeries.length === 0) {
      return normalisedSeries;
    }
    const firstSeriesData = normalisedSeries[0]?.data ?? [];
    if (firstSeriesData.length <= topN) {
      return normalisedSeries;
    }
    // Sort indices by first-series value descending
    const sortedIndices = firstSeriesData
      .map((d, i) => ({ value: d.value, i }))
      .sort((a, b) => b.value - a.value)
      .map((item) => item.i);

    const topIndices = new Set(sortedIndices.slice(0, topN));

    return normalisedSeries.map((s) => {
      const topData = s.data.filter((_, idx) => topIndices.has(idx));
      const overflowValue = s.data
        .filter((_, idx) => !topIndices.has(idx))
        .reduce((sum, d) => sum + d.value, 0);
      return {
        ...s,
        data: [...topData, { label: overflowLabel, value: overflowValue }]
      };
    });
  });

  // Legend-toggled series are excluded from geometry and scales (Highcharts
  // rescales on toggle) but stay in legendItems so they can be re-enabled.
  let visibleEntries = $derived(
    resolvedSeries.map((s, si) => ({ s, si })).filter((e) => !hiddenSeries.has(e.si))
  );
  let visibleOrder = $derived(new Map(visibleEntries.map((e, vi) => [e.si, vi])));

  function toggleSeries(index: number): void {
    if (hiddenSeries.has(index)) {
      hiddenSeries.delete(index);
    } else {
      hiddenSeries.add(index);
    }
  }

  let labels = $derived.by(() => {
    const first = resolvedSeries[0]?.data ?? [];
    return first.map((d) => d.label);
  });

  // ── Effective highlighted index: merge declarative + imperative ─

  /**
   * The declarative `highlightedIndex` prop takes precedence when explicitly
   * set (non-null). The imperative API writes to `apiHighlightedIndex`.
   * When both are null the chart renders normally (no dimming).
   */
  let effectiveHighlightedIndex = $derived(
    highlightedIndex != null ? highlightedIndex : apiHighlightedIndex
  );

  let isNormalized = $derived(stackNormalize && isMulti && groupMode === 'stacked');

  /** When stackNormalize is active and no custom valueFormat is supplied, append % so the
   *  unitless tick numbers (0, 25, 50, 75, 100) are displayed as percentages consistently
   *  in tooltips and value labels. A consumer-supplied valueFormat always takes precedence. */
  let normalizedFormat = $derived(
    isNormalized && valueFormat == null ? (v: number) => `${formatNumber(v)}%` : format
  );

  let isStackedMode = $derived(isMulti && groupMode === 'stacked');

  function getDisplayValue(bar: BarRect): string {
    if (typeof bar.dataPoint.valueLabel === 'string' && bar.dataPoint.valueLabel.length > 0) {
      return bar.dataPoint.valueLabel;
    }
    if (isNormalized && bar.normalizedValue != null) {
      return normalizedFormat(bar.normalizedValue);
    }
    if (bar.isFloating && Array.isArray(bar.dataPoint.range)) {
      return `${format(bar.dataPoint.range[0])} – ${format(bar.dataPoint.range[1])}`;
    }
    return format(bar.dataPoint.value);
  }

  // ── Y-extent: account for floating bars (A1-1) ────────────────

  let yExtent = $derived.by<[number, number]>(() => {
    if (yDomain) {
      return yDomain;
    }
    if (isMulti && groupMode === 'stacked') {
      if (stackNormalize) {
        return [0, 100];
      }
      const totalsPerLabel = labels.map((_, labelIndex) =>
        visibleEntries.reduce((sum, { s }) => sum + Math.max(0, s.data[labelIndex]?.value ?? 0), 0)
      );
      return niceLinearDomain(0, Math.max(0, ...totalsPerLabel));
    }
    // Collect all individual values including floating-bar low/high endpoints
    const all: number[] = [];
    for (const { s } of visibleEntries) {
      for (const d of s.data) {
        if (Array.isArray(d.range)) {
          all.push(d.range[0], d.range[1]);
        } else {
          all.push(d.value);
        }
      }
    }
    if (all.length === 0) {
      return [0, 1];
    }
    return niceLinearDomain(Math.min(0, ...all), Math.max(0, ...all));
  });

  let valTickCount = $derived(
    isVertical
      ? Math.max(2, Math.min(6, Math.floor(chartHeight / 70)))
      : Math.max(2, Math.min(8, Math.floor(chartWidth / 90)))
  );

  let layout = $derived.by(() => {
    const valFmt = isNormalized ? normalizedFormat : format;
    const valTicks = computeLinearTicks(yExtent, valTickCount).map((t) => valFmt(t));
    return computeAutoLayout({
      width: chartWidth,
      height: chartHeight,
      yTickLabels: showYAxis ? (isVertical ? valTicks : labels) : [],
      xTickLabels: showXAxis ? (isVertical ? labels : valTicks) : [],
      hasYAxisLabel: Boolean(yAxisLabel) && showYAxis,
      hasXAxisLabel: Boolean(xAxisLabel) && showXAxis,
      base: { top: 20, left: showYAxis ? 50 : 28, right: 28, bottom: showXAxis ? 40 : 8 }
    });
  });
  let dims = $derived(layout);

  let catScale = $derived(
    createBandScale(labels, isVertical ? [0, dims.innerWidth] : [0, dims.innerHeight], barPadding)
  );
  let valScale = $derived(
    createLinearScale(yExtent, isVertical ? [dims.innerHeight, 0] : [0, dims.innerWidth])
  );

  // ── Bar geometry (A1-1 floating bars integrated) ──────────────

  let bars = $derived.by<BarRect[]>(() => {
    const zeroPos = valScale(0);
    const result: BarRect[] = [];

    /**
     * Computes x/y/width/height for a single data point in vertical or
     * horizontal orientation, handling both normal value bars and floating
     * [low,high] range bars (A1-1).
     */
    const barGeometry = (
      d: (typeof resolvedSeries)[0]['data'][0],
      catPos: number,
      barW: number
    ): { x: number; y: number; width: number; height: number; isFloating: boolean } => {
      const hasRange = Array.isArray(d.range);
      if (isVertical) {
        if (hasRange) {
          const lowPos = valScale(d.range![0]);
          const highPos = valScale(d.range![1]);
          const top = Math.min(lowPos, highPos);
          const bottom = Math.max(lowPos, highPos);
          return {
            x: catPos,
            y: top,
            width: barW,
            height: Math.max(2, bottom - top),
            isFloating: true
          };
        }
        const valPos = valScale(d.value);
        return {
          x: catPos,
          y: d.value >= 0 ? valPos : zeroPos,
          width: barW,
          height: Math.max(2, Math.abs(valPos - zeroPos)),
          isFloating: false
        };
      } else {
        if (hasRange) {
          const lowPos = valScale(d.range![0]);
          const highPos = valScale(d.range![1]);
          const left = Math.min(lowPos, highPos);
          const right = Math.max(lowPos, highPos);
          return {
            x: left,
            y: catPos,
            width: Math.max(2, right - left),
            height: barW,
            isFloating: true
          };
        }
        const valPos = valScale(d.value);
        return {
          x: d.value >= 0 ? zeroPos : valPos,
          y: catPos,
          width: Math.max(2, Math.abs(valPos - zeroPos)),
          height: barW,
          isFloating: false
        };
      }
    };

    if (isMulti && groupMode === 'grouped') {
      const subBand = catScale.bandwidth / Math.max(1, visibleEntries.length);
      for (let vi = 0; vi < visibleEntries.length; vi++) {
        const { s, si } = visibleEntries[vi];
        const seriesFill: BarFill = s.color ?? getColor(si);
        for (let pi = 0; pi < s.data.length; pi++) {
          const d = s.data[pi];
          const catPos = catScale(d.label) + vi * subBand;
          const barW = Math.max(1, subBand * 0.9);
          const geom = barGeometry(d, catPos, barW);
          const effectiveFill: BarFill = d.color ?? seriesFill;
          const color = fallbackColor(effectiveFill, si);
          const fillId = resolveFillId(effectiveFill, si, pi, d.color != null);
          result.push({ ...geom, color, fillId, si, pi, dataPoint: d, seriesName: s.name });
        }
      }
    } else if (isMulti && groupMode === 'stacked') {
      const categoryTotals = labels.map((_, labelIndex) =>
        visibleEntries.reduce((sum, { s }) => sum + Math.max(0, s.data[labelIndex]?.value ?? 0), 0)
      );
      const stackBase = new Array(labels.length).fill(0);
      for (let vi = 0; vi < visibleEntries.length; vi++) {
        const { s, si } = visibleEntries[vi];
        const seriesFill: BarFill = s.color ?? getColor(si);
        for (let pi = 0; pi < s.data.length; pi++) {
          const d = s.data[pi];
          const rawVal = Math.max(0, d.value);
          const normalizedValue = isNormalized
            ? categoryTotals[pi] > 0
              ? (rawVal / categoryTotals[pi]) * 100
              : 0
            : null;
          const val = isNormalized ? (normalizedValue ?? 0) : rawVal;
          const y0 = stackBase[pi];
          const y1 = y0 + val;
          stackBase[pi] = y1;
          const effectiveFill: BarFill = d.color ?? seriesFill;
          const color = fallbackColor(effectiveFill, si);
          const fillId = resolveFillId(effectiveFill, si, pi, d.color != null);
          if (isVertical) {
            result.push({
              x: catScale(d.label),
              y: valScale(y1),
              width: catScale.bandwidth,
              height: Math.max(0, valScale(y0) - valScale(y1)),
              color,
              fillId,
              si,
              pi,
              dataPoint: d,
              seriesName: s.name,
              normalizedValue,
              isFloating: false
            });
          } else {
            result.push({
              x: valScale(y0),
              y: catScale(d.label),
              width: Math.max(0, valScale(y1) - valScale(y0)),
              height: catScale.bandwidth,
              color,
              fillId,
              si,
              pi,
              dataPoint: d,
              seriesName: s.name,
              normalizedValue,
              isFloating: false
            });
          }
        }
      }
    } else {
      const singleSeries = resolvedSeries[0];
      for (let pi = 0; pi < singleSeries.data.length; pi++) {
        const d = singleSeries.data[pi];
        const catPos = catScale(d.label);
        const barW = catScale.bandwidth;
        const geom = barGeometry(d, catPos, barW);
        const effectiveFill: BarFill = d.color ?? singleSeries.color ?? getColor(pi);
        const color = fallbackColor(effectiveFill, pi);
        const fillId = resolveFillId(effectiveFill, 0, pi, d.color != null);
        result.push({
          ...geom,
          color,
          fillId,
          si: 0,
          pi,
          dataPoint: d,
          seriesName: singleSeries.name
        });
      }
    }
    return result;
  });

  let valueFont = $derived({ size: valueFontSize, weight: 600 });

  // Highcharts label chain per bar (outside → justify inside → crop), then a
  // global allowOverlap:false pass so neighbouring labels never collide.
  let barLabels = $derived.by(() => {
    if (!showValues) {
      return [];
    }
    const plot = { width: dims.innerWidth, height: dims.innerHeight };
    const placements = bars.map((bar) => {
      const text = getDisplayValue(bar);
      const size = measureText(text, valueFont);
      const p = isStackedMode
        ? resolveInsideLabel({ bar, label: size })
        : resolveEndLabel({
            bar,
            plot,
            label: size,
            orientation,
            negative: !bar.isFloating && bar.dataPoint.value < 0
          });
      return { bar, text, size, p };
    });
    const mask = dropOverlapping(
      placements.map(({ p, size }) => (p.placement === 'hidden' ? null : placedLabelRect(p, size)))
    );
    return placements.map((entry, i) => ({
      ...entry,
      visible: mask[i] === true && entry.p.placement !== 'hidden'
    }));
  });

  const contrastOutline = (fill: string): string =>
    getContrastColor(fill) === '#000000' ? '#ffffff' : '#000000';

  // ── Defs: pattern and gradient fill resolution (A1-2 / A1-3) ──

  /**
   * Computes a stable defs element id for a given bar fill.
   *
   * Series-level fills (no per-bar override) share ONE def entry keyed by `si`
   * only, so N data points in the same series do not produce N duplicate SVG
   * ids. Per-bar fills (d.color is set) include `pi` so each bar gets its own
   * def. Returns null for plain CSS color strings (no defs entry needed).
   */
  function resolveFillId(fill: BarFill, si: number, pi: number, isPerBar: boolean): string | null {
    if (typeof fill === 'string') {
      return null;
    }
    const key = isPerBar ? `${si}-${pi}` : `${si}`;
    if ('pattern' in fill) {
      return `${uid}-pat-${key}`;
    }
    if ('gradient' in fill) {
      return `${uid}-grad-${key}`;
    }
    return null;
  }

  /**
   * Collects unique defs entries (pattern or gradient fills) needed by the
   * current set of bars. Uses a SvelteMap keyed by id to guarantee each SVG id
   * is emitted exactly once — series-level fills that apply to many bars collapse
   * to a single shared def, satisfying the SVG uniqueness requirement.
   */
  let defsEntries = $derived.by(() => {
    const seen = new SvelteMap<
      string,
      { id: string; bar: BarRect; fill: BarFillPattern | BarFillGradient }
    >();
    for (const bar of bars) {
      if (!bar.fillId) {
        continue;
      }
      if (seen.has(bar.fillId)) {
        continue;
      }
      const rawFill = bar.dataPoint.color ?? resolvedSeries[bar.si]?.color;
      if (rawFill == null || typeof rawFill === 'string') {
        continue;
      }
      if ('pattern' in rawFill || 'gradient' in rawFill) {
        seen.set(bar.fillId, { id: bar.fillId, bar, fill: rawFill });
      }
    }
    return [...seen.values()];
  });

  // ── Legend items ───────────────────────────────────────────────

  let legendItems = $derived<LegendItem[]>(
    isMulti
      ? resolvedSeries.map((s, i) => ({
          label: s.name,
          color: fallbackColor(s.color ?? getColor(i), i),
          hidden: hiddenSeries.has(i)
        }))
      : []
  );

  let isEmpty = $derived(resolvedSeries.every((s) => s.data.length === 0) || labels.length === 0);

  // ── Scroll geometry ────────────────────────────────────────────

  let minScrollWidth = $derived(
    labels.length * minBandWidth + dims.margin.left + dims.margin.right
  );

  // ── Stacked bar path helper ────────────────────────────────────

  function stackedBarPath(bar: BarRect): string {
    if (barRadius <= 0) {
      return roundedRectPath(bar.x, bar.y, bar.width, bar.height, 0, 0, 0, 0);
    }
    const vi = visibleOrder.get(bar.si) ?? 0;
    const isFirst = vi === 0;
    const isLast = vi === visibleEntries.length - 1;
    if (isVertical) {
      const tl = isLast ? barRadius : 0;
      const tr = isLast ? barRadius : 0;
      const br = isFirst ? barRadius : 0;
      const bl = isFirst ? barRadius : 0;
      return roundedRectPath(bar.x, bar.y, bar.width, bar.height, tl, tr, br, bl);
    } else {
      const tl = isFirst ? barRadius : 0;
      const bl = isFirst ? barRadius : 0;
      const tr = isLast ? barRadius : 0;
      const br = isLast ? barRadius : 0;
      return roundedRectPath(bar.x, bar.y, bar.width, bar.height, tl, tr, br, bl);
    }
  }

  // ── Fill attribute helper ──────────────────────────────────────

  function barFillAttr(bar: BarRect): string {
    return bar.fillId ? `url(#${bar.fillId})` : bar.color;
  }

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
    const displayValue = getDisplayValue(bar);
    return {
      title,
      items: [{ label: bar.dataPoint.label, value: displayValue, color: bar.color }]
    };
  });

  // ── Render context for overlay snippet (A1-4) ─────────────────

  let overlayContext = $derived<BarChartRenderContext>({
    innerWidth: dims.innerWidth,
    innerHeight: dims.innerHeight,
    margin: {
      top: dims.margin.top,
      right: dims.margin.right,
      bottom: dims.margin.bottom,
      left: dims.margin.left
    },
    bars: bars.map((bar, index) => {
      // barLabels is index-aligned with bars (both derive from the same list);
      // fall back to the bar's top-centre when value labels are hidden.
      const barLabel = barLabels[index];
      return {
        index,
        seriesIndex: bar.si,
        pointIndex: bar.pi,
        x: bar.x,
        y: bar.y,
        width: bar.width,
        height: bar.height,
        value: bar.dataPoint.value,
        label: bar.dataPoint.label ?? '',
        labelX: barLabel ? barLabel.p.x : bar.x + bar.width / 2,
        labelY: barLabel ? barLabel.p.y : bar.y
      };
    })
  });

  // ── Interactions ───────────────────────────────────────────────

  // Narrows an event's currentTarget to Element without an `as` cast (repo
  // lint bans type assertions outside test files).
  const targetElement = (e: Event): Element | null =>
    e.currentTarget instanceof Element ? e.currentTarget : null;

  function trackMouse(e: PointerEvent): void {
    const position = pointerPositionIn(plotEl, e);
    if (position !== null) {
      mouseX = position.x;
      mouseY = position.y;
    }
  }

  // Anchor from the live element rect (not SVG math) so legend offset and
  // scrollable-mode scroll position are automatically accounted for.
  function anchorFromElement(el: Element): TooltipAnchor | null {
    if (plotEl === null) {
      return null;
    }
    const r = el.getBoundingClientRect();
    const c = plotEl.getBoundingClientRect();
    return isVertical
      ? { x: r.left + r.width / 2 - c.left, y: r.top - c.top, side: 'top' }
      : { x: r.right - c.left, y: r.top + r.height / 2 - c.top, side: 'right' };
  }

  function activateBar(target: Element, bar: BarRect): void {
    hovered = { si: bar.si, pi: bar.pi };
    anchor = anchorFromElement(target);
    onbarhover?.({ index: bar.pi, dataPoint: bar.dataPoint });
  }

  function handleEnter(e: PointerEvent, bar: BarRect): void {
    const el = targetElement(e);
    if (el !== null) {
      activateBar(el, bar);
    }
    trackMouse(e);
  }

  function handleFocus(e: FocusEvent, bar: BarRect): void {
    const el = targetElement(e);
    if (el !== null) {
      activateBar(el, bar);
    }
  }

  function handleLeave(): void {
    hovered = null;
    anchor = null;
    onbarhover?.(null);
  }

  function handleKeydown(e: KeyboardEvent, bar: BarRect): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(bar);
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
    {#if isMulti && showLegend && (chartWidth === 0 || hideLegendBelow === 0 || chartWidth >= hideLegendBelow)}
      {#if interactiveLegend}
        <Legend items={legendItems} position="top" onToggle={toggleSeries} />
      {:else}
        <Legend items={legendItems} position="top" />
      {/if}
    {/if}

    <div class="chart-plot" bind:this={plotEl}>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div
        class="chart-scroll-area"
        role="region"
        aria-label={yAxisLabel ? `${yAxisLabel} bar chart` : 'Bar chart'}
        tabindex={scrollable ? 0 : null}
        style={scrollable
          ? `overflow-x: auto; -webkit-overflow-scrolling: touch; height: var(--barchart-scroll-area-height, auto);`
          : ''}
      >
        <div style={scrollable ? `min-width: ${minScrollWidth}px;` : ''}>
          <ChartContainer
            bind:width={chartWidth}
            bind:height={chartHeight}
            {aspectRatio}
            {maxHeight}
            {minHeight}
          >
            <!-- A1-2 / A1-3: SVG <defs> for pattern and gradient fills -->
            {#if defsEntries.length > 0}
              <defs>
                {#each defsEntries as entry (entry.id)}
                  {#if 'pattern' in entry.fill}
                    {@const pat = entry.fill.pattern}
                    {@const patSize = pat.size ?? 8}
                    {@const patColor = pat.color ?? entry.bar.color}
                    {@const patBg = pat.background ?? 'transparent'}
                    {@const patStrokeW = pat.strokeWidth ?? 1.5}
                    <pattern
                      id={entry.id}
                      patternUnits="userSpaceOnUse"
                      width={patSize}
                      height={patSize}
                    >
                      <rect width={patSize} height={patSize} fill={patBg} />
                      {#if pat.type === 'lines'}
                        <line
                          x1="0"
                          y1={patSize}
                          x2={patSize}
                          y2="0"
                          stroke={patColor}
                          stroke-width={patStrokeW}
                        />
                      {:else if pat.type === 'crosshatch'}
                        <line
                          x1="0"
                          y1={patSize}
                          x2={patSize}
                          y2="0"
                          stroke={patColor}
                          stroke-width={patStrokeW}
                        />
                        <line
                          x1="0"
                          y1="0"
                          x2={patSize}
                          y2={patSize}
                          stroke={patColor}
                          stroke-width={patStrokeW}
                        />
                      {:else}
                        <!-- dots -->
                        <circle cx={patSize / 2} cy={patSize / 2} r={patStrokeW} fill={patColor} />
                      {/if}
                    </pattern>
                  {:else if 'gradient' in entry.fill}
                    {@const grad = entry.fill.gradient}
                    {@const isHoriz = grad.direction === 'horizontal'}
                    <!--
                    gradientUnits="userSpaceOnUse" is required here.
                    objectBoundingBox ratios are undefined on degenerate (zero-height)
                    path bounding boxes (stacked segments, Firefox renders black).
                    userSpaceOnUse resolves in the coordinate system of the
                    referencing element — i.e. inner space (inside the <g transform>)
                    — so bar.y / bar.x / bar.height / bar.width are used directly
                    without any margin offset. This matches the AreaChart pattern
                    (feat/linechart-gradient ea5f794, lines 282-284).
                  -->
                    <linearGradient
                      id={entry.id}
                      x1={entry.bar.x}
                      y1={entry.bar.y}
                      x2={isHoriz ? entry.bar.x + entry.bar.width : entry.bar.x}
                      y2={isHoriz ? entry.bar.y : entry.bar.y + entry.bar.height}
                      gradientUnits="userSpaceOnUse"
                    >
                      {#each grad.stops as stop, stopIndex (`${stopIndex}-${stop.offset}`)}
                        <stop
                          offset="{stop.offset * 100}%"
                          stop-color={stop.color}
                          stop-opacity={stop.opacity ?? 1}
                        />
                      {/each}
                    </linearGradient>
                  {/if}
                {/each}
              </defs>
            {/if}

            <g transform="translate({dims.margin.left}, {dims.margin.top})">
              {#if showYAxis}
                <Axis
                  orientation="left"
                  scale={isVertical ? valScale : catScale}
                  tickCount={valTickCount}
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
                    tickCount={valTickCount}
                    rotateTicks={layout.xRotate}
                    tickEvery={layout.xEvery}
                    labelOffset={layout.xLabelOffset}
                    showGridlines={!isVertical && showGridlines}
                    gridlineLength={dims.innerHeight}
                    label={xAxisLabel}
                  />
                </g>
              {/if}

              {#if !hideBarGraphics}
                {#each bars as bar, i (i)}
                  {#if isStackedMode && barRadius > 0}
                    <path
                      class="bar"
                      class:hovered={hovered?.si === bar.si && hovered?.pi === bar.pi}
                      class:highlighted={effectiveHighlightedIndex !== null &&
                        effectiveHighlightedIndex === bar.pi}
                      class:dimmed={(hovered !== null &&
                        (hovered.si !== bar.si || hovered.pi !== bar.pi)) ||
                        (effectiveHighlightedIndex !== null &&
                          effectiveHighlightedIndex !== bar.pi)}
                      d={stackedBarPath(bar)}
                      fill={barFillAttr(bar)}
                      data-pw={`bar-${i}`}
                      tabindex="0"
                      role="button"
                      aria-label="{bar.dataPoint.label}: {getDisplayValue(bar)}"
                      onpointerenter={(e) => handleEnter(e, bar)}
                      onpointermove={trackMouse}
                      onpointerleave={handleLeave}
                      onfocus={(e) => handleFocus(e, bar)}
                      onblur={handleLeave}
                      onkeydown={(e) => handleKeydown(e, bar)}
                      onclick={() => handleClick(bar)}
                    />
                  {:else}
                    <rect
                      class="bar"
                      class:hovered={hovered?.si === bar.si && hovered?.pi === bar.pi}
                      class:highlighted={effectiveHighlightedIndex !== null &&
                        effectiveHighlightedIndex === bar.pi}
                      class:dimmed={(hovered !== null &&
                        (hovered.si !== bar.si || hovered.pi !== bar.pi)) ||
                        (effectiveHighlightedIndex !== null &&
                          effectiveHighlightedIndex !== bar.pi)}
                      x={bar.x}
                      y={bar.y}
                      width={bar.width}
                      height={bar.height}
                      rx={barRadius}
                      ry={barRadius}
                      fill={barFillAttr(bar)}
                      data-pw={`bar-${i}`}
                      tabindex="0"
                      role="button"
                      aria-label="{bar.dataPoint.label}: {getDisplayValue(bar)}"
                      onpointerenter={(e) => handleEnter(e, bar)}
                      onpointermove={trackMouse}
                      onpointerleave={handleLeave}
                      onfocus={(e) => handleFocus(e, bar)}
                      onblur={handleLeave}
                      onkeydown={(e) => handleKeydown(e, bar)}
                      onclick={() => handleClick(bar)}
                    />
                  {/if}
                {/each}
                {#each barLabels as bl, i (i)}
                  {#if bl.visible}
                    <text
                      class="bar-value"
                      class:bar-value-inside={bl.p.placement === 'inside'}
                      data-inside={bl.p.placement === 'inside' ? 'true' : 'false'}
                      x={bl.p.x}
                      y={bl.p.y}
                      text-anchor={bl.p.textAnchor}
                      dominant-baseline={bl.p.dominantBaseline}
                      data-pw={`bar-value-${i}`}
                      style={bl.p.placement === 'inside'
                        ? `fill: ${getContrastColor(bl.bar.color)}; stroke: ${contrastOutline(bl.bar.color)};`
                        : ''}>{bl.text}</text
                    >
                  {/if}
                {/each}
              {/if}

              <!-- A1-4: renderOverlay escape hatch — rendered after all bars -->
              {#if typeof renderOverlay === 'function'}
                {@render renderOverlay(overlayContext)}
              {/if}
            </g>
          </ChartContainer>
        </div>
      </div>

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
            {@const hb = hoveredBar()}
            {#if hb}
              {@render tooltipSnippet(hb.dataPoint, hb.pi)}
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
  {/if}
</div>

<style>
  .bar-chart {
    width: 100%;
    position: relative;
  }
  .chart-scroll-area {
    width: 100%;
  }
  .chart-plot {
    position: relative;
  }
  .bar {
    transition: opacity var(--chart-transition-duration, 0.2s) ease;
    cursor: pointer;
  }
  .bar.hovered {
    opacity: var(--barchart-bar-hover-opacity, 1);
  }
  .bar.highlighted {
    opacity: var(--barchart-bar-highlighted-opacity, 1);
  }
  .bar.dimmed {
    opacity: var(--barchart-bar-dimmed-opacity, 0.3);
  }
  .bar:focus-visible {
    outline: 2px solid var(--chart-axis-label-color, light-dark(#333, #e5e7eb));
    outline-offset: 1px;
  }
  .bar-value {
    fill: var(--barchart-value-color, light-dark(#333, #e5e7eb));
    font-size: var(--barchart-value-font-size, 14px);
    font-weight: var(--barchart-value-font-weight, 600);
    font-family: var(--chart-font-family, inherit);
    pointer-events: none;
  }
  .bar-value-inside {
    paint-order: stroke;
    stroke-width: 2px;
    stroke-opacity: 0.35;
    stroke-linejoin: round;
  }
  .chart-empty {
    padding: var(--chart-empty-padding, 32px 24px);
    color: var(--chart-empty-color, light-dark(#9ca3af, #6b7280));
    text-align: center;
  }
</style>
