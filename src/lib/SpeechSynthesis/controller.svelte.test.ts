import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SpeechSynthesisController,
  clampErrorTimeoutMs,
  clampSpeechNumber,
  createBrowserEngine,
  DEFAULT_ERROR_TIMEOUT_MS
} from './controller.svelte';
import type {
  SpeechSynthesisEngineLike,
  SpeechUtteranceCallbacks,
  SpeechUtteranceRequest
} from './types';

/**
 * A faithful stand-in for the browser's speechSynthesis: voices start empty (as they
 * commonly do on first call) and only populate once `setVoices` simulates the async
 * `voiceschanged` event; `cancel()` fires the in-flight utterance's `onerror('canceled')`
 * rather than `onend`, mirroring real engines interrupting a live utterance. Lifecycle
 * events are fired manually (`fireStart`/`fireEnd`/`fireError`) rather than on a timer so
 * tests can interleave them deterministically, including firing a *stale* captured
 * callback after a newer utterance has superseded it.
 */
class FakeSpeechSynthesisEngine implements SpeechSynthesisEngineLike {
  speaking = false;
  onvoiceschanged: (() => void) | null = null;
  cancelCallCount = 0;
  speakCallCount = 0;
  lastRequest: SpeechUtteranceRequest | null = null;
  private voicesList: SpeechSynthesisVoice[] = [];
  private active: SpeechUtteranceCallbacks | null = null;

  getVoices = (): readonly SpeechSynthesisVoice[] => this.voicesList;

  speak = (request: SpeechUtteranceRequest, callbacks: SpeechUtteranceCallbacks): void => {
    this.speakCallCount += 1;
    this.lastRequest = request;
    this.speaking = true;
    this.active = callbacks;
  };

  cancel = (): void => {
    this.cancelCallCount += 1;
    this.speaking = false;
    const callbacks = this.active;
    this.active = null;
    callbacks?.onerror('canceled');
  };

  /** Grabs the currently in-flight utterance's callbacks, to fire later as a stale event. */
  captureActiveCallbacks(): SpeechUtteranceCallbacks | null {
    return this.active;
  }

  fireStart(): void {
    this.active?.onstart();
  }

  fireEnd(): void {
    const callbacks = this.active;
    this.active = null;
    this.speaking = false;
    callbacks?.onend();
  }

  fireError(code: string): void {
    const callbacks = this.active;
    this.active = null;
    this.speaking = false;
    callbacks?.onerror(code);
  }

  setVoices(voices: SpeechSynthesisVoice[]): void {
    this.voicesList = voices;
    this.onvoiceschanged?.();
  }
}

/**
 * A double for the real page-wide `speechSynthesis` singleton -- as opposed to
 * FakeSpeechSynthesisEngine above, which doubles the *reduced*, already-adapted
 * SpeechSynthesisEngineLike surface `createBrowserEngine` produces. This one implements the
 * one DOM behavior Finding 1 is about: `addEventListener('voiceschanged', ...)` accepts
 * multiple independent listeners, unlike a single-slot `.onvoiceschanged =` property, so a
 * test built on it can actually catch a clobbering regression instead of passing regardless
 * (as the pre-fix suite did, since every other test here goes through the already-reduced
 * fake and never exercises `createBrowserEngine` itself).
 */
class FakeBrowserSpeechSynthesis {
  speaking = false;
  private voicesList: SpeechSynthesisVoice[] = [];
  private voicesChangedListeners: Array<() => void> = [];

  addEventListener(type: string, listener: () => void): void {
    if (type === 'voiceschanged') {
      this.voicesChangedListeners.push(listener);
    }
  }

  removeEventListener(type: string, listener: () => void): void {
    if (type === 'voiceschanged') {
      this.voicesChangedListeners = this.voicesChangedListeners.filter(
        (registered) => registered !== listener
      );
    }
  }

  getVoices = (): SpeechSynthesisVoice[] => this.voicesList;
  cancel = (): void => {};
  speak = (): void => {};

