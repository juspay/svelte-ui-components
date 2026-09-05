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
  onfiles?: (files: File[]) => void;
  /** @deprecated Use `onfiles` instead; both work until 4.0.0. */
  onFiles?: (files: File[]) => void;
  onerror?: (message: string) => void;
  /** @deprecated Use `onerror` instead; both work until 4.0.0. */
  onError?: (message: string) => void;
};
