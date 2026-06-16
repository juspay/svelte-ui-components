import type { CustomValidator, InputDataType, TextTransformer, ValidationState } from '$lib/types';
import type { HTMLInputAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

export type InputProperties = OptionalInputProperties &
  InputEventProperties &
  MandatoryInputProperties;

export type MandatoryInputProperties = {
  value: string;
};

export type OptionalInputProperties = {
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
  min?: number;
  max?: number;
  actionInput?: boolean;
  useTextArea?: boolean;
  autoComplete?: HTMLInputAttributes['autocomplete'];
  name?: string;
  textTransformers?: TextTransformer[];
  textViewPresentation?: TextTransformer[];
  testId?: string;
  classes?: string;
  role?: string;
  ariaExpanded?: boolean;
  ariaAutocomplete?: 'none' | 'inline' | 'list' | 'both';
  ariaControls?: string | null;
  ariaActivedescendant?: string | null;
  /** Passive/clickable icon rendered inside the field on the leading edge (e.g. a search icon). */
  leftIcon?: Snippet;
  /** Passive/clickable icon rendered inside the field on the trailing edge (e.g. a clear button). */
  rightIcon?: Snippet;
  /** When set, the leftIcon becomes a focusable button invoking this handler. */
  onLeftIconClick?: () => void;
  /** When set, the rightIcon becomes a focusable button invoking this handler. */
  onRightIconClick?: () => void;
  /** Accessible label for the clickable leftIcon button (defaults to a generic label). */
  leftIconLabel?: string;
  /** Accessible label for the clickable rightIcon button (defaults to a generic label). */
  rightIconLabel?: string;
  /** Appends a required asterisk beside the label and sets aria-required on the field. */
  mandatory?: boolean;
  /** Forces the error border independent of validationPattern (server/runtime-driven errors). */
  forceError?: boolean;
};

export type InputEventProperties = {
  onInput?: (value: string, event: Event) => void;
  onFocus?: (event: FocusEvent) => void;
  onFocusout?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onPaste?: (event: ClipboardEvent) => void;
  onClick?: (event: MouseEvent) => void;
  onStateChange?: (state: ValidationState) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
};
