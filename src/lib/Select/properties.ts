import type { Snippet } from 'svelte';

export type SelectProperties = MandatorySelectProperties &
  OptionalSelectProperties &
  SelectEventProperties;

export type SelectItem = {
  id: string;
  label: string;
  /** Optional per-option test id, emitted as `data-pw` on the option element. */
  testId?: string;
};

export type MandatorySelectProperties = {
  items: SelectItem[] | string[];
};

export type OptionalSelectProperties = {
  value?: string[];
  multiple?: boolean;
  searchable?: boolean;
  placeholder?: string;
  disabled?: boolean;
  bottomContent?: Snippet;
  optionIndicator?: Snippet<[{ checked: boolean }]>;
  testId?: string;
  /** Fallback per-option test id prefix. Each option emits `data-pw="{itemTestId}-{id}"` when its own `item.testId` is not set. */
  itemTestId?: string;
  classes?: string;
  /** Bindable. Controls whether the dropdown is open; the component writes back on open/close so parents can `bind:open` to observe or drive it. Unbound, the component manages its own state. */
  open?: boolean;
};

export type SelectEventProperties = {
  onchange?: (value: string[]) => void;
};
