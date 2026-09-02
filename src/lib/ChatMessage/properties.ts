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
   * Markdown source rendered through the library's sanitized-by-construction
   * pipeline (raw HTML is escaped; unsafe link/image protocols are stripped) —
   * unlike `html`, which must arrive pre-sanitized. Non-empty `markdown` takes
   * precedence over `html` and `content`; a `body` snippet still wins. An
   * empty string is treated as absent and falls through, exactly like `html`.
   * Also serves as the copy text when `content` is empty. The pipeline loads
   * on demand, so the `marked` peer is only needed when this prop is used;
   * during SSR and while loading, `html`/`content` render as the fallback
   * (for server-rendered markdown use `MarkdownText` or `renderMarkdown`).
   */
  markdown?: string;
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
  onRetry?: (() => void) | null;
  onfeedback?: ((value: ChatMessageFeedback) => void) | null;
  onFeedback?: ((value: ChatMessageFeedback) => void) | null;
  oncopy?: (text: string) => void;
  onCopy?: (text: string) => void;
};
