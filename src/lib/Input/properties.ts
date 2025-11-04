import type {
  AutoCompleteType,
  CustomValidator,
  InputDataType,
  TextTransformer,
  ValidationState
} from '$lib/types';

export type InputProperties = OptionalInputProps & {
  value: string;
}

export type OptionalInputProps = {
  placeholder?: string | null;
  dataType?: InputDataType;
  label?: string | null;
  onErrorMessage?: string | null;
  infoMessage?: string | null;
  validators?: CustomValidator[];
  disable?: boolean;
  validationPattern?: RegExp | null;
  inProgressPattern?: RegExp | null;
  addFocusColor?: boolean;
  maxLength?: number;
  minLength?: number;
  actionInput?: boolean;
  useTextArea?: boolean;
  autoComplete?: AutoCompleteType;
  name?: string;
  textTransformers?: TextTransformer[];
  testId?: string;
  onInput?: (value: string, event: Event) => void;
  onFocusout?: (event: FocusEvent) => void;
  onPaste?: (event: ClipboardEvent) => void;
  onClick?: (event: MouseEvent) => void;
  onStateChange?: (state: ValidationState) => void;
};
