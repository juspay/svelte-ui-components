import { render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import PieChart from './PieChart.svelte';

/*
 * jsdom cannot observe layout; ChartContainer measures via
 * getBoundingClientRect() on mount, and jsdom otherwise reports an all-zero
 * rect, which keeps the <svg> (and every slice path/label) from ever
 * rendering -- same rationale as keyboard.test.ts and non-finite.test.ts,
 * which this file sits alongside.
 */
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

const data = [
  { label: 'Chrome', value: 30 },
  { label: 'Safari', value: 70 }
];
const baseProps = { data, showLegend: true, legendShowValues: true };

describe('PieChart animateLegendValues (default off)', () => {
  it('renders the legend value as a plain text node, with no AnimatedNumber in the tree', () => {
    const { container } = render(PieChart, baseProps);
    const values = [...container.querySelectorAll('.pie-legend-value')];
    expect(values).toHaveLength(2);
    // formatNumber(30) === '30', pctFormat(30) === '30%' -- joined by the
    // same non-breaking space the markup's `&nbsp;` entity resolves to.
    expect(values[0].textContent?.trim()).toBe('30 30%');
    expect(values[1].textContent?.trim()).toBe('70 70%');
    expect(container.querySelector('.animated-number')).toBeNull();
  });

  it('renders byte-identical legend value markup whether the prop is omitted or explicitly false', () => {
    const omitted = render(PieChart, baseProps);
    const explicitFalse = render(PieChart, { ...baseProps, animateLegendValues: false });
    const omittedValue = omitted.container.querySelector('.pie-legend-value');
    const explicitValue = explicitFalse.container.querySelector('.pie-legend-value');
    expect(explicitValue?.innerHTML).toBe(omittedValue?.innerHTML);
  });

  it('leaves the SVG slice labels, collision engine and +N more overflow untouched', () => {
    // Slices are role="button" too, so the overflow control is queried by its
    // own class rather than getByRole('button'), which would be ambiguous.
    const { container } = render(PieChart, {
      ...baseProps,
      showLabels: true,
      showValues: true,
      legendMaxItems: 1
    });
    // Slice labels are still plain SVG <text> nodes, never AnimatedNumber.
    const sliceLabels = [...container.querySelectorAll('.slice-label')];
    expect(sliceLabels.length).toBeGreaterThan(0);
    for (const label of sliceLabels) {
      expect(label.tagName.toLowerCase()).toBe('text');
    }
    expect(container.querySelectorAll('.pie-legend-row')).toHaveLength(1);
    expect(container.querySelector('.pie-legend-more')?.textContent?.trim()).toBe('+1 more');
  });
});

describe('PieChart animateLegendValues (opt-in)', () => {
  it('routes each .pie-legend-value through AnimatedNumber, exposing the same text as its accessible name', () => {
    const { container } = render(PieChart, { ...baseProps, animateLegendValues: true });
    const values = [...container.querySelectorAll('.pie-legend-value')];
    expect(values).toHaveLength(2);

    const roots = [...container.querySelectorAll('.pie-legend-value .animated-number')];
    expect(roots).toHaveLength(2);
    expect(roots[0].getAttribute('role')).toBe('img');
    expect(roots[0].getAttribute('aria-label')).toBe('30 30%');
    expect(roots[1].getAttribute('aria-label')).toBe('70 70%');

    // Nothing is left beside the odometer -- the legend cell must not render the
    // value once as an odometer and again as plain text. Checked by removing the
    // odometer's subtree rather than by scraping textContent: the subtree legitimately
    // contains the value twice, once as the ten-glyph track every column keeps for
    // the roll and once as the visually-hidden node that makes the number
    // selectable and copyable.
    const withoutOdometer = values[0].cloneNode(true) as HTMLElement;
    withoutOdometer.querySelector('[role="img"]')?.remove();
    expect(withoutOdometer.textContent?.trim()).toBe('');
  });

  it('still respects a custom valueFormat, animated or not', () => {
    const valueFormat = (value: number): string => `$${value.toFixed(2)}`;
    const { container } = render(PieChart, {
      ...baseProps,
      valueFormat,
      animateLegendValues: true
    });
    const root = container.querySelector('.pie-legend-value .animated-number');
    expect(root?.getAttribute('aria-label')).toBe('$30.00 30%');
  });

  it('does not disturb the +N more overflow control while animated', () => {
    const { container } = render(PieChart, {
      ...baseProps,
      animateLegendValues: true,
      legendMaxItems: 1
    });
    expect(container.querySelectorAll('.pie-legend-row')).toHaveLength(1);
    expect(container.querySelector('.pie-legend-more')?.textContent?.trim()).toBe('+1 more');
  });
});
