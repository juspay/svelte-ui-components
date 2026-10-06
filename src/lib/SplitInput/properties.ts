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
  | 'ariaLabel'
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
   * Names the whole group ("One-time code"), and leads the name of every box in
   * it ("One-time code, digit 2 of 6"), so each box is identifiable on its own --
   * a screen reader's form-field list shows controls without their group. The
   * boxes are individually meaningless, so naming the group is what makes them
   * one control; leave it off and each box is named by its position alone
   * ("Digit 2 of 6"), which says where it is but not what it is for.
   *
   * To name one box instead, set `ariaLabel` on its `fields` entry.
   */
  ariaLabel?: string;
  /**
   * Builds the position part of a box's accessible name from its 1-based
   * position and the number of boxes. Replaces the English default ("digit 2 of
   * 6" for single-digit boxes, "character 2 of 6" for single-character ones,
   * "field 2 of 4" for wider boxes), so it is the hook for another language or
   * a better noun ("octet 2 of 4"). A box with its own `ariaLabel` or visible
   * `label` is named by that instead and never asks for a position.
   */
  positionLabel?: (position: number, total: number) => string;
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
