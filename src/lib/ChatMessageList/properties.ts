import type { Snippet } from 'svelte';
import type { ChatMessageData } from '../Chat/types';
import type { ChatMessageFeedback } from '../ChatMessage/properties';

export type ChatMessageListProperties = OptionalChatMessageListProperties &
  ChatMessageListEventProperties &
  MandatoryChatMessageListProperties;

export type MandatoryChatMessageListProperties = {
  messages: ChatMessageData[];
};

export type OptionalChatMessageListProperties = {
  autoscroll?: boolean;
  message?: Snippet<[ChatMessageData]>;
  messageAttachments?: Snippet<[ChatMessageData]>;
  empty?: Snippet;
  jumpLabel?: string;
  jumpIcon?: Snippet;
  allowCopy?: boolean;
  testId?: string;
  classes?: string;
};

export type ChatMessageListEventProperties = {
  onretry?: () => void;
  onfeedback?: (value: ChatMessageFeedback, message: ChatMessageData) => void;
};
