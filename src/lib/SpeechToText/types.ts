export type SpeechRecognitionAlternative = {
  transcript: string;
};

export type SpeechRecognitionResultItem = {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
};

export type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultItem[];
};

export type SpeechRecognitionErrorEvent = {
  error: string;
};

/**
 * The browser's non-standard SpeechRecognition surface, reduced to the members the
 * controller drives. lib.dom does not declare the API, so the shape lives here and
 * a fake implementing it can be injected for tests and demos.
 */
export type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: () => void;
  onresult: (event: SpeechRecognitionResultEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
};

export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export type SpeechPermissionResult = {
  granted: boolean;
  error?: string;
};

/** User-facing copy the controller emits outside the per-error-code map. */
export type SpeechToTextMessages = {
  unsupported: string;
  initFailed: string;
  startFailed: string;
  startRetryFailedPrefix: string;
  fallback: string;
  permissionDenied: string;
  permissionPreviouslyDenied: string;
  permissionRequestFailed: string;
};

export type SpeechToTextOptions = {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  /** How long an error toast stays visible. */
  errorTimeoutMs?: number;
  /** Per-recognition-error-code messages, merged over the built-in map. */
  errorMessages?: Record<string, string>;
  /** Copy overrides, merged over the built-in defaults. */
  messages?: Partial<SpeechToTextMessages>;
  /** Resolves the recognition constructor; defaults to the browser's. Injectable for tests. */
  getRecognitionConstructor?: () => SpeechRecognitionConstructor | null;
  /**
   * Host permission hook (e.g. a native shell's microphone bridge). Called on a start
   * attempt; return null to mean "no bridge here", which falls through to the standard
   * browser flow without consuming the single proactive request. A resolved denial is
   * remembered and short-circuits later attempts.
   */
  requestPermission?: () => Promise<SpeechPermissionResult> | null;
  /** Text the transcript starts from when listening begins (e.g. the composer's current value). */
  seedTranscript?: () => string;
  /** Fires with the accumulated transcript each time a final result lands. */
  onTranscript?: (transcript: string) => void;
  onListeningChange?: (listening: boolean) => void;
  onError?: (message: string, code: string | null) => void;
  /** Non-fatal internals worth logging; hosts wire this to their telemetry. */
  onDiagnostic?: (event: string, detail: Record<string, string | number | boolean | null>) => void;
};
