import type {
  SpeechRecognitionConstructor,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionLike,
  SpeechRecognitionResultEvent,
  SpeechToTextMessages,
  SpeechToTextOptions
} from './types';

const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  'not-allowed':
    'Microphone access is blocked. Allow microphone access in your browser settings to use voice input.',
  'service-not-allowed':
    'Microphone access is blocked. Allow microphone access in your browser settings to use voice input.',
  'no-speech': 'No speech detected. Please speak closer to your microphone and try again.',
  'audio-capture': 'No microphone found. Please connect a microphone and try again.',
  network: 'A network error interrupted voice input. Please check your connection and try again.'
};

const DEFAULT_MESSAGES: SpeechToTextMessages = {
  unsupported: 'Speech recognition not supported in this browser.',
  initFailed: 'Failed to initialize speech recognition service.',
  startFailed: 'Recognition service could not be initialized for starting.',
  startRetryFailedPrefix: 'Failed to start speech recognition even after retry: ',
  fallback: 'Could not start voice input. Please try again.',
  permissionDenied: 'Microphone permission denied.',
  permissionPreviouslyDenied: 'Microphone permission was previously denied.',
  permissionRequestFailed: 'Failed to request microphone permission.'
};

const DEFAULT_ERROR_TIMEOUT_MS = 4000;

type SpeechCapableWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

function defaultRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const speechWindow: SpeechCapableWindow = window;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function errorName(raw: unknown): string {
  return raw instanceof Error ? raw.name : 'UnknownError';
}

function errorDetail(raw: unknown): string {
  return raw instanceof Error ? raw.message : String(raw);
}

function permissionRejectionDetail(raw: unknown): string | null {
  if (
    typeof raw === 'object' &&
    raw !== null &&
    'error' in raw &&
    typeof raw.error === 'string' &&
    raw.error.length > 0
  ) {
    return raw.error;
  }
  if (raw instanceof Error && raw.message.length > 0) {
    return raw.message;
  }
  return null;
}

/**
 * Headless speech-to-text over the browser's SpeechRecognition API. Owns the whole
 * lifecycle a mic button needs — support detection, a one-shot host permission hook,
 * start-with-retry, interim/final transcript assembly, and a self-hiding error toast —
 * and exposes it as reactive fields plus callbacks. Rendering stays entirely with the
 * host; pair it with ChatComposer's voice control (`recording`, `onvoice`).
 */
export class SpeechToTextController {
  /** True between the notified start and end of a listening session. */
  listening = $state(false);
  /** Committed transcript plus the current interim guess; what a composer shows while listening. */
  interimText = $state('');
  errorMessage = $state('');
  errorVisible = $state(false);
  supported = $state(false);

  private readonly options: SpeechToTextOptions;
  private readonly messages: SpeechToTextMessages;
  private readonly errorMessages: Record<string, string>;
  private recognition: SpeechRecognitionLike | null = null;
  // Bumped per initialize(); handlers captured by a discarded instance compare
  // against it so a late onend/onerror from the old engine cannot end the new
  // session (start() rebuilds the instance on its retry path).
  private instanceGeneration = 0;
  private transcript = '';
  private internalListening = false;
  private everInitialized = false;
  private errorTimer: ReturnType<typeof setTimeout> | null = null;
  private permissionRequested = false;
  private permissionGranted: boolean | null = null;

  constructor(options: SpeechToTextOptions = {}) {
    this.options = options;
    this.messages = { ...DEFAULT_MESSAGES, ...options.messages };
    this.errorMessages = { ...DEFAULT_ERROR_MESSAGES, ...options.errorMessages };
  }

  /**
   * Detects the API and builds a wired recognition instance. Safe to call again
   * to rebuild after a failure; `start` calls it lazily if the host never did.
   */
  initialize(): boolean {
    this.everInitialized = true;
    const getConstructor = this.options.getRecognitionConstructor ?? defaultRecognitionConstructor;
    const RecognitionApi = getConstructor();
    this.supported = RecognitionApi !== null;
    if (RecognitionApi === null) {
      this.recognition = null;
      return false;
    }
    try {
      const instance = new RecognitionApi();
      this.instanceGeneration += 1;
      const generation = this.instanceGeneration;
      const isCurrent = (): boolean => generation === this.instanceGeneration;
      instance.continuous = this.options.continuous ?? false;
      instance.interimResults = this.options.interimResults ?? true;
      instance.lang = this.options.lang ?? 'en-US';
      instance.onstart = () => {
        if (isCurrent()) {
          this.handleStart();
        }
      };
      instance.onresult = (event) => {
        if (isCurrent()) {
          this.handleResult(event);
        }
      };
      instance.onerror = (event) => {
        if (isCurrent()) {
          this.handleRecognitionError(event);
        }
      };
      instance.onend = () => {
        if (isCurrent()) {
          this.handleEnd();
        }
      };
      this.recognition = instance;
      return true;
    } catch (error) {
      this.supported = false;
      this.recognition = null;
      this.diagnose('initializeFailed', { error: errorDetail(error) });
      this.showError(this.messages.initFailed);
      return false;
    }
  }

