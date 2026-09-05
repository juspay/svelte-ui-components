import type { Snippet } from 'svelte';

// ── Data shape ────────────────────────────────────────────────

export type FunnelStage = {
  /** Numeric value for this stage. Used to compute bar heights and percentages. */
  value: number;
  /** Human-readable label displayed above the stage bar. */
  category: string;
};

// ── Component property types ──────────────────────────────────

export type FunnelChartProperties = MandatoryFunnelChartProperties &
  OptionalFunnelChartProperties &
  FunnelChartEventProperties;

export type MandatoryFunnelChartProperties = {
  /** Ordered list of funnel stages. The first stage is the widest; each subsequent stage narrows proportionally. */
  data: FunnelStage[];
};

export type OptionalFunnelChartProperties = {
  /**
   * Fill color for each stage bar. Index-matched to `data`.
   * Cycles via the shared chart palette for any stages without an explicit entry.
   */
  stageColors?: string[];
  /**
   * Fill color for the trapezoidal connector polygons drawn between consecutive stages.
   * Defaults to a light-teal shared palette neutral.
   */
  connectorColor?: string;
  /**
   * Corner radius on each stage bar in pixels. Defaults to
   * `DEFAULT_CHART_CORNER_RADIUS` (4), mirroring the design system's base
   * `--radius` token. SVG `rx`/`ry` cannot read CSS `var()`, so pass this
   * prop explicitly to track a changed `--radius` at runtime.
   */
  radius?: number;
  /**
   * Horizontal width (in SVG user units relative to total inner width) of each
   * trapezoidal slope connector. Larger values produce steeper visual drops between stages.
   * Default is `10`.
   */
  slopeWidth?: number;
  /**
   * Extra vertical pixels added symmetrically to the hovered stage bar (half on each edge).
   * Set to `0` to disable hover expansion. Default is `10`.
   */
  onHoverExpand?: number;
  /**
   * When `true`, renders the value and percentage label centred inside each stage bar.
   * Default is `true`.
   */
  showValueLabels?: boolean;
  /**
   * Custom formatter for the value portion of the in-bar label.
   * Receives the stage value and the maximum value across all stages.
   * The default renders `"<value> | <pct>%"`.
   */
  valueFormat?: (value: number, max: number) => string;
  /**
   * Width-to-height ratio for the chart area.
   * Passed directly to `ChartContainer`. Default is `16 / 9`.
   */
  aspectRatio?: number;
  /**
   * Upper bound (px) on the rendered chart height, so the aspect-ratio-derived height
   * can't balloon on wide surfaces. Defaults to `DEFAULT_CHART_MAX_HEIGHT` (420), the
   * same cap every other chart in this library applies.
   */
  maxHeight?: number;
  /** Lower bound (px) on the rendered chart height (defaults to `0`). */
  minHeight?: number;
  /** Render the tooltip into document.body (position:fixed) so scroll/overflow ancestors never clip it. */
  tooltipPortal?: boolean;
  /** Value for the `data-pw` attribute on the chart root element. */
  testId?: string;
  /** CSS class string applied to the chart root element. Useful for CSS-variable theming. */
  classes?: string;
  /** Content rendered when `data` is empty or all values are zero. */
  empty?: Snippet;
};

export type FunnelChartEventProperties = {
  /** Fires when the user clicks a stage bar. Receives the stage index and its data. */
  onstageclick?: (event: { index: number; stage: FunnelStage }) => void;
  /** @deprecated Use `onstageclick` instead; both work until 4.0.0. */
  onStageClick?: (event: { index: number; stage: FunnelStage }) => void;
  /** Fires when the user hovers over or leaves a stage bar. `null` on leave. */
  onstagehover?: (event: { index: number; stage: FunnelStage } | null) => void;
  /** @deprecated Use `onstagehover` instead; both work until 4.0.0. */
  onStageHover?: (event: { index: number; stage: FunnelStage } | null) => void;
};
