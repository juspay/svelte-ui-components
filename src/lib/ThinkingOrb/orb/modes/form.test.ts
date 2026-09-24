import { describe, expect, it } from 'vitest';
import { breathing, composing, shaping } from './form';
import type { ModeContext, ModeFn, ModeSize } from '../types';

const SIZES: readonly ModeSize[] = [64, 32, 20];
const T_VALUES: readonly number[] = [0, 0.001, 0.37, 1, 2.5, 9.4, 40, 123.456];

const baseContext = (size: ModeSize): ModeContext => ({ size, density: 1, dotScale: 1 });

/** Every dot's fields are the finite, in-range numbers `paintFrame` and the canvas need. */
const expectWellFormedDots = (frame: ReturnType<ModeFn>, size: ModeSize): void => {
  expect(frame.dots.length).toBeGreaterThan(0);
  expect(frame.strokes.length).toBe(0);
  for (const dot of frame.dots) {
    expect(Number.isFinite(dot.x)).toBe(true);
    expect(Number.isFinite(dot.y)).toBe(true);
    expect(dot.x).toBeGreaterThanOrEqual(0);
    expect(dot.x).toBeLessThanOrEqual(size);
    expect(dot.y).toBeGreaterThanOrEqual(0);
    expect(dot.y).toBeLessThanOrEqual(size);
    expect(dot.depth).toBeGreaterThanOrEqual(0);
    expect(dot.depth).toBeLessThanOrEqual(1);
    expect(dot.radius).toBeGreaterThan(0);
    expect(Number.isFinite(dot.radius)).toBe(true);
    expect(dot.ink).toBeGreaterThanOrEqual(0);
    expect(dot.ink).toBeLessThanOrEqual(1);
    expect(dot.alpha).toBeGreaterThanOrEqual(0);
    expect(dot.alpha).toBeLessThanOrEqual(1);
  }
};

/** A `describe` block shared by every mode: the checks the spec asks of every mode alike. */
const describeCommonModeBehaviour = (name: string, mode: ModeFn, maxCountAt64: number): void => {
  describe(name, () => {
    it('is non-blank, finite and inside the canvas at every size and t, including t = 0', () => {
      for (const size of SIZES) {
        for (const t of T_VALUES) {
          expectWellFormedDots(mode(t, baseContext(size)), size);
        }
      }
    });

    it('is deterministic: the same (t, ctx) always paints the same frame', () => {
      for (const size of SIZES) {
        const ctx = baseContext(size);
        for (const t of T_VALUES) {
          expect(mode(t, ctx)).toEqual(mode(t, ctx));
        }
      }
    });

    it(`keeps its 64px dot count within its bound (at most ${maxCountAt64})`, () => {
      const frame = mode(0.6, baseContext(64));
      expect(frame.dots.length).toBeGreaterThan(0);
      expect(frame.dots.length).toBeLessThanOrEqual(maxCountAt64);
    });

    it('stays legible at 20px: still draws a double-digit handful of dots', () => {
      const frame = mode(0.6, baseContext(20));
      expect(frame.dots.length).toBeGreaterThanOrEqual(10);
    });

    it('draws fewer dots at a smaller size than at a larger one', () => {
      const at64 = mode(0.6, baseContext(64)).dots.length;
      const at32 = mode(0.6, baseContext(32)).dots.length;
      const at20 = mode(0.6, baseContext(20)).dots.length;
      expect(at64).toBeGreaterThan(at32);
      expect(at32).toBeGreaterThan(at20);
    });

    it('draws more dots as density rises, at a fixed size and dotScale', () => {
      const low = mode(0.6, { size: 64, density: 0.2, dotScale: 1 }).dots.length;
      const high = mode(0.6, { size: 64, density: 4, dotScale: 1 }).dots.length;
      expect(high).toBeGreaterThan(low);
    });

    it('draws larger dots as dotScale rises, without changing the dot count', () => {
      const low = mode(0.6, { size: 64, density: 1, dotScale: 0.3 });
      const high = mode(0.6, { size: 64, density: 1, dotScale: 3 });
      expect(high.dots.length).toBe(low.dots.length);

      const meanRadius = (frame: ReturnType<ModeFn>): number =>
        frame.dots.reduce((sum, dot) => sum + dot.radius, 0) / frame.dots.length;
      expect(meanRadius(high)).toBeGreaterThan(meanRadius(low));
    });

    it('keeps painting the same non-blank frame far beyond any one animation cycle', () => {
      const frame = mode(10_000.25, baseContext(32));
      expectWellFormedDots(frame, 32);
    });
  });
};

describeCommonModeBehaviour('composing', composing, 300);
describeCommonModeBehaviour('breathing', breathing, 300);
describeCommonModeBehaviour('shaping', shaping, 300);

