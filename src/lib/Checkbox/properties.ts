import type { Snippet } from 'svelte';

export type CheckboxProperties = OptionalCheckboxProperties & CheckboxEventProperties;

// No property is mandatory anymore -- `text` is optional here too, matching its
// home in OptionalCheckboxProperties below, so a form-only checkbox
// (`<Checkbox name="agree" />`) compiles without it. This type is kept exported
// (rather than deleted), and `text` kept present on it (rather than dropped to
// `Record<string, never>`), only so an existing `import type
// { MandatoryCheckboxProperties }` -- or an object literal typed against it --
// keeps compiling; it is not itself intersected into CheckboxProperties above.
export type MandatoryCheckboxProperties = { text?: string };

export type OptionalCheckboxProperties = {
  /**
   * Visible label. Optional, and empty by default -- matching Toggle's own `text`
   * contract (Toggle/properties.ts) -- so a form-only checkbox
   * (`<Checkbox name="agree" />`) does not need an empty string just to compile.
   *
   * It mattered beyond the type. `Checkbox` dereferences `text.length`, and the
   * custom-element build type-checks nothing, so `<sui-checkbox name="terms">`
   * with no `text` attribute threw during render and left an empty shadow root
   * -- the same failure mode as the `attributes` collision, from a different
   * cause. `Toggle` and `Radio` already declared it optional with a default.
   *
   * A checkbox with no visible text needs `ariaLabel` for an accessible name;
   * see `ariaLabel` below.
   */
  text?: string;
  /**
   * Text shown, and announced, when the control is in error. Linked to the
   * control through `aria-describedby`, and sets `aria-invalid` while present.
   */
  errorMessage?: string | null;
  /**
   * Persistent helper text describing the control. Linked through
   * `aria-describedby` too, so it is read before the user trips an error rather
   * than only after.
   */
  infoMessage?: string | null;
  /**
   * Marks the control invalid without supplying a message, for a consumer
   * driving validity from a server or its own rules.
   */
  invalid?: boolean;
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
  /** Submits the box under this name when it sits inside (or is associated with) a
   *  form. Omitted by default: with no `name` the box stays outside `FormData`,
   *  exactly as before this prop existed. Omitted from submission too when unchecked,
   *  indeterminate or disabled, which is what a native `<input type="checkbox">` does. */
  name?: string;
  /** Value submitted while checked. Left unset, the attribute is omitted and the native
   *  checkbox's own `"on"` default is what submits -- so setting `name` alone is enough to
   *  form-associate a plain "checked or not" box, and an existing consumer's DOM is
   *  unchanged. The default is the platform's, not one this component hardcodes. */
  value?: string;
  /** Makes an unchecked box block submission. Invalid validation moves focus to the
   *  visible box, since the form control behind it is deliberately not a tab stop. */
  required?: boolean;
  /** `id` of a form elsewhere in the same document, for a box rendered outside it.
   *  Custom elements have no form association: inside `<sui-checkbox>` the control
   *  lives in a shadow root and cannot reach a form in the host document. */
  form?: string;
};

export type CheckboxEventProperties = {
  onclick?: (checked: boolean) => void;
};
