export type ToggleProperties = OptionalToggleProperties & ToggleEventProperties;

export type OptionalToggleProperties = {
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
  /** Submits the switch under this name. Omitted when absent, off or disabled,
   *  matching the native checkbox the switch is built from. */
  name?: string;
  /** Value submitted while on. Defaults to `'on'`, the native default. */
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
