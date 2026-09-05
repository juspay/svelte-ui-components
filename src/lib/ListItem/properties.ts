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
  /** @deprecated Use `onleftimageclick` instead; both work until 4.0.0. */
  onleftImageClick?: (event: MouseEvent) => void;
  /** @deprecated Use `onleftimageclick` instead; both work until 4.0.0. */
  onLeftImageClick?: (event: MouseEvent) => void;
  onrightimageclick?: (event: MouseEvent) => void;
  /** @deprecated Use `onrightimageclick` instead; both work until 4.0.0. */
  onrightImageClick?: (event: MouseEvent) => void;
  /** @deprecated Use `onrightimageclick` instead; both work until 4.0.0. */
  onRightImageClick?: (event: MouseEvent) => void;
  oncentertextclick?: (event: MouseEvent) => void;
  /** @deprecated Use `oncentertextclick` instead; both work until 4.0.0. */
  oncenterTextClick?: (event: MouseEvent) => void;
  /** @deprecated Use `oncentertextclick` instead; both work until 4.0.0. */
  onCenterTextClick?: (event: MouseEvent) => void;
  onitemclick?: (event: MouseEvent) => void;
  /** @deprecated Use `onitemclick` instead; both work until 4.0.0. */
  onitemClick?: (event: MouseEvent) => void;
  /** @deprecated Use `onitemclick` instead; both work until 4.0.0. */
  onItemClick?: (event: MouseEvent) => void;
  ontopsectionclick?: (event: MouseEvent) => void;
  /** @deprecated Use `ontopsectionclick` instead; both work until 4.0.0. */
  ontopSectionClick?: (event: MouseEvent) => void;
  /** @deprecated Use `ontopsectionclick` instead; both work until 4.0.0. */
  onTopSectionClick?: (event: MouseEvent) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
