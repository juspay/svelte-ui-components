import type { Snippet } from 'svelte';

export type SelectProperties = MandatorySelectProperties &
  OptionalSelectProperties &
  SelectEventProperties;

export type SelectItem = {
  id: string;
  label: string;
};

export type MandatorySelectProperties = {
  items: SelectItem[];
};

export type OptionalSelectProperties = {
  value?: string[];
  /** Bindable. When manageOpenState is false the parent fully controls open/close. */
  open?: boolean;
  /**
   * When true (default) the component manages its own open/close state.
   * Set to false to drive open state entirely via the `open` prop.
   */
  manageOpenState?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
  classes?: string;
  /**
   * When true (default) a "Select All / Deselect All" row is shown at the
   * top of the dropdown in multiple mode. Set to false to suppress it.
   */
  allowSelectAll?: boolean;
  /**
   * When true in multiple mode the dropdown stays open and onchange only
   * fires when the user clicks the Apply button rendered in the footer.
   * Defaults to false (immediate onchange on every toggle).
   */
  showSelectButton?: boolean;
  /**
   * Optional Snippet rendered pinned at the bottom of the open dropdown
   * panel, below the item list. Useful for action buttons or custom footers.
   */
  bottomContent?: Snippet;
};

export type SelectEventProperties = {
  onchange?: (value: string[]) => void;
  /** Fired when the dropdown opens. */
  onopen?: () => void;
  /** Fired when the dropdown closes. */
  onclose?: () => void;
};
