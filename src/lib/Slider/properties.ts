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
  testId?: string;
  classes?: string;
};

export type SliderEventProperties = {
  onchange?: (value: number) => void;
  oninput?: (value: number) => void;
};
