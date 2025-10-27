import type { Snippet } from 'svelte';

export type LoaderType = 'Circular' | 'ProgressBar';

export type ButtonProperties = {
  text: string;
  enable?: boolean;
  showProgressBar?: boolean;
  showLoader?: boolean;
  loaderType?: LoaderType;
  type?: 'submit' | 'reset' | 'button';
  testId?: string;
  onclick?: (event: MouseEvent) => void;
  onkeyup?: (event: KeyboardEvent) => void;
  icon?: Snippet;
};
