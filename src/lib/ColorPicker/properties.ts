export type ColorPickerProperties = MandatoryColorPickerProperties &
  OptionalColorPickerProperties &
  ColorPickerEventProperties;

export type MandatoryColorPickerProperties = {
  value: string;
};

export type OptionalColorPickerProperties = {
  label?: string;
  disabled?: boolean;
  showValue?: boolean;
  testId?: string;
  classes?: string;
  /**
   * Text shown, and announced, when the chosen colour is in error ("not enough
   * contrast on white"). Referenced by `aria-describedby` on the group holding
   * the swatch and the hex field, and sets `aria-invalid` while present.
   */
  errorMessage?: string | null;
  /**
   * Persistent helper text describing the control. Referenced the same way, so
   * it is read before the user trips an error rather than only after.
   */
  infoMessage?: string | null;
  /**
   * Marks the control invalid without supplying a message, for a consumer
   * driving validity from a server or its own rules.
   */
  invalid?: boolean;
};

export type ColorPickerEventProperties = {
  onchange?: (value: string) => void;
  oninput?: (value: string) => void;
};
