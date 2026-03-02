import type { Snippet } from 'svelte';

export type CheckboxProperties = MandatoryCheckboxProperties &
  OptionalCheckboxProperties &
  CheckboxEventProperties;

export type MandatoryCheckboxProperties = {
  text: string;
};

export type OptionalCheckboxProperties = {
  checked?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  testId?: string;
  checkedIcon?: Snippet;
  indeterminateIcon?: Snippet;
  classes?: string;
};

export type CheckboxEventProperties = {
  onclick?: (checked: boolean) => void;
};
