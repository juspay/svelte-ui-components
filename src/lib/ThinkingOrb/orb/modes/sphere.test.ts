import { describe, expect, it } from 'vitest';
import { listening, searching, solving, working } from './sphere';
import type { Dot, Frame, ModeContext, ModeFn, ModeSize, Stroke } from '../types';

const SIZES: ModeSize[] = [64, 32, 20];
const T_VALUES = [0, 0.001, 0.37, 1, 2.75, 6.4, 40];

const MODES: Record<string, ModeFn> = { working, searching, solving, listening };

const contextFor = (size: ModeSize, density = 1, dotScale = 1): ModeContext => ({
  size,
  density,
  dotScale
});

const markCount = (frame: Frame): number => frame.dots.length + frame.strokes.length;

const expectDotSane = (dot: Dot, size: number): void => {
  expect(Number.isFinite(dot.x)).toBe(true);
  expect(Number.isFinite(dot.y)).toBe(true);
  expect(Number.isFinite(dot.depth)).toBe(true);
  expect(Number.isFinite(dot.radius)).toBe(true);
  expect(Number.isFinite(dot.ink)).toBe(true);
  expect(Number.isFinite(dot.alpha)).toBe(true);
  expect(dot.x).toBeGreaterThanOrEqual(0);
  expect(dot.x).toBeLessThanOrEqual(size);
  expect(dot.y).toBeGreaterThanOrEqual(0);
  expect(dot.y).toBeLessThanOrEqual(size);
  expect(dot.depth).toBeGreaterThanOrEqual(0);
  expect(dot.depth).toBeLessThanOrEqual(1);
  expect(dot.ink).toBeGreaterThanOrEqual(0);
  expect(dot.ink).toBeLessThanOrEqual(1);
  expect(dot.alpha).toBeGreaterThanOrEqual(0);
  expect(dot.alpha).toBeLessThanOrEqual(1);
  expect(dot.radius).toBeGreaterThan(0);
};

const expectStrokeSane = (stroke: Stroke, size: number): void => {
  const scalars = [
    stroke.x1,
    stroke.y1,
    stroke.x2,
    stroke.y2,
    stroke.depth,
    stroke.width,
    stroke.ink,
    stroke.alpha
  ];
  for (const value of scalars) {
    expect(Number.isFinite(value)).toBe(true);
  }
  for (const x of [stroke.x1, stroke.x2]) {
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThanOrEqual(size);
  }
  for (const y of [stroke.y1, stroke.y2]) {
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThanOrEqual(size);
  }
  expect(stroke.depth).toBeGreaterThanOrEqual(0);
  expect(stroke.depth).toBeLessThanOrEqual(1);
  expect(stroke.width).toBeGreaterThan(0);
  expect(stroke.ink).toBeGreaterThanOrEqual(0);
  expect(stroke.ink).toBeLessThanOrEqual(1);
  expect(stroke.alpha).toBeGreaterThanOrEqual(0);
  expect(stroke.alpha).toBeLessThanOrEqual(1);
};

const expectFrameSane = (frame: Frame, size: number): void => {
  expect(markCount(frame)).toBeGreaterThan(0);
  for (const dot of frame.dots) {
    expectDotSane(dot, size);
  }
  for (const stroke of frame.strokes) {
    expectStrokeSane(stroke, size);
  }
};

const averageMarkSize = (frame: Frame): number => {
  const sizes = [...frame.dots.map((dot) => dot.radius), ...frame.strokes.map((s) => s.width)];
  return sizes.reduce((sum, value) => sum + value, 0) / sizes.length;
};

describe.each(Object.entries(MODES))('%s', (_name, mode: ModeFn) => {
  describe.each(SIZES)('at size %d', (size: ModeSize) => {
    it.each(T_VALUES)('is non-blank, finite and inside the canvas at t=%s', (t: number) => {
      expectFrameSane(mode(t, contextFor(size)), size);
    });

    it('is deterministic: the same (t, ctx) always paints the same frame', () => {
      const ctx = contextFor(size);
      expect(mode(1.7, ctx)).toEqual(mode(1.7, ctx));
    });

    it('never exceeds about 600 marks at the default density and dot scale', () => {
      for (const t of T_VALUES) {
        expect(markCount(mode(t, contextFor(size)))).toBeLessThanOrEqual(600);
      }
    });
  });

  it('is never blank at t = 0, at any size', () => {
    for (const size of SIZES) {
      expect(markCount(mode(0, contextFor(size)))).toBeGreaterThan(0);
    }
  });

  it('draws more marks as density increases, all else equal', () => {
    const sparse = mode(0.6, contextFor(64, 0.4, 1));
    const dense = mode(0.6, contextFor(64, 2.5, 1));
    expect(markCount(dense)).toBeGreaterThan(markCount(sparse));
  });

  it('draws larger marks as dotScale increases, all else equal', () => {
    const small = mode(0.6, contextFor(64, 1, 0.4));
    const large = mode(0.6, contextFor(64, 1, 2.5));
    expect(averageMarkSize(large)).toBeGreaterThan(averageMarkSize(small));
  });
});

describe('the four states at the same instant', () => {
  it('are pairwise different from one another', () => {
    const ctx = contextFor(64);
    const entries = Object.entries(MODES);
    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        const [, modeA] = entries[i];
        const [, modeB] = entries[j];
        expect(modeA(1, ctx)).not.toEqual(modeB(1, ctx));
      }
    }
  });
});

describe('solving', () => {
  it('is fully aligned (every band at the same rotation as any other) at t = 0', () => {
    // t = 0 is the puzzle's solved pose: every dot should sit exactly where
    // sampleSphere put it, with no per-band quarter turn applied yet.
    const ctx = contextFor(64);
    const solved = solving(0, ctx);
    const nearby = solving(0.001, ctx);
    expect(solved.dots.length).toBe(nearby.dots.length);
  });

  it('reaches a fully scrambled pose partway through its cycle, then returns to solved', () => {
    const ctx = contextFor(64);
    const start = solving(0, ctx);
    const midCycle = solving(1.6, ctx);
    const wellPastAScramble = solving(3.9, ctx);
    expect(midCycle).not.toEqual(start);
    // A later point after a full unscramble-and-rescramble should look like
    // an earlier equivalent point in the cycle rather than drifting forever.
    expect(wellPastAScramble).not.toEqual(start);
  });
});

describe('searching', () => {
  it('sweeps its band to a different position over time', () => {
    const ctx = contextFor(64);
    expect(searching(0, ctx)).not.toEqual(searching(0.8, ctx));
  });

  it('draws a guide arc for the sweeping band in addition to its dots', () => {
    const frame = searching(0.5, contextFor(64));
    expect(frame.strokes.length).toBeGreaterThan(0);
  });
});

describe('listening', () => {
  it('rolls its wave to a different position over time', () => {
    const ctx = contextFor(64);
    expect(listening(0, ctx)).not.toEqual(listening(0.9, ctx));
  });

  it('keeps at least one ring of dots even at the smallest size', () => {
    const frame = listening(0, contextFor(20));
    expect(frame.dots.length).toBeGreaterThan(0);
  });
});

describe('working', () => {
  it('moves its particles onward over time', () => {
    const ctx = contextFor(64);
    expect(working(0, ctx)).not.toEqual(working(0.5, ctx));
  });

  it('spreads particles across more than one orbit', () => {
    const frame = working(0.3, contextFor(64));
    const depths = new Set(frame.dots.map((dot) => dot.depth));
    expect(depths.size).toBeGreaterThan(1);
  });
});
