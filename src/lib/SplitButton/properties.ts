import type { Snippet } from 'svelte';
import type { MenuItem } from '../Menu/properties';

export type SplitButtonProperties = MandatorySplitButtonProperties &
  OptionalSplitButtonProperties &
  SplitButtonEventProperties;

export type MandatorySplitButtonProperties = {
  text: string;
  items: MenuItem[];
};

export type OptionalSplitButtonProperties = {
  disabled?: boolean;
  testId?: string;
  dropdownIcon?: Snippet;
  classes?: string;
};

export type SplitButtonEventProperties = {
  onclick?: (event: MouseEvent) => void;
  onselect?: (item: MenuItem) => void;
  /** @deprecated Use `onselect` instead; both work until 4.0.0. */
  onSelect?: (item: MenuItem) => void;
};
