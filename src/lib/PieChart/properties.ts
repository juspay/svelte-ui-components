import type { Snippet } from 'svelte';
import type { ChartHighlightAPI } from '../_chart/highlight';

export type PieChartSlice = {
  label: string;
  value: number;
  color?: string;
};

/** Placement of the `legendShowValues` list. See `legendPosition`. */
export type PieChartLegendPosition = 'bottom' | 'right';

export type PieChartProperties = MandatoryPieChartProperties &
  OptionalPieChartProperties &
  PieChartEventProperties;

export type MandatoryPieChartProperties = {
  data: PieChartSlice[];
};

export type OptionalPieChartProperties = {
  innerRadius?: number;
  padAngle?: number;
  showLabels?: boolean;
  showValues?: boolean;
  labelPosition?: 'inside' | 'outside';
  showLegend?: boolean;
  startAngle?: number;
  aspectRatio?: number;
  /**
   * Upper bound (px) on the rendered chart height, so the aspect-ratio-derived height
   * can't balloon on wide surfaces. Defaults to `Infinity` (uncapped).
   */
  maxHeight?: number;
  /** Lower bound (px) on the rendered chart height (defaults to `0`). */
  minHeight?: number;
  valueFormat?: (value: number) => string;
  tooltipSnippet?: Snippet<[PieChartSlice, number]>;
  center?: Snippet;
  empty?: Snippet;
  testId?: string;
  classes?: string;
  semiCircle?: boolean;
  legendShowValues?: boolean;
  /**
   * Where the `legendShowValues` list sits relative to the chart. `'bottom'`
   * (the default) keeps today's below-chart placement; `'right'` renders it as
   * a column beside the chart, which is the shape a donut legend usually
   * wants once the labels carry values. Only affects the values legend —
   * `showLegend` without `legendShowValues` still renders the plain top
   * legend.
   */
  legendPosition?: PieChartLegendPosition;
  /**
   * Show at most this many legend rows, followed by a `+N more` control. Omit
   * it (the default) to show every row with no control at all. A cap that is
   * not exceeded renders no control either, since it would do nothing.
   */
  legendMaxItems?: number;
  /**
   * Called when the `+N more` control is activated. Providing it SUPPRESSES
   * the built-in in-place expansion, so a consumer opening their own modal or
   * drawer does not have the legend expand underneath it as well. Without it,
   * the control toggles the hidden rows in place.
   */
  onlegendmore?: () => void;
  percentDecimals?: number;
  /**
   * Called once on mount with the imperative highlight API. Pass the returned
   * object to an external orchestrator (e.g. voice narration) so it can drive
   * slice highlighting without touching internal state. The `type` field is
   * always `'donut-chart'` regardless of whether `innerRadius` is set.
   */
  onchartready?: (api: ChartHighlightAPI) => void;
  /**
   * Index of the slice to highlight programmatically. The highlighted slice
   * scales out and all others dim, exactly as if the user were hovering it.
   * Pass `null` (or omit the prop) to clear all highlights.
   */
  highlightedIndex?: number | null;
  /**
   * When provided, renders a `DeltaIndicator` badge anchored to the top-right
   * corner of the chart container. Positive values show green ↑, negative
   * values show red ↓ (unless `changeInvertColors` is `true`).
   */
  changePercentage?: number;
  /**
   * Swap the up/down colors on the delta badge for lower-is-better metrics
   * (e.g. RTO rate, bounce rate). Has no effect when `changePercentage` is
   * not provided.
   */
  changeInvertColors?: boolean;
};

export type PieChartEventProperties = {
  onsliceclick?: (event: { index: number; slice: PieChartSlice }) => void;
  onslicehover?: (event: { index: number; slice: PieChartSlice } | null) => void;
};
