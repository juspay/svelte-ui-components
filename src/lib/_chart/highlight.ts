export type ChartHighlightType = 'bar-chart' | 'line-chart' | 'donut-chart';

/**
 * The imperative interface a chart hands back through `onChartReady`, so an
 * external orchestrator (e.g. voice narration sync) can drive point highlighting
 * without knowing the chart's internal rendering. Replaces the legacy pattern of
 * reaching into a charting-library instance stored on the DOM node.
 */
export type ChartHighlightAPI = {
  /** Highlight the data point at this zero-based index; pass `null` to clear. */
  highlight: (index: number | null) => void;
  /** The ordered category labels for this chart, for name-based lookup. */
  getCategories: () => string[];
  /** The chart kind, for consumers maintaining a registry of charts. */
  type: ChartHighlightType;
};
