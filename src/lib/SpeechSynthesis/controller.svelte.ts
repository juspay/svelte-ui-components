import type {
  SpeechSynthesisEngineLike,
  SpeechSynthesisMessages,
  SpeechSynthesisOptions,
  SpeechUtteranceCallbacks,
  SpeechUtteranceOptions,
  SpeechUtteranceRequest
} from './types';

// The engine fires these when OUR OWN stop()/re-speak cancels an in-flight utterance --
// expected traffic (per the Web Speech spec, cancel() interrupts via onerror, not onend),
// not a failure worth surfacing as a toast.
const SILENT_ERROR_CODES: readonly string[] = ['canceled', 'interrupted'];

const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  'not-allowed':
    'Speech playback is blocked. Allow audio in your browser settings to hear this read aloud.',
  'audio-busy': 'Audio output is busy. Please try again.',
  'audio-hardware': 'No audio output device found.',
  network:
    'A network error interrupted speech playback. Please check your connection and try again.',
  'synthesis-failed': 'Could not read this text aloud. Please try again.',
  'synthesis-unavailable': 'Speech playback is unavailable right now. Please try again.',
  'language-unavailable': 'The requested language is not available for speech playback.',
  'voice-unavailable': 'The requested voice is not available for speech playback.',
  'text-too-long': 'This text is too long to read aloud.',
  'invalid-argument': 'Could not read this text aloud due to an invalid option.'
};

const DEFAULT_MESSAGES: SpeechSynthesisMessages = {
  unsupported: 'Speech playback is not supported in this browser.',
  fallback: 'Could not read this text aloud. Please try again.'
};

export const DEFAULT_ERROR_TIMEOUT_MS = 4000;

// Web Speech spec ranges for SpeechSynthesisUtterance.rate/pitch/volume -- a value outside
// these throws or is silently ignored depending on the browser, so the controller clamps
// instead of leaving that behavior to chance.
const RATE_RANGE = { min: 0.1, max: 10, fallback: 1 };
const PITCH_RANGE = { min: 0, max: 2, fallback: 1 };
const VOLUME_RANGE = { min: 0, max: 1, fallback: 1 };

function errorDetail(raw: unknown): string {
  return raw instanceof Error ? raw.message : String(raw);
}

/**
 * Clamps a caller-supplied numeric option into `[min, max]`, falling back to `fallback` for
 * a non-finite value (`NaN`, `+/-Infinity`) rather than clamping garbage into range silently.
 * Exported (and kept free of the class) so range enforcement is unit-testable without a
 * browser or an engine.
 */
export function clampSpeechNumber(
  value: number,
  range: { readonly min: number; readonly max: number; readonly fallback: number }
): number {
  if (!Number.isFinite(value)) {
    return range.fallback;
  }
  return Math.min(range.max, Math.max(range.min, value));
}

/** Floors a caller-supplied toast delay at zero, falling back to the default for non-finite input. */
export function clampErrorTimeoutMs(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ERROR_TIMEOUT_MS;
  }
  return Math.max(0, value);
}

/**
 * Wraps the real `speechSynthesis` global so the controller only ever talks to
 * `SpeechSynthesisEngineLike` -- never a live `SpeechSynthesisUtterance` (which extends
 * EventTarget). `speak()` builds and wires a real utterance internally per call; nothing
 * outside this function ever sees it.
 *
 * `window.speechSynthesis` is a single page-wide singleton, so voice-change notification is
 * wired with `addEventListener('voiceschanged', ...)` rather than the single-slot
 * `.onvoiceschanged =` property -- the latter would let a second controller's registration
 * silently overwrite a first controller's, since both would be assigning the same DOM
 * property on the same object. `addEventListener` registration is additive: each call to
 * this function adds its own listener, and the engine's own `onvoiceschanged` setter -- the
 * injected-engine contract stays a plain property, unrelated to how this wrapper talks to
 * the real DOM object underneath -- removes exactly that listener when the controller tears
 * down (`set onvoiceschanged(null)`), never another instance's.
 */
