export type RadioGroupVariant = 'radio' | 'segmented';

export type RadioGroupDirection = 'vertical' | 'horizontal';

export type RadioGroupItem = {
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
  name: string;
  items: RadioGroupItem[];
};

export type OptionalRadioGroupProperties = {
  selectedValue?: string;
  variant?: RadioGroupVariant;
  direction?: RadioGroupDirection;
  disabled?: boolean;
  testId?: string;
  classes?: string;
};

export type RadioGroupEventProperties = {
  onchange?: (value: string) => void;
};
