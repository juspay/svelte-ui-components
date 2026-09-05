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
};

export type ColorPickerEventProperties = {
  onchange?: (value: string) => void;
  /** @deprecated Use `onchange` instead; both work until 4.0.0. */
  onChange?: (value: string) => void;
  oninput?: (value: string) => void;
  /** @deprecated Use `oninput` instead; both work until 4.0.0. */
  onInput?: (value: string) => void;
};
