import type { Snippet } from 'svelte';

export type TabItem = {
  key: string;
  label: string;
  testId?: string;
  subtitle?: string;
};

export type TabVariant = 'underline' | 'segmented';

export type TabsProperties = MandatoryTabsProperties & OptionalTabsProperties & TabsEventProperties;

export type MandatoryTabsProperties = {
  items: string[] | TabItem[];
};

export type OptionalTabsProperties = {
  activeIndex?: number;
  activeKey?: string;
  disabled?: boolean;
  testId?: string;
  scrollLeftIcon?: Snippet;
  scrollRightIcon?: Snippet;
  tab?: Snippet<[{ label: string; index: number; active: boolean; subtitle?: string }]>;
  classes?: string;
  /** Visual style of the tab strip.
   * - `"underline"` (default) — bottom-border indicator per active tab.
   * - `"segmented"` — pill group with a track background; active tab rendered as an elevated chip.
   */
  variant?: TabVariant;
};

export type TabsEventProperties = {
  onchange?: (index: number, label: string) => void;
  onkeychange?: (key: string) => void;
};
