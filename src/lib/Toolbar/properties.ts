import type { Snippet } from 'svelte';

export type ToolbarProperties = {
  showBackButton?: boolean;
  text?: string | null;
  backIcon?: string | null;
  leftContent?: Snippet;
  centerContent?: Snippet;
  rightContent?: Snippet;
  additionalContent?: Snippet;
  onbackClick?: () => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
