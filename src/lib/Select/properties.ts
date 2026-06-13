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
  multiple?: boolean;
  searchable?: boolean;
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
  classes?: string;
  /**
   * Optional footer snippet rendered inside the dropdown panel, below the
   * options list. Use it to place action buttons ("Add zone", "Manage rates",
   * etc.). Styled via --select-bottom-content-* CSS vars.
   */
  bottomContent?: Snippet;
  /**
   * Controls whether the dropdown is open. Bindable — the component writes
   * back to this prop on open/close so parents can use bind:open to observe
   * or drive the open state (accordion-style panels, external triggers).
   * Defaults to false (closed), unchanged behaviour when not bound.
   */
  open?: boolean;
};

export type SelectEventProperties = {
  onchange?: (value: string[]) => void;
};
