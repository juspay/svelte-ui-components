import { describe, it, expect } from 'vitest';
import { linePath, areaPath } from './paths';

const finiteRun = [
  { x: 0, y: 10 },
  { x: 10, y: 20 },
  { x: 20, y: 5 }
];

describe('linePath — gap (non-finite) segmentation', () => {
  it('never emits NaN into the path data', () => {
    const points = [
      { x: 0, y: 10 },
      { x: 10, y: NaN },
      { x: 20, y: 5 }
    ];
    for (const curve of ['linear', 'monotone', 'step'] as const) {
      expect(linePath(points, curve)).not.toContain('NaN');
    }
  });

  it('breaks the line into one subpath per finite run', () => {
    const points = [
      { x: 0, y: 10 },
      { x: 10, y: 20 },
      { x: 20, y: NaN },
      { x: 30, y: 5 },
      { x: 40, y: 8 }
    ];
    const d = linePath(points, 'linear');
    expect(d.match(/M /g)).toHaveLength(2);
    expect(d).toBe('M 0 10 L 10 20 M 30 5 L 40 8');
  });

  it('is unchanged for fully-finite input', () => {
    expect(linePath(finiteRun, 'linear')).toBe('M 0 10 L 10 20 L 20 5');
  });

  it('renders an isolated finite point between gaps as a bare moveto', () => {
    const points = [
      { x: 0, y: NaN },
      { x: 10, y: 7 },
      { x: 20, y: NaN }
    ];
    expect(linePath(points, 'linear')).toBe('M 10 7');
  });

  it('returns an empty string when every point is a gap', () => {
    const points = [
      { x: 0, y: NaN },
      { x: 10, y: NaN }
    ];
    expect(linePath(points, 'monotone')).toBe('');
  });
});

describe('areaPath — gap (non-finite) segmentation', () => {
  it('closes one area per finite run and never emits NaN', () => {
    const points = [
      { x: 0, y: 10 },
      { x: 10, y: 20 },
      { x: 20, y: NaN },
      { x: 30, y: 5 },
      { x: 40, y: 8 }
    ];
    const d = areaPath(points, 100, 'linear');
    expect(d).not.toContain('NaN');
    expect(d.match(/Z/g)).toHaveLength(2);
    expect(d).toBe('M 0 10 L 10 20 L 10 100 L 0 100 Z M 30 5 L 40 8 L 40 100 L 30 100 Z');
  });

  it('is unchanged for fully-finite input', () => {
    expect(areaPath(finiteRun, 100, 'linear')).toBe('M 0 10 L 10 20 L 20 5 L 20 100 L 0 100 Z');
  });
});
