import type { Snippet } from 'svelte';

export type ScrollDirection = 'horizontal' | 'vertical';

export type ScrollPosition = {
  scrollOffset: number;
  scrollSize: number;
  clientSize: number;
  progress: number;
};

export type ScrollerProperties = OptionalScrollerProperties &
  ScrollerEventProperties &
  MandatoryScrollerProperties;

export type MandatoryScrollerProperties = {
  children: Snippet;
};

export type OptionalScrollerProperties = {
  direction?: ScrollDirection;
  scrollAmount?: number;
  showArrows?: boolean;
  showGradient?: boolean;
  dragToScroll?: boolean;
  snapToItem?: boolean;
  hideScrollbar?: boolean;
  hideArrowsOnTouch?: boolean;
  smoothScroll?: boolean;
  testId?: string;
  arrowPrevious?: Snippet;
  arrowNext?: Snippet;
  classes?: string;
};

export type ScrollerEventProperties = {
  onscrollposition?: (position: ScrollPosition) => void;
};
