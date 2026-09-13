import { render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { formatNumber } from '../_chart/format';
import AreaChart from './AreaChart.svelte';

// Same jsdom-stubbing approach as LineChart.svelte.test.ts (see its own note):
// a fixed 800x400 box is enough for ChartContainer to render its SVG and for
// pointerPositionIn to turn a pointer event into a deterministic plot-space
// coordinate, without asserting on anything real-browser layout would produce.
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

/** Reads the real margin the component computed, from its own rendered
 *  `translate(left, top)` -- not a re-implementation of computeAutoLayout. */
function readMargin(container: HTMLElement): { left: number; top: number } {
  const g = container.querySelector('svg > g');
  const transform = g?.getAttribute('transform') ?? '';
  const match = /translate\(([-\d.]+),\s*([-\d.]+)\)/.exec(transform);
  if (!match) {
    throw new Error(`no translate(...) on outer <g>, got "${transform}"`);
  }
  return { left: Number(match[1]), top: Number(match[2]) };
}

function dotCenters(container: HTMLElement): Array<{ x: number; y: number }> {
  return Array.from(container.querySelectorAll('.dot')).map((el) => ({
    x: Number(el.getAttribute('cx')),
    y: Number(el.getAttribute('cy'))
  }));
}

/** Reads a mark's own (cx, cy) by its aria-label instead of by position in
 *  some list -- a semantic lookup that keeps working however many other
 *  marks render or skip around it. `focus-target` shares its coordinates
 *  exactly with the `dot` at the same point (both come from the same
 *  `area.points[pi]`), so this doubles as "where would that point's dot be." */
function focusTargetCenter(container: HTMLElement, ariaLabel: string): { x: number; y: number } {
  const el = container.querySelector(`circle.focus-target[aria-label="${ariaLabel}"]`);
  if (!el) {
    throw new Error(`no focus-target with aria-label "${ariaLabel}"`);
  }
  return { x: Number(el.getAttribute('cx')), y: Number(el.getAttribute('cy')) };
}

function hoverAt(container: HTMLElement, plotPoint: { x: number; y: number }): void {
  const margin = readMargin(container);
  const overlay = container.querySelector('.hover-overlay');
  if (!overlay) {
    throw new Error('hover-overlay not found');
  }
  overlay.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      clientX: margin.left + plotPoint.x,
      clientY: margin.top + plotPoint.y
    })
  );
}

// The exact counterexample from TABLE-CHART-TASKS.md: two same-length
// series whose x's do NOT line up index-for-index. A positional join (the
// pre-fix bug) reused whichever pi the nearest-x search landed on in ONE
// series against every other series' array.
const seriesA = {
  name: 'A',
  data: [
    { x: 1, y: 10 },
    { x: 2, y: 20 }
  ]
};
const seriesB = {
  name: 'B',
  data: [
    { x: 2, y: 200 },
    { x: 3, y: 300 }
  ]
};

describe('AreaChart cross-series alignment', () => {
  it('tooltip at x=2 reports each series’ OWN value there, not a value copied by array position', async () => {
    const { container } = render(AreaChart, {
      props: { series: [seriesA, seriesB], aspectRatio: 2, showDots: true }
    });

    // AreaChart renders series in order (no back-to-front reversal), so
    // dots[0..1] are A's own two points; A's 2nd point is at x=2.
    const dots = dotCenters(container);
    expect(dots).toHaveLength(4);
    const aSecondPoint = dots[1];

    hoverAt(container, aSecondPoint);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const items = Array.from(container.querySelectorAll('.tooltip-item'));
    expect(items).toHaveLength(2);
    const labelled = items.map((el) => ({
      label: el.querySelector('.tooltip-label')?.textContent,
      value: el.querySelector('.tooltip-value')?.textContent
    }));
    expect(labelled).toEqual([
      { label: 'A', value: '20' },
      // The pre-fix bug would report '300' here (B's own 2nd array
      // position), not '200' (B's actual sample at x=2).
      { label: 'B', value: '200' }
    ]);
  });

  it('onpointhover reports the hovered series’ OWN array index, not a shared position', async () => {
    const onpointhover = vi.fn();
    const short = {
      name: 'A',
      data: [
        { x: 1, y: 1 },
        { x: 2, y: 2 }
      ]
    };
    const long = {
      name: 'B',
      data: [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 30 }
      ]
    };
    const { container } = render(AreaChart, {
      props: { series: [short, long], aspectRatio: 2, showDots: true, onpointhover }
    });

    // Natural order [A, B]; B's dots come after A's 2, so dots[4] is B's OWN
    // 3rd point (x=3) -- a column A has no sample at all.
    const dots = dotCenters(container);
    expect(dots).toHaveLength(5);
    const bThirdPoint = dots[4];

    hoverAt(container, bThirdPoint);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onpointhover).toHaveBeenCalled();
    const payload = onpointhover.mock.calls.at(-1)?.[0];
    expect(payload).toEqual({ seriesIndex: 1, pointIndex: 2, point: { x: 3, y: 30 } });
  });
});

