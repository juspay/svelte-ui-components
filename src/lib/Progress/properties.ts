export type ProgressProperties = MandatoryProgressProperties & OptionalProgressProperties;

export type MandatoryProgressProperties = {
  value: number;
};

export type OptionalProgressProperties = {
  max?: number;
  showLabel?: boolean;
  testId?: string;
  classes?: string;
  /**
   * When set to a positive integer N, renders the progress bar as N discrete
   * segments instead of a continuous fill. The first `value` segments are
   * styled with the `--progress-bar-background`; the remaining segments use
   * `--progress-track-background`. Useful for count-based progress like
   * "3 of 12 installments paid". When unset or 0, renders the continuous bar
   * (the original behaviour). Indeterminate animation (negative `value`) is
   * only honoured in continuous mode.
   */
  segments?: number;
};
