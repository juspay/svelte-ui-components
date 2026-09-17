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
  /**
   * Routes the header's `N / maxLength` counter through `AnimatedNumber` so an
   * add/remove rolls the count instead of swapping it as plain text. Only
   * `items.length` animates -- the `/` separator and `maxLength` stay static,
   * since neither of those actually changes. Off by default so an unset prop
   * renders the exact static text node it always has.
   * @default false
   */
  animateCounter?: boolean;
  testId?: string;
  classes?: string;
};

export type MediaUploadEventProperties = {
  onchange?: (files: File[]) => void;
  onremove?: (file: File) => void;
  onerror?: (rejections: MediaUploadRejection[]) => void;
};
