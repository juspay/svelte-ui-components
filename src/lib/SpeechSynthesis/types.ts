/**
 * The browser's `speechSynthesis` surface, reduced to what the controller drives. Unlike
 * SpeechRecognition, lib.dom does declare this API -- but jsdom does not implement it at
 * runtime, and the real SpeechSynthesisUtterance extends EventTarget, which would force
 * every fake in tests to also fake addEventListener/removeEventListener/dispatchEvent.
 * Utterance construction and event wiring are pushed inside the engine (`speak` takes a
 * plain data request plus a callback bag) so a fake never has to impersonate a live DOM
 * object -- only this flat surface -- and can be injected for tests and demos.
 */
export type SpeechSynthesisEngineLike = {
  readonly speaking: boolean;
  onvoiceschanged: (() => void) | null;
  getVoices: () => readonly SpeechSynthesisVoice[];
  speak: (request: SpeechUtteranceRequest, callbacks: SpeechUtteranceCallbacks) => void;
  cancel: () => void;
};

export type SpeechUtteranceRequest = {
  text: string;
  lang: string;
  rate: number;
  pitch: number;
  volume: number;
  voice: SpeechSynthesisVoice | null;
};

export type SpeechUtteranceCallbacks = {
  onstart: () => void;
  onend: () => void;
  onerror: (code: string) => void;
};

/** Per-call overrides for `speak()`; falls back to the controller's own options, then platform defaults. */
export type SpeechUtteranceOptions = {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
};

/** User-facing copy the controller emits outside the per-error-code map. */
export type SpeechSynthesisMessages = {
  unsupported: string;
  fallback: string;
};

export type SpeechSynthesisOptions = {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  /**
   * Picks the voice for an utterance when neither the call nor the controller names one.
   * Defaults to the platform's default voice among those matching `lang`, else the first
   * voice matching `lang`, else the platform default overall, else null (let the engine
   * pick). A caller-supplied list of preferred voice names is exactly this hook, called
   * with the enumerated voices -- there is no baked-in preferred-voice list.
   */
  selectVoice?: (
    voices: readonly SpeechSynthesisVoice[],
    lang: string
  ) => SpeechSynthesisVoice | null;
  /** How long an error toast stays visible. */
  errorTimeoutMs?: number;
  /** Per-synthesis-error-code messages, merged over the built-in map. */
  errorMessages?: Record<string, string>;
  /** Copy overrides, merged over the built-in defaults. */
  messages?: Partial<SpeechSynthesisMessages>;
  /** Resolves the synthesis engine; defaults to the browser's. Injectable for tests. */
  getSynthesisEngine?: () => SpeechSynthesisEngineLike | null;
  onSpeakingChange?: (speaking: boolean) => void;
  onError?: (message: string, code: string | null) => void;
  /** Non-fatal internals worth logging; hosts wire this to their telemetry. */
  onDiagnostic?: (event: string, detail: Record<string, string | number | boolean | null>) => void;
};
