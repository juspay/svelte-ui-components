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
  classes?: string;
};

export type SnippetEventProperties = {
  oncopy?: () => void;
};
