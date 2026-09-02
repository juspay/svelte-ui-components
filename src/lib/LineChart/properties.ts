import type { Snippet } from 'svelte';
import type { CurveType } from '$lib/_chart/types';
import type { ChartHighlightAPI } from '$lib/_chart/highlight';

export type LineChartDataPoint = {
  x: number;
  y: number;
  label?: string;
};

export type LineChartSeries = {
  name: string;
  data: LineChartDataPoint[];
  color?: string;
  /**
   * Dashed stroke for this series (e.g. a comparison/previous-period line).
   * `true` uses the default `'6 4'` pattern; a string is passed through as a
   * custom SVG `stroke-dasharray`. Omit for a solid line.
   */
  dash?: boolean | string;
};

export type LineChartTooltipContext = {
  x: number;
  points: Array<{ name: string; y: number; color: string; label?: string }>;
};

/**
 * Colours used for the vertical gradient fill rendered under the line when
 * `showArea` is true. Both values accept any valid CSS colour string.
 */
export type LineChartAreaGradient = {
  /** Colour at the top of the gradient (closest to the line). */
  from: string;
  /** Colour at the bottom of the gradient (at the baseline). */
  to: string;
};

export type LineChartProperties = MandatoryLineChartProperties &
  OptionalLineChartProperties &
  LineChartEventProperties;

export type MandatoryLineChartProperties = {
  /** Array of `{name, data, color?}`. Each series renders as a separate line. */
  series: LineChartSeries[];
};

export type OptionalLineChartProperties = {
  /** Interpolation between points. `'spline'` is an alias for `'monotone'`. */
  curve?: CurveType;
  /**
   * When true, renders a gradient fill under each line using the series colour,
   * fading from `fillOpacity+0.3` at the top to transparent at the bottom.
   * For per-series custom gradient colours use `showArea` + `areaGradient` instead.
   */
  gradientFill?: boolean;
  /** Base opacity of the gradient fill (0–1). Only used when `gradientFill` is true. */
  fillOpacity?: number;
  /**
   * When true, renders a solid filled area under each line. The fill colour is
   * taken from `areaGradient` when provided, otherwise falls back to a
   * transparent-to-series-colour vertical gradient.
   */
  showArea?: boolean;
  /**
   * Custom colours for the filled area rendered when `showArea` is true.
   * Applies the same gradient to every series; supply a per-series colour via
   * each series' own `color` field if distinct fills are needed.
   */
  areaGradient?: LineChartAreaGradient;
  /** Whether to render dots at each data point. Hover still works via overlay when `false`. */
  showDots?: boolean;
  /** Whether to render text labels with the y-value at each data point. */
  showValues?: boolean;
  /** Radius of data point dots in pixels. Hovered or highlighted dot is 1.5× this. */
  dotRadius?: number;
  /** Width of line strokes in pixels. */
  strokeWidth?: number;
  /** Whether to show dashed gridlines across the Y axis. */
  showGridlines?: boolean;
  /** Whether to render the X axis. */
  showXAxis?: boolean;
  /** Whether to render the Y axis. */
  showYAxis?: boolean;
  /** Whether to render the legend. Only shown when there are multiple series. */
  showLegend?: boolean;
  /** Fixed `[min, max]` for the X axis. When omitted the domain is derived from data. */
  xDomain?: [number, number];
  /** Fixed `[min, max]` for the Y axis. When omitted the domain is derived from data. */
  yDomain?: [number, number];
  /** Text label below the X axis. */
  xAxisLabel?: string;
  /** Text label beside the Y axis (rotated). */
  yAxisLabel?: string;
  /**
   * String category labels, one per unique x-index (parallel array to the
   * numeric x values used in `series[n].data`). When provided these labels
   * replace the raw numeric x values in the X-axis tick labels and tooltips.
   * Index 0 maps to x=1, index 1 maps to x=2, and so on.
   */
  xAxisCategories?: string[];
  /** Formatter for X axis tick labels. */
  xTickFormat?: (value: number | string) => string;
  /** Formatter for Y axis tick labels. */
  yTickFormat?: (value: number | string) => string;
  /**
   * Snap Y-axis ticks to whole numbers (mirrors the X axis' category
   * behaviour). Use for count-style series (orders, items) where a small
   * domain would otherwise produce fractional ticks (0, 0.5, 1, 1.5, 2) —
   * `yTickFormat` only changes label text, not tick placement.
   */
  yIntegerTicks?: boolean;
  /** Width-to-height ratio for the chart. */
  aspectRatio?: number;
  /** Minimum chart height in pixels, regardless of computed aspect-ratio height. */
  minHeight?: number;
  /** Maximum chart height in pixels, regardless of computed aspect-ratio height. */
  maxHeight?: number;
  /** Custom tooltip. Receives `{x, points: [{name, y, color, label?}]}`. */
  tooltipSnippet?: Snippet<[LineChartTooltipContext]>;
  /** Content rendered when all series are empty. */
  empty?: Snippet;
  /** One tooltip listing every series at the hovered x (Highcharts shared tooltip).
   *  Defaults to true for multi-series charts; single-series behavior is unchanged. */
  sharedTooltip?: boolean;
  /** Legend items become click/keyboard toggles for series visibility. */
  interactiveLegend?: boolean;
  /** Hide the legend when the measured chart width is below this px value; 0 disables. */
  hideLegendBelow?: number;
  /** Render the tooltip into document.body so scroll/overflow ancestors never clip it. */
  tooltipPortal?: boolean;
  /** Value for the data-pw attribute on the chart container. */
  testId?: string;
  /** CSS class string applied to the top-level element. */
  classes?: string;
  /**
   * Zero-based point index to highlight imperatively. When set, the marker at
   * that index is emphasised and all others are dimmed. Pass `null` to clear.
   * Use `onChartReady` for the imperative API equivalent.
   */
  highlightedIndex?: number | null;
};

export type LineChartEventProperties = {
  onpointclick?: (event: {
    seriesIndex: number;
    pointIndex: number;
    point: LineChartDataPoint;
  }) => void;
  onPointClick?: (event: {
    seriesIndex: number;
    pointIndex: number;
    point: LineChartDataPoint;
  }) => void;
  onpointhover?: (
    event: {
      seriesIndex: number;
      pointIndex: number;
      point: LineChartDataPoint;
    } | null
  ) => void;
  onPointHover?: (
    event: {
      seriesIndex: number;
      pointIndex: number;
      point: LineChartDataPoint;
    } | null
  ) => void;
  /**
   * Called once after the chart mounts, handing back a `ChartHighlightAPI`
   * so an external orchestrator (e.g. voice narration sync) can drive point
   * highlighting without knowledge of the chart's internal state.
   */
  onChartReady?: (api: ChartHighlightAPI) => void;
};
