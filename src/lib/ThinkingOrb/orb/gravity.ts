/**
 * Pulls a frame's dots toward a pointer position, so an orb can feel alive
 * under the cursor without any mode ever knowing pointers exist -- the same
 * separation `paintFrame` keeps between a mode and the canvas.
 */

import { easeOutCubic } from './space';
import type { Dot, Frame, Stroke } from './types';

/**
 * Where gravity pulls toward, in the same coordinate space as a `Dot`.
 * `null` means nothing is hovering, and gravity does nothing.
 */
export type GravityPointer = { x: number; y: number } | null;

/** How far gravity reaches (`radius`, px) and how hard it pulls at its centre (`strength`, px). */
export type GravityOptions = {
  radius: number;
  strength: number;
};

/** A reach and pull tuned to read as a subtle few px of drift, never a snap to the cursor. */
export const GRAVITY_DEFAULTS: GravityOptions = {
  radius: 32,
  strength: 6
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/**
 * Where one point ends up after `pointer` pulls on it. The pull is capped at
 * the point's own distance from `pointer` -- without that cap, a point
 * already close to the pointer (distance smaller than `strength`) would
 * overshoot past it. Shared by dots and stroke endpoints so a line stays
 * attached to the nodes it joins: each endpoint moves exactly as far as a
 * dot sitting at that same spot would.
 */
const attractPoint = (
  point: { x: number; y: number },
  pointer: { x: number; y: number },
  options: GravityOptions
): { x: number; y: number } => {
  const dx = pointer.x - point.x;
  const dy = pointer.y - point.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0 || distance >= options.radius) {
    return point;
  }
  const proximity = clamp01(1 - distance / options.radius);
  const pull = Math.min(easeOutCubic(proximity) * options.strength, distance);
  const scale = pull / distance;
  return { x: point.x + dx * scale, y: point.y + dy * scale };
};

const attractDot = (dot: Dot, pointer: { x: number; y: number }, options: GravityOptions): Dot => {
  const moved = attractPoint(dot, pointer, options);
  return moved.x === dot.x && moved.y === dot.y ? dot : { ...dot, x: moved.x, y: moved.y };
};

const attractStroke = (
  stroke: Stroke,
  pointer: { x: number; y: number },
  options: GravityOptions
): Stroke => {
  const start = attractPoint({ x: stroke.x1, y: stroke.y1 }, pointer, options);
  const end = attractPoint({ x: stroke.x2, y: stroke.y2 }, pointer, options);
  if (
    start.x === stroke.x1 &&
    start.y === stroke.y1 &&
    end.x === stroke.x2 &&
    end.y === stroke.y2
  ) {
    return stroke;
  }
  return { ...stroke, x1: start.x, y1: start.y, x2: end.x, y2: end.y };
};

/**
 * Returns a NEW `Frame` with every dot and stroke endpoint inside
 * `options.radius` of `pointer` pulled toward it, the pull smoothly fading
 * to nothing at the radius edge; marks outside are returned untouched. Each
 * stroke endpoint moves by the same amount a dot at that point would, so a
 * line stays attached to the nodes it joins. A `null` pointer is a no-op:
 * `frame` is returned as-is. Never mutates `frame` or anything inside it.
 */
export const attract = (frame: Frame, pointer: GravityPointer, options: GravityOptions): Frame => {
  if (pointer === null) {
    return frame;
  }
  return {
    dots: frame.dots.map((dot) => attractDot(dot, pointer, options)),
    strokes: frame.strokes.map((stroke) => attractStroke(stroke, pointer, options))
  };
};
