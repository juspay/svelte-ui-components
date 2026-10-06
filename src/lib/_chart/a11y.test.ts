import { describe, expect, it } from 'vitest';
import { defaultChartName, resolveChartName } from './a11y';

describe('chart name helpers', () => {
  it('prefers a non-blank ariaLabel over the derived name', () => {
    expect(resolveChartName('Revenue by month', 'Line chart')).toBe('Revenue by month');
    expect(resolveChartName('   ', 'Line chart')).toBe('Line chart');
    expect(resolveChartName(null, 'Line chart')).toBe('Line chart');
  });

  it('keeps the wording BarChart always put on its wrapping region', () => {
    expect(defaultChartName('bar', { yAxisLabel: 'Revenue ($)' })).toBe('Revenue ($) bar chart');
  });

  it('lists named series when there is no y-axis title, and only the kind when there is nothing', () => {
    expect(defaultChartName('line', { seriesNames: ['Revenue', 'Cost'] })).toBe(
      'Line chart: Revenue, Cost'
    );
    expect(defaultChartName('area', { seriesNames: ['', '  '] })).toBe('Area chart');
    expect(defaultChartName('bar', {})).toBe('Bar chart');
  });
  it('names the remaining families from the data they plot', () => {
    expect(defaultChartName('pie', { seriesNames: ['UPI', 'Card'] })).toBe('Pie chart: UPI, Card');
    expect(defaultChartName('sankey', { seriesNames: ['Visits', 'Orders'] })).toBe(
      'Flow diagram: Visits, Orders'
    );
    expect(defaultChartName('dual-axis', { seriesNames: ['Revenue', 'CTR'] })).toBe(
      'Dual-axis chart: Revenue, CTR'
    );
    expect(defaultChartName('funnel', { seriesNames: ['Visits', 'Orders'] })).toBe(
      'Funnel chart: Visits, Orders'
    );
  });
});
