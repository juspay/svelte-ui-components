import type { Snippet } from 'svelte';

export type ThinkingIndicatorVariant = 'default' | 'bare';

export type ThinkingIndicatorProperties = OptionalThinkingIndicatorProperties &
  MandatoryThinkingIndicatorProperties;

export type MandatoryThinkingIndicatorProperties = {
  label: string;
};

export type OptionalThinkingIndicatorProperties = {
  /** Reasoning/steps text. Providing one makes the indicator an expandable disclosure. */
  detail?: string;
  /** Bindable disclosure state — meaningful only when `detail` is set. */
  expanded?: boolean;
  /**
   * `bare` renders only the shimmering label — for chat bubbles where the surrounding
   * UI already supplies the avatar and layout. It never becomes expandable.
   */
  variant?: ThinkingIndicatorVariant;
  onToggle?: () => void;
  /** Leading indicator. Falls back to the built-in spinner. */
  avatar?: Snippet;
  /** Disclosure chevron. Falls back to a built-in chevron that rotates on expand. */
  toggleIcon?: Snippet;
  testId?: string;
  /** Override the toggle button's test id (default: `<testId>-toggle`). */
  toggleTestId?: string;
  /** Override the detail text's test id (default: `<testId>-detail`). */
  detailTestId?: string;
  /** Test id for the status label itself (none by default). */
  labelTestId?: string;
  classes?: string;
};
