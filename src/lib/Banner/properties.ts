import type { Snippet } from 'svelte';

export type BannerProperties = MandatoryBannerProperties &
  OptionalBannerProperties &
  BannerEventProperties;

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
  /**
   * Duration (ms) of the show/hide `slide` transition. A CSS custom property
   * cannot reach a Svelte transition directive's parameters, so this prop is
   * the token-contract equivalent for Banner's motion — same shape as
   * Toast's `inAnimationDuration`/`outAnimationDuration`. Defaults to the
   * library's existing 300ms so omitting it renders identically to before.
   */
  transitionDuration?: number | null;
};

export type BannerEventProperties = {
  onclick?: (event: MouseEvent) => void;
  ondismiss?: () => void;
};
