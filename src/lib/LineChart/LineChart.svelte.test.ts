import { render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import LineChart from './LineChart.svelte';

// jsdom cannot observe real layout (see PieChart/legend.test.ts's own note on
// this), so every element is stubbed to one fixed 800x400 box. That is enough
// to make ChartContainer render its SVG (width/height > 0) and to turn a
// pointer event's clientX/clientY into a deterministic plot-space coordinate
// via `pointerPositionIn` -- exactly what these hover/tooltip tests need,
// without asserting on anything ChartContainer's own browser-tested
// measurement produces.
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

function hoverAt(container: HTMLElement, plotPoint: { x: number; y: number }): void {
  const margin = readMargin(container);
  const overlay = container.querySelector('[data-pw="hover-overlay"]');
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
// series against every other series' array -- so hovering at x=2 (A's own
// 2nd point) used to read series B's 2nd point (x=3, y=300) instead of B's
// actual x=2 sample (y=200).
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

describe('LineChart cross-series alignment', () => {
  it('tooltip at x=2 reports each series’ OWN value there, not a value copied by array position', async () => {
    const { container } = render(LineChart, {
      props: { series: [seriesA, seriesB], aspectRatio: 2, showDots: true }
    });

    // markerPaintOrder renders series back-to-front (B, then A), so the last
    // two `.dot` elements are A's own two points; A's 2nd point is at x=2.
    const dots = dotCenters(container);
    expect(dots).toHaveLength(4);
    const aSecondPoint = dots[3];

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
    // B is longer than A, so a "reuse the reference series' pi" bug would
    // resolve indices that do not exist -- or exist but belong to the wrong
    // x -- on the shorter series.
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
    const { container } = render(LineChart, {
      props: { series: [short, long], aspectRatio: 2, showDots: true, onpointhover }
    });

    // Paint order is [B, A]; B's dots come first, so dots[2] is B's OWN 3rd
    // point (x=3) -- a column A has no sample at all.
    const dots = dotCenters(container);
    expect(dots).toHaveLength(5);
    const bThirdPoint = dots[2];

    hoverAt(container, bThirdPoint);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onpointhover).toHaveBeenCalled();
    const payload = onpointhover.mock.calls.at(-1)?.[0];
    expect(payload).toEqual({ seriesIndex: 1, pointIndex: 2, point: { x: 3, y: 30 } });
  });

  it('preserves exact positional pairing for the common case where every series shares one x sequence', async () => {
    const aligned1 = {
      name: 'A',
      data: [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 }
      ]
    };
    const aligned2 = {
      name: 'B',
      data: [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 30 }
      ]
    };
    const { container } = render(LineChart, {
      props: { series: [aligned1, aligned2], aspectRatio: 2, showDots: true }
    });

    // Paint order [B, A]; A's 2nd point (x=2) is the 5th dot overall (3 for B, then A0, A1).
    const dots = dotCenters(container);
    expect(dots).toHaveLength(6);
    const aSecondPoint = dots[4];

    hoverAt(container, aSecondPoint);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const items = Array.from(container.querySelectorAll('.tooltip-item')).map((el) => ({
      label: el.querySelector('.tooltip-label')?.textContent,
      value: el.querySelector('.tooltip-value')?.textContent
    }));
    expect(items).toEqual([
      { label: 'A', value: '2' },
      { label: 'B', value: '20' }
    ]);
  });
});
