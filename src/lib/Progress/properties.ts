export type ProgressProperties = MandatoryProgressProperties & OptionalProgressProperties;

export type MandatoryProgressProperties = {
  value: number;
};

export type OptionalProgressProperties = {
  max?: number;
  showLabel?: boolean;
  testId?: string;
  classes?: string;
};
