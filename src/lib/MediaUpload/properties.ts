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
  onFilesChange?: (files: File[]) => void;
  onRemove?: (file: File) => void;
  onRejected?: (rejections: MediaUploadRejection[]) => void;
};
