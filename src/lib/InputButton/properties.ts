import type { ButtonEventProperties, OptionalButtonProperties } from '../Button/properties';
import type { InputEventProperties, OptionalInputProperties } from '../Input/properties';
import type { Snippet } from 'svelte';

/**
 * Preset size variants for the InputButton component.
 * - `sm`: 36px height with compact padding (6px 12px)
 * - `md`: 44px height with standard padding (10px 16px)
 * - `lg`: 54px height with generous padding (14px 20px)
 *
 * All sizes are overridable via the corresponding CSS variables
 * (`--inputbutton-sm-height`, `--inputbutton-md-padding`, etc.).
 */
export type InputButtonSize = 'sm' | 'md' | 'lg';

export type InputButtonProperties = OptionalInputButtonProperties &
  InputButtonEventProperties & {
    value: string;
  };

export type OptionalInputButtonProperties = {
  inputProperties: OptionalInputProperties;
  rightButtonProperties?: OptionalButtonProperties | null;
  leftButtonProperties?: OptionalButtonProperties | null;
  bottomButtonProperties?: OptionalButtonProperties | null;
  leftIcon?: Snippet;
  rightIcon?: Snippet;
  classes?: string;
  /** When true, renders a red asterisk (*) next to the label to signal the field is required. */
  mandatory?: boolean;
  /** Preset height/padding size variant. Overridable per-size via CSS variables. */
  size?: InputButtonSize;
  /**
   * External error message to display below the input-button row. Takes precedence over
   * the internal `inputProperties.onErrorMessage` — when this prop is a non-empty string,
   * the internal validation error is suppressed. Pass an empty string or omit to let
   * internal validation messages surface normally.
   */
  error?: string;
  testId?: string;
};

export type InputButtonEventProperties = {
  inputEventProperties?: InputEventProperties;
  rightButtonEventProperties?: ButtonEventProperties | null;
  leftButtonEventProperties?: ButtonEventProperties | null;
  bottomButtonEventProperties?: ButtonEventProperties | null;
};
