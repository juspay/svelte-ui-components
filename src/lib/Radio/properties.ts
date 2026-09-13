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
