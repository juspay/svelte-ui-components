import type { Snippet } from 'svelte';

export type BrowserVariant = 'light' | 'dark';

export type BrowserProperties = OptionalBrowserProperties;

export type OptionalBrowserProperties = {
  url?: string;
  title?: string;
  showAddressBar?: boolean;
  showTabBar?: boolean;
  variant?: BrowserVariant;
  shadow?: boolean;
  rounded?: boolean;
  testId?: string;
  children?: Snippet;
  lockIcon?: Snippet;
  classes?: string;
};
