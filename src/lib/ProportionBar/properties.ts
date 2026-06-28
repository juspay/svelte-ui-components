export type ProportionBarSegment = {
  /** Display label for this segment. */
  label: string;
  /** Absolute numeric value used to compute proportion. */
  value: number;
  /** Override fill color for this segment. Falls back to the default palette. */
  color?: string;
};

export type ProportionBarProperties = MandatoryProportionBarProperties &
  OptionalProportionBarProperties;

export type MandatoryProportionBarProperties = {
  /** Array of segments whose values define the proportions shown in the bar. */
  segments: ProportionBarSegment[];
};

export type OptionalProportionBarProperties = {
  /**
   * Whether to render a legend list below the bar. Each legend item shows a
   * colour swatch, the segment label, and the formatted value. Defaults to `true`.
   */
  showLegend?: boolean;
  /**
   * Custom formatter for the legend value column. Receives the absolute value and
   * the computed percentage. Defaults to `"N (X%)"`.
   */
  valueFormat?: (value: number, percent: number) => string;
  /**
   * Height of the bar track (e.g. `"8px"`, `"12px"`). Also settable via the
   * `--proportion-bar-track-height` CSS variable.
   */
  trackHeight?: string;
  /** Test selector applied as the `data-pw` attribute on the root element. */
  testId?: string;
  /** Extra CSS class names appended to the root element. */
  classes?: string;
};
