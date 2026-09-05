import type { Snippet } from 'svelte';

export type SheetSide = 'left' | 'right' | 'top' | 'bottom' | 'center';

export type SheetProperties = MandatorySheetProperties &
  OptionalSheetProperties &
  SheetEventProperties;

export type MandatorySheetProperties = {
  content: Snippet;
};

export type OptionalSheetProperties = {
  open?: boolean;
  side?: SheetSide;
  title?: string;
  showOverlay?: boolean;
  /**
   * Whether clicking outside the panel dismisses the sheet, independent of
   * `showOverlay`'s visual tint. Defaults to mirroring `showOverlay`, so
   * existing behavior is unchanged unless this is set explicitly. Set this to
   * `true` alongside `showOverlay={false}` for a dismissible sheet with no
   * dimming backdrop — e.g. an anchored dropdown-style panel.
   */
  dismissOnOutsideClick?: boolean;
  showCloseButton?: boolean;
  /**
   * Renders `title` through a real `<h1>`-`<h6>` heading element instead of
   * the default `<span>`. Omit to keep the existing `<span>` markup
   * unchanged — the default when this prop is not set. Set it to the level
   * that is correct in the surrounding document outline (a sheet opened from
   * a page whose top-level heading is an `<h1>` typically wants `2`).
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  testId?: string;
  footer?: Snippet;
  classes?: string;
};

export type SheetEventProperties = {
  onclose?: () => void;
  /** Called once after the open transition has fully completed. */
  onafteropen?: () => void;
  /** Called once after the close transition has fully completed. */
  onafterclose?: () => void;
};
