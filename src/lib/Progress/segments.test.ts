import { describe, expect, it } from 'vitest';

import { clampFilledSegments } from './segments';

describe('clampFilledSegments', () => {
  it('returns the value when it is within range', () => {
    expect(clampFilledSegments(3, 12)).toBe(3);
  });

  it('fills no segments when the value is 0', () => {
    expect(clampFilledSegments(0, 12)).toBe(0);
  });

  it('fills every segment when the value equals the segment count', () => {
    expect(clampFilledSegments(12, 12)).toBe(12);
  });

  it('clamps to the segment count when the value exceeds it', () => {
    expect(clampFilledSegments(20, 12)).toBe(12);
  });

  it('fills no segments for a negative value (indeterminate is ignored when segmented)', () => {
    expect(clampFilledSegments(-1, 12)).toBe(0);
  });

  it('floors fractional values to whole filled segments', () => {
    expect(clampFilledSegments(3.7, 12)).toBe(3);
  });
});