export function createBrowserEngine(synth: SpeechSynthesis): SpeechSynthesisEngineLike {
  let voicesChangedHandler: (() => void) | null = null;
  let listening = false;
  const dispatch = (): void => {
    voicesChangedHandler?.();
  };
  return {
    get speaking() {
      return synth.speaking;
    },
    get onvoiceschanged() {
      return voicesChangedHandler;
    },
    set onvoiceschanged(handler) {
      voicesChangedHandler = handler;
      if (handler === null) {
        if (listening) {
          synth.removeEventListener('voiceschanged', dispatch);
          listening = false;
        }
      } else if (!listening) {
        synth.addEventListener('voiceschanged', dispatch);
        listening = true;
      }
    },
    getVoices: () => synth.getVoices(),
    cancel: () => synth.cancel(),
    speak: (request, callbacks) => {
      // `createBrowserEngine` is exported, so a caller can reach it directly and
      // run it somewhere `SpeechSynthesisUtterance` does not exist. The
      // controller's own path guards `window` before ever getting here; this
      // guard is for the direct caller, and reports through the normal error
      // channel rather than throwing out of `speak()`.
      if (typeof SpeechSynthesisUtterance !== 'function') {
        callbacks.onerror('synthesis-unavailable');
        return;
      }
      const utterance = new SpeechSynthesisUtterance(request.text);
      utterance.lang = request.lang;
      utterance.rate = request.rate;
      utterance.pitch = request.pitch;
      utterance.volume = request.volume;
      utterance.voice = request.voice;
      utterance.onstart = () => callbacks.onstart();
      utterance.onend = () => callbacks.onend();
      utterance.onerror = (event) => callbacks.onerror(event.error);
      synth.speak(utterance);
    }
  };
}

function defaultSynthesisEngine(): SpeechSynthesisEngineLike | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }
  return createBrowserEngine(window.speechSynthesis);
}

/** The primary language subtag (BCP 47), lowercased -- the part before the first '-', which
 *  may be two letters ('en') or three ('fil', 'haw', 'yue'), not always the first two characters. */
function primarySubtag(lang: string): string {
  const dashIndex = lang.indexOf('-');
  const subtag = dashIndex === -1 ? lang : lang.slice(0, dashIndex);
  return subtag.toLowerCase();
}

/** Platform default among voices matching `lang`'s primary subtag, else the first such match, else the platform default overall, else null. */
function defaultSelectVoice(
  voices: readonly SpeechSynthesisVoice[],
  lang: string
): SpeechSynthesisVoice | null {
  const subtag = primarySubtag(lang);
  const matching =
    subtag.length > 0 ? voices.filter((voice) => primarySubtag(voice.lang) === subtag) : [];
  const pool = matching.length > 0 ? matching : voices;
  const preferred = pool.find((voice) => voice.default);
  return preferred ?? pool[0] ?? null;
}

/**
 * Headless text-to-speech over the browser's `speechSynthesis` API. The symmetric
 * counterpart to `SpeechToTextController`: support detection, the voiceschanged dance for
 * voice enumeration, toggle-to-stop orchestration (calling `speak()` while already speaking
 * stops instead of starting a new utterance), and a self-hiding error toast. Rendering
 * stays entirely with the host.
 */
export class SpeechSynthesisController {
  /** True between the confirmed start and end of an utterance. */
  speaking = $state(false);
  /** Often empty until the platform's voiceschanged fires -- see `initialize()`. */
  voices: readonly SpeechSynthesisVoice[] = $state([]);
  errorMessage = $state('');
  errorVisible = $state(false);
  supported = $state(false);

  private readonly options: SpeechSynthesisOptions;
  private readonly messages: SpeechSynthesisMessages;
  private readonly errorMessages: Record<string, string>;
  private engine: SpeechSynthesisEngineLike | null = null;
  private everInitialized = false;
  private internalSpeaking = false;
  private errorTimer: ReturnType<typeof setTimeout> | null = null;
  // Bumped per speak()/stop(); callbacks captured by a superseded utterance compare
  // against it so a late onend/onerror cannot affect state for a newer utterance
  // (mirrors SpeechToTextController's instanceGeneration guard).
  private speechGeneration = 0;

