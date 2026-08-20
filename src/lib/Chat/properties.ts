import type { Snippet } from 'svelte';
import type { ChatMessageData, ChatToolStatus } from './types';
import type { ChatMessageFeedback } from '../ChatMessage/properties';
import type { ChatSuggestion } from '../ChatSuggestions/properties';

export type ChatProperties = OptionalChatProperties & ChatEventProperties & MandatoryChatProperties;

export type MandatoryChatProperties = {
  messages: ChatMessageData[];
};

export type OptionalChatProperties = {
  value?: string;
  title?: string;
  subtitle?: string;
  image?: string;
  imageAlt?: string;
  placeholder?: string;
  disabled?: boolean;
  streaming?: boolean;
  recording?: boolean;
  autoscroll?: boolean;
  toolStatus?: ChatToolStatus | null;
  suggestions?: ChatSuggestion[];
  attachments?: File[];
  accept?: string;
  multiple?: boolean;
  allowCopy?: boolean;
  closeLabel?: string;
  showClose?: boolean;
  headerAvatar?: Snippet;
  headerActions?: Snippet;
  headerContent?: Snippet;
  message?: Snippet<[ChatMessageData]>;
  messageAttachments?: Snippet<[ChatMessageData]>;
  empty?: Snippet;
  composerLeading?: Snippet;
  sendIcon?: Snippet;
  stopIcon?: Snippet;
  voiceIcon?: Snippet;
  attachIcon?: Snippet;
  testId?: string;
  classes?: string;
};

export type ChatEventProperties = {
  onsend?: (value: string, attachments: File[]) => void;
  onsuggestion?: (value: string, index: number) => void;
  onclose?: () => void;
  onstop?: () => void;
  onvoice?: () => void;
  onattach?: (files: File[]) => void;
  onretry?: () => void;
  onfeedback?: (value: ChatMessageFeedback, message: ChatMessageData) => void;
};
