import { describe, expect, it } from 'vitest';
import { computeUtcTicks, formatUtcTick } from './temporal';

describe('computeUtcTicks', () => {
  it('returns [] for a non-finite domain', () => {
    expect(computeUtcTicks([Number.NaN, 10], 'day')).toEqual([]);
    expect(computeUtcTicks([0, Number.POSITIVE_INFINITY], 'day')).toEqual([]);
  });

  it('returns [] for an inverted domain', () => {
    const max = Date.UTC(2026, 0, 1);
    const min = Date.UTC(2026, 0, 10);
    expect(computeUtcTicks([min, max], 'day')).toEqual([]);
  });

  it('places day ticks on UTC midnight boundaries, not local time', () => {
    const start = Date.UTC(2026, 0, 1, 13, 45); // Jan 1, 13:45 UTC -- not a midnight
    const end = Date.UTC(2026, 0, 4);
    const ticks = computeUtcTicks([start, end], 'day', 8);
    for (const t of ticks) {
      const d = new Date(t);
      expect(d.getUTCHours()).toBe(0);
      expect(d.getUTCMinutes()).toBe(0);
    }
    expect(ticks[0]).toBe(Date.UTC(2026, 0, 1));
  });

  it('steps week ticks by exactly 7 days once thinning is not needed', () => {
    const start = Date.UTC(2026, 0, 1);
    const end = Date.UTC(2026, 0, 22);
    const ticks = computeUtcTicks([start, end], 'week', 8);
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i] - ticks[i - 1]).toBe(7 * 86_400_000);
    }
  });

  it('thins ticks so the count stays at or under maxTicks', () => {
    const start = Date.UTC(2026, 0, 1);
    const end = Date.UTC(2026, 11, 31); // a full year of days
    const ticks = computeUtcTicks([start, end], 'day', 6);
    expect(ticks.length).toBeLessThanOrEqual(6);
  });

  it('steps month ticks onto the 1st of the month even across a variable-length month boundary', () => {
    // Feb 2026 (28 days) sits between Jan (31) and Mar (31) -- a fixed-ms step
    // would drift off the 1st; calendar stepping must not.
    const start = Date.UTC(2026, 0, 1);
    const end = Date.UTC(2026, 3, 1);
    const ticks = computeUtcTicks([start, end], 'month', 8);
    for (const t of ticks) {
      const d = new Date(t);
      expect(d.getUTCDate()).toBe(1);
    }
    expect(ticks).toContain(Date.UTC(2026, 0, 1));
    expect(ticks).toContain(Date.UTC(2026, 1, 1));
    expect(ticks).toContain(Date.UTC(2026, 2, 1));
  });

  it('includes both single-day domain endpoints without an infinite loop', () => {
    const day = Date.UTC(2026, 5, 15);
    const ticks = computeUtcTicks([day, day], 'day');
    expect(ticks).toEqual([day]);
  });
});

describe('formatUtcTick', () => {
  it('returns an empty string for a non-finite value', () => {
    expect(formatUtcTick(Number.NaN)).toBe('');
    expect(formatUtcTick(Number.POSITIVE_INFINITY)).toBe('');
  });

  it('formats a day/week-unit tick as "Mon D" in UTC', () => {
    const value = Date.UTC(2026, 2, 4); // Mar 4 2026
    expect(formatUtcTick(value, 'day')).toBe('Mar 4');
    expect(formatUtcTick(value, 'week')).toBe('Mar 4');
  });

  it('formats a month-unit tick as "Mon YYYY" in UTC', () => {
    const value = Date.UTC(2026, 2, 1);
    expect(formatUtcTick(value, 'month')).toBe('Mar 2026');
  });

  it('defaults to day-style formatting when no unit is given', () => {
    const value = Date.UTC(2026, 6, 20);
    expect(formatUtcTick(value)).toBe('Jul 20');
  });
});
