import { describe, expect, it } from 'vitest';
import { connecting, weaving } from './network';
import type { Frame, ModeContext, ModeFn, ModeSize } from '../types';

const SIZES: readonly ModeSize[] = [64, 32, 20];
const SAMPLE_TIMES: readonly number[] = [0, 0.001, 0.5, 1.7, 12.25, 500];

const contextFor = (size: ModeSize, overrides: Partial<ModeContext> = {}): ModeContext => ({
  size,
  density: 1,
  dotScale: 1,
  ...overrides
});

// Generous relative to the tiny overshoot perspective projection can add at
// the sphere's silhouette, but tight enough to still catch a badly broken
// projection or rotation.
const MARGIN_RATIO = 0.2;

const expectInBounds = (value: number, size: ModeSize): void => {
  expect(Number.isFinite(value)).toBe(true);
  expect(value).toBeGreaterThanOrEqual(-size * MARGIN_RATIO);
  expect(value).toBeLessThanOrEqual(size * (1 + MARGIN_RATIO));
};

const expectUnit = (value: number): void => {
  expect(Number.isFinite(value)).toBe(true);
  expect(value).toBeGreaterThanOrEqual(0);
  expect(value).toBeLessThanOrEqual(1);
};

const expectValidFrame = (frame: Frame, size: ModeSize): void => {
  expect(frame.dots.length + frame.strokes.length).toBeGreaterThan(0);

  for (const dot of frame.dots) {
    expectInBounds(dot.x, size);
    expectInBounds(dot.y, size);
    expectUnit(dot.depth);
    expect(Number.isFinite(dot.radius)).toBe(true);
    expect(dot.radius).toBeGreaterThan(0);
    expectUnit(dot.ink);
    expect(dot.alpha).toBeGreaterThan(0);
    expect(dot.alpha).toBeLessThanOrEqual(1);
  }

  for (const stroke of frame.strokes) {
    expectInBounds(stroke.x1, size);
    expectInBounds(stroke.y1, size);
    expectInBounds(stroke.x2, size);
    expectInBounds(stroke.y2, size);
    expectUnit(stroke.depth);
    expect(Number.isFinite(stroke.width)).toBe(true);
    expect(stroke.width).toBeGreaterThan(0);
    expectUnit(stroke.ink);
    expect(stroke.alpha).toBeGreaterThan(0);
    expect(stroke.alpha).toBeLessThanOrEqual(1);
  }
};

const MODES: ReadonlyArray<readonly [string, ModeFn]> = [
  ['connecting', connecting],
  ['weaving', weaving]
];

for (const [name, mode] of MODES) {
  describe(name, () => {
    for (const size of SIZES) {
      it(`is non-blank, finite and in bounds at every sampled t, at size ${size}`, () => {
        for (const t of SAMPLE_TIMES) {
          expectValidFrame(mode(t, contextFor(size)), size);
        }
      });

      it(`is deterministic for the same (t, ctx), at size ${size}`, () => {
        for (const t of SAMPLE_TIMES) {
          const ctx = contextFor(size);
          expect(mode(t, ctx)).toEqual(mode(t, ctx));
        }
      });
    }

    it('draws at most about 600 marks at 64px, at default density and dotScale', () => {
      const frame = mode(0, contextFor(64));
      expect(frame.dots.length + frame.strokes.length).toBeLessThanOrEqual(600);
    });

    it('moves each dot only a little between two nearby instants, with no jump', () => {
      const ctx = contextFor(64);
      const before = mode(10, ctx);
      const after = mode(10.016, ctx); // one frame later at 60fps
      expect(after.dots.length).toBe(before.dots.length);
      for (let i = 0; i < before.dots.length; i += 1) {
        const distance = Math.hypot(
          after.dots[i].x - before.dots[i].x,
          after.dots[i].y - before.dots[i].y
        );
        expect(distance).toBeLessThan(4);
      }
    });

    it('draws more marks at a higher density than a lower one, at the same size', () => {
      const low = mode(0.4, contextFor(64, { density: 0.5 }));
      const high = mode(0.4, contextFor(64, { density: 2 }));
      const lowCount = low.dots.length + low.strokes.length;
      const highCount = high.dots.length + high.strokes.length;
      expect(highCount).toBeGreaterThan(lowCount);
    });

    it('draws a larger radius at a higher dotScale than a lower one, at the same size and density', () => {
      const small = mode(0.4, contextFor(64, { dotScale: 0.3 }));
      const large = mode(0.4, contextFor(64, { dotScale: 3 }));
      // dotScale alone must not change which or how many marks are drawn.
      expect(large.dots.length).toBe(small.dots.length);
      expect(large.dots[0].radius).toBeGreaterThan(small.dots[0].radius);
    });
  });
}

describe('connecting', () => {
  it('draws at least one edge, and exactly one pulse per edge, at every size', () => {
    for (const size of SIZES) {
      const frame = connecting(0.3, contextFor(size));
      expect(frame.strokes.length).toBeGreaterThan(0);
      // dots are the sphere's nodes plus one travelling pulse per edge.
      expect(frame.dots.length).toBeGreaterThan(frame.strokes.length);
    }
  });
});

describe('weaving', () => {
  it('draws exactly 3 strands worth of beads, each one shorter by 1 in its stroke count', () => {
    for (const size of SIZES) {
      const frame = weaving(0.3, contextFor(size));
      expect(frame.dots.length % 3).toBe(0);
      expect(frame.strokes.length).toBe(frame.dots.length - 3);
    }
  });
});

describe('connecting vs weaving', () => {
  it('draw clearly different frames for the same (t, ctx)', () => {
    const ctx = contextFor(64);
    const a = connecting(0.3, ctx);
    const b = weaving(0.3, ctx);
    expect(a.dots.length).not.toBe(b.dots.length);
    expect(a).not.toEqual(b);
  });
});
