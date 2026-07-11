export type DeltaIndicatorProperties = MandatoryDeltaIndicatorProperties &
  OptionalDeltaIndicatorProperties;

export type DeltaDirection = 'up' | 'down' | 'neutral';

export type MandatoryDeltaIndicatorProperties = {
  /** The change amount; its sign selects the up / down / neutral direction. */
  value: number;
};

export type OptionalDeltaIndicatorProperties = {
  /**
   * Formats the displayed text from the raw value. Default renders the rounded
   * absolute value followed by a percent sign (e.g. `12%`).
   */
  format?: (value: number) => string;
  /**
   * Swap the up/down colors for lower-is-better metrics (e.g. bounce rate, RTO),
   * where a decrease is "good" (positive tone) and an increase is "bad".
   */
  invertColors?: boolean;
  /** Hide the directional arrow, showing only the formatted text. */
  hideArrow?: boolean;
  /** Absolute values at or below this are treated as `neutral` (default 0). */
  neutralThreshold?: number;
  /** Test selector applied as the `data-pw` attribute. */
  testId?: string | null;
  /** Additional CSS classes for theming. */
  classes?: string;
};
