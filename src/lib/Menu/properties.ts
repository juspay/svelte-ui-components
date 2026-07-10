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

/**
 * Corner of the trigger the dropdown anchors to. The four fixed corners map to
 * static CSS anchoring; `'auto'` measures the rendered panel on every open and
 * picks the corner that keeps it inside the viewport — right-anchoring when the
 * panel would overflow the right edge, flipping above the trigger when there is
 * not enough room below but enough above.
 */
export type MenuPlacement = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'auto';

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
  /** Dropdown anchoring relative to the trigger. Defaults to `'bottom-left'`,
   * which preserves the existing behavior (including the `--menu-dropdown-top`
   * / `--menu-dropdown-left` consumer tokens). Fixed corners anchor statically;
   * `'auto'` resolves the best-fitting corner against the viewport on open. */
  placement?: MenuPlacement;
};

export type MenuEventProperties = {
  onselect?: (item: MenuItem) => void;
  onopen?: () => void;
  onclose?: () => void;
};
