import type { Snippet } from 'svelte';

export type BannerProperties = MandatoryBannerProperties &
  OptionalBannerProperties &
  BannerEventProperties;

export type BannerType = 'info' | 'success' | 'warning' | 'error';

export type MandatoryBannerProperties = {
  text: string;
};

export type OptionalBannerProperties = {
  icon?: Snippet;
  title?: Snippet;
  linkText?: string;
  dismissible?: boolean;
  visible?: boolean;
  testId?: string;
  rightContent?: Snippet;
  dismissIcon?: Snippet;
  classes?: string;
  role?: string | null;
  type?: BannerType;
};

export type BannerEventProperties = {
  onclick?: (event: MouseEvent) => void;
  ondismiss?: () => void;
};
