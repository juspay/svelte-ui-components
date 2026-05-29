import type { Snippet } from 'svelte';

export type ErrorCardProperties = {
  title?: string;
  message?: string;
  icon?: Snippet;
  action?: Snippet;
  variant?: 'card' | 'inline';
  testId?: string;
  classes?: string;
};
