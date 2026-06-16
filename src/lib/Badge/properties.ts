export type BadgeMode = 'count' | 'dot';

export type BadgeProperties = MandatoryBadgeProperties &
  OptionalBadgeProperties &
  BadgeEventProperties;

export type MandatoryBadgeProperties = Record<never, never>;

export type OptionalBadgeProperties = {
  image?: string;
  alt?: string;
  value?: string;
  mode?: BadgeMode;
  hidden?: boolean;
  ariaLabel?: string;
  testId?: string;
  classes?: string;
};

export type BadgeEventProperties = Record<never, never>;