  setVoices(voices: SpeechSynthesisVoice[]): void {
    this.voicesList = voices;
    // Copy first: a listener that reacts by registering/unregistering must not mutate the
    // array this loop is iterating.
    for (const listener of [...this.voicesChangedListeners]) {
      listener();
    }
  }

  get voicesChangedListenerCount(): number {
    return this.voicesChangedListeners.length;
  }
}

function makeVoice(overrides: Partial<SpeechSynthesisVoice>): SpeechSynthesisVoice {
  return {
    default: false,
    lang: 'en-US',
    localService: true,
    name: 'Voice',
    voiceURI: 'voice',
    ...overrides
  };
}

describe('SpeechSynthesisController', () => {
  let engine: FakeSpeechSynthesisEngine;

  beforeEach(() => {
    engine = new FakeSpeechSynthesisEngine();
  });

  describe('capability detection and SSR safety', () => {
    it('does not touch the engine getter at construction time (lazy init)', () => {
      const getSynthesisEngine = vi.fn(() => engine);
      new SpeechSynthesisController({ getSynthesisEngine });
      expect(getSynthesisEngine).not.toHaveBeenCalled();
    });

    it('reports unsupported and does not throw when no speechSynthesis is available', () => {
      const controller = new SpeechSynthesisController({ getSynthesisEngine: () => null });
      expect(() => controller.speak('hello')).not.toThrow();
      expect(controller.supported).toBe(false);
      expect(controller.errorVisible).toBe(true);
    });

    it('degrades honestly against the real default path in this jsdom environment (no speechSynthesis implemented)', () => {
      // No getSynthesisEngine override -- exercises the actual window-detection branch.
      const controller = new SpeechSynthesisController();
      const supported = controller.initialize();
      expect(supported).toBe(false);
      expect(controller.supported).toBe(false);
    });

    it('surviving a throwing engine getter without crashing', () => {
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => {
          throw new Error('boom');
        }
      });
      expect(() => controller.initialize()).not.toThrow();
      expect(controller.supported).toBe(false);
    });
  });

  describe('voice enumeration and the voiceschanged dance', () => {
    it('starts empty and populates once voiceschanged fires', () => {
      const controller = new SpeechSynthesisController({ getSynthesisEngine: () => engine });
      controller.initialize();
      expect(controller.voices).toEqual([]);

      const voices = [makeVoice({ name: 'A' }), makeVoice({ name: 'B' })];
      engine.setVoices(voices);

      expect(controller.voices).toEqual(voices);
    });

    it('re-fires still update voices (not a one-shot subscription)', () => {
      const controller = new SpeechSynthesisController({ getSynthesisEngine: () => engine });
      controller.initialize();

      engine.setVoices([makeVoice({ name: 'A' })]);
      expect(controller.voices).toHaveLength(1);

      engine.setVoices([makeVoice({ name: 'A' }), makeVoice({ name: 'B' })]);
      expect(controller.voices).toHaveLength(2);
    });
  });

  describe('speak / state reporting', () => {
    it('reports speaking=true only once the engine confirms start, not synchronously on speak()', () => {
      const speakingChanges: boolean[] = [];
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        onSpeakingChange: (speaking) => speakingChanges.push(speaking)
      });

      controller.speak('hello world');
      expect(controller.speaking).toBe(false);
      expect(speakingChanges).toEqual([]);

      engine.fireStart();
      expect(controller.speaking).toBe(true);
      expect(speakingChanges).toEqual([true]);

      engine.fireEnd();
      expect(controller.speaking).toBe(false);
      expect(speakingChanges).toEqual([true, false]);
    });

    it('passes rate/pitch/volume/lang through to the engine, with per-call overrides beating controller defaults', () => {
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        lang: 'en-GB',
        rate: 0.9,
        pitch: 1.2,
        volume: 0.8
      });

      controller.speak('hi');
      expect(engine.lastRequest).toEqual({
        text: 'hi',
        lang: 'en-GB',
        rate: 0.9,
        pitch: 1.2,
        volume: 0.8,
        voice: null
      });
      engine.fireEnd();

      controller.speak('yo', { rate: 1.5 });
      expect(engine.lastRequest?.rate).toBe(1.5);
      expect(engine.lastRequest?.pitch).toBe(1.2);
    });

    it('does not speak empty text', () => {
      const controller = new SpeechSynthesisController({ getSynthesisEngine: () => engine });
      controller.speak('');
      expect(engine.speakCallCount).toBe(0);
    });

    it('applies the default voice selection: platform default among lang matches', () => {
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        lang: 'en-US'
      });
      controller.initialize();
      const other = makeVoice({ name: 'Other', lang: 'fr-FR', default: true });
      const match = makeVoice({ name: 'Match', lang: 'en-US', default: false });
      const matchDefault = makeVoice({ name: 'MatchDefault', lang: 'en-US', default: true });
      engine.setVoices([other, match, matchDefault]);

      controller.speak('hi');
      expect(engine.lastRequest?.voice).toEqual(matchDefault);
    });

    it('preserves an explicit voice: null override instead of running default selection (Finding 4 regression)', () => {
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        lang: 'en-US'
      });
      controller.initialize();
      // A default-marked match exists, so `??` (which treats null as absent) would silently
      // replace the caller's explicit opt-out with this voice.
      engine.setVoices([makeVoice({ name: 'MatchDefault', lang: 'en-US', default: true })]);

      controller.speak('hi', { voice: null });
      expect(engine.lastRequest?.voice).toBeNull();
    });

    it('falls back to the first lang match when no match is marked default', () => {
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        lang: 'en-US'
      });
      controller.initialize();
      const match = makeVoice({ name: 'Match', lang: 'en-US', default: false });
      engine.setVoices([makeVoice({ name: 'Other', lang: 'fr-FR' }), match]);

      controller.speak('hi');
      expect(engine.lastRequest?.voice).toEqual(match);
    });

    it('honors a caller-supplied selectVoice hook instead of any built-in name list', () => {
      const preferred = makeVoice({ name: 'Preferred', lang: 'en-US' });
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        lang: 'en-US',
        selectVoice: (voices) => voices.find((voice) => voice.name === 'Preferred') ?? null
      });
      controller.initialize();
      engine.setVoices([makeVoice({ name: 'Other' }), preferred]);

      controller.speak('hi');
      expect(engine.lastRequest?.voice).toEqual(preferred);
    });

    it('matches on the full primary language subtag, not a fixed 2-character prefix (Finding 3 regression)', () => {
      // 'fil' (Filipino) is a 3-letter subtag; slicing the first two characters of 'fil-PH'
      // gives 'fi', which is also the whole subtag for Finnish -- the pre-fix bug would have
      // matched the Finnish voice below instead of the correct Filipino one.
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        lang: 'fil-PH'
      });
      controller.initialize();
      const finnish = makeVoice({ name: 'Finnish', lang: 'fi-FI', default: true });
      const filipino = makeVoice({ name: 'Filipino', lang: 'fil-PH', default: false });
      engine.setVoices([finnish, filipino]);

      controller.speak('hi');
      expect(engine.lastRequest?.voice).toEqual(filipino);
    });

    it('matches the primary subtag case-insensitively (Finding 3 regression)', () => {
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        lang: 'EN-us'
      });
      controller.initialize();
      const match = makeVoice({ name: 'Match', lang: 'en-US', default: false });
      engine.setVoices([makeVoice({ name: 'Other', lang: 'fr-FR' }), match]);

      controller.speak('hi');
      expect(engine.lastRequest?.voice).toEqual(match);
    });

    it('an empty lang still matches nothing and falls back to the overall pool, as before (Finding 3 regression guard)', () => {
      const controller = new SpeechSynthesisController({ getSynthesisEngine: () => engine });
      controller.initialize();
      const onlyVoice = makeVoice({ name: 'Only', lang: 'de-DE', default: false });
      engine.setVoices([onlyVoice]);

      controller.speak('hi');
      expect(engine.lastRequest?.voice).toEqual(onlyVoice);
    });

    it('a throwing selectVoice hook does not crash speak(): falls back to the default selection and reports a diagnostic (Finding 2 regression)', () => {
      const onDiagnosticSpy = vi.fn();
      const fallbackMatch = makeVoice({ name: 'Fallback', lang: 'en-US', default: true });
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        lang: 'en-US',
        selectVoice: () => {
          throw new Error('selectVoice boom');
        },
        onDiagnostic: onDiagnosticSpy
      });
      controller.initialize();
      engine.setVoices([fallbackMatch]);

      expect(() => controller.speak('hi')).not.toThrow();
      expect(engine.lastRequest?.voice).toEqual(fallbackMatch);
      expect(onDiagnosticSpy).toHaveBeenCalledWith('selectVoiceThrew', {
        error: 'selectVoice boom'
      });
    });

    it('clamps out-of-range rate/pitch/volume to the Web Speech spec before they reach the engine (Finding 5 regression)', () => {
      const controller = new SpeechSynthesisController({ getSynthesisEngine: () => engine });
      controller.speak('hi', { rate: 100, pitch: -5, volume: 3 });
      expect(engine.lastRequest?.rate).toBe(10);
      expect(engine.lastRequest?.pitch).toBe(0);
      expect(engine.lastRequest?.volume).toBe(1);
    });

    it('falls back to the numeric default when rate/pitch/volume are non-finite (Finding 5 regression)', () => {
      const controller = new SpeechSynthesisController({ getSynthesisEngine: () => engine });
      controller.speak('hi', {
        rate: Number.NaN,
        pitch: Number.POSITIVE_INFINITY,
        volume: Number.NaN
      });
      expect(engine.lastRequest?.rate).toBe(1);
      expect(engine.lastRequest?.pitch).toBe(1);
      expect(engine.lastRequest?.volume).toBe(1);
    });

    it('clamps a construction-time rate/pitch/volume default the same way as a per-call override (Finding 5 regression)', () => {
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        rate: 0.01,
        pitch: 9,
        volume: -1
      });
      controller.speak('hi');
      expect(engine.lastRequest?.rate).toBe(0.1);
      expect(engine.lastRequest?.pitch).toBe(2);
      expect(engine.lastRequest?.volume).toBe(0);
    });
  });

  describe('toggle-to-stop orchestration', () => {
    it('calling speak() while already speaking stops instead of starting a new utterance', () => {
      const controller = new SpeechSynthesisController({ getSynthesisEngine: () => engine });
      controller.speak('first');
      engine.fireStart();
      expect(controller.speaking).toBe(true);
      expect(engine.speakCallCount).toBe(1);

      controller.speak('second');

      expect(engine.cancelCallCount).toBe(1);
      expect(engine.speakCallCount).toBe(1); // no new utterance was started
      expect(controller.speaking).toBe(false);
    });

    it('toggling to stop before the engine confirms start still stops (internal flag, not just the public one)', () => {
      const controller = new SpeechSynthesisController({ getSynthesisEngine: () => engine });
      controller.speak('first');
      // engine.fireStart() never called -- speak() has been issued but not yet confirmed.
      controller.speak('second');

      expect(engine.cancelCallCount).toBe(1);
      expect(engine.speakCallCount).toBe(1);
    });

    it('stop() forwards to the engine even when nothing is speaking', () => {
      const controller = new SpeechSynthesisController({ getSynthesisEngine: () => engine });
      controller.initialize();
      controller.stop();
      expect(engine.cancelCallCount).toBe(1);
    });
  });

  describe('error reporting', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('a real synthesis error shows a toast and fires onError, then self-hides', () => {
      const onErrorSpy = vi.fn();
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        errorTimeoutMs: 1000,
        onError: onErrorSpy
      });
      controller.speak('hello');
      engine.fireError('synthesis-failed');

      expect(controller.errorVisible).toBe(true);
      expect(controller.errorMessage.length).toBeGreaterThan(0);
      expect(controller.speaking).toBe(false);
      expect(onErrorSpy).toHaveBeenCalledWith(controller.errorMessage, 'synthesis-failed');

      vi.advanceTimersByTime(1000);
      expect(controller.errorVisible).toBe(false);
    });

    it('falls back to the default toast delay when errorTimeoutMs is non-finite (Finding 5 regression)', () => {
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        errorTimeoutMs: Number.NaN
      });
      controller.speak('hello');
      engine.fireError('synthesis-failed');
      expect(controller.errorVisible).toBe(true);

      vi.advanceTimersByTime(DEFAULT_ERROR_TIMEOUT_MS - 1);
      expect(controller.errorVisible).toBe(true);
      vi.advanceTimersByTime(1);
      expect(controller.errorVisible).toBe(false);
    });

    it('an unknown error code falls back to the generic message', () => {
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        messages: { fallback: 'Generic fallback copy' }
      });
      controller.speak('hello');
      engine.fireError('some-future-error-code');
      expect(controller.errorVisible).toBe(true);
      expect(controller.errorMessage).toBe('Generic fallback copy');
    });

    it('a caller-supplied errorMessages entry overrides the built-in map', () => {
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        errorMessages: { 'synthesis-failed': 'Custom copy' }
      });
      controller.speak('hello');
      engine.fireError('synthesis-failed');
      expect(controller.errorMessage).toBe('Custom copy');
    });

    it('canceled/interrupted (our own stop()/cancel()) never show an error toast', () => {
      const onErrorSpy = vi.fn();
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        onError: onErrorSpy
      });
      controller.speak('hello');
      controller.stop();

      expect(controller.errorVisible).toBe(false);
      expect(onErrorSpy).not.toHaveBeenCalled();
    });

    it('reports a diagnostic for a silent cancellation', () => {
      const onDiagnosticSpy = vi.fn();
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        onDiagnostic: onDiagnosticSpy
      });
      controller.speak('hello');
      controller.stop();

      expect(onDiagnosticSpy).toHaveBeenCalledWith('utteranceCanceled', { code: 'canceled' });
    });
  });

  describe('stale-event guard (generation)', () => {
    it('a late onend from a superseded utterance cannot resurrect/clobber the current state', () => {
      const speakingChanges: boolean[] = [];
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        onSpeakingChange: (speaking) => speakingChanges.push(speaking)
      });

      controller.speak('first');
      engine.fireStart();
      const staleCallbacks = engine.captureActiveCallbacks();
      expect(controller.speaking).toBe(true);

      // Toggle-to-stop supersedes utterance #1 (this is the synchronous, real stop path).
      controller.speak('second-triggers-stop');
      expect(controller.speaking).toBe(false);
      expect(speakingChanges).toEqual([true, false]);

      // The old engine now fires a late onend for the superseded utterance.
      staleCallbacks?.onend();

      // Must not flip speaking back on, and must not emit a spurious extra change.
      expect(controller.speaking).toBe(false);
      expect(speakingChanges).toEqual([true, false]);
    });

    it('a late onerror from a superseded utterance is ignored the same way', () => {
      const onErrorSpy = vi.fn();
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => engine,
        onError: onErrorSpy
      });

      controller.speak('first');
      const staleCallbacks = engine.captureActiveCallbacks();
      controller.speak('second-triggers-stop');
      onErrorSpy.mockClear();

      staleCallbacks?.onerror('synthesis-failed');

      expect(onErrorSpy).not.toHaveBeenCalled();
      expect(controller.errorVisible).toBe(false);
    });
  });

  describe('destroy()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('tears down: further stop() calls do not reach a stale engine, and a pending toast timer is cleared', () => {
      const controller = new SpeechSynthesisController({ getSynthesisEngine: () => engine });
      controller.speak('hello');
      engine.fireError('synthesis-failed');
      expect(controller.errorVisible).toBe(true);

      controller.destroy();

      expect(controller.speaking).toBe(false);
      controller.stop();
      expect(engine.cancelCallCount).toBe(1); // the cancel() inside destroy() itself, not a second one

      vi.advanceTimersByTime(10_000);
      expect(controller.errorVisible).toBe(true); // timer was cleared, not fired late
    });

    it('does not throw when destroyed before ever being initialized', () => {
      const controller = new SpeechSynthesisController({ getSynthesisEngine: () => engine });
      expect(() => controller.destroy()).not.toThrow();
    });
  });

  describe('re-initializing onto a different engine (Finding: the previous engine must be torn down)', () => {
    it('stops and detaches the superseded engine, and routes further calls to the new one', () => {
      const engineA = new FakeSpeechSynthesisEngine();
      const engineB = new FakeSpeechSynthesisEngine();
      let current: SpeechSynthesisEngineLike = engineA;
      const controller = new SpeechSynthesisController({
        getSynthesisEngine: () => current
      });

      controller.initialize();
      controller.speak('hello');
      engineA.fireStart();
      expect(controller.speaking).toBe(true);

      current = engineB;
      controller.initialize();

      // engineA was stopped and its subscription removed, not left speaking in the background.
      expect(engineA.cancelCallCount).toBe(1);
      expect(engineA.onvoiceschanged).toBeNull();
      expect(controller.speaking).toBe(false);

      // A late event from the superseded engine cannot affect state for the new one.
      engineA.setVoices([makeVoice({ name: 'Stale' })]);
      expect(controller.voices).toHaveLength(0);

      controller.speak('world');
      expect(engineB.speakCallCount).toBe(1);
      expect(engineA.speakCallCount).toBe(1); // unchanged -- only the original 'hello'
    });

    it('re-initializing onto the same engine leaves it running, untouched', () => {
      const controller = new SpeechSynthesisController({ getSynthesisEngine: () => engine });

      controller.initialize();
      controller.speak('hello');
      engine.fireStart();
      expect(controller.speaking).toBe(true);

      controller.initialize();

      expect(engine.cancelCallCount).toBe(0);
      expect(controller.speaking).toBe(true);
    });
  });

  describe('two instances are independent (no module-level shared state)', () => {
    it('speaking, voices, and engine state on one instance never leak into another', () => {
      const engineA = new FakeSpeechSynthesisEngine();
      const engineB = new FakeSpeechSynthesisEngine();
      const controllerA = new SpeechSynthesisController({ getSynthesisEngine: () => engineA });
      const controllerB = new SpeechSynthesisController({ getSynthesisEngine: () => engineB });

      controllerA.initialize();
      controllerB.initialize();
      engineA.setVoices([makeVoice({ name: 'A-voice' })]);
      engineB.setVoices([makeVoice({ name: 'B-voice' }), makeVoice({ name: 'B-voice-2' })]);

      expect(controllerA.voices).toHaveLength(1);
      expect(controllerB.voices).toHaveLength(2);

      controllerA.speak('only on A');
      engineA.fireStart();

      expect(controllerA.speaking).toBe(true);
      expect(controllerB.speaking).toBe(false);
      expect(engineB.speakCallCount).toBe(0);

      controllerB.speak('only on B');
      engineB.fireStart();
      expect(controllerB.speaking).toBe(true);

      // Stopping A must not touch B.
      controllerA.stop();
      expect(controllerA.speaking).toBe(false);
      expect(controllerB.speaking).toBe(true);
      expect(engineB.cancelCallCount).toBe(0);
    });
  });
});

