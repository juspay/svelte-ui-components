import type { Snippet } from 'svelte';
import type { ChartHighlightAPI } from '../_chart/highlight';

// ── Fill types (A1-2 pattern, A1-3 gradient) ──────────────────

export type BarFillPattern = {
  pattern: {
    /** SVG pattern element type: 'lines' | 'dots' | 'crosshatch' */
    type: 'lines' | 'dots' | 'crosshatch';
    /** Foreground stroke/fill color of the pattern marks */
    color?: string;
    /** Background fill color (defaults to transparent) */
    background?: string;
    /** Pattern cell size in px (default 8) */
    size?: number;
    /** Stroke width for line-based patterns (default 1.5) */
    strokeWidth?: number;
  };
};

export type BarFillGradientStop = {
  offset: number;
  color: string;
  opacity?: number;
};

export type BarFillGradient = {
  gradient: {
    stops: BarFillGradientStop[];
    /** 'vertical' → top-to-bottom (default), 'horizontal' → left-to-right */
    direction?: 'vertical' | 'horizontal';
  };
};

/** A bar's fill: plain CSS color string, SVG pattern fill, or linear gradient fill. */
export type BarFill = string | BarFillPattern | BarFillGradient;

// ── Data shapes ───────────────────────────────────────────────

export type BarChartDataPoint = {
  label: string;
  /** Value used for a standard bar. Ignored when [low, high] tuple is supplied. */
  value: number;
  /**
   * A1-1 floating / columnrange bar: [low, high] tuple where both are absolute
   * domain values. When present the bar spans from low to high instead of
   * from zero to value.
   */
  range?: [number, number];
  /** Per-bar fill: plain color, pattern, or gradient. Overrides series color. */
  color?: BarFill;
};

export type BarChartSeries = {
  name: string;
  data: BarChartDataPoint[];
  /** Series-level fill: plain color, pattern, or gradient. */
  color?: BarFill;
};

// ── Render-overlay escape hatch (A1-4) ───────────────────────

export type BarChartRenderContext = {
  /** Inner drawing width (pixels) */
  innerWidth: number;
  /** Inner drawing height (pixels) */
  innerHeight: number;
  /**
   * Full margin offsets applied to the main <g> transform.
   * All four edges are exposed so consumers can compute chart
   * boundaries in both dimensions (e.g. innerWidth + margin.right
   * for a right-edge annotation, innerHeight + margin.bottom for
   * a bottom-edge connector in a funnel overlay).
   */
  margin: { top: number; right: number; bottom: number; left: number };
};

// ── Component property types ──────────────────────────────────

export type BarChartProperties = OptionalBarChartProperties & BarChartEventProperties;

export type OptionalBarChartProperties = {
  data?: BarChartDataPoint[];
  series?: BarChartSeries[];
  orientation?: 'vertical' | 'horizontal';
  showValues?: boolean;
  showGridlines?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  barPadding?: number;
  /**
   * Corner radius on bar/column shapes in pixels. Defaults to
   * `DEFAULT_CHART_CORNER_RADIUS` (4), mirroring the design system's base
   * `--radius` token. SVG `rx`/`ry` cannot read CSS `var()`, so pass this
   * prop explicitly to track a changed `--radius` at runtime.
   */
  barRadius?: number;
  aspectRatio?: number;
  /**
   * Upper bound (px) on the rendered chart height. The chart height is derived from
   * its width via `aspectRatio`; on wide or scrollable surfaces that can balloon the
   * chart. Cap it here to keep the chart compact (defaults to `Infinity` = uncapped).
   */
  maxHeight?: number;
  /** Lower bound (px) on the rendered chart height (defaults to `0`). */
  minHeight?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  yDomain?: [number, number];
  valueFormat?: (value: number) => string;
  groupMode?: 'grouped' | 'stacked';
  showLegend?: boolean;
  /**
   * When `true` and `groupMode="stacked"`, normalises each category's stack to
   * 100% so bars represent proportions rather than absolute values. The Y axis
   * runs 0–100 and value labels are suffixed with `%` (unless `valueFormat` is
   * provided to override the default formatter).
   */
  stackNormalize?: boolean;
  /**
   * When `true`, wraps the SVG in a horizontally-scrollable container so that
   * wide charts with many categories remain readable at small container widths.
   * Combine with `minBandWidth` to control how much each category band expands
   * before the chart begins to overflow and scroll.
   */
  scrollable?: boolean;
  /**
   * Minimum pixel width per category band when `scrollable` is `true`.
   * The chart's inner width grows until every band is at least this many pixels
   * wide, then the scroll container takes over. Has no effect when `scrollable`
   * is `false`. Default is `48`.
   */
  minBandWidth?: number;
  tooltipSnippet?: Snippet<[BarChartDataPoint, number]>;
  empty?: Snippet;
  /**
   * A1-4 escape hatch: a Snippet rendered inside the SVG transform group after
   * all bars. Use for overlays, annotations, or drop-off indicators that must
   * live in SVG coordinate space.
   */
  renderOverlay?: Snippet<[BarChartRenderContext]>;
  /**
   * Called once on mount with an imperative `ChartHighlightAPI` handle.
   * Use `api.highlight(index)` to emphasise a specific bar (by its zero-based
   * position within the category axis) and dim all others. Pass `null` to clear.
   * The `type` field on the handle is always `'bar-chart'`.
   */
  onChartReady?: (api: ChartHighlightAPI) => void;
  /**
   * Declarative complement to `onChartReady`. When set to a non-null number the
   * bar at that zero-based category index is highlighted (full opacity) and the
   * remaining bars are dimmed. Set to `null` or omit to show all bars normally.
   */
  highlightedIndex?: number | null;
  /**
   * When `true`, each series' values are expressed as a percentage of that
   * series' own first data point. A value equal to the baseline renders as 100,
   * a value twice the baseline as 200, and so on. Useful for comparing relative
   * growth across series that start at very different absolute levels.
   * Has no effect on series that have no data or whose first point is zero.
   */
  normaliseToFirstPoint?: boolean;
  /**
   * When set, only the top `topN` bars (by descending value) are shown
   * individually. The remaining bars are aggregated into a single bar whose
   * value is the sum of all omitted bars and whose label is `overflowLabel`
   * (default `"Other"`). Has no effect when the data has `topN` or fewer bars.
   * In multi-series mode the ranking is based on the first series.
   */
  topN?: number;
  /**
   * Label for the aggregated overflow bar produced by `topN`. Defaults to
   * `"Other"`. Has no effect when `topN` is not set.
   */
  overflowLabel?: string;
  /**
   * When `true`, bar rectangles are not rendered. Only the axis labels, gridlines,
   * and legend remain visible. Useful for building legend-only or label-only
   * thumbnails alongside a full chart.
   */
  hideBarGraphics?: boolean;
  testId?: string;
  classes?: string;
};

export type BarChartEventProperties = {
  onbarclick?: (event: { index: number; dataPoint: BarChartDataPoint }) => void;
  onbarhover?: (event: { index: number; dataPoint: BarChartDataPoint } | null) => void;
};
