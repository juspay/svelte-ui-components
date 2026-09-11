import { render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import DualAxisBarChart from './DualAxisBarChart.svelte';

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

const categories = ['Jan', 'Feb', 'Mar'];
const series = [
  { name: 'Revenue', data: [100, 200, 300], yAxisIndex: 0 as const },
  { name: 'Conversion', data: [10, 20, 30], yAxisIndex: 1 as const }
];

describe('DualAxisBarChart legend aggregation', () => {
  it('shows no aggregate text by default', () => {
    const { container } = render(DualAxisBarChart, { categories, series, showLegend: true });
    expect(container.querySelectorAll('.legend-aggregate')).toHaveLength(0);
  });

  it('formats the aggregate using its own axis valueFormat by default', () => {
    const withAggregate = [
      { ...series[0], aggregate: 'sum' as const },
      { ...series[1], aggregate: 'average' as const }
    ];
    const { container } = render(DualAxisBarChart, {
      categories,
      series: withAggregate,
      showLegend: true,
      leftAxis: { valueFormat: (v: number) => `$${v}` },
      rightAxis: { valueFormat: (v: number) => `${v}%` }
    });
    const aggregates = container.querySelectorAll('.legend-aggregate');
    expect(aggregates).toHaveLength(2);
    expect(aggregates[0].textContent).toBe('$600'); // left axis, sum
    expect(aggregates[1].textContent).toBe('20%'); // right axis, average
  });

  it('lets a series override the aggregate formatter independently of its axis', () => {
    const withAggregate = [
      {
        ...series[0],
        aggregate: 'sum' as const,
        aggregateFormat: (v: number) => `total ${v}`
      },
      series[1]
    ];
    const { container } = render(DualAxisBarChart, {
      categories,
      series: withAggregate,
      showLegend: true,
      leftAxis: { valueFormat: (v: number) => `$${v}` }
    });
    expect(container.querySelector('.legend-aggregate')?.textContent).toBe('total 600');
  });

  it('renders nothing (not NaN) for a series with an empty data array', () => {
    const withEmpty = [
      series[0],
      { name: 'Empty', data: [], yAxisIndex: 1 as const, aggregate: 'average' as const }
    ];
    const { container } = render(DualAxisBarChart, {
      categories,
      series: withEmpty,
      showLegend: true
    });
    expect(container.querySelectorAll('.legend-aggregate')).toHaveLength(0);
    expect(container.textContent).not.toContain('NaN');
  });
});
