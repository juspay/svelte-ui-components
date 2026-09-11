import { describe, it, expect } from 'vitest';
import { computeSeriesAggregate, formatSeriesAggregate } from './aggregate';

describe('computeSeriesAggregate', () => {
  it('returns null for "none" regardless of the data', () => {
    expect(computeSeriesAggregate([1, 2, 3], 'none')).toBeNull();
    expect(computeSeriesAggregate([], 'none')).toBeNull();
  });

  it('sums the values', () => {
    expect(computeSeriesAggregate([1, 2, 3], 'sum')).toBe(6);
  });

  it('averages the values', () => {
    expect(computeSeriesAggregate([1, 2, 3], 'average')).toBe(2);
  });

  it('finds the minimum', () => {
    expect(computeSeriesAggregate([3, 1, 2], 'min')).toBe(1);
  });

  it('finds the maximum', () => {
    expect(computeSeriesAggregate([3, 1, 2], 'max')).toBe(3);
  });

  it('passes through a single value for every kind', () => {
    expect(computeSeriesAggregate([5], 'sum')).toBe(5);
    expect(computeSeriesAggregate([5], 'average')).toBe(5);
    expect(computeSeriesAggregate([5], 'min')).toBe(5);
    expect(computeSeriesAggregate([5], 'max')).toBe(5);
  });

  // Pinned decision: a null/missing point is ABSENT, not a zero. Treating it as
  // zero would only change `average` (it shrinks the denominator) -- this test
  // is written against `average` specifically because it is the one kind where
  // the two interpretations produce different, both-plausible numbers.
  it('skips null points rather than counting them as zero', () => {
    // Skip-null: (10 + 20) / 2 = 15. Zero-fill: (10 + 0 + 20) / 3 = 10.
    expect(computeSeriesAggregate([10, null, 20], 'average')).toBe(15);
  });

  it('skips non-finite points (NaN, Infinity) the same way as null', () => {
    expect(computeSeriesAggregate([10, Number.NaN, 20], 'average')).toBe(15);
    expect(computeSeriesAggregate([10, Number.POSITIVE_INFINITY, 20], 'average')).toBe(15);
    expect(computeSeriesAggregate([10, Number.NEGATIVE_INFINITY, 20], 'average')).toBe(15);
  });

  it('never lets a skipped point win min/max', () => {
    expect(computeSeriesAggregate([null, 4, null], 'min')).toBe(4);
    expect(computeSeriesAggregate([null, 4, null], 'max')).toBe(4);
  });

  // Pinned decision: an aggregate over zero real data points is `null` for
  // EVERY kind, including `sum` -- an empty/all-null series must never render
  // as a fabricated "0" total, and must never surface `NaN` on screen.
  it('resolves an empty series to null for every kind, not NaN or 0', () => {
    expect(computeSeriesAggregate([], 'sum')).toBeNull();
    expect(computeSeriesAggregate([], 'average')).toBeNull();
    expect(computeSeriesAggregate([], 'min')).toBeNull();
    expect(computeSeriesAggregate([], 'max')).toBeNull();
  });

  it('resolves an all-null series to null for every kind', () => {
    expect(computeSeriesAggregate([null, null], 'sum')).toBeNull();
    expect(computeSeriesAggregate([null, null], 'average')).toBeNull();
    expect(computeSeriesAggregate([null, null], 'min')).toBeNull();
    expect(computeSeriesAggregate([null, null], 'max')).toBeNull();
  });

  it('handles negative values in sum/average/min/max', () => {
    expect(computeSeriesAggregate([-5, 5, -10], 'sum')).toBe(-10);
    expect(computeSeriesAggregate([-5, 5, -10], 'average')).toBeCloseTo(-3.333, 3);
    expect(computeSeriesAggregate([-5, 5, -10], 'min')).toBe(-10);
    expect(computeSeriesAggregate([-5, 5, -10], 'max')).toBe(5);
  });
});

describe('formatSeriesAggregate', () => {
  it('formats the computed value with the given formatter', () => {
    expect(formatSeriesAggregate([1, 2, 3], 'sum', (v) => `$${v}`)).toBe('$6');
  });

  it('returns null instead of calling the formatter for "none"', () => {
    let calls = 0;
    const result = formatSeriesAggregate([1, 2, 3], 'none', (v) => {
      calls += 1;
      return String(v);
    });
    expect(result).toBeNull();
    expect(calls).toBe(0);
  });

  // The formatter must never be handed NaN/null -- this is what keeps a
  // consumer's formatter (e.g. one that assumes a real number) from throwing
  // or rendering "NaN" when a series has no usable data.
  it('never invokes the formatter for an empty series', () => {
    let calls = 0;
    const result = formatSeriesAggregate([], 'average', (v) => {
      calls += 1;
      return String(v);
    });
    expect(result).toBeNull();
    expect(calls).toBe(0);
  });
});
