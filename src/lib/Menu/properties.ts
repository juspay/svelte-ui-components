import type { Snippet } from 'svelte';

export type MenuItem = {
  label: string;
  value: string;
  icon?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  id?: string;
};

export type MenuProperties = MandatoryMenuProperties & OptionalMenuProperties & MenuEventProperties;

export type MandatoryMenuProperties = {
  items: MenuItem[];
};

export type OptionalMenuProperties = {
  open?: boolean;
  testId?: string;
  trigger?: Snippet;
  classes?: string;
  /** Value of the currently selected item. When set, opening the menu focuses the
   * selected option instead of the first item, the matching item gets the
   * `menu-item-selected` class (stylable via --menu-item-selected-*), and
   * listbox aria-selected reflects the real selection. */
  selectedValue?: string | null;
  role?: 'menu' | 'listbox';
  ariaLabel?: string;
  id?: string;
};

export type MenuEventProperties = {
  onselect?: (item: MenuItem) => void;
  onopen?: () => void;
  onclose?: () => void;
};
