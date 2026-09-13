export type SliderProperties = MandatorySliderProperties &
  OptionalSliderProperties &
  SliderEventProperties;

export type MandatorySliderProperties = {
  value: number;
};

export type OptionalSliderProperties = {
  /**
   * Text shown, and announced, when the control is in error. Linked to the
   * control through `aria-describedby`, and sets `aria-invalid` while present.
   */
  errorMessage?: string | null;
  /**
   * Persistent helper text describing the control. Linked through
   * `aria-describedby` too, so it is read before the user trips an error rather
   * than only after.
   */
  infoMessage?: string | null;
  /**
   * Marks the control invalid without supplying a message, for a consumer
   * driving validity from a server or its own rules.
   */
  invalid?: boolean;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  labelFormatter?: (value: number) => string;
  /**
   * Names the range input for assistive tech. A bare slider announces only its value,
   * so a control whose purpose is not carried by adjacent visible text needs this.
   */
  ariaLabel?: string;
  /**
   * Ids of the elements that name the range input (aria-labelledby). Use this
   * instead of `ariaLabel` when the name is already on screen, so the two cannot
   * drift apart. `ariaLabel` wins if both are given, matching how the platform
   * resolves them.
   */
  ariaLabelledby?: string;
  testId?: string;
  classes?: string;
  /** Spoken in place of the raw number, for a value whose meaning the digits do not
   *  carry ("Quiet", "Large"). Falls back to `labelFormatter(value)` when that is
   *  supplied, and is omitted entirely when neither is. An explicit empty string is
   *  honoured rather than treated as absent. */
  ariaValueText?: string;
  /** Submits the current value under this name. Omitted while disabled. */
  name?: string;
  /** `id` of a form elsewhere in the same document. Unavailable through
   *  `<sui-slider>`, whose input sits in a shadow root. */
  form?: string;
};

export type SliderEventProperties = {
  onchange?: (value: number) => void;
  oninput?: (value: number) => void;
};
