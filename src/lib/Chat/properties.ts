import type { Snippet } from 'svelte';
import type { ChatMessageData, ChatToolStatus } from './types';
import type { ChatMessageFeedback } from '../ChatMessage/properties';
import type { ChatMessageListProperties } from '../ChatMessageList/properties';
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
  scrollPolicy?: ChatMessageListProperties['scrollPolicy'];
  pinHold?: ChatMessageListProperties['pinHold'];
  jump?: ChatMessageListProperties['jump'];
  jumpLabel?: ChatMessageListProperties['jumpLabel'];
  jumpIcon?: ChatMessageListProperties['jumpIcon'];
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
  /** Per-message bubble body, threaded through to ChatMessageList's `messageBody`. */
  messageBody?: Snippet<[ChatMessageData]>;
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
  onSend?: (value: string, attachments: File[]) => void;
  onsuggestion?: (value: string, index: number) => void;
  onSuggestion?: (value: string, index: number) => void;
  onclose?: () => void;
  onClose?: () => void;
  onstop?: () => void;
  onStop?: () => void;
  onvoice?: () => void;
  onVoice?: () => void;
  onattach?: (files: File[]) => void;
  onAttach?: (files: File[]) => void;
  onretry?: () => void;
  onRetry?: () => void;
  onfeedback?: (value: ChatMessageFeedback, message: ChatMessageData) => void;
  onFeedback?: (value: ChatMessageFeedback, message: ChatMessageData) => void;
  onscrollstate?: ChatMessageListProperties['onscrollstate'];
  onScrollState?: ChatMessageListProperties['onscrollstate'];
};
