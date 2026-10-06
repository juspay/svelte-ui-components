import { describe, it, expect, vi } from 'vitest';
import { measureText, readCssVarPx, invalidateTextMeasurements } from './measure';

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

  it('remeasures the same font key when a loaded font replaces its fallback', () => {
    let loadedWidth = 50;
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      font: '',
      measureText: () => ({ width: loadedWidth })
    } as unknown as CanvasRenderingContext2D);
    try {
      const font = { size: 12, family: 'LoadedFont' };
      expect(measureText('Font ready', font).width).toBe(50);
      loadedWidth = 75;
      expect(measureText('Font ready', font).width).toBe(50);
      invalidateTextMeasurements();
      expect(measureText('Font ready', font).width).toBe(75);
    } finally {
      canvas.mockRestore();
    }
  });
});

describe('readCssVarPx', () => {
  it('returns the fallback when window is unavailable', () => {
    expect(readCssVarPx(null as unknown as Element, '--x', 14)).toBe(14);
  });
});
