import { render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import DualAxisBarChart from './DualAxisBarChart.svelte';
import type { DualAxisSeries } from './properties';

// Same jsdom stubbing the BarChart/DualAxisBarChart specs use elsewhere:
// ChartContainer measures with getBoundingClientRect() on mount, and jsdom
// otherwise reports an all-zero rect, so no <svg>, no bars, and no axis
// ticks are ever rendered.
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

/** Reads the left-axis' rendered tick-label text, in DOM order. */
function leftAxisTickLabels(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[data-pw="axis-left"] .tick-label')].map(
    (el) => el.textContent ?? ''
  );
}

/** Finds a rendered bar `<path>` by its exact aria-label ("{category}: {value}") and returns its `d`. */
function barD(container: HTMLElement, ariaLabel: string): string {
  const bar = [...container.querySelectorAll('path.bar-shape')].find(
    (el) => el.getAttribute('aria-label') === ariaLabel
  );
  if (!bar) {
    throw new Error(`non-finite.test.ts: no bar found with aria-label "${ariaLabel}"`);
  }
  const d = bar.getAttribute('d');
  if (d === null) {
    throw new Error(`non-finite.test.ts: bar "${ariaLabel}" has no d attribute`);
  }
  return d;
}

const categories = ['Q1', 'Q2', 'Q3', 'Q4'];

// One well-behaved series shares the left axis with a second series carrying
// the bad values, exactly like BarChart's "one bad series must not corrupt
// the other" setup, but for axisDomain() rather than a stacked baseline.
const cleanSeries: DualAxisSeries = { name: 'Clean', data: [10, 20, 30, 40], yAxisIndex: 0 };

// 0 is the correct "as if excluded" reference for axisDomain's finite filter:
// the domain is computed as [Math.min(0, ...), Math.max(0, ...)], so an
// explicit 0 already sits at the floor either way and cannot move the
// bounds -- unlike the bad values, which the filter must actively drop.
const badMix: DualAxisSeries = { name: 'Bad', data: [NaN, Infinity, -Infinity, 7], yAxisIndex: 0 };
const neutralReference: DualAxisSeries = { name: 'Bad', data: [0, 0, 0, 7], yAxisIndex: 0 };

describe('DualAxisBarChart non-finite guard — axisDomain', () => {
  it('keeps the left axisDomain unpoisoned by a same-axis series mixing NaN, Infinity and -Infinity, leaving the clean series and the axis ticks identical to the neutral reference', () => {
    const bad = render(DualAxisBarChart, {
      props: { categories, series: [cleanSeries, badMix], aspectRatio: 2 }
    });
    const reference = render(DualAxisBarChart, {
      props: { categories, series: [cleanSeries, neutralReference], aspectRatio: 2 }
    });

    const badTicks = leftAxisTickLabels(bad.container);
    // Sanity requirement from the assignment: the axis renders ticks at all
    // (this alone can pass even with the guard removed, because
    // niceLinearDomain has its own independent non-finite fallback -- the
    // tick-content equality assertion below is what actually distinguishes
    // fixed from broken).
    expect(badTicks.length).toBeGreaterThan(0);
    expect(badTicks).toEqual(leftAxisTickLabels(reference.container));

    // The clean series' own bars never carry a bad value, so their geometry
    // must be completely unaffected by whatever the other same-axis series
    // contains.
    expect(barD(bad.container, 'Q1: 10')).toBe(barD(reference.container, 'Q1: 10'));
    expect(barD(bad.container, 'Q4: 40')).toBe(barD(reference.container, 'Q4: 40'));
  });
});
