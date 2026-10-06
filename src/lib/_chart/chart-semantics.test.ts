import { createRawSnippet } from 'svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import AreaChart from '../AreaChart/AreaChart.svelte';
import BarChart from '../BarChart/BarChart.svelte';
import LineChart from '../LineChart/LineChart.svelte';
import ChartContainer from './ChartContainer.svelte';

// jsdom reports an all-zero rect, so ChartContainer would never render its <svg>.
// Same stubbing the chart family's other specs use.
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

const body = createRawSnippet(() => ({ render: () => '<g data-testid="body"></g>' }));

const lineSeries = [
  {
    name: 'Revenue',
    data: [
      { x: 1, y: 10 },
      { x: 2, y: 20 }
    ]
  },
  {
    name: 'Cost',
    data: [
      { x: 1, y: 5 },
      { x: 2, y: 8 }
    ]
  }
];

const svgOf = (container: HTMLElement): SVGSVGElement => {
  const svg = container.querySelector('svg');
  if (svg === null) {
    throw new Error('chart did not render an <svg>');
  }
  return svg;
};

describe('ChartContainer naming API', () => {
  it('recalculates a changed minimum height without requiring a width resize', async () => {
    const { container, rerender } = render(ChartContainer, {
      props: { children: body, minHeight: 0, maxHeight: 700 }
    });
    expect(svgOf(container).getAttribute('height')).toBe('450');
    await rerender({ children: body, minHeight: 550, maxHeight: 700 });
    expect(svgOf(container).getAttribute('height')).toBe('550');
  });

  it('keeps role="img" with no name for a bare container caller that passes nothing', () => {
    const { container } = render(ChartContainer, { props: { children: body } });
    const svg = svgOf(container);
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.hasAttribute('aria-label')).toBe(false);
    expect(svg.hasAttribute('aria-describedby')).toBe(false);
    expect(svg.querySelector('desc')).toBeNull();
  });

  it('exposes an interactive drawing as a named group, not an image', () => {
    const { container } = render(ChartContainer, {
      props: { ariaLabel: 'Revenue', interactive: true, children: body }
    });
    const svg = svgOf(container);
    expect(svg.getAttribute('role')).toBe('group');
    expect(svg.getAttribute('aria-label')).toBe('Revenue');
  });

  it('keeps a static drawing a named image', () => {
    const { container } = render(ChartContainer, {
      props: { ariaLabel: 'Revenue', children: body }
    });
    const svg = svgOf(container);
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Revenue');
  });

  it('treats a blank name as no name rather than aria-label=""', () => {
    const { container } = render(ChartContainer, {
      props: { ariaLabel: '   ', ariaDescription: '', children: body }
    });
    const svg = svgOf(container);
    expect(svg.hasAttribute('aria-label')).toBe(false);
    expect(svg.hasAttribute('aria-describedby')).toBe(false);
  });

  it('renders the description as a <desc> that aria-describedby resolves', () => {
    const { container } = render(ChartContainer, {
      props: { ariaLabel: 'Revenue', ariaDescription: 'Rises all year.', children: body }
    });
    const svg = svgOf(container);
    const id = svg.getAttribute('aria-describedby');
    expect(id).toMatch(/^chart-desc-/);
    const desc = svg.querySelector(`desc[id="${id}"]`);
    expect(desc?.textContent).toBe('Rises all year.');
  });

  it('gives two instances on one page different description ids', () => {
    const first = render(ChartContainer, {
      props: { ariaLabel: 'One', ariaDescription: 'First.', children: body }
    });
    const second = render(ChartContainer, {
      props: { ariaLabel: 'Two', ariaDescription: 'Second.', children: body }
    });
    const a = svgOf(first.container).getAttribute('aria-describedby');
    const b = svgOf(second.container).getAttribute('aria-describedby');
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a).not.toBe(b);
  });
});

