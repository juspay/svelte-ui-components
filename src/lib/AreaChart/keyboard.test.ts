import { fireEvent, render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import AreaChart from './AreaChart.svelte';

// Same jsdom-stubbing approach as AreaChart.svelte.test.ts: ChartContainer
// measures via getBoundingClientRect() on mount, and jsdom otherwise reports
// an all-zero rect that keeps the <svg> (and every focus target) from ever
// rendering.
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

const series = [
  {
    name: 'Revenue',
    data: [
      { x: 1, y: 10, label: 'Mon' },
      { x: 2, y: 20, label: 'Tue' },
      { x: 3, y: 30, label: 'Wed' }
    ]
  }
];

describe('AreaChart keyboard access', () => {
  it('exposes each data point as a focusable, labelled mark', () => {
    const { container } = render(AreaChart, { props: { series, aspectRatio: 2 } });
    const marks = container.querySelectorAll('circle.focus-target');
    expect(marks).toHaveLength(3);
    for (const mark of marks) {
      expect(mark.getAttribute('tabindex')).toBe('0');
      expect(mark.getAttribute('role')).toBe('button');
      expect(mark.getAttribute('aria-label')).toMatch(/Mon|Tue|Wed/);
    }
  });

  it('invokes onpointclick on Enter and on Space, and not on other keys', async () => {
    const onpointclick = vi.fn();
    const { container } = render(AreaChart, { props: { series, aspectRatio: 2, onpointclick } });
    const second = container.querySelectorAll('circle.focus-target')[1];

    // A real Tab always fires `focus` before any subsequent keydown -- this
    // mirrors that ordering (activate() is reached through the same path as
    // pointer hover, see AreaChart.svelte's `activate`), unlike a click which
    // needs no prior focus event of its own.
    await fireEvent.focus(second);

    await fireEvent.keyDown(second, { key: 'a' });
    expect(onpointclick).not.toHaveBeenCalled();

    await fireEvent.keyDown(second, { key: 'Enter' });
    expect(onpointclick).toHaveBeenCalledWith({
      seriesIndex: 0,
      pointIndex: 1,
      point: series[0].data[1]
    });

    await fireEvent.keyDown(second, { key: ' ' });
    expect(onpointclick).toHaveBeenCalledTimes(2);
  });

  // AreaChart deliberately has no live-status region: unlike LineChart it
  // exposes neither `highlightedIndex` nor a ChartHighlightAPI, so there is
  // no non-focus-triggered highlight path that would need one (see the
  // comment above LineChart's `activeDatum`/`statusText`, and the family's
  // own majority -- only PieChart, which has that same non-focus path, adds
  // a live region). Each mark's own aria-label is this chart's only
  // announcement, matching Bar/DualAxisBar/Funnel/Sankey.
  it('has no live-status region, matching the family majority (no highlightedIndex/ChartHighlightAPI here)', () => {
    const { container } = render(AreaChart, { props: { series, aspectRatio: 2 } });
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  /**
   * Assistive technology commonly realises "activate this control" as a click
   * DISPATCHED AT the focused node, not as a raw keydown. The mark carried only
   * `onkeydown`, so it was reachable, announceable, and unactivatable by exactly
   * the users a focus target exists for -- while all five sibling charts put
   * `onclick` and `onkeydown` on the same element.
   *
   * `pointer-events: none` does not conflict with this: it suppresses hit-testing
   * for real pointer input, which is what keeps mouse hover flowing to the
   * overlay underneath, and a dispatched click still fires a listener here.
   */
  it('activates on a click dispatched at the focused mark, not only on a key', async () => {
    const onpointclick = vi.fn();
    const { container } = render(AreaChart, { props: { series, aspectRatio: 2, onpointclick } });
    const second = container.querySelectorAll('circle.focus-target')[1];

    // A real activation gesture focuses first; the handler reads the focused
    // datum, so a click with no prior focus legitimately does nothing.
    await fireEvent.focus(second);
    await fireEvent.click(second);

    expect(onpointclick).toHaveBeenCalledTimes(1);
  });
});
