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
