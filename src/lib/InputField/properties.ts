import type { Snippet } from 'svelte';
import type { InputDataType } from '$lib/types';

export type InputFieldProperties = {
  label?: string;
  mandatory?: boolean;
  value?: string;
  placeholder?: string;
  hintText?: string;
  errorText?: string;
  disabled?: boolean;
  type?: InputDataType;
  testId?: string;
  classes?: string;
  trailingIcon?: Snippet;
  ontrailingClick?: (event: MouseEvent) => void;
  oninput?: (value: string) => void;
};
