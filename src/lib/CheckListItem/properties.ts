import type { Snippet } from 'svelte';

export type CheckListItemProperties = OptionalCheckListItemProperties &
  CheckListItemEventProperties &
  MandatoryCheckListItemProperties;

export type MandatoryCheckListItemProperties = {
  text: string;
};
export type OptionalCheckListItemProperties = {
  checked?: boolean;
  checkboxLabel?: Snippet;
};

export type CheckListItemEventProperties = {
  onclick?: (checked: boolean) => void;
};
