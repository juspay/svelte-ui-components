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
  /**
   * Replaces the rendered bubble body with arbitrary markup while keeping the
   * message chrome (role styling, avatar, header, attachments, copy/retry/
   * feedback actions). Keep `content` populated with the text form so the copy
   * action still has something to copy.
   */
  body?: Snippet | null;
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
