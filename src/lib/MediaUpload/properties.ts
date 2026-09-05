import type { Snippet } from 'svelte';

export type MediaUploadProperties = OptionalMediaUploadProperties & MediaUploadEventProperties;

export type MediaUploadItem = {
  file: File;
  src: string;
  name: string;
  size: number;
  isImage: boolean;
};

export type MediaUploadRejectionReason = 'type' | 'size' | 'max';

export type MediaUploadRejection = {
  file: File;
  reason: MediaUploadRejectionReason;
};

export type MediaUploadErrorMessages = {
  type?: string;
  size?: string;
  max?: string;
};

export type OptionalMediaUploadProperties = {
  label?: string;
  description?: string;
  addText?: string;
  hintText?: string;
  maxLength?: number;
  accept?: string;
  maxFileSize?: number;
  multiple?: boolean;
  dragAndDrop?: boolean;
  disabled?: boolean;
  showCounter?: boolean;
  showFileName?: boolean;
  showFileSize?: boolean;
  addIcon?: Snippet;
  removeIcon?: Snippet;
  fileIcon?: Snippet;
  errorMessages?: MediaUploadErrorMessages;
  files?: File[];
  testId?: string;
  classes?: string;
};

export type MediaUploadEventProperties = {
  onchange?: (files: File[]) => void;
  /** @deprecated Use `onchange` instead; both work until 4.0.0. */
  onFilesChange?: (files: File[]) => void;
  onremove?: (file: File) => void;
  /** @deprecated Use `onremove` instead; both work until 4.0.0. */
  onRemove?: (file: File) => void;
  onerror?: (rejections: MediaUploadRejection[]) => void;
  /** @deprecated Use `onerror` instead; both work until 4.0.0. */
  onRejected?: (rejections: MediaUploadRejection[]) => void;
};
