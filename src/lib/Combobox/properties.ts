import type { Snippet } from 'svelte';
import type { OptionalInputProperties, InputEventProperties } from '../Input/properties';

export type ComboboxItem = {
  id: string;
  label: string;
  disabled?: boolean;
};

/** A persistent custom action row rendered at the foot of the dropdown. */
export type ComboboxAction = {
  label: string;
  onClick: () => void;
  /** Keep the dropdown open after the action runs. Defaults to `false`. */
  keepOpen?: boolean;
};

export type ComboboxProperties = MandatoryComboboxProperties &
  OptionalComboboxProperties &
  ComboboxEventProperties;

export type MandatoryComboboxProperties = {
  items: ComboboxItem[];
};

export type OptionalComboboxProperties = {
  value?: string;
  inputValue?: string;
  open?: boolean;
  highlightedIndex?: number;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  testId?: string;
  classes?: string;
  noResultsText?: string;
  ariaLabel?: string;
  filterFn?: (item: ComboboxItem, query: string) => boolean;
  inputProperties?: OptionalInputProperties;
  inputEventProperties?: InputEventProperties;
  itemSnippet?: Snippet<[ComboboxItem, boolean]>;
  emptySnippet?: Snippet;
  inputPrefix?: Snippet;
  inputSuffix?: Snippet;
  dropdownHeader?: Snippet;
  dropdownFooter?: Snippet;

  // ── Multi-select (pill typeahead) ─────────────────────────────────────────
  /** Enable multi-select: picked options become removable pills inside the control. */
  multiple?: boolean;
  /** Bindable array of selected ids (multi-select mode). */
  selected?: string[];
  /** Cap the number of selections (multi-select mode). */
  maxSelected?: number;
  /**
   * Message shown in the dropdown once `maxSelected` is reached (option/create rows are hidden).
   * Defaults to "You can select up to {maxSelected}.".
   */
  maxSelectedText?: string;
  /** Custom pill renderer; receives `(value, remove, disabled)`. */
  pillSnippet?: Snippet<[string, () => void, boolean]>;

  // ── Create + custom action rows ───────────────────────────────────────────
  /** Show a "Create …" row when the query has no exact match. Default `false`. */
  allowCreate?: boolean;
  /** Build the create-row label from the current query. */
  createLabel?: (query: string) => string;
  /** A persistent custom action row shown at the foot of the dropdown. */
  action?: ComboboxAction;
  /** Custom leading icon for the persistent action row. */
  actionIcon?: Snippet;
};

export type ComboboxEventProperties = {
  onselect?: (item: ComboboxItem) => void;
  onSelect?: (item: ComboboxItem) => void;
  oninput?: (value: string) => void;
  onInput?: (value: string) => void;
  onopen?: () => void;
  onOpen?: () => void;
  onclose?: () => void;
  onClose?: () => void;
  onkeydown?: (event: KeyboardEvent) => void;
  onfocus?: (event: FocusEvent) => void;
  onblur?: (event: FocusEvent) => void;
  /** Multi-select: fires whenever the selection changes (add, remove, or create). */
  onchange?: (selected: string[]) => void;
  onChange?: (selected: string[]) => void;
  /** Multi-select: fires when a value is added. */
  onadd?: (value: string) => void;
  onAdd?: (value: string) => void;
  /** Multi-select: fires when a value is removed. */
  onremove?: (value: string) => void;
  onRemove?: (value: string) => void;
  /** Fires when the create row is chosen, with the trimmed query. */
  oncreate?: (value: string) => void;
  onCreate?: (value: string) => void;
};
