/**
 * The "form" modes: composing, breathing and shaping. Each one reads as a
 * single evolving surface or ring rather than a swarm of independent points,
 * so the motion stays legible down at 20px instead of dissolving into noise
 * the way a large loose point cloud would.
 *
 * All three share one placement idiom: build each dot in its own object
 * space (a band or ring parametrised by its index, deformed however that
 * mode's intent calls for), spin the whole thing with `rotateY` for a sense
 * of turning, tilt it with `rotateX` so it reads in 3D, then `project`. That
 * split keeps "the shape's own motion" and "the camera's fixed angle on it"
 * from tangling together in the per-dot math.
 */

import type { ModeContext, Dot, Frame, ModeFn } from '../types';
import {
  type ModeSizing,
  type Point3,
  type Projected,
  easeInOutCubic,
  hashUnit,
  modeSizing,
  project,
  rotateX,
  rotateY,
  rotateZ
} from '../space';

const TWO_PI = Math.PI * 2;

/** The shared "reads as a form inside a square" contract: radius as a share of `size`. */
const FORM_RADIUS_RATIO = 0.4;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/** Nearer dots read as more saturated tint; `paintFrame` turns low ink into more of `tint`. */
const depthToInk = (depth: number): number => clamp01(1 - depth);

/** Farther dots stay at partial opacity rather than fading to nothing, so no instant reads blank. */
const depthToAlpha = (depth: number): number => clamp01(0.5 + depth * 0.5);

/** Nearer dots draw a touch larger, reinforcing the depth `paintFrame`'s draw order already implies. */
const depthToRadiusFactor = (depth: number): number => 0.7 + depth * 0.3;

/** Builds one `Dot` from a projected point; `jitter` gives per-dot size variety from `hashUnit`. */
const dotFrom = (
  projected: Projected,
  baseRadius: number,
  sizing: ModeSizing,
  jitter: number
): Dot => ({
  x: projected.x,
  y: projected.y,
  depth: projected.depth,
  radius: sizing.radius(baseRadius) * depthToRadiusFactor(projected.depth) * jitter,
  ink: depthToInk(projected.depth),
  alpha: depthToAlpha(projected.depth)
});

/** Turns an object-space point into a placed, projected `Dot` via the shared spin/tilt/project steps. */
const place = (
  point: Point3,
  spinAngle: number,
  tiltAngle: number,
  originPx: number,
  worldRadius: number,
  baseRadius: number,
  sizing: ModeSizing,
  jitter: number
): Dot => {
  const spun = rotateY(point, spinAngle);
  const tilted = rotateX(spun, tiltAngle);
  const projected = project(tilted, originPx, worldRadius);
  return dotFrom(projected, baseRadius, sizing, jitter);
};

const EMPTY_STROKES: readonly [] = [];

// --- composing ---------------------------------------------------------

const RIBBON_BASE_COUNT = 260;
const RIBBON_BASE_DOT_RADIUS = 2.2;
const RIBBON_THREADS: Record<64 | 32 | 20, number> = { 64: 7, 32: 5, 20: 4 };
const RIBBON_HALF_WIDTH = 0.4;
/** The ribbon's own great circle sits tilted off the spin axis by this much,
 * so spinning genuinely sweeps its width through the frame -- a band that
 * happened to lie flat on the equator would look identical at every spin
 * angle, since an equatorial ring is rotationally symmetric about that axis. */
const RIBBON_AXIS_TILT = 0.68;
const RIBBON_RIPPLE_WAVES = 3;
const RIBBON_RIPPLE_SPEED = 1.15;
const RIBBON_RIPPLE_AMPLITUDE = 0.5;
const RIBBON_THREAD_JITTER = 0.1;
const RIBBON_SPIN_SPEED = 0.48;
const RIBBON_CAMERA_TILT = 0.45;
/** Edge threads only dim toward the background; nothing here shrinks a dot's
 * radius, so the ribbon keeps a full-width row of legible marks even where a
 * combined ink/alpha/radius fade would collapse an edge row to a speck. */
