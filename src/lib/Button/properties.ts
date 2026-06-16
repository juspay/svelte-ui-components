import type { Snippet } from 'svelte';

export type LoaderType = 'Circular' | 'ProgressBar';

export type ButtonProperties = OptionalButtonProperties & ButtonEventProperties;

export type OptionalButtonProperties = {
  text?: string;
  enable?: boolean;
  showProgressBar?: boolean;
  showLoader?: boolean;
  loaderType?: LoaderType;
  type?: 'submit' | 'reset' | 'button';
  testId?: string;
  icon?: Snippet;
  children?: Snippet;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaSelected?: boolean;
  role?: string;
  disabled?: boolean;
  classes?: string;
};

export type ButtonEventProperties = {
  onclick?: (event: MouseEvent) => void;
  onkeydown?: (event: KeyboardEvent) => void;
  onkeyup?: (event: KeyboardEvent) => void;
  onmousedown?: (event: MouseEvent) => void;
  onmouseup?: (event: MouseEvent) => void;
  onmouseleave?: (event: MouseEvent) => void;
  ontouchstart?: (event: TouchEvent) => void;
  ontouchend?: (event: TouchEvent) => void;
};
