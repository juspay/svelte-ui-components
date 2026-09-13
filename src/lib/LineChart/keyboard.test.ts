import { fireEvent, render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import LineChart from './LineChart.svelte';

// Same jsdom-stubbing approach as LineChart.svelte.test.ts: ChartContainer
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

describe('LineChart keyboard access', () => {
  it('exposes each data point as a focusable, labelled mark', () => {
    const { container } = render(LineChart, { props: { series, aspectRatio: 2 } });
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
    const { container } = render(LineChart, { props: { series, aspectRatio: 2, onpointclick } });
    const second = container.querySelectorAll('circle.focus-target')[1];

    // A real Tab always fires `focus` before any subsequent keydown -- this
    // mirrors that ordering (activate() is reached through the same path as
    // pointer hover, see LineChart.svelte's `activate`), unlike a click which
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

  // LineChart, unlike AreaChart, exposes both `highlightedIndex` and
  // ChartHighlightAPI -- neither fires a focus event of its own, so (exactly
  // PieChart's own justification for its live region) a live-status region
  // is the only way either path reaches assistive tech.
  it('publishes the focused datum through a live status region for assistive tech', async () => {
    const { container } = render(LineChart, { props: { series, aspectRatio: 2 } });
    const status = container.querySelector('[data-pw="line-status"]');
    expect(status).not.toBeNull();
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(status?.textContent?.trim()).toBe('');

    const first = container.querySelectorAll('circle.focus-target')[0];
    expect(first.getAttribute('aria-describedby')).toBe(status?.id);
    await fireEvent.focus(first);
    expect(status?.textContent).toContain('Mon');

    await fireEvent.blur(first);
    expect(status?.textContent?.trim()).toBe('');
  });

  it('announces a declarative highlightedIndex even with no focus event', () => {
    const { container } = render(LineChart, {
      props: { series, aspectRatio: 2, highlightedIndex: 2 }
    });
    const status = container.querySelector('[data-pw="line-status"]');
    expect(status?.textContent).toContain('Wed');
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
    const { container } = render(LineChart, { props: { series, aspectRatio: 2, onpointclick } });
    const second = container.querySelectorAll('circle.focus-target')[1];

    // A real activation gesture focuses first; the handler reads the focused
    // datum, so a click with no prior focus legitimately does nothing.
    await fireEvent.focus(second);
    await fireEvent.click(second);

    expect(onpointclick).toHaveBeenCalledTimes(1);
  });

  /**
   * `shared` defaults to true whenever there is more than one series, so a
   * shared tooltip listing every series at the hovered x is the DEFAULT
   * multi-series configuration -- not an opt-in. The live region announced only
   * the focused series, so a sighted user saw "Revenue: 10" and "Cost: 5" while
   * a screen-reader user heard "Revenue: 10" alone. The comparison a shared
   * tooltip exists to provide was withheld from exactly the people who cannot
   * read it off the screen.
   */
  it('announces every series at the focused x when the tooltip is shared', async () => {
    const twoSeries = [
      { name: 'Revenue', data: [{ x: 1, y: 10, label: 'Mon' }] },
      { name: 'Cost', data: [{ x: 1, y: 5, label: 'Mon' }] }
    ];
    const { container } = render(LineChart, { props: { series: twoSeries, aspectRatio: 2 } });
    const status = container.querySelector('[data-pw="line-status"]');
    const first = container.querySelectorAll('circle.focus-target')[0];

    await fireEvent.focus(first);

    expect(status?.textContent).toContain('Revenue: 10');
    expect(status?.textContent).toContain('Cost: 5');
  });
});
