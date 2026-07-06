import { describe, it, expect } from 'vitest';
import { computeTooltipPosition } from './tooltipPosition';

const tooltip = { width: 100, height: 40 };
const container = { width: 500, height: 300 };

describe('cursor mode', () => {
  it('offsets right of and above the cursor', () => {
    const p = computeTooltipPosition({ mouseX: 50, mouseY: 100, tooltip, container });
    expect(p).toEqual({ left: 62, top: 88 });
  });

  it('flips left of the cursor at the right edge', () => {
    const p = computeTooltipPosition({ mouseX: 450, mouseY: 100, tooltip, container });
    expect(p.left).toBe(450 - 100 - 12);
  });

  it('flips fully above the cursor at the bottom edge', () => {
    const p = computeTooltipPosition({ mouseX: 50, mouseY: 295, tooltip, container });
    expect(p.top).toBe(295 - 40 - 12);
  });

  it('clamps into the container when both flip directions overflow', () => {
    const p = computeTooltipPosition({
      mouseX: 10,
      mouseY: 10,
      tooltip: { width: 600, height: 40 },
      container
    });
    expect(p.left).toBe(0);
  });
});

describe('anchor mode', () => {
  it('centers above a top anchor', () => {
    const p = computeTooltipPosition({
      anchor: { x: 250, y: 100, side: 'top' },
      tooltip,
      container
    });
    expect(p).toEqual({ left: 200, top: 100 - 40 - 12 });
  });

  it('flips below when there is no headroom', () => {
    const p = computeTooltipPosition({
      anchor: { x: 250, y: 20, side: 'top' },
      tooltip,
      container
    });
    expect(p.top).toBe(32);
  });

  it('places right of a right anchor and flips left at the edge', () => {
    const ok = computeTooltipPosition({
      anchor: { x: 100, y: 150, side: 'right' },
      tooltip,
      container
    });
    expect(ok).toEqual({ left: 112, top: 130 });
    const flipped = computeTooltipPosition({
      anchor: { x: 480, y: 150, side: 'right' },
      tooltip,
      container
    });
    expect(flipped.left).toBe(480 - 100 - 12);
  });

  it('clamps horizontally so an edge anchor never clips', () => {
    const p = computeTooltipPosition({
      anchor: { x: 10, y: 100, side: 'top' },
      tooltip,
      container
    });
    expect(p.left).toBe(0);
  });
});
