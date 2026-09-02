import type { Snippet } from 'svelte';

export type ToolbarProperties = ToolbarEventProperties & {
  showBackButton?: boolean;
  text?: string | null;
  backIcon?: string | null;
  backLabel?: string;
  leftContent?: Snippet;
  centerContent?: Snippet;
  rightContent?: Snippet;
  additionalContent?: Snippet;
  classes?: string;
  testId?: string;
  headingTestId?: string;
};

export type ToolbarEventProperties = {
  onbackClick?: () => void;
  onBackClick?: () => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
