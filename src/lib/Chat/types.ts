export type ChatParty = 'sender' | 'responder';

export type ChatRole = ChatParty | 'user' | 'assistant' | 'system' | (string & {});

export type ChatMessageStatus = 'sending' | 'sent' | 'error';

export type ChatMessageData = {
  id: string;
  role: ChatRole;
  content: string;
  html?: string;
  /**
   * Markdown source rendered through the library's sanitized pipeline (see
   * MarkdownText). Wins over `html` and `content` in the bubble.
   */
  markdown?: string;
  streaming?: boolean;
  status?: ChatMessageStatus;
  timestamp?: number;
  attachments?: unknown[];
};

export type ChatToolStatus = {
  tool?: string;
  label: string;
  state?: 'calling' | 'done';
};

export type ChatError = {
  code?: string;
  message: string;
};

export type ChatStreamHandlers = {
  onText: (chunk: string) => void;
  onToolStatus?: (status: ChatToolStatus | null) => void;
  onAttachment?: (attachment: unknown) => void;
  onError?: (error: ChatError) => void;
  onDone?: (meta?: ChatCompletion) => void;
};

export type ChatCompletion = {
  sessionId?: string;
};

export type ChatTransportInput = {
  message: string;
  history: ChatMessageData[];
  sessionId: string | null;
  signal: AbortSignal;
};

export type ChatTransport = (
  input: ChatTransportInput,
  handlers: ChatStreamHandlers
) => Promise<void>;

export type ChatControllerOptions = {
  transport: ChatTransport;
  initialMessages?: ChatMessageData[];
  typewriter?: boolean;
  generateId?: () => string;
};
