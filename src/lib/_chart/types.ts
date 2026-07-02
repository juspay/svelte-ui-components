import type { Snippet } from 'svelte';
import type { BarChartDataPoint } from '$lib/BarChart/properties';

// ── Shared constants ──────────────────────────────────────────

/**
 * Corner radius (px) shared by every chart shape (bar/column rects, funnel
 * stage bars, sankey nodes). Mirrors Lighthouse's `--radius` design token
 * (0.25rem = 4px at the 16px root). SVG `rx`/`ry` attributes and the
 * `roundedRectPath()` curve builder in `_chart/paths.ts` consume plain JS
 * numbers, so this constant is the chart-layer equivalent of `var(--radius)`
 * for surfaces CSS cannot reach. Consumers who need runtime sync to a
 * *changed* `--radius` should pass the corresponding radius prop explicitly.
 */
export const DEFAULT_CHART_CORNER_RADIUS = 4;

/**
 * Default upper bound (px) on a chart's rendered height. Chart height is derived
 * from width via `aspectRatio`, so on a wide surface (e.g. a full-width dashboard
 * panel) a 16/9 chart can balloon past 700px. This default keeps charts from ever
 * rendering absurdly tall; a call site that genuinely needs a taller chart passes
 * an explicit `maxHeight` to override it.
 */
export const DEFAULT_CHART_MAX_HEIGHT = 420;

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
  maxHeight?: number;
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
