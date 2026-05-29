import type { Snippet } from 'svelte';

export type DescriptiveTileProperties = {
  image?: string;
  alt?: string;
  label?: string;
  selected?: boolean;
  disabled?: boolean;
  testId?: string;
  classes?: string;
  bottom?: Snippet;
  onclick?: (event: MouseEvent) => void;
};
