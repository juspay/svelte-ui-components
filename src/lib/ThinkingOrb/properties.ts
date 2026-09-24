import type { Rgb } from '../types';
import type { GravityOptions } from './orb/gravity';
import type { ModeSize } from './orb/types';

export type { GravityOptions };

/**
 * The nine animations `ThinkingOrb` can play. Full descriptions of each are
 * in docs/ThinkingOrb.md.
 */
export type OrbState =
  | 'working'
  | 'searching'
  | 'solving'
  | 'listening'
  | 'connecting'
  | 'weaving'
  | 'composing'
  | 'breathing'
  | 'shaping';

/** The three fixed canvas sizes `ThinkingOrb` can draw at, in CSS pixels. */
export type ThinkingOrbSize = ModeSize;

export type MandatoryThinkingOrbProperties = Record<string, never>;

export type OptionalThinkingOrbProperties = {
  /**
   * Which animation to show.
   * - `working` — dots travel in short trails along six differently tilted loops around the centre, each loop at its own pace
   * - `searching` — a bright band sweeps around a speckled sphere, running from top to bottom while it goes, and brightens whichever dots it passes over
   * - `solving` — four horizontal bands each turn a quarter-turn out of place, one after another, hold there a moment, then straighten out again starting from the last one that turned, looping the whole way through
   * - `listening` — a wave of brightness rises through a stack of rings, swelling the dots in whichever ring it currently reaches
   * - `connecting` — a small scattering of nodes across a sphere, linked to their closest neighbours, with small bright dots travelling along those links
   * - `weaving` — three spiral strands wrap around a sphere end to end, swinging into and out of each other's path so they appear to cross as it spins
   * - `composing` — a broad ribbon of dots, fading out at its edges, ripples like fabric while the whole thing turns
   * - `breathing` — a single ring of dots slowly swells and settles on a steady cycle, its edge never quite resting
   * - `shaping` — a ring of dots gradually reshapes itself, rounding out and pulling into a triangle, then a square, before smoothing back to round, on a repeating loop
   * @default 'working'
   */
  state?: OrbState;
  /** How big the canvas is, in CSS pixels. Only 64, 32 and 20 have real artwork; any other number falls back to `64`. @default 64 */
  size?: ThinkingOrbSize;
  /** Multiplies how fast the animation's own clock advances: `1` is normal pace, `2` is double speed, `0` holds it still. @default 1 */
  speed?: number;
  /** Stops the animation and leaves whatever frame was last drawn on screen. @default false */
  paused?: boolean;
  /**
   * Sets the colour the dots and lines are drawn in. Left unset, the orb
   * reads `--sui-thinking-orb-color`, falls back to the inherited CSS
   * `color`, and finally to a mid-grey if neither resolves to something the
   * canvas can use.
   */
  color?: Rgb;
  /**
   * Scales how many dots (or strands, or nodes, depending on the state) an
   * animation draws. Anything below `0.1` is treated as `0.1`. @default 1
   */
  dots?: number;
  /** Scales the size of every dot the animation draws. Anything below `0.1` is treated as `0.1`. @default 1 */
  dotSize?: number;
  /**
   * While the pointer sits over the canvas, dots near it get pulled toward
   * it — scoped to this instance's own canvas only. `true` uses the built-in
   * reach and pull; pass a `GravityOptions` object to set your own
   * `radius`/`strength`. Purely decorative, and deliberately has no
   * keyboard equivalent — see docs/ThinkingOrb.md's Accessibility section.
   * @default false
   */
  gravity?: boolean | GravityOptions;
  /** Replaces the default label generated for the current state. See docs/ThinkingOrb.md's Accessibility section. */
  ariaLabel?: string;
  /** Extra CSS class names added to the canvas element. */
  classes?: string;
  /** Sets the `data-pw` attribute on the canvas, so tests can select it. */
  testId?: string;
};

export type ThinkingOrbEventProperties = {
  /** Called exactly once, right after the first frame is actually painted — this happens after mount, not at the same moment. */
  onfirstframe?: () => void;
};

export type ThinkingOrbProperties = OptionalThinkingOrbProperties & ThinkingOrbEventProperties;
