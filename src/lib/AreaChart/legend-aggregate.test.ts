import { render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import AreaChart from './AreaChart.svelte';

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

describe('AreaChart legend aggregation', () => {
  it('shows no aggregate text by default', () => {
    const { container } = render(AreaChart, { series, showLegend: true });
    expect(container.querySelectorAll('.legend-aggregate')).toHaveLength(0);
  });

  it('shows a sum aggregate per-series even when stacked (never the stack total)', () => {
    const withAggregate = [{ ...series[0], aggregate: 'sum' as const }, series[1]];
    const { container } = render(AreaChart, {
      series: withAggregate,
      showLegend: true,
      stacked: true
    });
    const aggregates = container.querySelectorAll('.legend-aggregate');
    expect(aggregates).toHaveLength(1);
    // 100+200+300 = 600, NOT the per-category stack total (110/220/330 -> 660).
    expect(aggregates[0].textContent).toBe('600');
  });

  it('lets a series override the aggregate formatter independently of yTickFormat', () => {
    const withAggregate = [
      { ...series[0], aggregate: 'average' as const, aggregateFormat: (v: number) => `${v}%` },
      series[1]
    ];
    const { container } = render(AreaChart, {
      series: withAggregate,
      showLegend: true,
      yTickFormat: (v: number | string) => `$${v}`
    });
    expect(container.querySelector('.legend-aggregate')?.textContent).toBe('200%');
  });

  it('renders nothing (not NaN) for a series with an empty data array', () => {
    const withEmpty = [series[0], { name: 'Empty', data: [], aggregate: 'average' as const }];
    const { container } = render(AreaChart, { series: withEmpty, showLegend: true });
    expect(container.querySelectorAll('.legend-aggregate')).toHaveLength(0);
    expect(container.textContent).not.toContain('NaN');
  });
});