const RIBBON_EDGE_ALPHA_FLOOR = 0.5;
const RIBBON_EDGE_INK_LIFT = 0.22;

/**
 * A ribbon of dots looped once around the sphere on its own tilted great
 * circle -- distinct from the spin axis -- rippling along its length like a
 * travelling wave through cloth while the whole ribbon turns.
 */
export const composing: ModeFn = (t: number, ctx: ModeContext): Frame => {
  const sizing = modeSizing(ctx.size, ctx.density, ctx.dotScale);
  const worldRadius = ctx.size * FORM_RADIUS_RATIO;
  const originPx = ctx.size / 2;
  const threads = RIBBON_THREADS[ctx.size];
  const perThread = Math.max(1, Math.ceil(sizing.count(RIBBON_BASE_COUNT) / threads));
  const total = threads * perThread;

  const dots: Dot[] = [];
  for (let index = 0; index < total; index += 1) {
    const thread = index % threads;
    const step = Math.floor(index / threads);
    // w ranges -1 (one edge thread) .. 0 (centre) .. 1 (other edge thread).
    const w = threads > 1 ? (thread / (threads - 1)) * 2 - 1 : 0;
    const u = (step / perThread) * TWO_PI;
    const ripple =
      Math.sin(u * RIBBON_RIPPLE_WAVES + t * RIBBON_RIPPLE_SPEED) * RIBBON_RIPPLE_AMPLITUDE;
    // A standard spherical parametrisation keeps every point exactly on a
    // sphere of `worldRadius` regardless of `phi`, so the ribbon stays safely
    // inside the canvas no matter how far the ripple bends it.
    const phi = w * RIBBON_HALF_WIDTH + ripple;
    const onSphere: Point3 = {
      x: Math.cos(phi) * Math.cos(u) * worldRadius,
      y: Math.sin(phi) * worldRadius,
      z: Math.cos(phi) * Math.sin(u) * worldRadius
    };
    const onAxis = rotateZ(onSphere, RIBBON_AXIS_TILT);
    const jitter = 1 - RIBBON_THREAD_JITTER / 2 + hashUnit(index * 7 + 1) * RIBBON_THREAD_JITTER;
    const placed = place(
      onAxis,
      t * RIBBON_SPIN_SPEED,
      RIBBON_CAMERA_TILT,
      originPx,
      worldRadius,
      RIBBON_BASE_DOT_RADIUS,
      sizing,
      jitter
    );
    const edgeFeather = Math.abs(w);
    dots.push({
      ...placed,
      ink: clamp01(placed.ink + edgeFeather * RIBBON_EDGE_INK_LIFT),
      alpha: clamp01(placed.alpha * (1 - edgeFeather * (1 - RIBBON_EDGE_ALPHA_FLOOR)))
    });
  }

  return { dots, strokes: EMPTY_STROKES };
};

// --- breathing -----------------------------------------------------------

const BREATHING_BASE_COUNT = 210;
const BREATHING_BASE_DOT_RADIUS = 1.7;
/** Sits below composing/shaping's ~0.4: at the peak of its breath this ring
 * already swells by its amplitude plus its shape wobble below, so a resting
 * radius this much smaller still lands at about the same on-screen extent as
 * its siblings' fixed radius, without the peak pushing past the canvas. */
const BREATHING_WORLD_RADIUS_RATIO = 0.34;
const BREATHING_AMPLITUDE = 0.09;
const BREATHING_SPEED = 0.55;
const BREATHING_SHAPE_HARMONIC = 5;
const BREATHING_SHAPE_SPEED = 0.22;
const BREATHING_SHAPE_AMPLITUDE = 0.035;
const BREATHING_SPIN_SPEED = 0.12;
const BREATHING_TILT = 0.62;

/**
 * A single ring that swells and relaxes on a slow sine, with a faint,
 * higher-harmonic wobble layered on top so its outline never reads as a
 * perfectly static circle even at rest.
 */
