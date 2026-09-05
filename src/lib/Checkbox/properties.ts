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
};

export type CheckboxEventProperties = {
  onclick?: (checked: boolean) => void;
  /** @deprecated Use `onclick` instead; both work until 4.0.0. */
  onClick?: (checked: boolean) => void;
};
