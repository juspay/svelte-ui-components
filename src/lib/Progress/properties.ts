import type { Snippet } from 'svelte';

export type ProgressProperties = MandatoryProgressProperties & OptionalProgressProperties;

export type MandatoryProgressProperties = {
  value: number;
};

export type OptionalProgressProperties = {
  /**
   * The maximum value representing 100% completion. Must be a finite,
   * positive number for the percentage to be meaningful. A zero, negative,
   * or non-finite `max` (and likewise a non-finite `value`) is treated as an
   * invalid range: the bar renders at 0% rather than propagating `NaN` into
   * `aria-valuenow` and the percentage fallback text below.
   */
  max?: number;
  /**
   * Rendered in `.container` before the track, e.g. a fixed caption a
   * percentage label shouldn't replace. Independent of `showLabel`, which
   * renders after the track instead.
   */
  leadingLabel?: Snippet;
  showLabel?: boolean;
  /**
   * Routes the completion percentage through `AnimatedNumber` instead of
   * static text, so a consumer that already renders `showLabel` gets the
   * label visibly counting to its new value for free. Kept opt-in rather
   * than folded into `showLabel` itself, since `AnimatedNumber` is a new
   * dependency this component didn't previously have and existing markup
   * must stay untouched by default. An indeterminate bar has no percentage
   * to animate towards, so this is silently inert there rather than a state
   * that would need its own documentation.
   * @default false
   */
  animateValue?: boolean;
  /**
   * Accessible label for the progress element (`role="progressbar"`). Falls
   * back to the computed percentage text (e.g. `"75%"`) when determinate, or
   * `"Loading"` when indeterminate, so assistive technology always announces
   * a name by default. For an invalid `value`/`max` range (see `max`), the
   * fallback reads `"0%"`.
   */
  ariaLabel?: string;
  /**
   * Left end of a header row above the track, e.g. the bar's name. With
   * `headerEnd` it makes the label/value line a metered bar usually carries
   * ("Context  42%"). Layout only: the content's type and colour are the
   * caller's. When none of `headerStart`, `headerEnd` and `note` is passed,
   * the component renders exactly as before, with no extra wrapper.
   */
  headerStart?: Snippet;
  /** Right end of the header row (see `headerStart`), e.g. the value text. */
  headerEnd?: Snippet;
  /** A line under the track, e.g. "resets in 2h" (see `headerStart`). */
  note?: Snippet;
  testId?: string;
  classes?: string;
};
