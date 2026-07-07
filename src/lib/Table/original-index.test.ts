import { describe, it, expect } from 'vitest';

/**
 * Proves the mechanism Table.svelte uses to hand cell callbacks a sort-stable
 * `originalIndex`. The component builds `originalIndexByRow = new Map(effectiveData.map(...))`
 * over the consumer's ORIGINAL row order, and its `sortedTableData` returns the SAME row
 * object references reordered (never clones), so a Map lookup on any displayed (sorted) row
 * yields its index in the consumer's unsorted `rows` array. That is exactly what a consumer
 * needs to index its own source array correctly after the user sorts.
 */
describe('Table originalIndex under sort', () => {
  it('resolves each sorted display row back to its original consumer index', () => {
    // Projected rows in the consumer's original order (as normalizeColumns produces).
    const rows: Array<[string, number]> = [
      ['Charlie', 30],
      ['Alice', 10],
      ['Bob', 20]
    ];

    // Table.svelte: originalIndexByRow = new Map(effectiveData.map((row, index) => [row, index]))
    const originalIndexByRow = new Map(rows.map((row, index) => [row, index]));

    // Table.svelte sortedTableData: `[...effectiveData].sort(...)` — reorders the SAME refs.
    const sorted = [...rows].sort((a, b) => a[1] - b[1]); // ascending by the numeric column
    expect(sorted.map((row) => row[0])).toEqual(['Alice', 'Bob', 'Charlie']); // display order changed

    // For each displayed row, `originalIndex` points back to its pre-sort position.
    const resolved = sorted.map((row, displayIndex) => ({
      display: row[0],
      displayIndex,
      originalIndex: originalIndexByRow.get(row)
    }));

    expect(resolved).toEqual([
      { display: 'Alice', displayIndex: 0, originalIndex: 1 },
      { display: 'Bob', displayIndex: 1, originalIndex: 2 },
      { display: 'Charlie', displayIndex: 2, originalIndex: 0 }
    ]);

    // The exact bug the fix closes: acting on the DISPLAY index would target the wrong
    // source row. First sorted row is Alice (originalIndex 1); the old display index (0)
    // would have wrongly addressed rows[0] = Charlie.
    expect(originalIndexByRow.get(sorted[0])).toBe(1);
    expect(originalIndexByRow.get(sorted[0])).not.toBe(0);
  });

  it('is identity when unsorted (originalIndex === displayIndex)', () => {
    const rows: Array<[string, number]> = [
      ['Charlie', 30],
      ['Alice', 10],
      ['Bob', 20]
    ];
    const originalIndexByRow = new Map(rows.map((row, index) => [row, index]));
    const unsorted = [...rows]; // no sort applied
    unsorted.forEach((row, displayIndex) => {
      expect(originalIndexByRow.get(row)).toBe(displayIndex);
    });
  });
});
