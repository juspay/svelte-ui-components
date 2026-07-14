import type { Snippet } from 'svelte';

export type TabItem = {
  key: string;
  label: string;
  testId?: string;
  subtitle?: string;
  /**
   * Optional image src (URL or data URI) rendered before the label in the default
   * tab layout. Size is controlled by the `--tabs-item-icon-size` CSS variable
   * (default 16px). Also forwarded to the `tab` snippet for custom layouts.
   */
  icon?: string;
  /**
   * Optional status dot rendered after the label — for nav/menu tabs that flag
   * per-item state. `'none'` (default) renders nothing. Colours are themeable via
   * `--tabs-item-status-{pending,error,success}-color`.
   */
  status?: 'none' | 'pending' | 'error' | 'success';
};

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
  tab?: Snippet<
    [
      {
        label: string;
        index: number;
        active: boolean;
        subtitle?: string;
        icon?: string;
        status?: TabItem['status'];
      }
    ]
  >;
  classes?: string;
};

export type TabsEventProperties = {
  onchange?: (index: number, label: string) => void;
  onkeychange?: (key: string) => void;
};
