import type { Snippet } from 'svelte';

export type ListItemProperties = ListItemEventProperties & {
  leftImageUrl?: string | null;
  leftImageFallbackUrl?: string | null;
  rightImageUrl?: string | null;
  /** Rewrites SVG markup before either image is inlined. Providing it enables SVG inlining. */
  transformSvg?: (svg: string) => string;
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
  /**
   * Removes ListItem's synthetic roles and tab stops while retaining its mouse handlers.
   * Opt in when an ancestor or consumer supplies the semantic interactive control.
   */
  suppressRoleAndTabindex?: boolean;
  leftContent?: Snippet;
  centerContent?: Snippet;
  rightContent?: Snippet;
  bottomContent?: Snippet;
  classes?: string;
  role?: string;
  ariaSelected?: boolean;
  id?: string;
};

export type ListItemEventProperties = {
  onleftimageclick?: (event: MouseEvent) => void;
  onrightimageclick?: (event: MouseEvent) => void;
  oncentertextclick?: (event: MouseEvent) => void;
  onitemclick?: (event: MouseEvent) => void;
  ontopsectionclick?: (event: MouseEvent) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
