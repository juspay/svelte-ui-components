import type { Snippet } from 'svelte';

export type BarChartDataPoint = {
  label: string;
  value: number;
  color?: string;
};

export type BarChartSeries = {
  name: string;
  data: BarChartDataPoint[];
  color?: string;
};

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
  tooltipSnippet?: Snippet<[BarChartDataPoint, number]>;
  empty?: Snippet;
  testId?: string;
  classes?: string;
};

export type BarChartEventProperties = {
  onbarclick?: (event: { index: number; dataPoint: BarChartDataPoint }) => void;
  onbarhover?: (event: { index: number; dataPoint: BarChartDataPoint } | null) => void;
};
