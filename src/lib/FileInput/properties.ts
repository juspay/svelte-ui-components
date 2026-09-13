import type { Snippet } from 'svelte';

export type FileInputSnippetProps = {
  openFilePicker: () => void;
  dragOver: boolean;
  disabled: boolean;
};

export type FileInputProperties = {
  /** Content slot — receives { openFilePicker, dragOver, disabled } so consumers build any visual they need. */
  trigger: Snippet<[FileInputSnippetProps]>;
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
