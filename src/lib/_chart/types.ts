import type { Snippet } from 'svelte';
import type { BarChartDataPoint } from '$lib/BarChart/properties';

// ── Primitive shapes ──────────────────────────────────────────

export type Margin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type Point = {
  x: number;
  y: number;
};

export type ChartDimensions = {
  width: number;
  height: number;
  margin: Margin;
  innerWidth: number;
  innerHeight: number;
};

// ── Scales ────────────────────────────────────────────────────

export type LinearScale = {
  (value: number): number;
  domain: [number, number];
  range: [number, number];
  ticks: (count?: number) => number[];
  invert: (pixel: number) => number;
};

export type BandScale = {
  (label: string): number;
  domain: string[];
  range: [number, number];
  bandwidth: number;
  step: number;
};

// ── Enums ─────────────────────────────────────────────────────

export type CurveType = 'linear' | 'monotone' | 'spline' | 'step' | 'natural';

export type AxisOrientation = 'top' | 'right' | 'bottom' | 'left';

// ── Computed layout shapes ────────────────────────────────────

export type PieSliceLayout = {
  index: number;
  startAngle: number;
  endAngle: number;
  midAngle: number;
  value: number;
  percentage: number;
  label: string;
  color?: string;
};

export type ComputedSankeyNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  color?: string;
  column: number;
};

export type ComputedSankeyLink = {
  source: string;
  target: string;
  value: number;
  color?: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  width: number;
  path: string;
};

export type BarRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  /**
   * Resolved CSS color string used for plain fills and as the fallback when
   * a defs-based fill (pattern / gradient) is in use.
   */
  color: string;
  /**
   * When non-null, the bar's `fill` attribute should reference `url(#<fillId>)`
   * instead of the plain `color` string. Set by the BarChart defs resolution
   * logic for pattern and gradient fills.
   */
  fillId: string | null;
  si: number;
  pi: number;
  dataPoint: BarChartDataPoint;
  seriesName: string;
  normalizedValue?: number | null;
  /** True when this bar was produced from a [low, high] range tuple (A1-1). */
  isFloating?: boolean;
};

export type StackedPoint = {
  x: number;
  y0: number;
  y1: number;
};

// ── Tooltip / Legend ──────────────────────────────────────────

export type TooltipData = {
  title?: string;
  items: Array<{ label: string; value: string; color?: string }>;
};

export type LegendItem = {
  label: string;
  color: string;
};

// ── Sub-component props ───────────────────────────────────────

export type ChartContainerProperties = {
  width?: number;
  height?: number;
  aspectRatio?: number;
  minHeight?: number;
  testId?: string;
  classes?: string;
  children: Snippet;
};

export type AxisProperties = {
  orientation: AxisOrientation;
  scale: LinearScale | BandScale;
  tickCount?: number;
  tickFormat?: (value: number | string) => string;
  showGridlines?: boolean;
  gridlineLength?: number;
  label?: string;
  classes?: string;
};

export type ChartTooltipProperties = {
  data: TooltipData | null;
  mouseX?: number;
  mouseY?: number;
  customSnippet?: Snippet<[TooltipData]>;
  classes?: string;
};

export type LegendProperties = {
  items: LegendItem[];
  position?: 'top' | 'bottom';
  customSnippet?: Snippet<[LegendItem[]]>;
  classes?: string;
};
