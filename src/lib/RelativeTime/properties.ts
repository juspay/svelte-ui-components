export type RelativeTimeFormat = 'long' | 'short' | 'narrow';

export type MandatoryRelativeTimeProperties = {
  date: Date | string | number;
};

export type OptionalRelativeTimeProperties = {
  locale?: string;
  format?: RelativeTimeFormat;
  updateInterval?: number;
  tooltip?: boolean;
  testId?: string;
  classes?: string;
};

export type RelativeTimeProperties = MandatoryRelativeTimeProperties &
  OptionalRelativeTimeProperties;
