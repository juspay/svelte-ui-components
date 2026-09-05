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
  classes?: string;
};

export type SnippetEventProperties = {
  oncopy?: () => void;
};
