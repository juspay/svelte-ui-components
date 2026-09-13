import type { OptionalInputProperties } from '$lib/Input/properties';

export type FieldConfig = Pick<
  OptionalInputProperties,
  | 'dataType'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'placeholder'
  | 'validationPattern'
  | 'validators'
  | 'label'
  | 'autoComplete'
  | 'inputMode'
  | 'testId'
>;

export type SplitInputProperties = MandatorySplitInputProperties &
  OptionalSplitInputProperties &
  SplitInputEventProperties;

export type MandatorySplitInputProperties = {
  values: string[];
};

export type OptionalSplitInputProperties = {
  fields?: FieldConfig[];
  length?: number;
  disabled?: boolean;
  autoAdvance?: boolean;
  separator?: string;
  testId?: string;
  classes?: string;
  /**
   * Names the whole group ("One-time code"). The boxes are individually
   * meaningless, so without this a screen-reader user reaches four unlabelled
   * fields; naming the group is what makes them one control.
   */
  ariaLabel?: string;
  /**
   * Text shown, and announced, when the assembled value is in error ("That code
   * is not right"). Referenced by `aria-describedby` on the group rather than on
   * one box, since the message is about the whole code, and sets `aria-invalid`
   * while present.
   */
  errorMessage?: string | null;
  /**
   * Persistent helper text describing the whole group. Referenced the same way,
   * so it is read before the user trips an error rather than only after.
   */
  infoMessage?: string | null;
  /**
   * Marks the group invalid without supplying a message, for a consumer driving
   * validity from a server or its own rules.
   */
  invalid?: boolean;
};

export type SplitInputEventProperties = {
  onchange?: (values: string[]) => void;
  oninput?: (values: string[]) => void;
  oncomplete?: (values: string[]) => void;
};
