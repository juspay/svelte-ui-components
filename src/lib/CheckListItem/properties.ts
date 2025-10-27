import type { Snippet } from 'svelte';

export type CheckListItemProperties = {
  text: string;
  checked?: boolean;
  checkboxLabel?: Snippet;
  onclick?: (checked: boolean) => void;
};
