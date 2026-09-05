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
  onbackclick?: () => void;
  /** @deprecated Use `onbackclick` instead; both work until 4.0.0. */
  onbackClick?: () => void;
  /** @deprecated Use `onbackclick` instead; both work until 4.0.0. */
  onBackClick?: () => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
