import type { Snippet } from 'svelte';

export type TabsProperties = MandatoryTabsProperties & OptionalTabsProperties & TabsEventProperties;

export type MandatoryTabsProperties = {
  items: string[];
};

export type OptionalTabsProperties = {
  activeIndex?: number;
  disabled?: boolean;
  testId?: string;
  scrollLeftIcon?: Snippet;
  scrollRightIcon?: Snippet;
  tab?: Snippet<[{ label: string; index: number; active: boolean }]>;
  classes?: string;
};

export type TabsEventProperties = {
  onchange?: (index: number, label: string) => void;
};
