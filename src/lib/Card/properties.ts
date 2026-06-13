import type { Snippet } from 'svelte';

export type CardProperties = OptionalCardProperties;

export type MandatoryCardProperties = Record<string, never>;

export type OptionalCardProperties = {
  /**
   * Main content body of the card. Rendered inside the `.card-content` container.
   */
  children?: Snippet;
  title?: string;
  description?: string;
  classes?: string;
  /** Renders as `data-pw` on the root element for Playwright test selection. */
  testId?: string;
  /**
   * When provided the root element becomes interactive:
   * `role="button"`, `tabindex=0`, and keydown (Enter/Space) triggers the handler.
   * When omitted the root is a plain `<div>` with no interactive attributes,
   * so existing consumers see zero behaviour change.
   */
  onclick?: (event: MouseEvent) => void;
};
