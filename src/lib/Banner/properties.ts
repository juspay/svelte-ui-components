import type { Snippet } from 'svelte';

export type BannerProperties = MandatoryBannerProperties &
  OptionalBannerProperties &
  BannerEventProperties;

// `text` is optional now that a banner can say its message as `children`. It stays in
// this type, as in 4.33.3, so values and imports typed with it keep compiling.
export type MandatoryBannerProperties = {
  /** The message as plain text (with optional `linkText`). Defaults to ''. */
  text?: string;
};

export type OptionalBannerProperties = {
  /**
   * The message as markup -- a sentence with a link, or a sentence and a
   * Retry button -- rendered as the banner body in place of `text` and
   * `linkText`. `title` still renders above it.
   */
  children?: Snippet;
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
