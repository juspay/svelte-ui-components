export type ProgressProperties = MandatoryProgressProperties & OptionalProgressProperties;

export type MandatoryProgressProperties = {
  value: number;
};

export type OptionalProgressProperties = {
  /**
   * The maximum value representing 100% completion. Must be a finite,
   * positive number for the percentage to be meaningful. A zero, negative,
   * or non-finite `max` (and likewise a non-finite `value`) is treated as an
   * invalid range: the bar renders at 0% rather than propagating `NaN` into
   * `aria-valuenow` and the percentage fallback text below.
   */
  max?: number;
  showLabel?: boolean;
  /**
   * Accessible label for the progress element (`role="progressbar"`). Falls
   * back to the computed percentage text (e.g. `"75%"`) when determinate, or
   * `"Loading"` when indeterminate, so assistive technology always announces
   * a name by default. For an invalid `value`/`max` range (see `max`), the
   * fallback reads `"0%"`.
   */
  ariaLabel?: string;
  testId?: string;
  classes?: string;
};
