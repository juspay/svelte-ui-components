import type { Snippet } from 'svelte';
import type { CurveType } from '$lib/_chart/types';

export type AreaChartDataPoint = {
  x: number;
  y: number;
  label?: string;
};

export type AreaChartSeries = {
  name: string;
  data: AreaChartDataPoint[];
  color?: string;
};

export type AreaChartTooltipContext = {
  x: number;
  points: Array<{ name: string; y: number; color: string; label?: string }>;
};

export type AreaChartProperties = MandatoryAreaChartProperties &
  OptionalAreaChartProperties &
  AreaChartEventProperties;

export type MandatoryAreaChartProperties = {
  series: AreaChartSeries[];
};

export type OptionalAreaChartProperties = {
  curve?: CurveType;
  stacked?: boolean;
  stackNormalize?: boolean;
  fillOpacity?: number;
  gradientFill?: boolean;
  showDots?: boolean;
  showLine?: boolean;
  showValues?: boolean;
  strokeWidth?: number;
  showGridlines?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showLegend?: boolean;
  xDomain?: [number, number];
  yDomain?: [number, number];
  xAxisLabel?: string;
  yAxisLabel?: string;
  xTickFormat?: (value: number | string) => string;
  yTickFormat?: (value: number | string) => string;
  aspectRatio?: number;
  /** Minimum rendered height in px (parity with LineChart). */
  minHeight?: number;
  /** Maximum rendered height in px; defaults to DEFAULT_CHART_MAX_HEIGHT (420). */
  maxHeight?: number;
  tooltipSnippet?: Snippet<[AreaChartTooltipContext]>;
  empty?: Snippet;
  /** Render the tooltip into document.body so scroll/overflow ancestors never clip it. */
  tooltipPortal?: boolean;
  testId?: string;
  classes?: string;
};

export type AreaChartEventProperties = {
  onpointhover?: (
    event: {
      seriesIndex: number;
      pointIndex: number;
      point: AreaChartDataPoint;
    } | null
  ) => void;
  onpointclick?: (event: {
    seriesIndex: number;
    pointIndex: number;
    point: AreaChartDataPoint;
  }) => void;
};
