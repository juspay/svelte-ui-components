export type ColorPickerProperties = MandatoryColorPickerProperties &
  OptionalColorPickerProperties &
  ColorPickerEventProperties;

export type MandatoryColorPickerProperties = {
  value: string;
};

export type OptionalColorPickerProperties = {
  label?: string;
  /**
   * Names the picker when it has no visible `label` -- a swatch-only picker, say.
   * Every control inside is named from `label` if there is one, else this ("Brand
   * color hex value", "Pick a color: Brand color"), so several pickers on a page
   * can be told apart. Without either, the controls keep their purpose names
   * ("Hex value", "Red") and the trigger stays "Pick a color".
   */
  ariaLabel?: string;
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