  constructor(options: SpeechSynthesisOptions = {}) {
    this.options = options;
    this.messages = { ...DEFAULT_MESSAGES, ...options.messages };
    this.errorMessages = { ...DEFAULT_ERROR_MESSAGES, ...options.errorMessages };
  }

  /**
   * Detects the API and starts tracking voices. Safe to call again; `speak` calls it
   * lazily if the host never did. Re-initializing onto a *different* engine (a
   * `getSynthesisEngine` swap, not merely calling this twice against the same one) tears the
   * previous engine down first -- otherwise it would keep speaking with its `onvoiceschanged`
   * handler still live, and a later `stop()`/`destroy()` would only ever reach the new engine.
   */
  initialize(): boolean {
    this.everInitialized = true;
    const getEngine = this.options.getSynthesisEngine ?? defaultSynthesisEngine;
    let engine: SpeechSynthesisEngineLike | null;
    try {
      engine = getEngine();
    } catch (error) {
      this.diagnose('initializeFailed', { error: errorDetail(error) });
      engine = null;
    }
    if (this.engine !== null && this.engine !== engine) {
      this.teardownEngine(this.engine);
    }
    this.supported = engine !== null;
    this.engine = engine;
    if (engine === null) {
      return false;
    }
    engine.onvoiceschanged = () => {
      this.refreshVoices();
    };
    this.refreshVoices();
    return true;
  }

  /**
   * Speaks `text`. Calling this while already speaking stops instead of starting a new
   * utterance -- the same toggle-to-stop behavior as a mic button's start/stop click.
   */
  speak(text: string, options: SpeechUtteranceOptions = {}): void {
    if (this.internalSpeaking) {
      this.stop();
      return;
    }
    if (!this.everInitialized) {
      this.initialize();
    }
    if (!this.supported || this.engine === null) {
      this.showError(this.messages.unsupported);
      return;
    }
    if (text.length === 0) {
      return;
    }

    const lang = options.lang ?? this.options.lang ?? '';
    const request: SpeechUtteranceRequest = {
      text,
      lang,
      rate: clampSpeechNumber(options.rate ?? this.options.rate ?? RATE_RANGE.fallback, RATE_RANGE),
      pitch: clampSpeechNumber(
        options.pitch ?? this.options.pitch ?? PITCH_RANGE.fallback,
        PITCH_RANGE
      ),
      volume: clampSpeechNumber(
        options.volume ?? this.options.volume ?? VOLUME_RANGE.fallback,
        VOLUME_RANGE
      ),
      // `??` would treat an explicit `voice: null` (opt out of voice selection) the same as
      // an absent option, silently overriding it with resolveVoice() -- checked against the
      // key being unset instead, so `null` passes through untouched.
      voice: typeof options.voice === 'undefined' ? this.resolveVoice(lang) : options.voice
    };

    this.speechGeneration += 1;
    const generation = this.speechGeneration;
    const isCurrent = (): boolean => generation === this.speechGeneration;
    const callbacks: SpeechUtteranceCallbacks = {
      onstart: () => {
        if (isCurrent()) {
          this.handleStart();
        }
      },
      onend: () => {
        if (isCurrent()) {
          this.handleEnd();
        }
      },
      onerror: (code) => {
        if (isCurrent()) {
          this.handleUtteranceError(code);
        }
      }
    };

    this.internalSpeaking = true;
    this.errorMessage = '';
    this.errorVisible = false;
    try {
      this.engine.speak(request, callbacks);
    } catch (error) {
      this.internalSpeaking = false;
      this.diagnose('speakThrew', { error: errorDetail(error) });
      this.showError(this.messages.fallback);
    }
  }

  stop(): void {
    // Invalidate any in-flight utterance's callbacks before cancel() can fire them -- cancel()
    // itself may synchronously trigger onerror('canceled'), which must NOT re-run through
    // handleUtteranceError (that would double-fire onSpeakingChange with a redundant `false`).
    // The diagnostic for a self-initiated stop is emitted here instead, since the generation
    // bump means the engine round-trip can no longer be trusted to deliver it.
    this.speechGeneration += 1;
    if (this.internalSpeaking) {
      this.internalSpeaking = false;
      this.setSpeaking(false);
      this.diagnose('utteranceCanceled', { code: 'canceled' });
    }
    if (this.engine !== null) {
      this.engine.cancel();
    }
  }

