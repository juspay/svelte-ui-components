import type { ButtonProperties } from '../Button/properties';
import type { InputProperties } from '../Input/properties';
import type { Snippet } from 'svelte';

export type InputButtonProperties = {
  value: string;
  inputProperties: Omit<InputProperties, 'value'>;
  rightButtonProperties?: ButtonProperties | null;
  leftButtonProperties?: ButtonProperties | null;
  bottomButtonProperties?: ButtonProperties | null;
  leftIcon?: Snippet;
};
