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
  oninput?: (values: string[]) => void;
  oncomplete?: (values: string[]) => void;
};