describe('createBrowserEngine (Finding 1 regression: the real browser engine must not clobber a global)', () => {
  // Runs against FakeBrowserSpeechSynthesis, a double for the real page-wide
  // `speechSynthesis` singleton -- unlike every test above, which goes through
  // FakeSpeechSynthesisEngine (the already-reduced SpeechSynthesisEngineLike surface) and so
  // never exercises the addEventListener wiring this fix is about. The independence test in
  // the main suite above passes on a pre-fix implementation too, for exactly that reason.

  it('two engines built from one shared browser-like synth both receive voiceschanged (additive registration, not a clobbered single slot)', () => {
    const sharedSynth = new FakeBrowserSpeechSynthesis();
    const engineA = createBrowserEngine(sharedSynth as unknown as SpeechSynthesis);
    const engineB = createBrowserEngine(sharedSynth as unknown as SpeechSynthesis);

    let calledA = 0;
    let calledB = 0;
    engineA.onvoiceschanged = () => {
      calledA += 1;
    };
    engineB.onvoiceschanged = () => {
      calledB += 1;
    };

    sharedSynth.setVoices([makeVoice({ name: 'V' })]);

    // Under the pre-fix `synth.onvoiceschanged = handler` assignment, engineB's registration
    // would have overwritten engineA's on the shared object, leaving calledA at 0.
    expect(calledA).toBe(1);
    expect(calledB).toBe(1);
  });

  it('two SpeechSynthesisController instances sharing one browser-like engine both track voices independently', () => {
    const sharedSynth = new FakeBrowserSpeechSynthesis();
    const controllerA = new SpeechSynthesisController({
      getSynthesisEngine: () => createBrowserEngine(sharedSynth as unknown as SpeechSynthesis)
    });
    const controllerB = new SpeechSynthesisController({
      getSynthesisEngine: () => createBrowserEngine(sharedSynth as unknown as SpeechSynthesis)
    });

    controllerA.initialize();
    controllerB.initialize();

    sharedSynth.setVoices([makeVoice({ name: 'A' }), makeVoice({ name: 'B' })]);

    expect(controllerA.voices).toHaveLength(2);
    expect(controllerB.voices).toHaveLength(2);
  });

  it("destroy() removes exactly that engine's own listener, leaving a sibling engine's subscription intact", () => {
    const sharedSynth = new FakeBrowserSpeechSynthesis();
    const controllerA = new SpeechSynthesisController({
      getSynthesisEngine: () => createBrowserEngine(sharedSynth as unknown as SpeechSynthesis)
    });
    const controllerB = new SpeechSynthesisController({
      getSynthesisEngine: () => createBrowserEngine(sharedSynth as unknown as SpeechSynthesis)
    });

    controllerA.initialize();
    controllerB.initialize();
    expect(sharedSynth.voicesChangedListenerCount).toBe(2);

    controllerA.destroy();
    expect(sharedSynth.voicesChangedListenerCount).toBe(1);

    sharedSynth.setVoices([makeVoice({ name: 'Only-for-B' })]);
    expect(controllerB.voices).toHaveLength(1);
  });
});

