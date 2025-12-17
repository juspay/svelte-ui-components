import type {
  ButtonEventProperties,
  MandatoryButtonProperties,
  OptionalButtonProperties
} from '../Button/properties';
import type { InputEventProperties, OptionalInputProperties } from '../Input/properties';
import type { Snippet } from 'svelte';

export type InputButtonProperties = OptionalInputButtonProperties &
  InputButtonEventProperties & {
    value: string;
  };

type _ButtonProperties = OptionalButtonProperties & MandatoryButtonProperties;

export type OptionalInputButtonProperties = {
  inputProperties: OptionalInputProperties;
  rightButtonProperties?: _ButtonProperties | null;
  leftButtonProperties?: _ButtonProperties | null;
  bottomButtonProperties?: _ButtonProperties | null;
  leftIcon?: Snippet;
  rightIcon?: Snippet;
};

export type InputButtonEventProperties = {
  inputEventProperties?: InputEventProperties;
  rightButtonEventProperties?: ButtonEventProperties | null;
  leftButtonEventProperties?: ButtonEventProperties | null;
  bottomButtonEventProperties?: ButtonEventProperties | null;
};
