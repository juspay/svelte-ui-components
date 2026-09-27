import type { Snippet } from 'svelte';

export type SnippetProperties = MandatorySnippetProperties &
  OptionalSnippetProperties &
  SnippetEventProperties;

export type MandatorySnippetProperties = {
  text: string;
};

export type OptionalSnippetProperties = {
  prompt?: string;
  showCopyButton?: boolean;
  testId?: string;
  copyIcon?: Snippet;
  /** Text shown in place of the copy icon after a successful copy. Defaults to `'Copied!'`. */
  copiedLabel?: string;
  /** Milliseconds before the copied feedback reverts to the copy icon. Defaults to `2000`. */
  copyResetMs?: number;
  /**
   * Lays the snippet out as a pre-formatted block for long output (a command's
   * stdout, a JSON dump) instead of the default one-line, ellipsised chip:
   * every line shows, the code area scrolls (capped by
   * `--snippet-code-max-height`), the copy button sits in the top-right corner,
   * and an empty `prompt` renders nothing rather than an indent.
   */
  multiline?: boolean;
  classes?: string;
};

export type SnippetEventProperties = {
  oncopy?: () => void;
  /**
   * Fires when a clipboard write fails -- rejected (denied permission, a
   * non-secure context) or the Clipboard API being entirely absent -- with
   * the rejection reason (an `Error` when the API itself is missing).
   * `oncopy` does not fire for the same attempt.
   */
  onerror?: (reason: unknown) => void;
};
