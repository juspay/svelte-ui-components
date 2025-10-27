import type { Snippet } from 'svelte';

export type BannerProperties = {
  icon?: string | null;
  text: string;
  linkText?: string | null;
  rightContent?: Snippet;
  onclick?: (event: MouseEvent) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
