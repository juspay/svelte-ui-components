import { describe, expect, it } from 'vitest';
import { computeLinearTicks } from './scales';

describe('computeLinearTicks — integer mode (category axes)', () => {
  it('never emits fractional ticks when integer mode is on', () => {
    // Regression: the responsive x tick count (up to 8) picked a 0.5 step for
    // the [1, 6] category domain, so the category formatter repeated labels
    // ("Q2 Q2 Q3 Q3 …"). Category positions are whole numbers.
    expect(computeLinearTicks([1, 6], 8, true)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('clamps small domains that picked fractional steps even at the default count', () => {
    expect(computeLinearTicks([1, 3], 5, true)).toEqual([1, 2, 3]);
  });

  it('leaves integer steps untouched in integer mode', () => {
    expect(computeLinearTicks([0, 20], 8, true)).toEqual(computeLinearTicks([0, 20], 8));
  });

  it('still produces fractional steps when integer mode is off', () => {
    expect(computeLinearTicks([1, 6], 8)).toContain(1.5);
  });

  it('snaps count-style y domains to whole ticks', () => {
    // Regression: a low-volume order-count chart with y domain [0, 2] rendered
    // ticks 0, 0.5, 1, 1.5, 2 — fractional values for a discrete count. With
    // integer mode (the new yIntegerTicks prop) the axis shows 0, 1, 2.
    expect(computeLinearTicks([0, 2], 5)).toContain(0.5);
    expect(computeLinearTicks([0, 2], 5, true)).toEqual([0, 1, 2]);
  });
});
