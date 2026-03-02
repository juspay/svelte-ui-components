import type { Snippet } from 'svelte';

export type BannerProperties = MandatoryBannerProperties &
  OptionalBannerProperties &
  BannerEventProperties;

export type MandatoryBannerProperties = {
  text: string;
};

export type OptionalBannerProperties = {
  icon?: Snippet;
  linkText?: string;
  dismissible?: boolean;
  visible?: boolean;
  testId?: string;
  rightContent?: Snippet;
  dismissIcon?: Snippet;
  classes?: string;
};

export type BannerEventProperties = {
  onclick?: (event: MouseEvent) => void;
  ondismiss?: () => void;
};
