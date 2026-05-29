import type { Snippet } from 'svelte';

export type InlineAlertTone = 'info' | 'success' | 'warning' | 'error';

export type InlineAlertProperties = {
  text?: string;
  tone?: InlineAlertTone;
  icon?: Snippet;
  children?: Snippet;
  dismissible?: boolean;
  visible?: boolean;
  testId?: string;
  classes?: string;
  ondismiss?: () => void;
};
