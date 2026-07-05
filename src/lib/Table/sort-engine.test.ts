import { describe, it, expect } from 'vitest';
import { sortTableRows } from './sortEngine';
import type { JSONValue } from 'type-decoder';

const moneyRows: Array<JSONValue[]> = [
  ['Plan B', '₹19,752.40'],
  ['Plan A', '₹4,938.10'],
  ['Plan C', '₹1,20,000.00']
];

describe('sortTableRows', () => {
  it('returns rows untouched for null direction or single-row data', () => {
    expect(sortTableRows(moneyRows, 1, null)).toBe(moneyRows);
    const single: Array<JSONValue[]> = [['only', 1]];
    expect(sortTableRows(single, 1, 'asc')).toBe(single);
  });

  it('sorts currency/thousands-separated strings numerically, not lexicographically', () => {
    const sorted = sortTableRows(moneyRows, 1, 'asc');
    expect(sorted.map((row) => row[0])).toEqual(['Plan A', 'Plan B', 'Plan C']);
    const descending = sortTableRows(moneyRows, 1, 'desc');
    expect(descending.map((row) => row[0])).toEqual(['Plan C', 'Plan B', 'Plan A']);
  });

  it('sorts percent strings numerically', () => {
    const rows: Array<JSONValue[]> = [
      ['x', '9%'],
      ['y', '85%'],
      ['z', '12%']
    ];
    expect(sortTableRows(rows, 1, 'asc').map((row) => row[0])).toEqual(['x', 'z', 'y']);
  });

  it('sorts text case-insensitively', () => {
    const rows: Array<JSONValue[]> = [['banana'], ['Apple'], ['cherry']];
    expect(sortTableRows(rows, 0, 'asc').map((row) => row[0])).toEqual([
      'Apple',
      'banana',
      'cherry'
    ]);
  });

  it('extracts nested values via nestedKey (object-shaped cells)', () => {
    const rows: Array<JSONValue[]> = [
      ['b', { subrow1: '200' }],
      ['a', { subrow1: '30' }]
    ];
    const sorted = sortTableRows(rows, 1, 'asc', { nestedKey: 'subrow1' });
    expect(sorted.map((row) => row[0])).toEqual(['a', 'b']);
  });

  it('pins the summary row in place while the rest sort', () => {
    const rows: Array<JSONValue[]> = [
      ['Total', '999'],
      ['b', '2'],
      ['a', '1']
    ];
    const sorted = sortTableRows(rows, 1, 'desc', { hasSummaryRow: true });
    expect(sorted.map((row) => row[0])).toEqual(['Total', 'b', 'a']);
  });

  it('sorts dates chronologically only when sortType date is forced, using range starts', () => {
    const rows: Array<JSONValue[]> = [
      ['w2', '8 Jun 2025 - 14 Jun 2025'],
      ['w1', '1 Jun 2025 - 7 Jun 2025'],
      ['w3', '15 Jun 2025']
    ];
    const sorted = sortTableRows(rows, 1, 'asc', { sortType: 'date' });
    expect(sorted.map((row) => row[0])).toEqual(['w1', 'w2', 'w3']);
  });

  it('does not mutate the input array', () => {
    const rows: Array<JSONValue[]> = [
      ['b', 2],
      ['a', 1]
    ];
    const snapshot = rows.map((row) => [...row]);
    sortTableRows(rows, 1, 'asc');
    expect(rows).toEqual(snapshot);
  });
});
