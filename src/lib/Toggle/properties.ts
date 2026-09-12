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
  /** Native `name` on the underlying `<input type="checkbox">`, so the switch
   *  participates in a surrounding `<form>`'s submission. Omitted by default:
   *  the input stays nameless and outside `FormData`, exactly as before this
   *  prop existed. */
  name?: string;
  /** Native `value` submitted when on. Defaults to `"on"` — the native
   *  checkbox default — when omitted. An off toggle never appears in
   *  `FormData`, matching native behaviour. */
  value?: string;
};

export type ToggleEventProperties = {
  onclick?: (checked: boolean) => void;
};
