import type { Snippet } from 'svelte';

export type ToolbarProperties = ToolbarEventProperties & {
  showBackButton?: boolean;
  text?: string | null;
  backIcon?: string | null;
  leftContent?: Snippet;
  centerContent?: Snippet;
  rightContent?: Snippet;
  additionalContent?: Snippet;
};

export type ToolbarEventProperties = {
  onbackClick?: () => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
