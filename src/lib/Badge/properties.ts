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
  /**
   * Rolls `value` through AnimatedNumber instead of swapping it in place.
   * `value` stays the same string prop -- AnimatedNumber diffs it by
   * character position, so '99+' rolls the two digits and leaves the '+'
   * alone, with no separate numeric prop required here. No effect in
   * `mode="dot"`, which never renders `value` at all.
   * @default false
   */
  animateValue?: boolean;
};

export type BadgeEventProperties = Record<never, never>;
