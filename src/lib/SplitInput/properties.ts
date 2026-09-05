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
};

export type SplitInputEventProperties = {
  onchange?: (values: string[]) => void;
  /** @deprecated Use `onchange` instead; both work until 4.0.0. */
  onChange?: (values: string[]) => void;
  oninput?: (values: string[]) => void;
  /** @deprecated Use `oninput` instead; both work until 4.0.0. */
  onInput?: (values: string[]) => void;
  oncomplete?: (values: string[]) => void;
  /** @deprecated Use `oncomplete` instead; both work until 4.0.0. */
  onComplete?: (values: string[]) => void;
};
