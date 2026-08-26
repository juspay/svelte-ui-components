import type { SoundKit, SoundKitOptions, SoundName } from './properties';

const DEFAULT_STORAGE_KEY = 'sui-sound-enabled';
const DEFAULT_MASTER_GAIN = 0.32;
const SOUND_ATTRIBUTE = 'data-sound';

const TICK_SELECTOR =
  'input[type="checkbox"], input[type="radio"], [role="switch"], [role="checkbox"], [role="tab"]';
const PAGE_SELECTOR = 'a';
const PRESS_SELECTOR = 'button, [role="button"], summary';

type AudioEngine = {
  context: AudioContext;
  master: GainNode;
};

/** Every recipe plays through the shared master bus and stops itself; nothing outlives ~200ms. */
type SoundRecipe = (context: AudioContext, master: GainNode) => void;

const createNoiseBuffer = (context: AudioContext, durationSeconds: number): AudioBuffer => {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let sampleIndex = 0; sampleIndex < frameCount; sampleIndex += 1) {
    channel[sampleIndex] = Math.random() * 2 - 1;
  }
  return buffer;
};

const connectChain = (nodes: AudioNode[]): void => {
  for (let nodeIndex = 0; nodeIndex < nodes.length - 1; nodeIndex += 1) {
    nodes[nodeIndex].connect(nodes[nodeIndex + 1]);
  }
};

/** A light key tap: a highpassed noise crack layered under a short 680Hz sine body. */
const playPress: SoundRecipe = (context, master) => {
  const now = context.currentTime;

  const crackDuration = 0.02;
  const crackSource = context.createBufferSource();
  crackSource.buffer = createNoiseBuffer(context, crackDuration);

  const crackFilter = context.createBiquadFilter();
  crackFilter.type = 'highpass';
  crackFilter.frequency.value = 2400;

  const crackGain = context.createGain();
  crackGain.gain.setValueAtTime(0.3, now);
  crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.009);

  connectChain([crackSource, crackFilter, crackGain, master]);
  crackSource.start(now);
  crackSource.stop(now + crackDuration);

  const bodyDuration = 0.03;
  const body = context.createOscillator();
  body.type = 'sine';
  body.frequency.value = 680;

  const bodyGain = context.createGain();
  bodyGain.gain.setValueAtTime(0.0001, now);
  bodyGain.gain.exponentialRampToValueAtTime(0.6, now + 0.008);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + bodyDuration);

  connectChain([body, bodyGain, master]);
  body.start(now);
  body.stop(now + bodyDuration);
};

/** A tiny bandpassed square blip for checkbox/switch/radio/tab semantics. */
const playTick: SoundRecipe = (context, master) => {
  const now = context.currentTime;
  const duration = 0.012;

  const oscillator = context.createOscillator();
  oscillator.type = 'square';
  oscillator.frequency.value = 2100;

  const bandpass = context.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 2600;
  bandpass.Q.value = 1.6;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  connectChain([oscillator, bandpass, gain, master]);
  oscillator.start(now);
  oscillator.stop(now + duration);
};

/** A soft lowpassed noise puff — the un-press. */
const playRelease: SoundRecipe = (context, master) => {
  const now = context.currentTime;
  const duration = 0.03;

  const source = context.createBufferSource();
  source.buffer = createNoiseBuffer(context, duration);

  const lowpass = context.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 1600;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  connectChain([source, lowpass, gain, master]);
  source.start(now);
  source.stop(now + duration);
};

/** A gentle upward sine sweep for navigation/links. */
const playPage: SoundRecipe = (context, master) => {
  const now = context.currentTime;
  const duration = 0.12;

  const oscillator = context.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(430, now);
  oscillator.frequency.linearRampToValueAtTime(640, now + duration);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  connectChain([oscillator, gain, master]);
  oscillator.start(now);
  oscillator.stop(now + duration);
};

/** A rounded lowpassed sine thump for status/heartbeat pulses. */
const playPulse: SoundRecipe = (context, master) => {
  const now = context.currentTime;
  const duration = 0.08;

  const oscillator = context.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.value = 330;

  const lowpass = context.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 2200;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.3, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  connectChain([oscillator, lowpass, gain, master]);
  oscillator.start(now);
  oscillator.stop(now + duration);
};

const recipes: Record<SoundName, SoundRecipe> = {
  press: playPress,
  tick: playTick,
  release: playRelease,
  page: playPage,
  pulse: playPulse
};

