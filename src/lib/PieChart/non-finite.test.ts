import { fireEvent, render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import PieChart from './PieChart.svelte';
import { computePieLayout } from '../_chart/geometry';

// Same rationale as keyboard.test.ts: ChartContainer only renders its <svg>
// (and every slice path) once it measures a non-zero rect, which jsdom never
// produces on its own.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    left: 0,
    right: 300,
    top: 0,
    bottom: 300,
    width: 300,
    height: 300,
    x: 0,
    y: 0,
    toJSON: () => ({})
  }));
});
afterAll(() => vi.unstubAllGlobals());

describe('computePieLayout non-finite guard', () => {
  // The verified pre-fix symptom: `total` was one shared reduce over the
  // whole array, so a single NaN slice made `val / total` come out NaN for
  // EVERY slice's percentage, not just the offending one.
  const dataWithNaNSlice = [
    { label: 'A', value: 10 },
    { label: 'B', value: Number.NaN },
    { label: 'C', value: 20 },
    { label: 'D', value: 30 },
    { label: 'E', value: 40 }
  ];

  it("does not let one NaN slice poison every other slice's percentage", () => {
    const slices = computePieLayout(dataWithNaNSlice);
    expect(slices).toHaveLength(5);
    for (const slice of slices) {
      expect(Number.isFinite(slice.percentage), `${slice.label} percentage is finite`).toBe(true);
    }
    // The poisoned slice itself contributes zero rather than propagating.
    expect(slices.find((s) => s.label === 'B')?.percentage).toBe(0);
  });

  it("still sums the remaining good slices' percentages correctly", () => {
    const slices = computePieLayout(dataWithNaNSlice);
    const total = slices.reduce((sum, s) => sum + s.percentage, 0);
    expect(total).toBeCloseTo(100, 6);
  });

  // Infinity is a distinct failure mode from NaN: unguarded, `total` itself
  // becomes Infinity (not NaN), so `val / total` is 0 -- finite -- for every
  // OTHER slice's percentage. What actually goes non-finite unguarded is the
  // running `angle` accumulator: the offending slice's own sliceAngle is
  // Infinity/Infinity = NaN, and because `angle` is a running sum (not
  // recomputed per slice), that NaN carries forward into every slice's
  // start/end/mid angle AFTER it in array order, while slices before it stay
  // untouched. The guard must close this off too, not just the NaN case.
  it('keeps every slice angle finite for an Infinity value, including slices after it in array order', () => {
    const data = [
      { label: 'A', value: 10 },
      { label: 'B', value: Number.POSITIVE_INFINITY },
      { label: 'C', value: 20 },
      { label: 'D', value: 30 }
    ];
    const slices = computePieLayout(data);
    expect(slices).toHaveLength(4);
    for (const slice of slices) {
      expect(Number.isFinite(slice.startAngle), `${slice.label} startAngle finite`).toBe(true);
      expect(Number.isFinite(slice.endAngle), `${slice.label} endAngle finite`).toBe(true);
      expect(Number.isFinite(slice.midAngle), `${slice.label} midAngle finite`).toBe(true);
      expect(Number.isFinite(slice.percentage), `${slice.label} percentage finite`).toBe(true);
    }
  });
});

describe('PieChart component non-finite guard', () => {
  const data = [
    { label: 'Alpha', value: 10 },
    { label: 'Beta', value: Number.NaN },
    { label: 'Gamma', value: 20 }
  ];

  // The values-legend row (~PieChart.svelte:593) reads `d.value` off the raw
  // prop directly, not off a computed slice -- a separate unguarded site from
  // computePieLayout's own total/val reduces.
  it('never renders the literal "NaN" in the values-legend row, which reads raw data directly', () => {
    const { container } = render(PieChart, { data, showLegend: true, legendShowValues: true });
    const rows = container.querySelectorAll('.pie-legend-row');
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.textContent).not.toContain('NaN');
    }
  });

  it('does not announce "NaN" through the aria-live status region for the poisoned slice', async () => {
    const { container } = render(PieChart, { data });
    const status = container.querySelector('[data-pw="pie-status"]');
    const badSlice = container.querySelectorAll('path.slice')[1];

    await fireEvent.focus(badSlice);
    expect(status?.textContent).not.toContain('NaN');
    expect(status?.textContent).toContain('Beta');
  });
});
