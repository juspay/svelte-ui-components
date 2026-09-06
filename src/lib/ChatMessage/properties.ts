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
  /**
   * Collapse the rendered body to this many lines and render a `Button` below it
   * that expands and re-collapses the message; that button is the only control.
   * `0` or omitted leaves the message uncollapsed and renders no control.
   * The clamp applies to the rendered body, so `content` — and therefore the copy
   * action — always carries the whole message. A consumer stylesheet setting
   * `--chat-message-clamp-lines` takes priority over this value, so a theme can set
   * the line count for every message without touching each call site.
   */
  clampLines?: number;
  streaming?: boolean;
  /**
   * Reveal the message progressively instead of all at once, using `TypewriterText`.
   * Drives off `markdown` or `content` — never `html`, since typing a pre-rendered
   * string would put its tags on screen — and types `markdown` through the same
   * pipeline the static branch uses, so rich text reveals as rich text. `streaming`
   * decides the mode: while it is true, text keeps typing as it grows; the moment it
   * turns false the remainder is shown at once. Ignored when a `body` snippet is set.
   */
  typewriter?: boolean;
  /** Milliseconds between characters while typing, clamped to a minimum of 1. A non-finite value is ignored. Defaults to `TypewriterText`'s own. */
  typewriterSpeed?: number;
  status?: ChatMessageStatus;
  avatar?: Snippet;
  header?: Snippet;
  attachments?: Snippet | null;
  allowCopy?: boolean;
  actions?: Snippet;
  copyLabel?: string;
  retryLabel?: string;
  /**
   * Label on the expand/collapse button rendered when `clampLines` is set, swapped
   * on the expanded state.
   */
  expandLabel?: string;
  collapseLabel?: string;
  feedbackUpLabel?: string;
  feedbackDownLabel?: string;
  testId?: string;
  classes?: string;
};

export type ChatMessageEventProperties = {
  onretry?: (() => void) | null;
  /** @deprecated Use `onretry` instead; both work until 4.0.0. */
  onRetry?: (() => void) | null;
  onfeedback?: ((value: ChatMessageFeedback) => void) | null;
  /** @deprecated Use `onfeedback` instead; both work until 4.0.0. */
  onFeedback?: ((value: ChatMessageFeedback) => void) | null;
  oncopy?: (text: string) => void;
  /** @deprecated Use `oncopy` instead; both work until 4.0.0. */
  onCopy?: (text: string) => void;
};