describe('AreaChart gap handling', () => {
  it('a NaN (gap) point in one series does not poison the shared domain for the other series', () => {
    // Pre-fix, AreaChart fed every y (including this NaN) straight into
    // Math.min/max for the auto y-domain; Math.max(...) with a NaN argument
    // returns NaN, so niceLinearDomain(NaN, NaN) poisoned yScale for EVERY
    // series, not just the one with the gap.
    const withGap = {
      name: 'A',
      data: [
        { x: 1, y: 10 },
        { x: 2, y: NaN },
        { x: 3, y: 30 }
      ]
    };
    const clean = {
      name: 'B',
      data: [
        { x: 1, y: 5 },
        { x: 2, y: 5 },
        { x: 3, y: 5 }
      ]
    };
    const { container } = render(AreaChart, {
      props: { series: [withGap, clean], aspectRatio: 2, showDots: true }
    });

    // This test used to assert that a `.dot` existed at A's gap point (x=2)
    // with a non-finite cy -- true of the pre-fix component, but that pinned
    // the very bug fixed by AreaChart's `dot` guard (it now renders no
    // marker for a non-finite point, matching `focus-target` and LineChart)
    // rather than testing this test's own subject. A contributes its 2
    // finite points, then B's own 3, for 5 total.
    const dots = dotCenters(container);
    expect(dots).toHaveLength(5);

    // B's three dots (the clean series) must all be finite pixel positions --
    // if A's gap had poisoned the shared yScale, these would be NaN too.
    const bDots = dots.slice(2);
    expect(bDots).toHaveLength(3);
    for (const dot of bDots) {
      expect(Number.isFinite(dot.x)).toBe(true);
      expect(Number.isFinite(dot.y)).toBe(true);
    }

    // A's own non-gap points (x=1, x=3) must also stay finite.
    expect(Number.isFinite(dots[0].y)).toBe(true);
    expect(Number.isFinite(dots[1].y)).toBe(true);
  });

  it('excludes a gap entry from the tooltip instead of reporting a misleading 0', async () => {
    const withGap = {
      name: 'A',
      data: [
        { x: 1, y: 10 },
        { x: 2, y: NaN },
        { x: 3, y: 30 }
      ]
    };
    const clean = {
      name: 'B',
      data: [
        { x: 1, y: 5 },
        { x: 2, y: 5 },
        { x: 3, y: 5 }
      ]
    };
    const { container } = render(AreaChart, {
      props: { series: [withGap, clean], aspectRatio: 2, showDots: true }
    });

    // B's point at x=2 is the column where A has a gap. Looked up by its own
    // aria-label rather than a position in `dotCenters()` -- an index into
    // that list is only as stable as the count of *other* points that
    // happen to render a dot, which is exactly what just changed underneath
    // this test when the gap point stopped rendering one.
    const bSecondPoint = focusTargetCenter(container, `${formatNumber(2)} — B: ${formatNumber(5)}`);

    hoverAt(container, bSecondPoint);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const items = Array.from(container.querySelectorAll('.tooltip-item')).map((el) => ({
      label: el.querySelector('.tooltip-label')?.textContent,
      value: el.querySelector('.tooltip-value')?.textContent
    }));
    // Only B is reported -- A's gap at this x is absent, not a fabricated '0'.
    expect(items).toEqual([{ label: 'B', value: '5' }]);
  });
});
