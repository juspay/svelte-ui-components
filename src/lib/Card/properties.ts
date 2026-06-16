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
  /**
   * Snippet rendered at the top-right of the header row, alongside title/description.
   * When omitted the header row is unchanged (title block takes full width).
   */
  headerRight?: Snippet;
  /**
   * Snippet rendered in a `<footer class="card-footer">` element below the content area.
   * When omitted no footer element is rendered.
   */
  footer?: Snippet;
  /**
   * When true, the root `.card` element gets `height: 100%` and becomes a flex column
   * so the content area grows to fill the remaining space. Defaults to false.
   */
  stretch?: boolean;
  /**
   * When true, the `.card-content` area becomes vertically scrollable with a
   * configurable `max-height` (default 400px via `--card-content-max-height`).
   * The content div receives `role="region"`, `aria-label="Scrollable card content"`,
   * and `tabindex="0"` so keyboard users can focus and scroll the overflowing region.
   * Defaults to false.
   */
  scrollable?: boolean;
  /**
   * Per-instance CSS custom properties applied as inline style on the root `.card`.
   * Keys must be CSS variable names (e.g. `--bottom-sections-count`); values are
   * emitted verbatim. This lets a consumer feed a dynamic, per-instance value into a
   * recipe class whose selectors or media queries read that variable — something a
   * static `classes` string cannot express. When omitted, no `style` attribute is
   * rendered, so existing consumers are unchanged.
   */
  cssVars?: Record<string, string | number>;
};
