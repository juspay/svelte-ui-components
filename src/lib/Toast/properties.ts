import type { Snippet } from 'svelte';

export type ToastType = 'success' | 'error' | 'info' | 'warn';
export type ToastDirection = 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';

export type MandatoryToastProperties = {
  message: string;
};

export type OptionalToastProperties = {
  duration?: number;
  leftIcon?: string | null;
  subtext?: string | null;
  rightIcon?: string | null;
  type?: ToastType | null;
  direction?: ToastDirection;
  overlapPage?: boolean;
  inAnimationOffset?: number | null;
  inAnimationDuration?: number | null;
  outAnimationOffset?: number | null;
  outAnimationDuration?: number | null;
  testId?: string | null;
  messageTestId?: string;
  subTextTestId?: string;
  closeIconTestId?: string;
  bottomContent?: Snippet;
  classes?: string;
};

export type ToastEventProperties = {
  onToastHide?: () => void;
};

export type ToastProperties = MandatoryToastProperties &
  OptionalToastProperties &
  ToastEventProperties;
