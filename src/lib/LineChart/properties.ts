import type { Snippet } from 'svelte';
import type { CurveType } from '$lib/_chart/types';

export type LineChartDataPoint = {
  x: number;
  y: number;
  label?: string;
};

export type LineChartSeries = {
  name: string;
  data: LineChartDataPoint[];
  color?: string;
};

export type LineChartTooltipContext = {
  x: number;
  points: Array<{ name: string; y: number; color: string; label?: string }>;
};

export type LineChartProperties = MandatoryLineChartProperties &
  OptionalLineChartProperties &
  LineChartEventProperties;

export type MandatoryLineChartProperties = {
  series: LineChartSeries[];
};

export type OptionalLineChartProperties = {
  curve?: CurveType;
  showDots?: boolean;
  showValues?: boolean;
  dotRadius?: number;
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
  tooltipSnippet?: Snippet<[LineChartTooltipContext]>;
  empty?: Snippet;
  testId?: string;
  classes?: string;
};

export type LineChartEventProperties = {
  onpointclick?: (event: {
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
};
