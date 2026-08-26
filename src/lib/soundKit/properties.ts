/** One of the five synthesized recipes SoundKit can play. */
export type SoundName = 'press' | 'tick' | 'release' | 'page' | 'pulse';

export type SoundKitOptions = {
  /** localStorage key the enabled flag is persisted under. Defaults to `'sui-sound-enabled'`. */
  storageKey?: string;
  /** Gain applied to the shared master bus before the destination. Defaults to `0.32`. */
  masterGain?: number;
};

export type SoundKit = {
  /** Play one recipe by name. Silently does nothing while disabled or off the main thread. */
  play: (name: SoundName) => void;
  /**
   * Install one capture-phase click listener on `root` (defaults to `document`) that maps
   * click targets to sounds: an ancestor carrying `data-sound` always wins, otherwise plain
   * semantics apply (checkbox/radio/switch/tab-ish -> tick, links -> page, buttons -> press).
   * Calling it again re-scopes the listener to the new root.
   */
  attachClicks: (root?: Document | HTMLElement) => void;
  /** Remove the listener installed by `attachClicks`, if any. */
  detachClicks: () => void;
  /** Set the enabled flag and persist it. */
  setEnabled: (enabled: boolean) => void;
  /** Read the current enabled flag, resolving it from storage on first call. */
  isEnabled: () => boolean;
  /** Flip the enabled flag and persist it, returning the new value. */
  toggle: () => boolean;
  /** `detachClicks` plus close the AudioContext, if one was ever created. */
  dispose: () => void;
};
