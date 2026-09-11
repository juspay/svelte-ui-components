import { render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import BarChart from './BarChart.svelte';

// jsdom cannot observe layout; ChartContainer's ResizeObserver is stubbed the same
// way PieChart/legend.test.ts does it, so this exercises the legend's DOM output
// rather than measurement (which is covered by playwright/visual tests).
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});
afterAll(() => vi.unstubAllGlobals());

const twoSeries = [
  {
    name: 'Revenue',
    data: [
      { label: 'Q1', value: 100 },
      { label: 'Q2', value: 200 },
      { label: 'Q3', value: 300 }
    ]
  },
  {
    name: 'Users',
    data: [
      { label: 'Q1', value: 10 },
      { label: 'Q2', value: 20 },
      { label: 'Q3', value: 30 }
    ]
  }
];

describe('BarChart legend aggregation', () => {
  it('shows no aggregate text when no series sets `aggregate` (default, unchanged today)', () => {
    const { container } = render(BarChart, { series: twoSeries, showLegend: true });
    expect(container.querySelectorAll('.legend-aggregate')).toHaveLength(0);
  });

  it('shows a sum aggregate for a series that opts in, formatted via the chart valueFormat', () => {
    const series = [{ ...twoSeries[0], aggregate: 'sum' as const }, twoSeries[1]];
    const { container } = render(BarChart, {
      series,
      showLegend: true,
      valueFormat: (v: number) => `$${v}`
    });
    const aggregates = container.querySelectorAll('.legend-aggregate');
    expect(aggregates).toHaveLength(1);
    expect(aggregates[0].textContent).toBe('$600'); // 100 + 200 + 300
  });

  it('shows an average aggregate independently per series', () => {
    const series = [
      { ...twoSeries[0], aggregate: 'average' as const },
      { ...twoSeries[1], aggregate: 'average' as const }
    ];
    const { container } = render(BarChart, { series, showLegend: true });
    const aggregates = container.querySelectorAll('.legend-aggregate');
    expect(aggregates).toHaveLength(2);
    expect(aggregates[0].textContent).toBe('200'); // (100+200+300)/3
    expect(aggregates[1].textContent).toBe('20'); // (10+20+30)/3
  });

  it('lets a series override the aggregate formatter independently of the chart valueFormat', () => {
    const series = [
      { ...twoSeries[0], aggregate: 'average' as const, aggregateFormat: (v: number) => `${v}%` }
    ];
    const { container } = render(BarChart, {
      series: [series[0], twoSeries[1]],
      showLegend: true,
      valueFormat: (v: number) => `$${v}`
    });
    const aggregates = container.querySelectorAll('.legend-aggregate');
    expect(aggregates[0].textContent).toBe('200%');
  });

  it('aggregates the raw values, not normaliseToFirstPoint percentages', () => {
    // Regression: the legend must reflect the series' own $/units, not the
    // baseline-100 percentages normaliseToFirstPoint substitutes for display.
    // Baseline of 50 makes the two diverge: raw sum is 300, but the
    // percentage-of-first-point series (100/200/300) sums to 600.
    const revenue = {
      name: 'Revenue',
      aggregate: 'sum' as const,
      data: [
        { label: 'Q1', value: 50 },
        { label: 'Q2', value: 100 },
        { label: 'Q3', value: 150 }
      ]
    };
    const { container } = render(BarChart, {
      series: [revenue, twoSeries[1]],
      showLegend: true,
      normaliseToFirstPoint: true,
      valueFormat: (v: number) => `$${v}`
    });
    const aggregates = container.querySelectorAll('.legend-aggregate');
    expect(aggregates).toHaveLength(1);
    expect(aggregates[0].textContent).toBe('$300'); // 50 + 100 + 150, not the normalised 100+200+300=600
  });

  it('renders nothing (not NaN) for a series with an empty data array', () => {
    // The empty series is second, not first: category labels come from
    // resolvedSeries[0], so an empty *first* series would make the whole
    // chart register as empty -- a BarChart quirk unrelated to aggregation.
    const series = [twoSeries[0], { name: 'Empty', data: [], aggregate: 'average' as const }];
    const { container } = render(BarChart, { series, showLegend: true });
    expect(container.querySelectorAll('.legend-aggregate')).toHaveLength(0);
    expect(container.textContent).not.toContain('NaN');
  });
});
