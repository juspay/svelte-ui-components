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
  classes?: string;
};

export type TabsEventProperties = {
  onchange?: (index: number, label: string) => void;
};
