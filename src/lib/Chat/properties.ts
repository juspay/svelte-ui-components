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
  /** @deprecated Use `onsend` instead; both work until 4.0.0. */
  onSend?: (value: string, attachments: File[]) => void;
  onsuggestion?: (value: string, index: number) => void;
  /** @deprecated Use `onsuggestion` instead; both work until 4.0.0. */
  onSuggestion?: (value: string, index: number) => void;
  onclose?: () => void;
  /** @deprecated Use `onclose` instead; both work until 4.0.0. */
  onClose?: () => void;
  onstop?: () => void;
  /** @deprecated Use `onstop` instead; both work until 4.0.0. */
  onStop?: () => void;
  onvoice?: () => void;
  /** @deprecated Use `onvoice` instead; both work until 4.0.0. */
  onVoice?: () => void;
  onattach?: (files: File[]) => void;
  /** @deprecated Use `onattach` instead; both work until 4.0.0. */
  onAttach?: (files: File[]) => void;
  onretry?: () => void;
  /** @deprecated Use `onretry` instead; both work until 4.0.0. */
  onRetry?: () => void;
  onfeedback?: (value: ChatMessageFeedback, message: ChatMessageData) => void;
  /** @deprecated Use `onfeedback` instead; both work until 4.0.0. */
  onFeedback?: (value: ChatMessageFeedback, message: ChatMessageData) => void;
  /** @deprecated Use `onScrollState` instead; both work until 4.0.0. */
  onscrollstate?: ChatMessageListProperties['onscrollstate'];
  onScrollState?: ChatMessageListProperties['onscrollstate'];
};
