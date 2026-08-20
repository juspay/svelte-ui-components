import type { Snippet } from 'svelte';

export type ChatToolStatusProperties = OptionalChatToolStatusProperties &
  MandatoryChatToolStatusProperties;

export type MandatoryChatToolStatusProperties = {
  label: string;
};

export type OptionalChatToolStatusProperties = {
  icon?: Snippet;
  testId?: string;
  classes?: string;
};
