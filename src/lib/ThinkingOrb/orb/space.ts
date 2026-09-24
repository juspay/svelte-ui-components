/**
 * Pure 3D helpers shared by every mode: rotation, perspective projection,
 * even sphere sampling, easing and a seeded per-index hash. Nothing here
 * touches a canvas or keeps state, so a mode stays a plain function of
 * `(t, ctx)` and every helper below is trivial to unit test in isolation.
 */

import type { ModeSize } from './types';

/** A point in the mode's own 3D world space, before projection to the canvas. */
export type Point3 = { x: number; y: number; z: number };

/** A `Point3` projected onto the canvas: screen px plus normalised depth and raw scale. */
export type Projected = { x: number; y: number; depth: number; scale: number };

/** The two scalers `modeSizing` hands back: multiply a mode's own base counts and radii by them. */
export type ModeSizing = {
  count: (base: number) => number;
  radius: (base: number) => number;
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/** Rotates a point about the X axis (mixes y and z). */
export const rotateX = (point: Point3, angle: number): Point3 => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos
  };
};

/** Rotates a point about the Y axis (mixes x and z). */
export const rotateY = (point: Point3, angle: number): Point3 => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: point.z * cos - point.x * sin
  };
};

/** Rotates a point about the Z axis (mixes x and y). */
export const rotateZ = (point: Point3, angle: number): Point3 => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
    z: point.z
  };
};

const FOCAL_LENGTH_PX = 320;

/**
 * Projects a world point with perspective onto a canvas centred at
 * `(originPx, originPx)`. `worldRadius` is the extent the point's `z` is
 * expected to range over (typically the sphere/shape radius the mode drew it
 * at), and is what turns `z` into a 0..1 `depth`: nearer (more negative `z`)
 * is 1, farther is 0.
 */
export const project = (point: Point3, originPx: number, worldRadius: number): Projected => {
  const safeRadius = worldRadius > 0 ? worldRadius : 1;
  const perspective = FOCAL_LENGTH_PX / (FOCAL_LENGTH_PX + point.z);
  return {
    x: originPx + point.x * perspective,
    y: originPx + point.y * perspective,
    depth: clamp01((safeRadius - point.z) / (safeRadius * 2)),
    scale: perspective
  };
};

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * The `index`-th of `count` points spread evenly over a sphere of `radius`,
 * via a golden-angle spiral. Deterministic in `index` and `count` alone, and
 * even across the whole surface rather than crowding the poles the way a
 * uniformly-sampled latitude/longitude grid would.
 */
export const sampleSphere = (index: number, count: number, radius: number): Point3 => {
  const safeCount = count > 0 ? Math.floor(count) : 1;
  const wrapped = ((Math.floor(index) % safeCount) + safeCount) % safeCount;
  const y = 1 - (2 * wrapped + 1) / safeCount;
  const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
  const angle = wrapped * GOLDEN_ANGLE;
  return {
    x: Math.cos(angle) * ringRadius * radius,
    y: y * radius,
    z: Math.sin(angle) * ringRadius * radius
  };
};

/** Cubic ease, slow-fast-slow, for a motion that starts and ends at rest. */
export const easeInOutCubic = (t: number): number => {
  const clamped = clamp01(t);
  return clamped < 0.5 ? 4 * clamped ** 3 : 1 - (-2 * clamped + 2) ** 3 / 2;
};

/** Cubic ease-out, fast-then-slow, for a motion that only needs to settle at the end. */
export const easeOutCubic = (t: number): number => {
  const clamped = clamp01(t);
  return 1 - (1 - clamped) ** 3;
};

/**
 * A deterministic 0..1 value for an integer seed (a dot's index is the usual
 * one). Gives every mode per-dot variety -- a phase offset, a size jitter --
 * without `Math.random`, so the same `(t, ctx)` always paints the same frame.
 */
export const hashUnit = (seed: number): number => {
  let hash = (seed | 0) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash = (hash ^ (hash >>> 16)) >>> 0;
  return hash / 4294967296;
};

const REFERENCE_SIZE = 64;
const RADIUS_GROWTH_EXPONENT = 0.6;
const MIN_DOT_RADIUS_PX = 0.6;

/**
 * Turns `(size, density, dotScale)` into a count scaler and a radius scaler,
 * so every mode derives its dot counts and radii the same way instead of
 * keeping its own per-size table. Counts scale with area (`size` squared);
 * radii grow sub-linearly, with a floor that keeps dots visible at 20px.
 */
export const modeSizing = (size: ModeSize, density: number, dotScale: number): ModeSizing => {
  const sizeRatio = size / REFERENCE_SIZE;
  const areaRatio = sizeRatio * sizeRatio;
  const safeDensity = density > 0 ? density : 0.1;
  const safeDotScale = dotScale > 0 ? dotScale : 0.1;
  return {
    count: (base: number): number => Math.max(1, Math.round(base * areaRatio * safeDensity)),
    radius: (base: number): number =>
      Math.max(MIN_DOT_RADIUS_PX, base * sizeRatio ** RADIUS_GROWTH_EXPONENT * safeDotScale)
  };
};
