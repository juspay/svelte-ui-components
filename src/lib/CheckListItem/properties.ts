import type { Snippet } from 'svelte';

export type CheckListItemProperties = MandatoryCheckListItemProperties &
  OptionalCheckListItemProperties &
  CheckListItemEventProperties;

export type MandatoryCheckListItemProperties = {
  text: string;
};

export type OptionalCheckListItemProperties = {
  checked?: boolean;
  disabled?: boolean;
  checkboxLabel?: Snippet;
  testId?: string;
  classes?: string;
};

export type CheckListItemEventProperties = {
  onclick?: (checked: boolean) => void;
};
