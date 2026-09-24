/**
 * The shared vocabulary between `ThinkingOrb`'s modes, its painter and its
 * gravity pass. A mode never touches a canvas directly -- it only ever
 * describes one instant as a `Frame`, so it stays a pure, testable function
 * of `(t, ctx)` with nothing environment-specific to mock.
 */

/** One canvas size `ThinkingOrb` renders at; a mode adapts to whichever it is given. */
export type ModeSize = 64 | 32 | 20;

/**
 * One drawn point. `x`/`y` are canvas CSS px, `depth` is 0 (far) to 1 (near),
 * `ink` is 0 to 1 and is turned into a colour by `paintFrame`, and `alpha` is
 * 0 to 1 opacity.
 */
export type Dot = {
  x: number;
  y: number;
  depth: number;
  radius: number;
  ink: number;
  alpha: number;
};

/** One drawn line segment. Same coordinate, depth, ink and alpha units as `Dot`. */
export type Stroke = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number;
  width: number;
  ink: number;
  alpha: number;
};

/** Everything to paint for one instant: strokes and dots, in no particular order. */
export type Frame = {
  dots: readonly Dot[];
  strokes: readonly Stroke[];
};

/**
 * What a mode renders at and how strongly. `density` and `dotScale` are
 * multipliers already floored at 0.1 by the component, never negative or zero.
 */
export type ModeContext = {
  size: ModeSize;
  density: number;
  dotScale: number;
};

/**
 * A mode: a pure function of elapsed, already speed-scaled seconds and the
 * context it draws into. Must be non-blank, finite and in-bounds at every `t`,
 * including `t = 0`.
 */
export type ModeFn = (t: number, ctx: ModeContext) => Frame;
