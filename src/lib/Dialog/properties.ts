import type { Snippet } from 'svelte';
import type { HTMLDialogAttributes } from 'svelte/elements';

export type DialogProperties = {
  /** Bindable visibility. A modal uses showModal(), preserving the browser top layer. */
  open?: boolean;
  /** Use native modal isolation; false permits a non-modal dialog. Default true. */
  modal?: boolean;
  /** Lock the page scroll while modal and open. Default true. */
  lockScroll?: boolean;
  /** Explicit trigger to refocus on close, including pointer browsers that do not focus buttons. */
  returnFocusTo?: HTMLElement | null;
  /** Bindable native element for integration with existing controllers. */
  element?: HTMLDialogElement | null;
  classes?: string;
  testId?: string;
  nativeAttrs?: Omit<HTMLDialogAttributes, 'open' | 'class' | 'onclose' | 'oncancel' | 'onclick'>;
  children?: Snippet;
  onclose?: (event: Event) => void;
  /** Prevent the event's default to keep the dialog open. */
  oncancel?: (event: Event) => void;
  onclick?: (event: MouseEvent) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