describe('composing', () => {
  it('bends its band over time: the frame changes from one instant to the next', () => {
    const ctx = baseContext(64);
    expect(composing(0, ctx)).not.toEqual(composing(1.3, ctx));
  });

  it('turns continuously rather than jumping: small time steps move dots by small amounts', () => {
    const ctx = baseContext(64);
    const before = composing(5, ctx).dots;
    const after = composing(5.01, ctx).dots;
    for (let index = 0; index < before.length; index += 1) {
      const dx = Math.abs(before[index].x - after[index].x);
      const dy = Math.abs(before[index].y - after[index].y);
      expect(dx).toBeLessThan(2);
      expect(dy).toBeLessThan(2);
    }
  });
});

describe('breathing', () => {
  it('swells and relaxes over time: the frame changes from one instant to the next', () => {
    const ctx = baseContext(64);
    expect(breathing(0, ctx)).not.toEqual(breathing(2, ctx));
  });

  it('is calm: consecutive instants move dots by small amounts, not by jumps', () => {
    const ctx = baseContext(64);
    const before = breathing(3, ctx).dots;
    const after = breathing(3.01, ctx).dots;
    for (let index = 0; index < before.length; index += 1) {
      const dx = Math.abs(before[index].x - after[index].x);
      const dy = Math.abs(before[index].y - after[index].y);
      expect(dx).toBeLessThan(1);
      expect(dy).toBeLessThan(1);
    }
  });

  it('swells outward at the peak of its breath and relaxes inward at the trough', () => {
    const ctx = baseContext(64);
    const centre = ctx.size / 2;
    const meanDistance = (t: number): number => {
      const dots = breathing(t, ctx).dots;
      const total = dots.reduce((sum, dot) => sum + Math.hypot(dot.x - centre, dot.y - centre), 0);
      return total / dots.length;
    };
    // t where sin(t * BREATHING_SPEED) is at +1 and -1, half a breath apart.
    const atPeak = meanDistance(Math.PI / (2 * 0.55));
    const atTrough = meanDistance(Math.PI / (2 * 0.55) + Math.PI / 0.55);
    expect(atPeak).toBeGreaterThan(atTrough);
  });
});

describe('shaping', () => {
  it('is far rounder at t = 0 (circle) than partway through the cycle (triangle-ish)', () => {
    const ctx = baseContext(64);
    const centre = ctx.size / 2;
    const spread = (t: number): number => {
      const distances = shaping(t, ctx).dots.map((dot) =>
        Math.hypot(dot.x - centre, dot.y - centre)
      );
      return Math.max(...distances) - Math.min(...distances);
    };
    // The only spread at t = 0 is perspective foreshortening of a tilted circle;
    // by t = 2 the ring has eased well into the circle -> triangle leg.
    expect(spread(0)).toBeLessThan(spread(2));
  });

  it('loops seamlessly: one full cycle later is the same frame', () => {
    const ctx = baseContext(64);
    const cycleSeconds = 12;
    const start = shaping(0.4, ctx).dots;
    const later = shaping(0.4 + cycleSeconds, ctx).dots;
    expect(later.length).toBe(start.length);
    for (let index = 0; index < start.length; index += 1) {
      // toEqual would fail on float noise from (t / cycle) % 1 landing at a
      // different binary fraction for 0.4 vs 12.4; the loop only promises
      // the same frame within floating-point precision, not bit-for-bit.
      expect(later[index].x).toBeCloseTo(start[index].x, 9);
      expect(later[index].y).toBeCloseTo(start[index].y, 9);
      expect(later[index].radius).toBeCloseTo(start[index].radius, 9);
      expect(later[index].ink).toBeCloseTo(start[index].ink, 9);
      expect(later[index].alpha).toBeCloseTo(start[index].alpha, 9);
    }
  });

  it('morphs smoothly: no jump across a phase boundary (circle -> triangle -> square -> circle)', () => {
    const ctx = baseContext(64);
    const boundaries = [4, 8, 12];
    for (const boundary of boundaries) {
      const before = shaping(boundary - 0.01, ctx).dots;
      const after = shaping(boundary + 0.01, ctx).dots;
      for (let index = 0; index < before.length; index += 1) {
        const dx = Math.abs(before[index].x - after[index].x);
        const dy = Math.abs(before[index].y - after[index].y);
        expect(dx).toBeLessThan(1);
        expect(dy).toBeLessThan(1);
      }
    }
  });
});

describe('composing / breathing / shaping', () => {
  it('read as clearly different states: none of the three paint the same frame at the same instant', () => {
    for (const size of SIZES) {
      const ctx = baseContext(size);
      for (const t of [0, 1.5, 6]) {
        const a = composing(t, ctx);
        const b = breathing(t, ctx);
        const c = shaping(t, ctx);
        expect(a).not.toEqual(b);
        expect(b).not.toEqual(c);
        expect(a).not.toEqual(c);
      }
    }
  });
});
