export type ToggleProperties = OptionalToggleProperties & ToggleEventProperties;

export type OptionalToggleProperties = {
  text?: string;
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
};

export type ToggleEventProperties = {
  onclick?: (checked: boolean) => void;
  /** @deprecated Use `onclick` instead; both work until 4.0.0. */
  onClick?: (checked: boolean) => void;
};
