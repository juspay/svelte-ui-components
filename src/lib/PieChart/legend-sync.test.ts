import { fireEvent, render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import PieChart from './PieChart.svelte';

const data = [
  { label: 'Alpha', value: 10 },
  { label: 'Beta', value: 20 }
];

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

describe('PieChart synchronized legend', () => {
  it('highlights the matching slice when a legend item is hovered, not just clicked', async () => {
    const { container } = render(PieChart, { data, showLegend: true });
    const item = container.querySelector('[data-pw="pie-legend-sync-1"]');
    expect(item).not.toBeNull();
    if (item === null) {
      throw new Error('legend item not found');
    }

    const slice = container.querySelectorAll('path.slice')[1];
    expect(slice.classList.contains('hovered')).toBe(false);

    await fireEvent.pointerEnter(item);
    expect(slice.classList.contains('hovered')).toBe(true);

    await fireEvent.pointerLeave(item);
    expect(slice.classList.contains('hovered')).toBe(false);
  });

  it('does not use a visibility toggle (aria-pressed) for the sync legend -- highlighting only', () => {
    const { container } = render(PieChart, { data, showLegend: true });
    const item = container.querySelector('[data-pw="pie-legend-sync-0"]');
    expect(item?.hasAttribute('aria-pressed')).toBe(false);
  });

  it('forwards a click on a legend item through the same onsliceclick callback as the slice', async () => {
    const onsliceclick = vi.fn();
    const { container } = render(PieChart, { data, showLegend: true, onsliceclick });
    const item = container.querySelector('[data-pw="pie-legend-sync-0"]');
    if (item === null) {
      throw new Error('legend item not found');
    }

    await fireEvent.click(item);
    expect(onsliceclick).toHaveBeenCalledWith({ index: 0, slice: data[0] });
  });
});
