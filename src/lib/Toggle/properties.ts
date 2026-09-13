export type ToggleProperties = OptionalToggleProperties & ToggleEventProperties;

export type OptionalToggleProperties = {
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
  text?: string;
  /** Whether the switch is on. Bindable, like `Checkbox.checked` and `Slider.value`. */
  checked?: boolean;
  disabled?: boolean;
  testId?: string;
  classes?: string;
  /**
   * Native `id` of the checkbox input, so a consumer can point its own `<label for>`
   * at the control. Generated when omitted or blank, which is what wires `text` up as a real
   * label rather than adjacent text.
   */
  id?: string;
  /** Names the switch for assistive technology when it has no visible text. */
  ariaLabel?: string;
  /**
   * References a label in the same DOM root as the checkbox. `<sui-toggle>` exposes this as
   * `inputAriaLabelledby` (`input-aria-labelledby`); it cannot reach the host document, so use
   * `text` or `inputAriaLabel` for labels outside the shadow root.
   */
  ariaLabelledby?: string;
  /** Submits the switch under this name, so it participates in a surrounding
   *  `<form>`'s submission. Omitted by default: with no `name` the input stays
   *  nameless and outside `FormData`, exactly as before this prop existed. Omitted
   *  from submission too when off or disabled, matching the native checkbox the
   *  switch is built from. */
  name?: string;
  /** Value submitted while on. Left unset, the attribute is omitted and the native
   *  checkbox's own `"on"` default is what submits, so setting `name` alone is enough and
   *  an existing consumer's DOM is unchanged. An off switch never appears in `FormData`. */
  value?: string;
  /** Blocks submission while the switch is off. */
  required?: boolean;
  /** `id` of a form elsewhere in the same document. Unavailable through
   *  `<sui-toggle>`, whose control sits in a shadow root. */
  form?: string;
};

export type ToggleEventProperties = {
  onclick?: (checked: boolean) => void;
};
