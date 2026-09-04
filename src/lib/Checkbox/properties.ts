import type { Snippet } from 'svelte';

export type CheckboxProperties = MandatoryCheckboxProperties &
  OptionalCheckboxProperties &
  CheckboxEventProperties;

export type MandatoryCheckboxProperties = {
  text: string;
};

export type OptionalCheckboxProperties = {
  checked?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  testId?: string;
  checkedIcon?: Snippet;
  indeterminateIcon?: Snippet;
  classes?: string;
  ariaControls?: string;
  /** Accessible name for the checkbox. Needed whenever the visible label sits
   *  outside this component (a table header cell, an icon-only row control),
   *  since name-from-content cannot reach it. Ignored when `text` is non-empty:
   *  a visible label must stay part of the accessible name (WCAG 2.5.3). */
  ariaLabel?: string;
  /** Controlled mode: a click reports the requested value through `onclick`
   *  and changes nothing locally, so the parent's `checked` / `indeterminate`
   *  stay the single source of truth. Needed wherever the parent may decline
   *  the change (a table selection driven from a consumer-owned set). */
  controlled?: boolean;
  /** Extra DOM attributes spread onto the checkbox element itself (the
   *  `role="checkbox"` box, not the wrapping label) — an `id` for
   *  `aria-controls` to point at, or a consumer's own test attribute. Spread
   *  last, so a value here wins over the component's own `data-pw`. */
  attributes?: Record<string, string>;
};

export type CheckboxEventProperties = {
  onclick?: (checked: boolean) => void;
};
