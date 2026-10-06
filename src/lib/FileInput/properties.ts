import type { Snippet } from 'svelte';

export type FileInputSnippetProps = {
  openFilePicker: () => void;
  dragOver: boolean;
  disabled: boolean;
  /**
   * The ids of the rendered error/info messages, for `aria-describedby`. The drop region links
   * them itself while it owns activation; a control supplied under `activation="trigger"` is the
   * one that must carry them, so it is handed here. Null when nothing is rendered.
   */
  describedBy: string | null;
};

/**
 * Which element is the single interactive control for the upload action.
 *
 * - `'region'` (default): the drop region is the control. It is the one Tab stop, announces as
 *   a button named from the `trigger` content, and opens the chooser on Enter, Space or a click
 *   anywhere inside it. `trigger` content must therefore be non-interactive.
 * - `'trigger'`: the control inside `trigger` (a `Button`, say) is the one Tab stop and calls
 *   `openFilePicker`. The region becomes a passive drag-and-drop target with no role, no tab
 *   stop and no click or key handling of its own.
 */
export type FileInputActivation = 'region' | 'trigger';

export type FileInputProperties = {
  /**
   * Content slot — receives { openFilePicker, dragOver, disabled, describedBy } so consumers build
   * any visual they need. Under the default `activation="region"` it must be non-interactive: the
   * region is already the control, and a button inside it is a second Tab stop and a second
   * announcement for the same action.
   */
  trigger: Snippet<[FileInputSnippetProps]>;
  /** Who owns the single interactive control. Defaults to `'region'`; see {@link FileInputActivation}. */
  activation?: FileInputActivation;
  accept?: string;
  multiple?: boolean;
  maxSizeBytes?: number;
  disabled?: boolean;
  testId?: string;
  classes?: string;
  /** Text shown, and announced, when the control is in error. Linked through
   *  `aria-describedby`, and sets `aria-invalid` while present. */
  errorMessage?: string | null;
  /** Persistent helper text describing the control, linked the same way. */
  infoMessage?: string | null;
  /** Marks the control invalid without supplying a message. */
  invalid?: boolean;
  onfiles?: (files: File[]) => void;
  onerror?: (message: string) => void;
};
