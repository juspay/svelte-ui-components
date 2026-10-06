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
  /**
   * Accessible name for the scroll region. While the region is the only keyboard route to
   * overflowing content (no arrows, nothing focusable inside) it is a Tab stop and is named
   * `Scrollable content` unless this says otherwise; a region given a name keeps it whether
   * or not it is currently a Tab stop. Prefer a name that says what scrolls, e.g.
   * `Release timeline`.
   */
  ariaLabel?: string;
};

export type ScrollerEventProperties = {
  onscrollposition?: (position: ScrollPosition) => void;
};
