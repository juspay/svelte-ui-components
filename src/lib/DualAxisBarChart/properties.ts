import type { Snippet } from 'svelte';

// ── Axis config ───────────────────────────────────────────────

/**
 * Configuration for one of the two independent Y-axes.
 */
export type DualAxisConfig = {
  /** Optional label rendered above the axis line. */
  title?: string;
  /**
   * Color applied to axis title text and, by default, to tick labels on this side.
   * Accepts any CSS color string.
   */
  color?: string;
  /** Custom tick formatter. Receives a raw number and returns the display string. */
  valueFormat?: (value: number) => string;
};

// ── Series ────────────────────────────────────────────────────

/**
 * A single data series in the dual-axis chart.
 * Each series is mapped to either the left (0) or right (1) Y-axis.
 */
export type DualAxisSeries = {
  /** Display name shown in the legend and tooltip. */
  name: string;
  /**
   * Numeric values — one per category. The array length must match `categories`.
   */
  data: number[];
  /**
   * Which Y-axis this series uses.
   * `0` = left axis, `1` = right axis.
   */
  yAxisIndex: 0 | 1;
  /** Optional CSS color for the series bars/line. Falls back to the default palette. */
  color?: string;
  /**
   * Render type for this individual series.
   * `'column'` — vertical bars (default).
   * `'line'`   — line with optional dots drawn over the column layer.
   */
  type?: 'column' | 'line';
};

// ── Tooltip context ───────────────────────────────────────────

/**
 * Data passed to `tooltipSnippet` when the user hovers a category.
 */
export type DualAxisTooltipContext = {
  /** The hovered category label. */
  category: string;
  /** Zero-based index of the hovered category. */
  categoryIndex: number;
  /**
   * All series values for this category, in series order.
   * Each entry mirrors the corresponding `DualAxisSeries` plus the resolved value.
   */
  points: Array<{
    name: string;
    value: number;
    color: string;
    yAxisIndex: 0 | 1;
    type: 'column' | 'line';
  }>;
};

// ── Component properties ──────────────────────────────────────

export type DualAxisBarChartProperties = MandatoryDualAxisBarChartProperties &
  OptionalDualAxisBarChartProperties &
  DualAxisBarChartEventProperties;

export type MandatoryDualAxisBarChartProperties = {
  /** Ordered category labels for the shared X-axis (e.g. `['Jan', 'Feb', 'Mar']`). */
  categories: string[];
  /**
   * Array of series descriptors. Each series declares a `yAxisIndex` (0=left, 1=right),
   * the numeric `data` values, and an optional render `type`.
   */
  series: DualAxisSeries[];
};

export type OptionalDualAxisBarChartProperties = {
  /** Configuration for the left (primary) Y-axis. */
  leftAxis?: DualAxisConfig;
  /** Configuration for the right (secondary) Y-axis. */
  rightAxis?: DualAxisConfig;
  /** Whether to render dashed gridlines from the left-axis ticks. Default `true`. */
  showGridlines?: boolean;
  /** Whether to render the shared legend below the chart. Default `true`. */
  showLegend?: boolean;
  /**
   * Corner radius on column/bar shapes in pixels. Defaults to
   * `DEFAULT_CHART_CORNER_RADIUS` (4), mirroring the design system's base
   * `--radius` token. SVG `rx`/`ry` cannot read CSS `var()`, so pass this
   * prop explicitly to track a changed `--radius` at runtime.
   */
  barRadius?: number;
  /** Padding between category bands as a fraction of band width (0–1). Default `0.25`. */
  barPadding?: number;
  /**
   * Width-to-height ratio for the chart area.
   * Passed to `ChartContainer`'s ResizeObserver sizing. Default `16/9`.
   */
  aspectRatio?: number;
  /**
   * Upper bound (px) on the rendered chart height, so the aspect-ratio-derived height
   * can't balloon on wide surfaces. Defaults to `Infinity` (uncapped).
   */
  maxHeight?: number;
  /** Lower bound (px) on the rendered chart height (defaults to `0`). */
  minHeight?: number;
  /**
   * Custom tooltip content. Receives a `DualAxisTooltipContext` and replaces the
   * default multi-series tooltip.
   */
  tooltipSnippet?: Snippet<[DualAxisTooltipContext]>;
  /** Value set on `data-pw` for test targeting. */
  testId?: string;
  /** Extra CSS class string on the root `<div>`. */
  classes?: string;
  /**
   * Minimum rendered bar height in pixels. The default `2` keeps very small non-zero
   * values visible, but it also paints a 2px stub for genuine zeros — set `0` so an
   * all-zero/dormant series renders nothing (letting the consumer detect it and show
   * an empty state instead of a row of indistinguishable baseline stubs). Default `2`.
   */
  minBarHeight?: number;
  /**
   * Override the plot margins (px) reserved for axis titles and tick labels. Merged
   * over the defaults `{ top: 24, right: 56, bottom: 40, left: 56 }`; widen `left`/`right`
   * when long currency tick labels (e.g. `₹1,00,000`) would otherwise overlap the
   * gridlines in a narrow container.
   */
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  /**
   * Render the hover tooltip on `document.body` with `position: fixed` viewport
   * coordinates instead of `position: absolute` inside the chart. Set `true` when the
   * chart sits in an `overflow:auto`/scrollable container that would otherwise clip the
   * tooltip. Default `false` (in-chart positioning, unchanged).
   */
  tooltipPortal?: boolean;
  /** Legend items become click/keyboard toggles for series visibility. */
  interactiveLegend?: boolean;
  /** Hide the legend when the measured chart width is below this px value; 0 disables. */
  hideLegendBelow?: number;
};

export type DualAxisBarChartEventProperties = {
  /**
   * Fires when the user clicks a bar or line-dot.
   * Receives the category index and the full tooltip context for that category.
   */
  onbarclick?: (event: { categoryIndex: number; context: DualAxisTooltipContext }) => void;
};
