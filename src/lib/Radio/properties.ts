export type RadioProperties = MandatoryRadioProperties &
  OptionalRadioProperties &
  RadioEventProperties;

export type MandatoryRadioProperties = {
  name: string;
  value: string;
};

export type OptionalRadioProperties = {
  /**
   * Text shown, and announced, when the control is in error. Linked to the
   * control through `aria-describedby` and announced through `role="alert"`;
   * the input carries `data-invalid` while present. It does not set
   * `aria-invalid`, which WAI-ARIA 1.2 does not support on `role="radio"` --
   * put that on the `role="radiogroup"` that wraps the group.
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
   * driving validity from a server or its own rules. Sets `data-invalid` on
   * the input; the announced group state is the wrapping `role="radiogroup"`'s
   * `aria-invalid`.
   */
  invalid?: boolean;
  selectedValue?: string;
  text?: string;
  disabled?: boolean;
  testId?: string;
  classes?: string;
  /** Blocks submission until one radio in the group is selected. Set it on every
   *  member, the way the native control expects. */
  required?: boolean;
  /** `id` of a form elsewhere in the same document, for a radio rendered outside it.
   *  Not available through `<sui-radio>`: a shadow-root control cannot join a form
   *  in the host document. */
  form?: string;
};

export type RadioEventProperties = {
  onchange?: (value: string) => void;
};
