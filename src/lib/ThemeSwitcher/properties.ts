import type { Snippet } from 'svelte';

export type ThemeSwitcherOption = {
  value: string;
  label?: string;
  icon?: Snippet;
};

export type ThemeSwitcherMode = 'toggle' | 'segment' | 'link';

export type ThemeSwitcherProperties = OptionalThemeSwitcherProperties &
  ThemeSwitcherEventProperties;

export type OptionalThemeSwitcherProperties = {
  options?: ThemeSwitcherOption[];
  value?: string;
  mode?: ThemeSwitcherMode;
  storageKey?: string;
  testId?: string;
  classes?: string;
  showLabel?: boolean;
};

export type ThemeSwitcherEventProperties = {
  onchange?: (value: string, resolvedValue: string) => void;
};
