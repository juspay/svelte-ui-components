export type GaugeProperties = MandatoryGaugeProperties & OptionalGaugeProperties;

export type MandatoryGaugeProperties = {
  value: number;
};

export type OptionalGaugeProperties = {
  showLabel?: boolean;
  testId?: string;
  classes?: string;
};
