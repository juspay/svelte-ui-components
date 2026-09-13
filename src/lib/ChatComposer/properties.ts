import type { Snippet } from 'svelte';
import type {
  AttachmentChipFile,
  AttachmentChipImage,
  AttachmentChipVideo
} from '../AttachmentChipRow/properties';

export type ChatComposerProperties = OptionalChatComposerProperties & ChatComposerEventProperties;

export type OptionalChatComposerProperties = {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  /**
   * Disables only the textarea. `null` (the default) falls back to `disabled`,
   * so a caller that never sets this keeps today's single-`disabled` behaviour
   * exactly.
   */
  textDisabled?: boolean | null;
  /**
   * Disables only the voice button. `null` (the default) falls back to
   * `disabled` — see `textDisabled`.
   */
  voiceDisabled?: boolean | null;
  /**
   * Disables only the send (and idle-action) button, independent of `sendable`.
   * `null` (the default) falls back to `disabled` — see `textDisabled`.
   */
  sendDisabled?: boolean | null;
  submitOnEnter?: boolean;
  maxLength?: number;
  streaming?: boolean;
  /**
   * Voice/dictation state. Accepts the tri-state `'idle' | 'recording' |
   * 'busy'` -- 'busy' means the control is transcribing: it must not accept a
   * new press, so the voice button disables itself while busy regardless of
   * `voiceDisabled`/`disabled`.
   *
   * `boolean` is kept working, unchanged, as an alias for one minor cycle:
   * `true` reads as 'recording', `false` (the default) reads as 'idle'.
   */
  recording?: boolean | 'idle' | 'recording' | 'busy';
  attachments?: File[];
  /**
   * Replaces the built-in attachment pill strip above the input row — render a
   * richer preview there (e.g. AttachmentChipRow) driven by your own attachment
   * model. When your model lives outside `attachments`, pair with `sendable` so
   * attachment-only sends stay possible.
   */
  attachmentsPreview?: Snippet;
  /**
   * Processed image attachments for the built-in rich strip: when either rich
   * list is non-empty the composer renders an AttachmentChipRow above the input
   * row instead of the `attachments` pill strip, and counts the chips toward
   * "can send". Opt-in — with both lists empty (the default) nothing changes.
   * `attachmentsPreview` still replaces the strip entirely when provided.
   */
  richImages?: AttachmentChipImage[];
  /** Processed file attachments for the built-in rich strip — see `richImages`. */
  richFiles?: AttachmentChipFile[];
  /** Processed video attachments for the built-in rich strip — see `richImages`. */
  richVideos?: AttachmentChipVideo[];
  /** Tooltip text for a rich image chip. Nothing is shown when omitted or empty. */
  richImageTooltip?: (image: AttachmentChipImage) => string;
  /** Tooltip text for a rich video chip. Nothing is shown when omitted or empty. */
  richVideoTooltip?: (video: AttachmentChipVideo) => string;
  /** Glyph inside the rich chips' remove buttons. Falls back to the chip row's cross. */
  richRemoveIcon?: Snippet;
  /** Glyph on a rich file chip. Falls back to the chip row's document glyph. */
  richFileIcon?: Snippet;
  /**
   * Overrides the internal "can send" calculation (text or `attachments`
   * present). `null` keeps the default. `disabled` still wins.
   */
  sendable?: boolean | null;
  accept?: string;
  multiple?: boolean;
  sendLabel?: string;
  stopLabel?: string;
  voiceLabel?: string;
  attachLabel?: string;
  sendIcon?: Snippet;
  stopIcon?: Snippet;
  voiceIcon?: Snippet;
  attachIcon?: Snippet;
  /** Glyph for the idle action button (see `onaction`). */
  actionIcon?: Snippet;
  actionLabel?: string;
  leading?: Snippet;
  /**
   * Opt-in sr-only status region (`role="status" aria-live="polite"`) for
   * narrating composer state changes -- e.g. "Recording. Press Escape to stop
   * and transcribe." Rendered only when set (an empty string still renders an
   * emptied region, so a caller can clear it without unmounting). The library
   * owns only the region, its role and its politeness; the sentences are
   * product voice and must come from the caller -- never hardcoded here.
   */
  statusText?: string;
  /** Test id on the status region (see `statusText`). */
  statusTestId?: string;
  testId?: string;
  /** Test id emitted as `data-pw` on the textarea itself (none by default). */
  inputTestId?: string;
  /** Accessible name for the textarea. Defaults to the placeholder (or 'Message'). */
  inputAriaLabel?: string;
  /** Test ids for the control buttons (none by default). */
  sendTestId?: string;
  /** Test id on the send slot's wrapper — the same slot renders send, stop and action. */
  sendSlotTestId?: string;
  stopTestId?: string;
  voiceTestId?: string;
  attachTestId?: string;
  actionTestId?: string;
  classes?: string;
};

export type ChatComposerEventProperties = {
  /**
   * Fires on submit with the value and pending attachments. May return
   * `boolean | Promise<boolean>`: an explicit `false` (sync or resolved) skips
   * the automatic clear so a rejected send can restore its draft — anything
   * else, including today's `void` return, clears exactly as before.
   */
  onsubmit?: (value: string, attachments: File[]) => boolean | void | Promise<boolean | void>;
  oninput?: (value: string, event: Event) => void;
  onkeydown?: (event: KeyboardEvent) => void;
  onpaste?: (event: ClipboardEvent) => void;
  onstop?: () => void;
  onvoice?: () => void;
  /**
   * Fires when Escape is pressed while `recording` is 'recording' (or the
   * legacy `true`), and only then -- Escape has no effect at any other
   * dictation state. The library owns no microphone or media APIs, so this is
   * the seam a caller wires to actually stop dictation.
   */
  oncanceldictation?: () => void;
  onattach?: (files: File[]) => void;
  /**
   * Intercepts the attach button: when provided, clicking it calls this instead of
   * opening the built-in file picker — for apps with their own chooser (camera /
   * gallery / files).
   */
  onattachclick?: () => void;
  /**
   * Removal callbacks for the rich strip's chips. Omit them to render the rich
   * chips read-only (no remove buttons), mirroring AttachmentChipRow.
   */
  onremoverichimage?: (id: string) => void;
  onremoverichfile?: (id: string) => void;
  onremoverichvideo?: (id: string) => void;
  /**
   * Open/preview callbacks for the rich strip's chips — when provided, a chip's
   * tile becomes a real button and clicking it fires with the attachment (e.g.
   * open a lightbox, play the video).
   */
  onopenrichimage?: (image: AttachmentChipImage) => void;
  onopenrichvideo?: (video: AttachmentChipVideo) => void;
  onopenrichfile?: (file: AttachmentChipFile) => void;
  /**
   * The composer's idle action (e.g. voice conversation mode). While the value is
   * empty, nothing is sendable and no reply is streaming, the send button gives way
   * to an action button that fires this.
   */
  onaction?: () => void;
};
