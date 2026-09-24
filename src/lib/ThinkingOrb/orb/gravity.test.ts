import { describe, expect, it } from 'vitest';
import { attract, GRAVITY_DEFAULTS } from './gravity';
import type { GravityOptions } from './gravity';
import type { Dot, Frame, Stroke } from './types';

const dot = (overrides: Partial<Dot>): Dot => ({
  x: 0,
  y: 0,
  depth: 0.5,
  radius: 2,
  ink: 0,
  alpha: 1,
  ...overrides
});

const stroke = (overrides: Partial<Stroke>): Stroke => ({
  x1: 0,
  y1: 0,
  x2: 10,
  y2: 10,
  depth: 0.5,
  width: 1,
  ink: 0,
  alpha: 1,
  ...overrides
});

const OPTIONS: GravityOptions = { radius: 20, strength: 6 };
const POINTER = { x: 0, y: 0 };

describe('attract', () => {
  it('pulls a dot inside the radius toward the pointer', () => {
    const frame: Frame = { dots: [dot({ x: 10, y: 0 })], strokes: [] };
    const [moved] = attract(frame, POINTER, OPTIONS).dots;
    expect(moved.x).toBeLessThan(10);
    expect(moved.x).toBeGreaterThan(10 - OPTIONS.strength);
    expect(moved.y).toBe(0);
  });

  it('leaves a dot outside the radius untouched', () => {
    const frame: Frame = { dots: [dot({ x: 25, y: 0 })], strokes: [] };
    const result = attract(frame, POINTER, OPTIONS);
    expect(result.dots[0]).toBe(frame.dots[0]);
  });

  it('has a falloff that reaches exactly zero right at the radius edge', () => {
    const frame: Frame = { dots: [dot({ x: OPTIONS.radius, y: 0 })], strokes: [] };
    const result = attract(frame, POINTER, OPTIONS);
    expect(result.dots[0].x).toBe(OPTIONS.radius);
  });

  it('fades the pull smoothly rather than cutting off abruptly near the edge', () => {
    const justInside = OPTIONS.radius - 1;
    const frame: Frame = { dots: [dot({ x: justInside, y: 0 })], strokes: [] };
    const pull = justInside - attract(frame, POINTER, OPTIONS).dots[0].x;
    expect(pull).toBeGreaterThan(0);
    expect(pull).toBeLessThan(1);
  });

  it('pulls a dot closer to the pointer more strongly than one farther away, both inside the radius', () => {
    const near = attract({ dots: [dot({ x: 4, y: 0 })], strokes: [] }, POINTER, OPTIONS).dots[0];
    const far = attract({ dots: [dot({ x: 16, y: 0 })], strokes: [] }, POINTER, OPTIONS).dots[0];
    const nearPull = 4 - near.x;
    const farPull = 16 - far.x;
    expect(nearPull).toBeGreaterThan(farPull);
  });

  it('never pulls a dot past the pointer it is moving toward', () => {
    const frame: Frame = { dots: [dot({ x: 2, y: 0 })], strokes: [] };
    const result = attract(frame, POINTER, OPTIONS);
    expect(result.dots[0].x).toBeGreaterThanOrEqual(0);
  });

  it('leaves a dot exactly at the pointer unchanged (no direction to move toward)', () => {
    const frame: Frame = { dots: [dot({ x: 0, y: 0 })], strokes: [] };
    const result = attract(frame, { x: 0, y: 0 }, OPTIONS);
    expect(result.dots[0]).toBe(frame.dots[0]);
  });

  it('carries every other dot field through unchanged', () => {
    const frame: Frame = {
      dots: [dot({ x: 10, y: 0, depth: 0.7, radius: 3, ink: 0.2, alpha: 0.8 })],
      strokes: []
    };
    const result = attract(frame, POINTER, OPTIONS);
    expect(result.dots[0]).toMatchObject({ depth: 0.7, radius: 3, ink: 0.2, alpha: 0.8 });
  });

  it('leaves a stroke with both endpoints outside the radius untouched, by reference', () => {
    const strokes = [stroke({ x1: 25, y1: 0, x2: 30, y2: 0 })];
    const frame: Frame = { dots: [], strokes };
    const result = attract(frame, POINTER, OPTIONS);
    expect(result.strokes[0]).toBe(strokes[0]);
  });

  it('moves a stroke endpoint inside the radius toward the pointer by the same amount as a coincident dot', () => {
    const point = { x: 10, y: 0 };
    const frame: Frame = {
      dots: [dot(point)],
      strokes: [stroke({ x1: point.x, y1: point.y, x2: 25, y2: 0 })]
    };
    const result = attract(frame, POINTER, OPTIONS);
    expect(result.strokes[0].x1).toBe(result.dots[0].x);
    expect(result.strokes[0].y1).toBe(result.dots[0].y);
    expect(result.strokes[0].x1).toBeLessThan(point.x);
  });

  it('leaves a stroke endpoint outside the radius untouched while its other endpoint moves', () => {
    const frame: Frame = {
      dots: [],
      strokes: [stroke({ x1: 10, y1: 0, x2: 25, y2: 0 })]
    };
    const result = attract(frame, POINTER, OPTIONS);
    expect(result.strokes[0].x1).toBeLessThan(10);
    expect(result.strokes[0].x2).toBe(25);
    expect(result.strokes[0].y2).toBe(0);
  });

  it('is a no-op for a null pointer, returning the exact same frame', () => {
    const frame: Frame = { dots: [dot({ x: 5, y: 0 })], strokes: [stroke({})] };
    expect(attract(frame, null, OPTIONS)).toBe(frame);
  });

  it('never mutates the input frame or its dots', () => {
    const dots = [dot({ x: 10, y: 0 }), dot({ x: 50, y: 50 })];
    const strokes = [stroke({})];
    const frame: Frame = { dots, strokes };
    const snapshot = dots.map((d) => ({ ...d }));

    const result = attract(frame, POINTER, OPTIONS);

    expect(frame.dots).toBe(dots);
    expect(frame.strokes).toBe(strokes);
    expect(dots).toEqual(snapshot);
    expect(result).not.toBe(frame);
    expect(result.dots).not.toBe(dots);
  });

  it('ships defaults that reach and pull with a positive radius and strength', () => {
    expect(GRAVITY_DEFAULTS.radius).toBeGreaterThan(0);
    expect(GRAVITY_DEFAULTS.strength).toBeGreaterThan(0);
    const frame: Frame = { dots: [dot({ x: 1, y: 0 })], strokes: [] };
    const [moved] = attract(frame, POINTER, GRAVITY_DEFAULTS).dots;
    expect(Number.isFinite(moved.x)).toBe(true);
    expect(Number.isFinite(moved.y)).toBe(true);
  });
});
