import type { Snippet } from 'svelte';

export type ToastType = 'success' | 'error' | 'info' | 'warn';
export type ToastDirection = 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';

export type ToastProperties = ToastEventProperties & {
  duration?: number;
  leftIcon?: string | null;
  message: string;
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
