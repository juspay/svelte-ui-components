import type { Snippet } from 'svelte';
import type { ChatMessageStatus, ChatRole } from '../Chat/types';

export type ChatMessageFeedback = 'up' | 'down';

export type ChatMessageProperties = OptionalChatMessageProperties &
  ChatMessageEventProperties &
  MandatoryChatMessageProperties;

export type MandatoryChatMessageProperties = {
  role: ChatRole;
};

export type OptionalChatMessageProperties = {
  content?: string;
  html?: string;
  streaming?: boolean;
  status?: ChatMessageStatus;
  avatar?: Snippet;
  header?: Snippet;
  attachments?: Snippet | null;
  allowCopy?: boolean;
  actions?: Snippet;
  copyLabel?: string;
  retryLabel?: string;
  feedbackUpLabel?: string;
  feedbackDownLabel?: string;
  testId?: string;
  classes?: string;
};

export type ChatMessageEventProperties = {
  onretry?: (() => void) | null;
  onfeedback?: ((value: ChatMessageFeedback) => void) | null;
  oncopy?: (text: string) => void;
};
