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
  onChange?: (value: string) => void;
  oninput?: (value: string) => void;
  onInput?: (value: string) => void;
};
