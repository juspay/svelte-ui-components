export type RadioProperties = MandatoryRadioProperties &
  OptionalRadioProperties &
  RadioEventProperties;

export type MandatoryRadioProperties = {
  name: string;
  value: string;
};

export type OptionalRadioProperties = {
  selectedValue?: string;
  text?: string;
  subtitle?: string;
  disabled?: boolean;
  tabIndex?: number;
  testId?: string;
  classes?: string;
  inputRef?: HTMLInputElement | null;
};

export type RadioEventProperties = {
  onchange?: (value: string) => void;
};
