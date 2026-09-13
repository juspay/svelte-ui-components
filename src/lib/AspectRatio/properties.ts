import type { Snippet } from 'svelte';

export type AspectRatioProperties = OptionalAspectRatioProperties;

export type MandatoryAspectRatioProperties = Record<string, never>;

export type OptionalAspectRatioProperties = {
  /**
   * Width-to-height ratio the content is constrained to, expressed the same
   * way the CSS `aspect-ratio` property reads it -- e.g. `16 / 9` for a
   * widescreen frame, `4 / 3` for a photo. Must be a finite, positive
   * number: zero and negative ratios have no geometric meaning, and a
   * non-finite value (`NaN`, `Infinity` -- e.g. from an image's
   * `naturalWidth / naturalHeight` read before it has decoded) would either
   * produce an invalid CSS declaration or a degenerate one-dimensional box.
   * An invalid `ratio` falls back to the default of `1` (a square) rather
   * than emitting broken CSS.
   */
  ratio?: number;
  /**
   * Content rendered inside the ratio-constrained container. Optional --
   * an empty `AspectRatio` still reserves the correctly-shaped layout space,
   * which is useful as a placeholder while the real content (e.g. an image)
   * is still loading.
   */
  children?: Snippet;
  classes?: string;
  /** Renders as `data-pw` (and `testID`) on the root element for Playwright test selection. */
  testId?: string;
};
