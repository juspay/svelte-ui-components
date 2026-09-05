import type { Snippet } from 'svelte';

export type AttachmentChipImage = {
  id: string;
  /** Image src for the thumbnail — a data URI or URL. */
  thumbnailData: string;
  filename?: string | null;
};

export type AttachmentChipFile = {
  id: string;
  filename: string;
};

export type AttachmentChipVideo = {
  id: string;
  /** Poster/thumbnail src for the tile — a data URI or URL. Omit for a plain dark tile. */
  thumbnailData?: string | null;
  filename?: string | null;
};

export type AttachmentChipRowProperties = OptionalAttachmentChipRowProperties &
  MandatoryAttachmentChipRowProperties;

export type MandatoryAttachmentChipRowProperties = Record<never, never>;

export type OptionalAttachmentChipRowProperties = {
  /** Omit to render the row read-only — chips lose their remove buttons. */
  onremoveimage?: (id: string) => void;
  /** @deprecated Use `onremoveimage` instead; both work until 4.0.0. */
  onRemoveImage?: (id: string) => void;
  onremovefile?: (id: string) => void;
  /** @deprecated Use `onremovefile` instead; both work until 4.0.0. */
  onRemoveFile?: (id: string) => void;
  onremovevideo?: (id: string) => void;
  /** @deprecated Use `onremovevideo` instead; both work until 4.0.0. */
  onRemoveVideo?: (id: string) => void;
  /**
   * Open/preview callbacks — when provided, the chip's tile becomes a real button
   * and clicking it fires with the attachment (e.g. open a lightbox, play the
   * video). Omitted, the tile stays non-interactive.
   */
  onopenimage?: (image: AttachmentChipImage) => void;
  /** @deprecated Use `onopenimage` instead; both work until 4.0.0. */
  onOpenImage?: (image: AttachmentChipImage) => void;
  onopenvideo?: (video: AttachmentChipVideo) => void;
  /** @deprecated Use `onopenvideo` instead; both work until 4.0.0. */
  onOpenVideo?: (video: AttachmentChipVideo) => void;
  onopenfile?: (file: AttachmentChipFile) => void;
  /** @deprecated Use `onopenfile` instead; both work until 4.0.0. */
  onOpenFile?: (file: AttachmentChipFile) => void;
  images?: AttachmentChipImage[];
  files?: AttachmentChipFile[];
  /** Video attachments — a poster tile with a play badge (or a plain dark tile without a poster). */
  videos?: AttachmentChipVideo[];
  /** Tooltip text for an image chip. Nothing is shown when omitted or empty. */
  imageTooltip?: (image: AttachmentChipImage) => string;
  /** Tooltip text for a video chip. Nothing is shown when omitted or empty. */
  videoTooltip?: (video: AttachmentChipVideo) => string;
  /** Glyph inside the remove button. Falls back to a built-in cross. */
  removeIcon?: Snippet;
  /** Glyph on a file chip. Falls back to a built-in document. */
  fileIcon?: Snippet;
  testId?: string;
  classes?: string;
};
