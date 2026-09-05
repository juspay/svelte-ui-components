import type { Snippet } from 'svelte';

export type ChoiceboxProperties = OptionalChoiceboxProperties & ChoiceboxEventProperties;

export type ChoiceboxMode = 'radio' | 'checkbox';

export type OptionalChoiceboxProperties = {
  children?: Snippet;
  selected?: boolean;
  mode?: ChoiceboxMode;
  disabled?: boolean;
  showIndicator?: boolean;
  testId?: string;
  classes?: string;
};

export type ChoiceboxEventProperties = {
  onclick?: (selected: boolean) => void;
  /** @deprecated Use `onclick` instead; both work until 4.0.0. */
  onClick?: (selected: boolean) => void;
};
