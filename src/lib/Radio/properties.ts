export type RadioProperties = MandatoryRadioProperties &
  OptionalRadioProperties &
  RadioEventProperties;

export type MandatoryRadioProperties = {
  name: string;
  value: string;
};

export type OptionalRadioProperties = {
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
