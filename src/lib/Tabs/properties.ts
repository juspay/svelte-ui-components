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
   * `--tabs-item-status-{default,pending,error,success}-color`. `'default'` is a
   * neutral highlight dot (blue by default) for "has activity / configured" state.
   */
  status?: 'none' | 'default' | 'pending' | 'error' | 'success';
  /**
   * Optional section header rendered ABOVE this item — for grouped vertical nav
   * menus (e.g. a "SETTINGS" / "BODY" divider label). Renders regardless of the
   * `tab` snippet, since it sits outside the item row.
   */
  sectionLabel?: string;
};

export type TabsProperties = MandatoryTabsProperties & OptionalTabsProperties & TabsEventProperties;

export type MandatoryTabsProperties = {
  items: string[] | TabItem[];
};

export type OptionalTabsProperties = {
  activeIndex?: number;
  activeKey?: string;
  disabled?: boolean;
  /**
   * Layout axis. `'horizontal'` (default) is the classic tab bar — items in a row,
   * indicator on the bottom edge. `'vertical'` stacks items in a column (a nav/menu
   * rail) — indicator on the leading edge, scroll arrows point up/down.
   */
  orientation?: 'horizontal' | 'vertical';
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
  /** @deprecated Use `onchange` instead; both work until 4.0.0. */
  onChange?: (index: number, label: string) => void;
  onkeychange?: (key: string) => void;
  /** @deprecated Use `onkeychange` instead; both work until 4.0.0. */
  onKeyChange?: (key: string) => void;
};