export const breathing: ModeFn = (t: number, ctx: ModeContext): Frame => {
  const sizing = modeSizing(ctx.size, ctx.density, ctx.dotScale);
  const worldRadius = ctx.size * BREATHING_WORLD_RADIUS_RATIO;
  const originPx = ctx.size / 2;
  const count = sizing.count(BREATHING_BASE_COUNT);
  const breathe = Math.sin(t * BREATHING_SPEED);

  const dots: Dot[] = [];
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * TWO_PI;
    const wobble =
      Math.sin(angle * BREATHING_SHAPE_HARMONIC + t * BREATHING_SHAPE_SPEED) *
      BREATHING_SHAPE_AMPLITUDE;
    const radiusFactor = 1 + breathe * BREATHING_AMPLITUDE + wobble;
    const point: Point3 = {
      x: Math.cos(angle) * radiusFactor * worldRadius,
      y: 0,
      z: Math.sin(angle) * radiusFactor * worldRadius
    };
    const jitter = 0.88 + hashUnit(index * 11 + 5) * 0.24;
    dots.push(
      place(
        point,
        t * BREATHING_SPIN_SPEED,
        BREATHING_TILT,
        originPx,
        worldRadius,
        BREATHING_BASE_DOT_RADIUS,
        sizing,
        jitter
      )
    );
  }

  return { dots, strokes: EMPTY_STROKES };
};

// --- shaping ---------------------------------------------------------------

const SHAPING_BASE_COUNT = 210;
const SHAPING_BASE_DOT_RADIUS = 1.7;
const SHAPING_CYCLE_SECONDS = 12;
// One full turn per morph cycle, so the shape and its orientation both land
// back where they started at the same instant -- a true seamless loop.
const SHAPING_SPIN_SPEED = (2 * Math.PI) / SHAPING_CYCLE_SECONDS;
const SHAPING_TILT = 0.6;

/** The radial distance of a regular `sides`-gon's straight edge at `angle`, circumradius 1. */
const polygonRadius = (angle: number, sides: number): number => {
  const segment = TWO_PI / sides;
  const half = segment / 2;
  const wrapped = ((angle % segment) + segment) % segment;
  return Math.cos(half) / Math.cos(wrapped - half);
};

const lerp = (from: number, to: number, amount: number): number => from + (to - from) * amount;

/**
 * A ring that morphs circle to triangle to square and back over a fixed
 * cycle, each leg eased so the shape comes to rest at every corner instead
 * of snapping into it -- which also makes the wrap from the last leg back to
 * the first exactly continuous.
 */
export const shaping: ModeFn = (t: number, ctx: ModeContext): Frame => {
  const sizing = modeSizing(ctx.size, ctx.density, ctx.dotScale);
  const worldRadius = ctx.size * FORM_RADIUS_RATIO;
  const originPx = ctx.size / 2;
  const count = sizing.count(SHAPING_BASE_COUNT);

  const cyclePos = (((t / SHAPING_CYCLE_SECONDS) % 1) + 1) % 1;
  const phaseFloat = cyclePos * 3;
  const phaseIndex = Math.min(2, Math.floor(phaseFloat));
  const eased = easeInOutCubic(phaseFloat - phaseIndex);

  const dots: Dot[] = [];
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * TWO_PI;
    const triangleR = polygonRadius(angle, 3);
    const squareR = polygonRadius(angle, 4);
    let radiusFactor: number;
    if (phaseIndex === 0) {
      radiusFactor = lerp(1, triangleR, eased);
    } else if (phaseIndex === 1) {
      radiusFactor = lerp(triangleR, squareR, eased);
    } else {
      radiusFactor = lerp(squareR, 1, eased);
    }
    const point: Point3 = {
      x: Math.cos(angle) * radiusFactor * worldRadius,
      y: 0,
      z: Math.sin(angle) * radiusFactor * worldRadius
    };
    const jitter = 0.9 + hashUnit(index * 17 + 9) * 0.2;
    dots.push(
      place(
        point,
        t * SHAPING_SPIN_SPEED,
        SHAPING_TILT,
        originPx,
        worldRadius,
        SHAPING_BASE_DOT_RADIUS,
        sizing,
        jitter
      )
    );
  }

  return { dots, strokes: EMPTY_STROKES };
};
