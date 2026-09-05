import type { Snippet } from 'svelte';
import type { ChartHighlightAPI } from '../_chart/highlight';

export type PieChartSlice = {
  label: string;
  value: number;
  color?: string;
};

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
  percentDecimals?: number;
  /**
   * Called once on mount with the imperative highlight API. Pass the returned
   * object to an external orchestrator (e.g. voice narration) so it can drive
   * slice highlighting without touching internal state. The `type` field is
   * always `'donut-chart'` regardless of whether `innerRadius` is set.
   */
  onchartready?: (api: ChartHighlightAPI) => void;
  /** @deprecated Use `onchartready` instead; both work until 4.0.0. */
  onChartReady?: (api: ChartHighlightAPI) => void;
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
  /** @deprecated Use `onsliceclick` instead; both work until 4.0.0. */
  onSliceClick?: (event: { index: number; slice: PieChartSlice }) => void;
  onslicehover?: (event: { index: number; slice: PieChartSlice } | null) => void;
  /** @deprecated Use `onslicehover` instead; both work until 4.0.0. */
  onSliceHover?: (event: { index: number; slice: PieChartSlice } | null) => void;
};
