import type { Snippet } from 'svelte';

export type ChatHeaderProperties = OptionalChatHeaderProperties & ChatHeaderEventProperties;

export type OptionalChatHeaderProperties = {
  title?: string;
  subtitle?: string;
  image?: string;
  imageAlt?: string;
  avatar?: Snippet;
  actions?: Snippet;
  closeIcon?: Snippet;
  closeLabel?: string;
  showClose?: boolean;
  children?: Snippet;
  testId?: string;
  classes?: string;
};

export type ChatHeaderEventProperties = {
  onclose?: () => void;
};
