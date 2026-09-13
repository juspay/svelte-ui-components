import { render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import BarChart from './BarChart.svelte';

// Same jsdom stubbing the chart family's other specs use: ChartContainer
// measures with getBoundingClientRect() on mount, and jsdom otherwise reports an
// all-zero rect, so no <svg> and no bars are ever rendered.
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

const multiSeries = [
  { name: 'Revenue', data: [{ label: 'Jan', value: 42 }] },
  { name: 'Cost', data: [{ label: 'Jan', value: 38 }] }
];

/**
 * Every bar is `tabindex="0" role="button"`, so its aria-label is the only thing
 * a screen-reader user gets. In a multi-series chart two bars share a category,
 * and the label named only the category and the value -- so tabbing a grouped
 * chart announced "Jan: 42" then "Jan: 38" with nothing saying which series
 * either belonged to. The tooltip has disambiguated the same two bars with
 * `{label} — {seriesName}` since it shipped, so the information existed and only
 * sighted users had it.
 */
describe('BarChart accessible names', () => {
  it('names the series, so two bars in one category are distinguishable', () => {
    const { container } = render(BarChart, { props: { series: multiSeries, aspectRatio: 2 } });
    const labels = [...container.querySelectorAll('path.bar')].map((bar) =>
      bar.getAttribute('aria-label')
    );

    expect(labels).toHaveLength(2);
    // The assertion that matters is distinctness: whatever the wording, two
    // marks a sighted user can tell apart must not announce identically.
    expect(new Set(labels).size).toBe(2);
    expect(labels[0]).toContain('Revenue');
    expect(labels[1]).toContain('Cost');
  });

  it('leaves a single-series chart naming only the category', () => {
    // `isMulti` is false here, so adding the series name would append an empty
    // one -- the single-series path must stay exactly as it was.
    const { container } = render(BarChart, {
      props: {
        data: [
          { label: 'Jan', value: 42 },
          { label: 'Feb', value: 38 }
        ],
        aspectRatio: 2
      }
    });
    const labels = [...container.querySelectorAll('path.bar')].map((bar) =>
      bar.getAttribute('aria-label')
    );

    expect(labels).toEqual(['Jan: 42', 'Feb: 38']);
  });
});
