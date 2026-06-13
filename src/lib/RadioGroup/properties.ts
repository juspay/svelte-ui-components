export type RadioGroupOption = {
  label: string;
  value: string;
  subtitle?: string;
  disabled?: boolean;
  testId?: string;
};

export type RadioGroupProperties = MandatoryRadioGroupProperties &
  OptionalRadioGroupProperties &
  RadioGroupEventProperties;

export type MandatoryRadioGroupProperties = {
  options: RadioGroupOption[];
  value: string;
  name: string;
};

export type OptionalRadioGroupProperties = {
  ariaLabel?: string;
  ariaLabelledBy?: string;
  disabled?: boolean;
  testId?: string;
  classes?: string;
};

export type RadioGroupEventProperties = {
  onchange?: (value: string) => void;
};