describe('LineChart chart-level semantics', () => {
  it('is a named group whose name is the consumer ariaLabel, with its description', () => {
    const { container } = render(LineChart, {
      props: {
        series: lineSeries,
        ariaLabel: 'Revenue and cost by period',
        ariaDescription: 'Revenue stays above cost.'
      }
    });
    const svg = svgOf(container);
    expect(svg.getAttribute('role')).toBe('group');
    expect(svg.getAttribute('aria-label')).toBe('Revenue and cost by period');
    const id = svg.getAttribute('aria-describedby');
    expect(svg.querySelector(`desc[id="${id}"]`)?.textContent).toBe('Revenue stays above cost.');
  });

  it('falls back to a name derived from its series', () => {
    const { container } = render(LineChart, { props: { series: lineSeries } });
    expect(svgOf(container).getAttribute('aria-label')).toBe('Line chart: Revenue, Cost');
  });

  it('keeps every point a named, focusable button inside the group', () => {
    const { container } = render(LineChart, { props: { series: lineSeries, ariaLabel: 'X' } });
    const points = [...svgOf(container).querySelectorAll('circle.focus-target')];
    expect(points).toHaveLength(4);
    for (const point of points) {
      expect(point.getAttribute('role')).toBe('button');
      expect(point.getAttribute('tabindex')).toBe('0');
      expect(point.getAttribute('aria-label')).toBeTruthy();
    }
  });

  it('turns back into a named image once every series is hidden through the legend', async () => {
    const { container } = render(LineChart, {
      props: { series: lineSeries, ariaLabel: 'X', showLegend: true, interactiveLegend: true }
    });
    expect(svgOf(container).getAttribute('role')).toBe('group');
    for (const toggle of container.querySelectorAll('[data-pw^="legend-toggle-"]')) {
      await fireEvent.click(toggle);
    }
    const svg = svgOf(container);
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('X');
    expect(svg.querySelector('[tabindex]')).toBeNull();
  });

  it('hides point value labels from assistive technology', () => {
    const { container } = render(LineChart, {
      props: { series: lineSeries, ariaLabel: 'X', showValues: true }
    });
    const labels = [...container.querySelectorAll('text.point-value')];
    expect(labels.length).toBeGreaterThan(0);
    for (const label of labels) {
      expect(label.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('scopes gradient ids to the instance, from the first render', () => {
    const first = render(LineChart, {
      props: { series: lineSeries, gradientFill: true, showArea: true, ariaLabel: 'One' }
    });
    const second = render(LineChart, {
      props: { series: lineSeries, gradientFill: true, showArea: true, ariaLabel: 'Two' }
    });
    const idsOf = (container: HTMLElement): string[] =>
      [...container.querySelectorAll('linearGradient')].map((g) => g.id);
    const a = idsOf(first.container);
    const b = idsOf(second.container);
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBe(a.length);
    expect(new Set([...a, ...b]).size).toBe(a.length + b.length);
    // The old id was `line-grad--0` until the chart had mounted (empty prefix).
    for (const id of [...a, ...b]) {
      expect(id).not.toMatch(/--/);
    }
    // Every url(#...) reference resolves to a gradient in its own svg.
    for (const container of [first.container, second.container]) {
      const svg = svgOf(container);
      for (const path of svg.querySelectorAll('path[fill^="url(#"]')) {
        const id = /url\(#(.+)\)/.exec(path.getAttribute('fill') ?? '')?.[1] ?? '';
        expect(svg.querySelector(`linearGradient[id="${id}"]`)).not.toBeNull();
      }
    }
  });
});

describe('AreaChart chart-level semantics', () => {
  it('is a named group, with the derived name when none is given', () => {
    const named = render(AreaChart, { props: { series: lineSeries, ariaLabel: 'Traffic' } });
    expect(svgOf(named.container).getAttribute('role')).toBe('group');
    expect(svgOf(named.container).getAttribute('aria-label')).toBe('Traffic');

    const derived = render(AreaChart, { props: { series: lineSeries, yAxisLabel: 'Visits' } });
    expect(svgOf(derived.container).getAttribute('aria-label')).toBe('Visits area chart');
  });

  it('describes the chart through an id that resolves inside its own svg', () => {
    const { container } = render(AreaChart, {
      props: { series: lineSeries, ariaLabel: 'Traffic', ariaDescription: 'Grows.' }
    });
    const svg = svgOf(container);
    const id = svg.getAttribute('aria-describedby');
    expect(svg.querySelector(`desc[id="${id}"]`)?.textContent).toBe('Grows.');
  });

  it('scopes gradient ids to the instance and hides value labels', () => {
    const first = render(AreaChart, {
      props: { series: lineSeries, gradientFill: true, showValues: true, ariaLabel: 'One' }
    });
    const second = render(AreaChart, {
      props: { series: lineSeries, gradientFill: true, ariaLabel: 'Two' }
    });
    const ids = [
      ...first.container.querySelectorAll('linearGradient'),
      ...second.container.querySelectorAll('linearGradient')
    ].map((g) => g.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).not.toMatch(/--/);
    }
    for (const label of first.container.querySelectorAll('text.point-value')) {
      expect(label.getAttribute('aria-hidden')).toBe('true');
    }
  });
});

describe('BarChart chart-level semantics', () => {
  const data = [
    { label: 'Jan', value: 42 },
    { label: 'Feb', value: 38 }
  ];

  it('is a named group of named bars; the region wrapper is gone', () => {
    const { container } = render(BarChart, {
      props: { data, ariaLabel: 'Monthly revenue', aspectRatio: 2 }
    });
    const svg = svgOf(container);
    expect(svg.getAttribute('role')).toBe('group');
    expect(svg.getAttribute('aria-label')).toBe('Monthly revenue');
    expect(container.querySelector('[role="region"]')).toBeNull();
    expect(svg.querySelectorAll('path.bar[role="button"][tabindex="0"]')).toHaveLength(2);
  });

  it('keeps the wording its wrapping region always had when no ariaLabel is passed', () => {
    const plain = render(BarChart, { props: { data, aspectRatio: 2 } });
    expect(svgOf(plain.container).getAttribute('aria-label')).toBe('Bar chart');
    const titled = render(BarChart, { props: { data, yAxisLabel: 'Revenue', aspectRatio: 2 } });
    expect(svgOf(titled.container).getAttribute('aria-label')).toBe('Revenue bar chart');
  });

  it('is a named image, not an empty group, when it draws no bars', () => {
    const { container } = render(BarChart, {
      props: { data, ariaLabel: 'Labels only', hideBarGraphics: true, aspectRatio: 2 }
    });
    const svg = svgOf(container);
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.querySelector('[tabindex]')).toBeNull();
  });

  it('becomes a focusable named region only when it scrolls, under a different name than the chart', () => {
    const { container } = render(BarChart, {
      props: { data, ariaLabel: 'Monthly revenue', scrollable: true, aspectRatio: 2 }
    });
    const region = container.querySelector('[role="region"]');
    expect(region?.getAttribute('aria-label')).toBe('Monthly revenue, scrollable');
    expect(region?.getAttribute('tabindex')).toBe('0');
    expect(svgOf(container).getAttribute('aria-label')).toBe('Monthly revenue');
  });

  it('hides tick labels and value labels from assistive technology but keeps the axis title', () => {
    const { container } = render(BarChart, {
      props: { data, ariaLabel: 'X', showValues: true, yAxisLabel: 'Revenue', aspectRatio: 2 }
    });
    const ticks = [...container.querySelectorAll('text.tick-label')];
    const values = [...container.querySelectorAll('text.bar-value')];
    expect(ticks.length).toBeGreaterThan(0);
    expect(values.length).toBeGreaterThan(0);
    for (const label of [...ticks, ...values]) {
      expect(label.getAttribute('aria-hidden')).toBe('true');
    }
    const title = container.querySelector('text.axis-label');
    expect(title?.textContent?.trim()).toBe('Revenue');
    expect(title?.hasAttribute('aria-hidden')).toBe(false);
  });

  it('scopes pattern and gradient ids to the instance', () => {
    const fills = [
      {
        name: 'A',
        color: { pattern: { type: 'lines' as const } },
        data: [{ label: 'Jan', value: 1 }]
      },
      {
        name: 'B',
        color: {
          gradient: {
            direction: 'vertical' as const,
            stops: [
              { offset: 0, color: '#000' },
              { offset: 1, color: '#fff' }
            ]
          }
        },
        data: [{ label: 'Jan', value: 2 }]
      }
    ];
    const first = render(BarChart, { props: { series: fills, ariaLabel: 'One', aspectRatio: 2 } });
    const second = render(BarChart, { props: { series: fills, ariaLabel: 'Two', aspectRatio: 2 } });
    const idsOf = (container: HTMLElement): string[] =>
      [...container.querySelectorAll('defs [id]')].map((e) => e.id);
    const a = idsOf(first.container);
    const b = idsOf(second.container);
    expect(a.length).toBe(2);
    expect(new Set([...a, ...b]).size).toBe(4);
  });
});
