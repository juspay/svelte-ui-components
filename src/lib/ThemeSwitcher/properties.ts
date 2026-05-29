import type { Snippet } from 'svelte';

export type ThemeSwitcherOption = {
  value: string;
  label?: string;
  icon?: Snippet;
};

export type ThemeSwitcherMode = 'toggle' | 'segment';

export type ThemeSwitcherProperties = OptionalThemeSwitcherProperties &
  ThemeSwitcherEventProperties;

export type OptionalThemeSwitcherProperties = {
  options?: ThemeSwitcherOption[];
  value?: string;
  mode?: ThemeSwitcherMode;
  storageKey?: string;
  testId?: string;
  classes?: string;
  /** When true, renders a compact icon-button that expands to the full theme options on click/focus. */
  collapsible?: boolean;
  /** When collapsible and expanded, auto-collapse after this many milliseconds (default 3000). */
  autoHideDelay?: number;
};

export type ThemeSwitcherEventProperties = {
  onchange?: (value: string, resolvedValue: string) => void;
};