  /** Clears the toast timer and tears the engine connection down. */
  destroy(): void {
    this.speechGeneration += 1;
    if (this.errorTimer !== null) {
      clearTimeout(this.errorTimer);
      this.errorTimer = null;
    }
    if (this.engine !== null) {
      try {
        this.engine.cancel();
      } catch (cancelError) {
        this.diagnose('cancelErrorOnDestroy', { error: errorDetail(cancelError) });
      }
      this.engine.onvoiceschanged = null;
      this.engine = null;
    }
    this.internalSpeaking = false;
    // cancel() firing onerror is not guaranteed (a superseded generation may swallow it),
    // so clear the public state too -- a consumer's speaking indicator must not survive teardown.
    if (this.speaking) {
      this.setSpeaking(false);
    }
  }

  /** Stops a superseded engine and detaches its listener; invalidates any utterance still in flight on it. */
  private teardownEngine(engine: SpeechSynthesisEngineLike): void {
    this.speechGeneration += 1;
    if (this.internalSpeaking) {
      this.internalSpeaking = false;
      this.setSpeaking(false);
      this.diagnose('utteranceCanceled', { code: 'canceled' });
    }
    try {
      engine.cancel();
    } catch (cancelError) {
      this.diagnose('cancelErrorOnReplace', { error: errorDetail(cancelError) });
    }
    engine.onvoiceschanged = null;
  }

  private refreshVoices(): void {
    if (this.engine === null) {
      return;
    }
    // Copied rather than assigned through. `getSynthesisEngine` is a documented
    // seam for tests, demos and non-browser hosts, so an engine returning a
    // stable array it mutates in place is a supported shape -- and a raw array
    // mutated behind a `$state` proxy is not reliably observed. The real
    // `speechSynthesis.getVoices()` returns a fresh array (WebIDL sequence),
    // which is why the browser path never showed this. A copy costs nothing and
    // removes the aliasing entirely.
    this.voices = [...this.engine.getVoices()];
    this.diagnose('voicesChanged', { count: this.voices.length });
  }

  /**
   * Runs voice selection (the caller-supplied `selectVoice` hook, or the built-in default)
   * guarded the same way `getSynthesisEngine` is guarded in `initialize()`: a throwing hook
   * must not propagate out of `speak()` and strand the caller's utterance, so it is reported
   * via `onDiagnostic` and selection falls back to the built-in default instead.
   */
  private resolveVoice(lang: string): SpeechSynthesisVoice | null {
    const selectVoice = this.options.selectVoice ?? defaultSelectVoice;
    try {
      return selectVoice(this.voices, lang);
    } catch (error) {
      this.diagnose('selectVoiceThrew', { error: errorDetail(error) });
      return defaultSelectVoice(this.voices, lang);
    }
  }

  private handleStart(): void {
    this.internalSpeaking = true;
    this.setSpeaking(true);
  }

  private handleEnd(): void {
    this.internalSpeaking = false;
    this.setSpeaking(false);
  }

  private handleUtteranceError(code: string): void {
    this.internalSpeaking = false;
    this.setSpeaking(false);
    if (SILENT_ERROR_CODES.includes(code)) {
      this.diagnose('utteranceCanceled', { code });
      return;
    }
    this.showError(this.errorMessages[code] ?? this.messages.fallback, code);
  }

  private setSpeaking(speaking: boolean): void {
    this.speaking = speaking;
    this.options.onSpeakingChange?.(speaking);
  }

  private showError(message: string, code: string | null = null): void {
    this.errorMessage = message;
    this.errorVisible = true;
    if (this.errorTimer !== null) {
      clearTimeout(this.errorTimer);
    }
    this.errorTimer = setTimeout(
      () => {
        this.errorVisible = false;
      },
      clampErrorTimeoutMs(this.options.errorTimeoutMs ?? DEFAULT_ERROR_TIMEOUT_MS)
    );
    this.options.onError?.(message, code);
  }

  private diagnose(event: string, detail: Record<string, string | number | boolean | null>): void {
    this.options.onDiagnostic?.(event, detail);
  }
}
