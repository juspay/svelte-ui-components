import type { Snippet } from 'svelte';

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
  valueFormat?: (value: number) => string;
  tooltipSnippet?: Snippet<[PieChartSlice, number]>;
  center?: Snippet;
  empty?: Snippet;
  testId?: string;
  classes?: string;
  semiCircle?: boolean;
  legendShowValues?: boolean;
  percentDecimals?: number;
};

export type PieChartEventProperties = {
  onsliceclick?: (event: { index: number; slice: PieChartSlice }) => void;
  onslicehover?: (event: { index: number; slice: PieChartSlice } | null) => void;
};
