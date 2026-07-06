import type { Snippet } from 'svelte';

export type SheetSide = 'left' | 'right' | 'top' | 'bottom';

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
