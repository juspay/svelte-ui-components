import { describe, expect, it } from 'vitest';
import { formatNumberIndian } from './format';

describe('formatNumberIndian', () => {
  it('formats values >= 1 Cr (10 million) with Cr suffix', () => {
    expect(formatNumberIndian(15000000)).toBe('1.5Cr');
    expect(formatNumberIndian(10000000)).toBe('1Cr');
    expect(formatNumberIndian(100000000)).toBe('10Cr');
  });

  it('strips trailing zeros in Cr values', () => {
    expect(formatNumberIndian(10000000)).toBe('1Cr');
    expect(formatNumberIndian(20000000)).toBe('2Cr');
  });

  it('formats values >= 1 L (100 thousand) with L suffix', () => {
    expect(formatNumberIndian(250000)).toBe('2.5L');
    expect(formatNumberIndian(100000)).toBe('1L');
    expect(formatNumberIndian(500000)).toBe('5L');
  });

  it('strips trailing zeros in L values', () => {
    expect(formatNumberIndian(100000)).toBe('1L');
    expect(formatNumberIndian(500000)).toBe('5L');
  });

  it('formats values >= 1 K (1 thousand) with K suffix', () => {
    expect(formatNumberIndian(5000)).toBe('5K');
    expect(formatNumberIndian(1000)).toBe('1K');
    expect(formatNumberIndian(1500)).toBe('1.5K');
  });

  it('strips trailing zeros in K values', () => {
    expect(formatNumberIndian(1000)).toBe('1K');
    expect(formatNumberIndian(2500)).toBe('2.5K');
  });

  it('formats small values using en-IN locale', () => {
    expect(formatNumberIndian(999)).toBe('999');
    expect(formatNumberIndian(0)).toBe('0');
    expect(formatNumberIndian(1)).toBe('1');
  });

  it('handles negative values correctly', () => {
    expect(formatNumberIndian(-15000000)).toBe('-1.5Cr');
    expect(formatNumberIndian(-250000)).toBe('-2.5L');
    expect(formatNumberIndian(-5000)).toBe('-5K');
  });

  it('handles boundary values correctly', () => {
    // Exactly at Cr threshold
    expect(formatNumberIndian(1e7)).toBe('1Cr');
    // Just above Cr threshold
    expect(formatNumberIndian(1.5e7)).toBe('1.5Cr');
    // Exactly at L threshold
    expect(formatNumberIndian(1e5)).toBe('1L');
    // Just above L threshold
    expect(formatNumberIndian(1.5e5)).toBe('1.5L');
    // Exactly at K threshold
    expect(formatNumberIndian(1e3)).toBe('1K');
    // Just below K threshold — locale format
    expect(formatNumberIndian(999)).toBe('999');
  });
});
