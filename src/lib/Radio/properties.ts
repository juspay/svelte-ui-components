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
  disabled?: boolean;
  testId?: string;
  classes?: string;
};

export type RadioEventProperties = {
  onchange?: (value: string) => void;
};
