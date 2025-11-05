import type { ButtonProperties } from '../Button/properties';
import type { InputProperties } from '../Input/properties';
import type { Snippet } from 'svelte';

export type InputButtonProperties = OptionalInputButtonProperties &{
  value: string;
};

export type OptionalInputButtonProperties = {
  inputProperties: Omit<InputProperties, 'value'>;
  rightButtonProperties?: ButtonProperties | null;
  leftButtonProperties?: ButtonProperties | null;
  bottomButtonProperties?: ButtonProperties | null;
  leftIcon?: Snippet;
};
