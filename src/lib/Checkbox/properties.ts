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
  /** Visible label. Optional, defaulting to `''` (unlabelled) -- matching Toggle's
   *  own `text` contract (Toggle/properties.ts) -- so a form-only checkbox
   *  (`<Checkbox name="agree" />`) does not need an empty string just to compile.
   *  A checkbox with no visible text needs `ariaLabel` for an accessible name;
   *  see `ariaLabel` below. */
  text?: string;
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
  /** Native `name` on the underlying `<input type="checkbox">`, so the control
   *  participates in a surrounding `<form>`'s submission. Omitted by default:
   *  the input stays nameless and outside `FormData`, exactly as before this
   *  prop existed. */
  name?: string;
  /** Native `value` submitted when checked. Defaults to `"on"` — the native
   *  checkbox default — when omitted, so setting `name` alone is enough to
   *  form-associate a plain "checked or not" checkbox. An unchecked checkbox
   *  never appears in `FormData`, matching native behaviour. */
  value?: string;
};

export type CheckboxEventProperties = {
  onclick?: (checked: boolean) => void;
};
