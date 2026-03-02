import type { ButtonEventProperties, OptionalButtonProperties } from '../Button/properties';
import type { InputEventProperties, OptionalInputProperties } from '../Input/properties';
import type { Snippet } from 'svelte';

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
};

export type InputButtonEventProperties = {
  inputEventProperties?: InputEventProperties;
  rightButtonEventProperties?: ButtonEventProperties | null;
  leftButtonEventProperties?: ButtonEventProperties | null;
  bottomButtonEventProperties?: ButtonEventProperties | null;
};
