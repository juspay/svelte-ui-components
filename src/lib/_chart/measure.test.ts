import { describe, it, expect } from 'vitest';
import { measureText, readCssVarPx } from './measure';

describe('measureText (Node heuristic path)', () => {
  it('falls back to a per-char heuristic without a DOM', () => {
    const { width, height } = measureText('abcd', { size: 10 });
    expect(width).toBeCloseTo(4 * 10 * 0.6);
    expect(height).toBeCloseTo(12);
  });

  it('returns zero width for empty text', () => {
    expect(measureText('', { size: 11 }).width).toBe(0);
  });

  it('is deterministic across repeated calls (cache)', () => {
    const a = measureText('Revenue', { size: 11, weight: 600 });
    const b = measureText('Revenue', { size: 11, weight: 600 });
    expect(a).toEqual(b);
  });

  it('does not collide cache entries when text contains delimiter-like characters', () => {
    const a = measureText('b|c', { size: 10, family: 'a' });
    const b = measureText('c', { size: 10, family: 'a|b' });
    expect(a.width).not.toBe(b.width); // 3 chars vs 1 char on the heuristic path
  });
});

describe('readCssVarPx', () => {
  it('returns the fallback when window is unavailable', () => {
    expect(readCssVarPx(null as unknown as Element, '--x', 14)).toBe(14);
  });
});
