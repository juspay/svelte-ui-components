import { describe, expect, it } from 'vitest';
import {
  easeInOutCubic,
  easeOutCubic,
  hashUnit,
  modeSizing,
  project,
  rotateX,
  rotateY,
  rotateZ,
  sampleSphere
} from './space';

describe('rotateX / rotateY / rotateZ', () => {
  const point = { x: 3, y: -5, z: 7 };

  it('is a no-op at angle 0', () => {
    expect(rotateX(point, 0)).toEqual(point);
    expect(rotateY(point, 0)).toEqual(point);
    expect(rotateZ(point, 0)).toEqual(point);
  });

  it('preserves distance from the origin', () => {
    const before = Math.hypot(point.x, point.y, point.z);
    for (const rotated of [rotateX(point, 1.1), rotateY(point, -0.6), rotateZ(point, 2.4)]) {
      expect(Math.hypot(rotated.x, rotated.y, rotated.z)).toBeCloseTo(before, 10);
    }
  });

  it('leaves the axis coordinate it rotates about unchanged', () => {
    expect(rotateX(point, 0.8).x).toBe(point.x);
    expect(rotateY(point, 0.8).y).toBe(point.y);
    expect(rotateZ(point, 0.8).z).toBe(point.z);
  });
});

describe('project', () => {
  it('puts a point at the world origin exactly at the canvas centre, at unit scale', () => {
    const projected = project({ x: 0, y: 0, z: 0 }, 32, 20);
    expect(projected.x).toBe(32);
    expect(projected.y).toBe(32);
    expect(projected.scale).toBe(1);
    expect(projected.depth).toBeCloseTo(0.5, 10);
  });

  it('offsets x/y from the canvas origin by the projected, scaled coordinate', () => {
    const projected = project({ x: 10, y: -6, z: 0 }, 32, 20);
    expect(projected.x).toBe(32 + 10);
    expect(projected.y).toBe(32 - 6);
  });

  it('makes a nearer point (negative z) larger and farther (positive z) than a point at z=0', () => {
    const near = project({ x: 0, y: 0, z: -10 }, 32, 20);
    const far = project({ x: 0, y: 0, z: 10 }, 32, 20);
    expect(near.scale).toBeGreaterThan(1);
    expect(far.scale).toBeLessThan(1);
  });

  it('gives a nearer point a higher depth than a farther one', () => {
    const near = project({ x: 0, y: 0, z: -10 }, 32, 20);
    const far = project({ x: 0, y: 0, z: 10 }, 32, 20);
    expect(near.depth).toBeGreaterThan(far.depth);
  });

  it('keeps depth inside 0..1 even for z well beyond the world radius', () => {
    expect(project({ x: 0, y: 0, z: -500 }, 32, 20).depth).toBeLessThanOrEqual(1);
    expect(project({ x: 0, y: 0, z: 500 }, 32, 20).depth).toBeGreaterThanOrEqual(0);
  });

  it('falls back to a sane radius rather than dividing by zero', () => {
    const projected = project({ x: 0, y: 0, z: 0 }, 32, 0);
    expect(Number.isFinite(projected.depth)).toBe(true);
  });
});

describe('sampleSphere', () => {
  it('places every sampled point at the given radius from the origin', () => {
    const radius = 18;
    for (let index = 0; index < 40; index += 1) {
      const point = sampleSphere(index, 40, radius);
      expect(Math.hypot(point.x, point.y, point.z)).toBeCloseTo(radius, 10);
    }
  });

  it('is deterministic for the same index and count', () => {
    expect(sampleSphere(7, 50, 20)).toEqual(sampleSphere(7, 50, 20));
  });

  it('gives different points for different indices', () => {
    expect(sampleSphere(0, 50, 20)).not.toEqual(sampleSphere(1, 50, 20));
  });

  it('spreads across the full range rather than clustering at one pole', () => {
    const first = sampleSphere(0, 20, 10);
    const last = sampleSphere(19, 20, 10);
    expect(Math.sign(first.y)).not.toBe(Math.sign(last.y));
  });

  it('never produces NaN for a non-positive count', () => {
    const point = sampleSphere(0, 0, 10);
    expect(Number.isFinite(point.x)).toBe(true);
    expect(Number.isFinite(point.y)).toBe(true);
    expect(Number.isFinite(point.z)).toBe(true);
  });
});

describe('easeInOutCubic / easeOutCubic', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it('clamps input outside 0..1 to the same endpoints', () => {
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
  });

  it('is monotonically increasing across the range', () => {
    let previousInOut = -1;
    let previousOut = -1;
    for (let t = 0; t <= 1; t += 0.1) {
      const inOut = easeInOutCubic(t);
      const out = easeOutCubic(t);
      expect(inOut).toBeGreaterThanOrEqual(previousInOut);
      expect(out).toBeGreaterThanOrEqual(previousOut);
      previousInOut = inOut;
      previousOut = out;
    }
  });
});

describe('hashUnit', () => {
  it('gives the same value for the same seed, every time', () => {
    expect(hashUnit(42)).toBe(hashUnit(42));
  });

  it('gives different values for different seeds', () => {
    expect(hashUnit(1)).not.toBe(hashUnit(2));
  });

  it('stays within 0..1', () => {
    for (const seed of [0, 1, -1, 999999, Number.MAX_SAFE_INTEGER]) {
      const value = hashUnit(seed);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('modeSizing', () => {
  it('scales counts up with area as size grows', () => {
    const at64 = modeSizing(64, 1, 1).count(100);
    const at32 = modeSizing(32, 1, 1).count(100);
    const at20 = modeSizing(20, 1, 1).count(100);
    expect(at64).toBeGreaterThan(at32);
    expect(at32).toBeGreaterThan(at20);
  });

  it('scales counts up with density', () => {
    const low = modeSizing(64, 0.5, 1).count(100);
    const high = modeSizing(64, 2, 1).count(100);
    expect(high).toBeGreaterThan(low);
  });

  it('never returns a count below 1, even for a tiny density', () => {
    expect(modeSizing(20, 0.1, 1).count(1)).toBeGreaterThanOrEqual(1);
  });

  it('grows radius sub-linearly with size: the 64px-to-20px ratio is smaller than the size ratio', () => {
    const radiusAt64 = modeSizing(64, 1, 1).radius(4);
    const radiusAt20 = modeSizing(20, 1, 1).radius(4);
    const sizeRatio = 64 / 20;
    const radiusRatio = radiusAt64 / radiusAt20;
    expect(radiusRatio).toBeLessThan(sizeRatio);
    expect(radiusRatio).toBeGreaterThan(1);
  });

  it('keeps a dot legible at 20px even with a tiny dotScale', () => {
    expect(modeSizing(20, 1, 0.01).radius(1)).toBeGreaterThan(0);
  });

  it('falls back to a safe multiplier for a non-positive density or dotScale', () => {
    const sizing = modeSizing(64, 0, -3);
    expect(Number.isFinite(sizing.count(10))).toBe(true);
    expect(Number.isFinite(sizing.radius(4))).toBe(true);
    expect(sizing.count(10)).toBeGreaterThanOrEqual(1);
    expect(sizing.radius(4)).toBeGreaterThan(0);
  });
});
