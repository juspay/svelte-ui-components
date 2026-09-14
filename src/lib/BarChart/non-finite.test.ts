import { render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import BarChart from './BarChart.svelte';
import type { BarChartSeries } from './properties';

// Same jsdom stubbing accessible-name.test.ts uses: ChartContainer measures
// with getBoundingClientRect() on mount, and jsdom otherwise reports an
// all-zero rect, so no <svg>, no bars, and no axis ticks are ever rendered.
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
    top: 0,
    right: 800,
    bottom: 400,
    width: 800,
    height: 400,
    x: 0,
    y: 0,
    toJSON: () => ({})
  }));
});
afterAll(() => vi.unstubAllGlobals());

/**
 * Reads the left (value) axis' rendered tick-label text, in DOM order.
 * A collapsed/poisoned domain renders different tick text than a correct
 * one, so comparing this array is a real-rendered-output stand-in for
 * "the axis domain is still what the finite data implies".
 */
function leftAxisTickLabels(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[data-pw="axis-left"] .tick-label')].map(
    (el) => el.textContent ?? ''
  );
}

/** Finds a rendered bar `<path>` by an exact prefix of its aria-label and returns its `d`. */
function barD(container: HTMLElement, ariaLabelPrefix: string): string {
  const bar = [...container.querySelectorAll('path.bar')].find((el) =>
    (el.getAttribute('aria-label') ?? '').startsWith(ariaLabelPrefix)
  );
  if (!bar) {
    throw new Error(`non-finite.test.ts: no bar found with aria-label prefix "${ariaLabelPrefix}"`);
  }
  const d = bar.getAttribute('d');
  if (d === null) {
    throw new Error(`non-finite.test.ts: bar "${ariaLabelPrefix}" has no d attribute`);
  }
  return d;
}

// ── Grouped/single mode: yExtent's finite filter ───────────────────────────
//
// stackContribution(0) === Math.max(0, 0) === 0, and the extent filter simply
// drops a non-finite value from the min/max computation -- which for a value
// that would itself contribute 0 to Math.max(0, ...) is observationally
// identical to just being 0. So a render with the bad value swapped for a
// literal 0 is the correct "as if excluded" reference: same category count,
// same label text, same layout -- the only thing that can legitimately differ
// is geometry the guard is supposed to protect.

const withBadValue = (badValue: number): ReadonlyArray<{ label: string; value: number }> => [
  { label: 'A', value: 10 },
  { label: 'Bad', value: badValue },
  { label: 'C', value: 30 }
];

describe.each([
  ['NaN', NaN],
  ['Infinity', Infinity]
])('BarChart non-finite guard — grouped/single mode (%s)', (label, badValue) => {
  it(`excludes a ${label} value from the value-axis domain, leaving the other bars and the axis ticks identical to a benign 0 at that point`, () => {
    const bad = render(BarChart, { props: { data: [...withBadValue(badValue)], aspectRatio: 2 } });
    const reference = render(BarChart, { props: { data: [...withBadValue(0)], aspectRatio: 2 } });

    const badTicks = leftAxisTickLabels(bad.container);
    // Sanity requirement from the assignment: the value axis renders ticks at
    // all (this alone can pass even with the guard removed here, because
    // niceLinearDomain has its own independent non-finite fallback -- see the
    // tick-content equality assertion below for the check that actually
    // distinguishes fixed from broken).
    expect(badTicks.length).toBeGreaterThan(0);
    expect(badTicks).toEqual(leftAxisTickLabels(reference.container));

    expect(barD(bad.container, 'A:')).toBe(barD(reference.container, 'A:'));
    expect(barD(bad.container, 'C:')).toBe(barD(reference.container, 'C:'));
  });
});

// ── Stacked mode: stackContribution guards both categoryTotals and stackBase ─
//
// Series A carries the bad value at Cat1; series B is the "other" series
// stacked in the same category. If A's bad value corrupts the running
// stackBase, B's bar at Cat1 shifts (or turns to NaN geometry) even though
// B's own data never changed. As above, swapping the bad value for a literal
// 0 is the correct neutral reference (stackContribution folds both to 0).

const stackedSeries = (badValue: number): BarChartSeries[] => [
  {
    name: 'A',
    data: [
      { label: 'Cat1', value: badValue },
      { label: 'Cat2', value: 10 }
    ]
  },
  {
    name: 'B',
    data: [
      { label: 'Cat1', value: 5 },
      { label: 'Cat2', value: 20 }
    ]
  }
];

describe.each([
  ['NaN', NaN],
  ['Infinity', Infinity]
])('BarChart non-finite guard — stacked mode (%s)', (label, badValue) => {
  it(`does not let series A's ${label} value at Cat1 corrupt series B's stack base, and renders no "NaN" in any bar path`, () => {
    const bad = render(BarChart, {
      props: { series: stackedSeries(badValue), groupMode: 'stacked', aspectRatio: 2 }
    });
    const reference = render(BarChart, {
      props: { series: stackedSeries(0), groupMode: 'stacked', aspectRatio: 2 }
    });

    for (const bar of [...bad.container.querySelectorAll('path.bar')]) {
      expect(bar.getAttribute('d')).not.toContain('NaN');
    }

    // The other series' bars, at the poisoned category AND elsewhere, must be
    // byte-identical to the neutral-zero reference.
    expect(barD(bad.container, 'Cat1 — B:')).toBe(barD(reference.container, 'Cat1 — B:'));
    expect(barD(bad.container, 'Cat2 — B:')).toBe(barD(reference.container, 'Cat2 — B:'));
  });
});
