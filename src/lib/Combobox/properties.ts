import type { Snippet } from 'svelte';
import type { OptionalInputProperties, InputEventProperties } from '../Input/properties';

export type ComboboxItem = {
  id: string;
  label: string;
  disabled?: boolean;
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
};

export type ComboboxEventProperties = {
  onselect?: (item: ComboboxItem) => void;
  oninput?: (value: string) => void;
  onopen?: () => void;
  onclose?: () => void;
  onkeydown?: (event: KeyboardEvent) => void;
  onfocus?: (event: FocusEvent) => void;
  onblur?: (event: FocusEvent) => void;
};
