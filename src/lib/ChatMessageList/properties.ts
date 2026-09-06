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
  /**
   * How the list follows new content. `near-bottom` (default) keeps the latest
   * content in view while the reader is already near the bottom. `pin-sender-turn`
   * is the conversational-AI pattern: each new sender message is pinned to the TOP
   * of the viewport (headroom is reserved below it) so the reply streams into view
   * beneath the question instead of yanking the reader to the bottom.
   */
  scrollPolicy?: 'near-bottom' | 'pin-sender-turn';
  /**
   * pin-sender-turn only: while true, the headroom reserved for the current pinned
   * turn is held. Drive it from the host's own "turn still busy" semantics
   * (streaming, tool execution, awaiting confirmation…); when it turns false the
   * reserved space collapses so a short reply leaves no blank gap.
   */
  pinHold?: boolean;
  /** Render the built-in jump-to-latest button (default true). Hosts with their own affordance pass false. */
  jump?: boolean;
  message?: Snippet<[ChatMessageData]>;
  /**
   * Renders inside each message's bubble in place of its text/html, keeping the
   * full ChatMessage chrome. Lighter-weight than `message`, which replaces the
   * entire ChatMessage; use `messageBody` when only the body is custom.
   */
  messageBody?: Snippet<[ChatMessageData]>;
  messageAttachments?: Snippet<[ChatMessageData]>;
  empty?: Snippet;
  jumpLabel?: string;
  jumpIcon?: Snippet;
  allowCopy?: boolean;
  testId?: string;
  classes?: string;
};

export type ChatMessageListEventProperties = {
  /**
   * Reports the scroll state whenever it changes: whether the reader is at the
   * bottom and whether the list overflows at all — for hosts that place their own
   * jump-to-latest affordance outside the list.
   */
  onscrollstate?: (state: { atBottom: boolean; scrollable: boolean }) => void;
  onretry?: () => void;
  onfeedback?: (value: ChatMessageFeedback, message: ChatMessageData) => void;
};
