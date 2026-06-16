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
  /** Fires when a key is pressed down while the button has focus. */
  onkeydown?: (event: KeyboardEvent) => void;
  /** Fires when a key is released while the button has focus. */
  onkeyup?: (event: KeyboardEvent) => void;
  /** Fires when a mouse button is pressed down on the button. */
  onmousedown?: (event: MouseEvent) => void;
  /** Fires when a mouse button is released over the button. */
  onmouseup?: (event: MouseEvent) => void;
  /** Fires when the pointer leaves the button area. */
  onmouseleave?: (event: MouseEvent) => void;
  /** Fires when a touch point is placed on the button. */
  ontouchstart?: (event: TouchEvent) => void;
  /** Fires when a touch point is removed from the button. */
  ontouchend?: (event: TouchEvent) => void;
};
