export type SliderProperties = MandatorySliderProperties &
  OptionalSliderProperties &
  SliderEventProperties;

export type MandatorySliderProperties = {
  value: number;
};

export type OptionalSliderProperties = {
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
};

export type SliderEventProperties = {
  onchange?: (value: number) => void;
  oninput?: (value: number) => void;
};
