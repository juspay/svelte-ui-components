import { render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import LineChart from './LineChart.svelte';

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

const series = [
  {
    name: 'Revenue',
    data: [
      { x: 1, y: 100 },
      { x: 2, y: 200 },
      { x: 3, y: 300 }
    ]
  },
  {
    name: 'Users',
    data: [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
      { x: 3, y: 30 }
    ]
  }
];

describe('LineChart legend aggregation', () => {
  it('shows no aggregate text by default', () => {
    const { container } = render(LineChart, { series, showLegend: true });
    expect(container.querySelectorAll('.legend-aggregate')).toHaveLength(0);
  });

  it('shows a sum aggregate, formatted via yTickFormat by default', () => {
    const withAggregate = [{ ...series[0], aggregate: 'sum' as const }, series[1]];
    const { container } = render(LineChart, {
      series: withAggregate,
      showLegend: true,
      yTickFormat: (v: number | string) => `$${v}`
    });
    const aggregates = container.querySelectorAll('.legend-aggregate');
    expect(aggregates).toHaveLength(1);
    expect(aggregates[0].textContent).toBe('$600');
  });

  it('lets a series override the aggregate formatter independently of yTickFormat', () => {
    const withAggregate = [
      { ...series[0], aggregate: 'average' as const, aggregateFormat: (v: number) => `${v}%` },
      series[1]
    ];
    const { container } = render(LineChart, {
      series: withAggregate,
      showLegend: true,
      yTickFormat: (v: number | string) => `$${v}`
    });
    expect(container.querySelector('.legend-aggregate')?.textContent).toBe('200%');
  });

  it('renders nothing (not NaN) for a series with an empty data array', () => {
    const withEmpty = [series[0], { name: 'Empty', data: [], aggregate: 'average' as const }];
    const { container } = render(LineChart, { series: withEmpty, showLegend: true });
    expect(container.querySelectorAll('.legend-aggregate')).toHaveLength(0);
    expect(container.textContent).not.toContain('NaN');
  });
});
