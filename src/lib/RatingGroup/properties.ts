import type { Snippet } from 'svelte';

/** Fill state of a single star, passed to the `star` snippet. `'half'` is only ever
 *  produced while `allowHalf` is on -- with it off every star is `'empty'` or `'full'`. */
export type RatingGroupStarState = 'empty' | 'half' | 'full';

export type RatingGroupStarContext = {
  /** 0-based position of this star in the row. */
  index: number;
  state: RatingGroupStarState;
};

export type RatingGroupProperties = OptionalRatingGroupProperties & RatingGroupEventProperties;

export type OptionalRatingGroupProperties = {
  /**
   * Current rating. Bindable, like `Checkbox.checked` and `Slider.value`. Defaults to
   * `0` (unrated). Clamped to `[0, max]` and, unless `allowHalf` is set, rounded to the
   * nearest whole star before it is ever painted or read back through `aria-valuenow` --
   * a non-finite or out-of-range value never reaches the DOM as `NaN` or an overflowed
   * star count, it renders as the nearest in-range value instead (mirrors `Progress`'s
   * guard against an unusable `value`/`max`).
   */
  value?: number;
  /**
   * Number of stars in the group. Must be a finite, positive number; a zero, negative,
   * or non-finite `max` is an invalid range and renders no stars at all, the same way
   * `Progress` renders an invalid range as an empty bar rather than a broken one.
   */
  max?: number;
  disabled?: boolean;
  /**
   * Read but not settable: the group stays a single tab stop and its ARIA value keeps
   * following `value` from outside, but clicking a star or pressing an arrow key no
   * longer changes it. Distinct from `disabled`, which removes it from the tab order
   * entirely.
   */
  readonly?: boolean;
  /**
   * Allows landing on the half star between two whole ones -- clicking the left half of
   * a star sets it, and the right half sets the whole star. Arrow keys move in 0.5 steps
   * instead of 1 while this is on.
   */
  allowHalf?: boolean;
  /** Accessible name for the `role="slider"` element. Falls back to `"Rating"`; the
   *  current value is announced separately through `aria-valuetext`. */
  ariaLabel?: string;
  testId?: string;
  classes?: string;
  /**
   * Custom rendering for a single star, given its 0-based `index` and fill `state`.
   * Falls back to a themeable default star built from `--rating-group-star-*` custom
   * properties.
   */
  star?: Snippet<[RatingGroupStarContext]>;
  /**
   * Submits the current rating under this name via a hidden native `<input
   * type="number">`, the way `Checkbox` submits through a visually hidden native input.
   * Omitted entirely while disabled, and while unrated (`0`) -- a native number input
   * cannot itself express "explicitly zero" vs. "never touched", so `0` is treated as
   * the empty state for submission purposes, matching `required`'s reading of it below.
   */
  name?: string;
  /**
   * Blocks submission while the rating is unset (`0`), the same way an unchecked
   * required `Checkbox` does. Invalid focus lands on the group itself, since the
   * hidden native input is deliberately not a tab stop.
   */
  required?: boolean;
  /** `id` of a form elsewhere in the same document, for a group rendered outside it.
   *  Unavailable through `<sui-rating-group>`, whose hidden input sits in a shadow
   *  root and cannot reach a form in the host document. */
  form?: string;
};

export type RatingGroupEventProperties = {
  onchange?: (value: number) => void;
};