  start(): void {
    if (!this.everInitialized) {
      this.initialize();
    }
    if (!this.supported) {
      this.showError(this.messages.unsupported);
      return;
    }
    if (this.recognition === null && !this.initialize()) {
      return;
    }
    this.attemptStart(false);
  }

  stop(): void {
    if (this.internalListening) {
      this.internalListening = false;
      this.setListening(false);
    }
    if (this.recognition !== null) {
      this.recognition.stop();
    }
  }

  /**
   * The mic-button handler: stops when listening, otherwise runs the permission
   * gate (at most one proactive host request, denial remembered) and starts.
   */
  async toggle(): Promise<void> {
    if (this.internalListening) {
      this.stop();
      return;
    }
    const requestPermission = this.options.requestPermission ?? null;
    if (requestPermission === null) {
      this.start();
      return;
    }
    if (this.permissionRequested) {
      if (this.permissionGranted === false) {
        this.showError(this.messages.permissionPreviouslyDenied);
      } else {
        this.start();
      }
      return;
    }
    const pending = requestPermission();
    if (pending === null) {
      this.start();
      return;
    }
    this.permissionRequested = true;
    try {
      const result = await pending;
      this.permissionGranted = result.granted;
      if (result.granted) {
        this.start();
      } else {
        const denialMessage =
          typeof result.error === 'string' && result.error.length > 0
            ? result.error
            : this.messages.permissionDenied;
        this.showError(denialMessage);
      }
    } catch (error) {
      this.permissionGranted = false;
      this.showError(permissionRejectionDetail(error) ?? this.messages.permissionRequestFailed);
    }
  }

  /** Clears the toast timer and tears the recognition instance down. */
  destroy(): void {
    if (this.errorTimer !== null) {
      clearTimeout(this.errorTimer);
      this.errorTimer = null;
    }
    if (this.recognition !== null) {
      try {
        this.recognition.abort();
      } catch (abortError) {
        this.diagnose('recognitionAbortErrorOnDestroy', { error: errorDetail(abortError) });
      }
      this.recognition = null;
    }
    this.internalListening = false;
    // abort() is not guaranteed to fire onend, so clear the public state too —
    // a consumer's recording indicator must not survive teardown.
    if (this.listening) {
      this.setListening(false);
    }
  }

  private attemptStart(isRetry: boolean): void {
    if (this.recognition === null) {
      this.showError(this.messages.startFailed);
      this.internalListening = false;
      this.setListening(false);
      return;
    }
    try {
      this.internalListening = true;
      this.errorMessage = '';
      this.errorVisible = false;
      this.recognition.start();
    } catch (error) {
      if (!isRetry) {
        try {
          this.recognition.abort();
        } catch (abortError) {
          this.diagnose('recognitionAbortErrorOnRetry', {
            error: errorDetail(abortError),
            rawError: String(abortError)
          });
        }
        if (this.initialize()) {
          this.attemptStart(true);
        } else {
          this.internalListening = false;
          this.setListening(false);
        }
      } else {
        this.showError(
          `${this.messages.startRetryFailedPrefix}${errorName(error)} - ${errorDetail(error)}`
        );
        this.internalListening = false;
        this.setListening(false);
      }
    }
  }

  private handleStart(): void {
    this.transcript = this.options.seedTranscript ? this.options.seedTranscript() : '';
    this.interimText = this.transcript;
    this.internalListening = true;
    this.setListening(true);
  }

  private handleResult(event: SpeechRecognitionResultEvent): void {
    let finalTranscript = '';
    let currentInterimTranscript = '';

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
      } else {
        currentInterimTranscript += result[0].transcript;
      }
    }

    this.interimText =
      this.transcript + (currentInterimTranscript ? ' ' + currentInterimTranscript : '');
    if (finalTranscript) {
      this.transcript = this.transcript ? `${this.transcript.trimEnd()} ` : '';
      this.transcript += finalTranscript;
      this.options.onTranscript?.(this.transcript);
    }
  }

  private handleRecognitionError(event: SpeechRecognitionErrorEvent): void {
    this.internalListening = false;
    this.setListening(false);
    this.showError(this.errorMessages[event.error] ?? this.messages.fallback, event.error);
  }

  private handleEnd(): void {
    this.internalListening = false;
    this.setListening(false);
  }

  private setListening(listening: boolean): void {
    this.listening = listening;
    this.options.onListeningChange?.(listening);
  }

  private showError(message: string, code: string | null = null): void {
    this.errorMessage = message;
    this.errorVisible = true;
    if (this.errorTimer !== null) {
      clearTimeout(this.errorTimer);
    }
    this.errorTimer = setTimeout(() => {
      this.errorVisible = false;
    }, this.options.errorTimeoutMs ?? DEFAULT_ERROR_TIMEOUT_MS);
    this.options.onError?.(message, code);
  }

  private diagnose(event: string, detail: Record<string, string | number | boolean | null>): void {
    this.options.onDiagnostic?.(event, detail);
  }
}
