import type { Snippet } from 'svelte';

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
  barRadius?: number;
  aspectRatio?: number;
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
  testId?: string;
  classes?: string;
};

export type BarChartEventProperties = {
  onbarclick?: (event: { index: number; dataPoint: BarChartDataPoint }) => void;
  onbarhover?: (event: { index: number; dataPoint: BarChartDataPoint } | null) => void;
};