describe('clampSpeechNumber / clampErrorTimeoutMs (Finding 5: pure, browser-free unit tests)', () => {
  it('clamps a value above the range down to max', () => {
    expect(clampSpeechNumber(50, { min: 0.1, max: 10, fallback: 1 })).toBe(10);
  });

  it('clamps a value below the range up to min', () => {
    expect(clampSpeechNumber(-5, { min: 0, max: 2, fallback: 1 })).toBe(0);
  });

  it('leaves an in-range value untouched', () => {
    expect(clampSpeechNumber(0.8, { min: 0, max: 1, fallback: 1 })).toBe(0.8);
  });

  it('falls back for non-finite input (NaN, +Infinity, -Infinity)', () => {
    expect(clampSpeechNumber(Number.NaN, { min: 0.1, max: 10, fallback: 1 })).toBe(1);
    expect(clampSpeechNumber(Number.POSITIVE_INFINITY, { min: 0.1, max: 10, fallback: 1 })).toBe(1);
    expect(clampSpeechNumber(Number.NEGATIVE_INFINITY, { min: 0.1, max: 10, fallback: 1 })).toBe(1);
  });

  it('clampErrorTimeoutMs floors a negative delay at zero and passes a valid one through', () => {
    expect(clampErrorTimeoutMs(-100)).toBe(0);
    expect(clampErrorTimeoutMs(2500)).toBe(2500);
  });

  it('clampErrorTimeoutMs falls back to the default for non-finite input', () => {
    expect(clampErrorTimeoutMs(Number.NaN)).toBe(DEFAULT_ERROR_TIMEOUT_MS);
    expect(clampErrorTimeoutMs(Number.POSITIVE_INFINITY)).toBe(DEFAULT_ERROR_TIMEOUT_MS);
  });
});
