import type { Snippet } from 'svelte';

export type CardProperties = MandatoryCardProperties & OptionalCardProperties;

export type MandatoryCardProperties = {
  children: Snippet;
};

export type OptionalCardProperties = {
  title?: string;
  description?: string;
  classes?: string;
  /** Renders as data-pw on the root element for Playwright test selection. */
  testId?: string;
  /**
   * When provided the root element becomes interactive:
   * role="button", tabindex=0, and keydown (Enter/Space) triggers the handler.
   * When omitted the root is a plain <div> with no interactive attributes.
   */
  onclick?: (event: MouseEvent) => void;
  /** Snippet rendered before the title inside the card header. */
  headerLeading?: Snippet;
  /** Snippet rendered at the trailing edge of the card header. */
  headerAction?: Snippet;
  /** Secondary line rendered below the header title. */
  headerSubtext?: string;
};
