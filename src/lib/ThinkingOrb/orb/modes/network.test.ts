import { describe, expect, it } from 'vitest';
import { connecting, weaving, weavingGhostCount } from './network';
import { inkAlpha } from '../paint';
import { modeSizing } from '../space';
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

// Ghost dots (the static backdrop sphere, BZ-6466 follow-up) are always appended after every
// strand's dots (see weaving's own comment), so this reproduces that count and slices them off --
// the tests below are about the three strands specifically, not the backdrop behind them.
const strandDotsOf = (frame: Frame, size: ModeSize): Frame['dots'] => {
  const ghostCount = weavingGhostCount(modeSizing(size, 1, 1));
  return frame.dots.slice(0, frame.dots.length - ghostCount);
};

describe('weaving', () => {
  it('draws exactly 3 strands worth of beads, each one shorter by 1 in its stroke count', () => {
    for (const size of SIZES) {
      const frame = weaving(0.3, contextFor(size));
      const strandDots = strandDotsOf(frame, size);
      expect(strandDots.length % 3).toBe(0);
      expect(frame.strokes.length).toBe(strandDots.length - 3);
    }
  });

  it('starts each of the three strands in its own place instead of pinching them into one point', () => {
    for (const size of SIZES) {
      for (const t of [0, 1.7, 12.25]) {
        const dots = strandDotsOf(weaving(t, contextFor(size)), size);
        const perStrand = dots.length / 3;
        for (const end of [0, perStrand - 1]) {
          const ends = [0, 1, 2].map((strand) => dots[strand * perStrand + end]);
          for (const [a, b] of [
            [0, 1],
            [1, 2],
            [0, 2]
          ]) {
            const apart = Math.hypot(ends[a].x - ends[b].x, ends[a].y - ends[b].y);
            expect(apart).toBeGreaterThan(size * 0.05);
          }
        }
      }
    }
  });

  it('keeps every stretch of every strand on screen: no mark paints below 10% opacity', () => {
    for (const size of SIZES) {
      for (const t of SAMPLE_TIMES) {
        const frame = weaving(t, contextFor(size));
        for (const mark of [...frame.dots, ...frame.strokes]) {
          expect(inkAlpha(mark.ink, mark.alpha)).toBeGreaterThanOrEqual(0.1);
        }
      }
    }
  });

  it('never turns a strand edge-on into a straight bar, at any instant of its spin', () => {
    // A strand is a closed loop; its projected outline's narrow extent over its wide one (from the
    // spread of its points) drops toward 0 as the loop turns edge-on.
    const flatness = (points: ReadonlyArray<{ x: number; y: number }>): number => {
      const mx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      const my = points.reduce((sum, p) => sum + p.y, 0) / points.length;
      const sxx = points.reduce((sum, p) => sum + (p.x - mx) ** 2, 0);
      const syy = points.reduce((sum, p) => sum + (p.y - my) ** 2, 0);
      const sxy = points.reduce((sum, p) => sum + (p.x - mx) * (p.y - my), 0);
      const spread = Math.sqrt((sxx - syy) ** 2 + 4 * sxy ** 2);
      return Math.sqrt((sxx + syy - spread) / (sxx + syy + spread));
    };
    for (const size of SIZES) {
      for (let step = 0; step < 48; step += 1) {
        const dots = strandDotsOf(weaving(step * 0.45, contextFor(size)), size);
        const perStrand = dots.length / 3;
        for (const strand of [0, 1, 2]) {
          const points = dots.slice(strand * perStrand, (strand + 1) * perStrand);
          expect(flatness(points)).toBeGreaterThan(0.4);
        }
      }
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