/** Narrows a string to a `SoundName` via exhaustive literal matching — no assertion needed. */
const resolveSoundName = (value: string): SoundName | null => {
  switch (value) {
    case 'press':
    case 'tick':
    case 'release':
    case 'page':
    case 'pulse':
      return value;
    default:
      return null;
  }
};

/** Same as `resolveSoundName` but also recognizes the explicit-silence `'off'` override. */
const resolveOverride = (value: string): SoundName | 'off' | null => {
  if (value === 'off') {
    return 'off';
  }
  return resolveSoundName(value);
};

const readStoredEnabled = (storageKey: string): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return window.localStorage.getItem(storageKey) === 'true';
  } catch {
    return false;
  }
};

const writeStoredEnabled = (storageKey: string, enabled: boolean): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(storageKey, enabled ? 'true' : 'false');
  } catch {
    // Storage can be unavailable (private mode, quota) — enabled state just won't persist.
  }
};

export const createSoundKit = (options: SoundKitOptions = {}): SoundKit => {
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const masterGain = options.masterGain ?? DEFAULT_MASTER_GAIN;

  // Enabled state starts unresolved so no storage read happens at createSoundKit() time —
  // resolveEnabled() reads it lazily, on first play/isEnabled/toggle call.
  let enabled: boolean | null = null;
  let engine: AudioEngine | null = null;
  let attachedRoot: Document | HTMLElement | null = null;

  const resolveEnabled = (): boolean => {
    if (enabled === null) {
      enabled = readStoredEnabled(storageKey);
    }
    return enabled;
  };

  const ensureEngine = (): AudioEngine | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    if (engine) {
      return engine;
    }
    const AudioContextConstructor = window.AudioContext;
    if (typeof AudioContextConstructor !== 'function') {
      return null;
    }
    const context = new AudioContextConstructor();
    const master = context.createGain();
    master.gain.value = masterGain;
    master.connect(context.destination);
    engine = { context, master };
    return engine;
  };

  const play = (name: SoundName): void => {
    if (!resolveEnabled()) {
      return;
    }
    const activeEngine = ensureEngine();
    if (!activeEngine) {
      return;
    }
    if (activeEngine.context.state === 'suspended') {
      activeEngine.context.resume().catch(() => {
        // A rejected resume just means this gesture can't unlock audio; the sound skips.
      });
    }
    recipes[name](activeEngine.context, activeEngine.master);
  };

  // Typed as the base `Event` (only `.target` is used) so it matches `EventListener` across
  // the `Document | HTMLElement` union `attachClicks` accepts — narrowing to `MouseEvent`
  // here would make TS fall back to the untyped `EventListenerOrEventListenerObject` overload.
  const handleClick = (event: Event): void => {
    if (!resolveEnabled()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const overrideElement = target.closest(`[${SOUND_ATTRIBUTE}]`);
    if (overrideElement !== null) {
      const overrideValue = overrideElement.getAttribute(SOUND_ATTRIBUTE) ?? '';
      const resolved = resolveOverride(overrideValue);
      if (resolved !== null && resolved !== 'off') {
        play(resolved);
      }
      return;
    }

    if (target.closest(TICK_SELECTOR) !== null) {
      play('tick');
      return;
    }
    if (target.closest(PAGE_SELECTOR) !== null) {
      play('page');
      return;
    }
    if (target.closest(PRESS_SELECTOR) !== null) {
      play('press');
    }
  };

  const attachClicks = (root?: Document | HTMLElement): void => {
    if (typeof document === 'undefined') {
      return;
    }
    const nextRoot = root ?? document;
    if (attachedRoot) {
      attachedRoot.removeEventListener('click', handleClick, true);
    }
    nextRoot.addEventListener('click', handleClick, true);
    attachedRoot = nextRoot;
  };

  const detachClicks = (): void => {
    if (!attachedRoot) {
      return;
    }
    attachedRoot.removeEventListener('click', handleClick, true);
    attachedRoot = null;
  };

  const setEnabled = (nextEnabled: boolean): void => {
    enabled = nextEnabled;
    writeStoredEnabled(storageKey, nextEnabled);
  };

  const isEnabled = (): boolean => {
    return resolveEnabled();
  };

  const toggle = (): boolean => {
    const nextEnabled = !resolveEnabled();
    setEnabled(nextEnabled);
    return nextEnabled;
  };

  const dispose = (): void => {
    detachClicks();
    if (engine) {
      engine.context.close().catch(() => {
        // Already-closed contexts reject close(); there is nothing left to clean up.
      });
      engine = null;
    }
  };

  return { play, attachClicks, detachClicks, setEnabled, isEnabled, toggle, dispose };
};
