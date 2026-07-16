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
    // When the nice step already fits the requested count, integer mode is a
    // no-op guard and both modes agree. (Under max-count escalation the modes
    // intentionally diverge: category axes step through whole numbers — any
    // integer stride is a valid category step — while numeric axes climb the
    // 1-2-5-10 ladder so tick values stay round.)
    expect(computeLinearTicks([0, 20], 5, true)).toEqual(computeLinearTicks([0, 20], 5));
    expect(computeLinearTicks([0, 20], 5, true)).toEqual([0, 5, 10, 15, 20]);
  });

  it('still produces fractional steps when integer mode is off', () => {
    // 0.5-step ticks over [1, 6] are 11 values, so the requested count must
    // accommodate them — `count` is a hard max (see below), not a hint.
    expect(computeLinearTicks([1, 6], 12)).toContain(1.5);
  });
});

describe('computeLinearTicks — count is a hard maximum (design spec: max 6 ticks)', () => {
  it('never returns more ticks than requested on a category axis', () => {
    // Regression: 15 daily categories at count 6 picked nice-step 2 → 7 ticks.
    const ticks = computeLinearTicks([1, 15], 6, true);
    expect(ticks.length).toBeLessThanOrEqual(6);
    // Integer escalation lands on the natural every-3rd-day stride.
    expect(ticks).toEqual([3, 6, 9, 12, 15]);
  });

  it('never returns more ticks than requested on a numeric axis', () => {
    // [0, 7] at count 5 picked step 1 → 8 ticks; the ladder climbs to 2.
    const ticks = computeLinearTicks([0, 7], 5);
    expect(ticks.length).toBeLessThanOrEqual(5);
    expect(ticks).toEqual([0, 2, 4, 6]);
  });

  it('keeps at least two ticks when the requested count is tiny', () => {
    expect(computeLinearTicks([1, 15], 1, true).length).toBeGreaterThanOrEqual(1);
    expect(computeLinearTicks([1, 15], 1, true).length).toBeLessThanOrEqual(2);
  });
});
