import type { Snippet } from 'svelte';

export type ListItemProperties = {
  leftImageUrl?: string | null;
  leftImageFallbackUrl?: string | null;
  rightImageUrl?: string | null;
  label?: string | null;
  useAccordion?: boolean;
  rightContentText?: string | null;
  testId?: string;
  topSectionTestId?: string;
  rightImageTestId?: string;
  leftImageTestId?: string;
  centerTextTestId?: string;
  showLoader?: boolean;
  showRightContentLoader?: boolean;
  expand?: boolean;
  preventFocus?: boolean;
  leftContent?: Snippet;
  centerContent?: Snippet;
  rightContent?: Snippet;
  bottomContent?: Snippet;
  onleftImageClick?: (event: MouseEvent) => void;
  onrightImageClick?: (event: MouseEvent) => void;
  oncenterTextClick?: (event: MouseEvent) => void;
  onitemClick?: (event: MouseEvent) => void;
  ontopSectionClick?: (event: MouseEvent) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
