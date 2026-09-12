export type VoiceOrbVariant = 'idle' | 'listening';

export type VoiceOrbProperties = OptionalVoiceOrbProperties & VoiceOrbEventProperties;

export type MandatoryVoiceOrbProperties = Record<string, never>;

export type OptionalVoiceOrbProperties = {
  /**
   * Animation state. `'idle'` rotates at a steady rate; `'listening'` breathes,
   * to show an assistant is taking input.
   *
   * What drives the breathing depends on whether you pass `analyser`. With one,
   * `'listening'` is driven by the sound itself. Without one, it rides a sine
   * wave and is decorative — it says "the microphone is open", never "this is
   * what it hears".
   */
  variant?: VoiceOrbVariant;
  /**
   * An `AnalyserNode` to drive the orb from, making `variant='listening'` react
   * to the sound instead of breathing on a timer. Ignored while `'idle'`.
   *
   * The node stays yours. This component never calls `getUserMedia`, never
   * creates an `AudioContext` and never closes one: microphone permission, the
   * context lifecycle and the choice of source are decisions that need
   * application context, and a component that grabbed a microphone because it
   * was mounted would be a worse component.
   *
   * Any source works — a live microphone, an `<audio>` element, a synthesised
   * tone. Closing the context under a mounted orb is safe: the read is guarded
   * and the orb falls back to the sine wave rather than freezing.
   */
  analyser?: AnalyserNode | null;
  /**
   * Multiplies the measured level before it drives the orb. Above `1` makes a
   * quiet speaker fill the sphere; below `1` tames a hot input. Defaults to `1`.
   *
   * Only meaningful alongside `analyser`.
   */
  sensitivity?: number;
  /**
   * Multiplies the rotation rate. `1` is the designed speed; `0` freezes the
   * orb mid-rotation without unmounting it.
   */
  speedMultiplier?: number;
  /**
   * Seeds particle placement, so the same value always produces the same orb.
   * A number and the numeric string that names it resolve to the same seed
   * -- `seed={42}` and `seed="42"` paint the same orb, which is what lets a
   * custom-element attribute (always a string) agree with the Svelte prop it
   * is the markup spelling of. Any other string is hashed as text. Omitted,
   * every mount looks different.
   *
   * Pass something stable per user or per session if you want the orb to look
   * like the same object across navigations.
   */
  seed?: string | number;
  /** Rendered height in pixels. Width always fills the container. Defaults to `400`. */
  height?: number;
  /** Particles on the sphere. Defaults to `1000`. */
  particleCount?: number;
  /** Sphere radius in pixels before projection. Defaults to `140`. */
  radius?: number;
  /**
   * Whether pointer movement pushes particles aside. Defaults to `true`.
   * Set `false` for a purely ambient orb that ignores the pointer.
   */
  interactive?: boolean;
  /** How far from the pointer the repulsion reaches, in pixels. Defaults to `200`. */
  repelRadius?: number;
  /**
   * Persists rotation across mounts under this `localStorage` key prefix, so
   * the orb resumes where it stopped rather than snapping back.
   *
   * Opt-in, and namespaced by the caller, deliberately. Writing to a
   * consumer's storage uninvited is not a component's decision to make, and a
   * fixed key would make two orbs on one page overwrite each other.
   */
  persistKey?: string;
  /** CSS class string applied to the orb's root element. */
  classes?: string;
  /** Value for the `data-pw` attribute on the root, for test selectors. */
  testId?: string;
};

export type VoiceOrbEventProperties = {
  /**
   * Fires once, on the first frame actually painted — not on mount.
   *
   * Named `onfirstframe` rather than `onanimationstart` because the latter is a
   * real `HTMLElement` accessor for the CSS animationstart event: a web-component
   * prop of that name would shadow the host's own, which `prop-parity` rejects.
   *
   * The gap matters: particle generation and the first paint happen after
   * mount, so a loading overlay removed on mount reveals an empty canvas. This
   * fires when there is something to see.
   */
  onfirstframe?: () => void;
  /**
   * The smoothed audio level, 0..1, as it changes. Only fires while `analyser`
   * is actually driving the orb, plus once on the way back to 0 when it stops,
   * so a meter does not stick at the last value it saw.
   *
   * Rate-limited by change, not by time: it fires when the level moves by at
   * least 0.01, which means silence is silent rather than 60 calls a second.
   * It is still a per-frame callback in the loud case — drive a DOM write or a
   * cheap store from it, not an expensive re-render.
   */
  onlevel?: (level: number) => void;
};
