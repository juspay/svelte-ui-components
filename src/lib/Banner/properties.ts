import type { Snippet } from 'svelte';

export type BannerTone = 'info' | 'success' | 'warning' | 'error';
export type BannerSize = 'sm' | 'md';

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
  tone?: BannerTone | null;
  title?: string | null;
  size?: BannerSize | null;
  flush?: boolean;
  role?: string | null;
};

export type BannerEventProperties = {
  onclick?: (event: MouseEvent) => void;
  ondismiss?: () => void;
};
