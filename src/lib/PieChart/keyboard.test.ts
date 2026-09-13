import { fireEvent, render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import PieChart from './PieChart.svelte';

const data = [
  { label: 'Alpha', value: 10 },
  { label: 'Beta', value: 20 },
  { label: 'Gamma', value: 30 }
];

// ChartContainer measures via getBoundingClientRect() on mount; jsdom otherwise
// reports an all-zero rect, which keeps its <svg> (and every slice path) from
// ever rendering. Stubbing a non-zero rect lets these tests reach real slices.
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

describe('PieChart keyboard access', () => {
  it('exposes each slice as a focusable, labelled button', () => {
    const { container } = render(PieChart, { data });
    const slices = container.querySelectorAll('path.slice');
    expect(slices).toHaveLength(3);
    for (const slice of slices) {
      expect(slice.getAttribute('tabindex')).toBe('0');
      expect(slice.getAttribute('role')).toBe('button');
      expect(slice.getAttribute('aria-label')).toMatch(/Alpha|Beta|Gamma/);
    }
  });

  it('invokes onsliceclick on Enter and on Space, and not on other keys', async () => {
    const onsliceclick = vi.fn();
    const { container } = render(PieChart, { data, onsliceclick });
    const second = container.querySelectorAll('path.slice')[1];

    await fireEvent.keyDown(second, { key: 'a' });
    expect(onsliceclick).not.toHaveBeenCalled();

    await fireEvent.keyDown(second, { key: 'Enter' });
    expect(onsliceclick).toHaveBeenCalledWith({ index: 1, slice: data[1] });

    await fireEvent.keyDown(second, { key: ' ' });
    expect(onsliceclick).toHaveBeenCalledTimes(2);
  });

  it('publishes the focused datum through a live status region for assistive tech', async () => {
    const { container } = render(PieChart, { data });
    const status = container.querySelector('[data-pw="pie-status"]');
    expect(status).not.toBeNull();
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(status?.textContent?.trim()).toBe('');

    const first = container.querySelectorAll('path.slice')[0];
    expect(first.getAttribute('aria-describedby')).toBe(status?.id);
    await fireEvent.focus(first);
    expect(status?.textContent).toContain('Alpha');

    await fireEvent.blur(first);
    expect(status?.textContent?.trim()).toBe('');
  });
});
