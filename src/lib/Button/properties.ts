import type { Snippet } from 'svelte';

export type LoaderType = 'Circular' | 'ProgressBar';

export type ButtonProperties = OptionalButtonProperties &
  ButtonEventProperties &
  MandatoryButtonProperties;

export type MandatoryButtonProperties = {
  text: string;
};

export type OptionalButtonProperties = {
  enable?: boolean;
  showProgressBar?: boolean;
  showLoader?: boolean;
  loaderType?: LoaderType;
  type?: 'submit' | 'reset' | 'button';
  testId?: string;
  icon?: Snippet;
};

export type ButtonEventProperties = {
  onclick?: (event: MouseEvent) => void;
  onkeyup?: (event: KeyboardEvent) => void;
};
