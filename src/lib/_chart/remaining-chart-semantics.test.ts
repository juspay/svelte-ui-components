import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import PieChart from '../PieChart/PieChart.svelte';
import SankeyChart from '../SankeyChart/SankeyChart.svelte';
import DualAxisBarChart from '../DualAxisBarChart/DualAxisBarChart.svelte';
import FunnelChart from '../FunnelChart/FunnelChart.svelte';

// Explicit jsdom layout adapter. Browser coverage uses real measured drawings.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  );
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: 640,
    bottom: 320,
    width: 640,
    height: 320,
    x: 0,
    y: 0,
    toJSON: () => ({})
  });
});
afterAll(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

type NameProps = { ariaLabel?: string; ariaDescription?: string };
const fixtures = [
  {
    name: 'PieChart',
    fallback: /Alpha/,
    mount: (extra: NameProps, empty = false) =>
      render(PieChart, {
        data: empty
          ? []
          : [
              { label: 'Alpha', value: 10 },
              { label: 'Beta', value: 20 }
            ],
        ...extra
      })
  },
  {
    name: 'SankeyChart',
    fallback: /Visits/,
    mount: (extra: NameProps, empty = false) =>
      render(SankeyChart, {
        nodes: empty
          ? []
          : [
              { id: 'visits', label: 'Visits' },
              { id: 'orders', label: 'Orders' }
            ],
        links: empty ? [] : [{ source: 'visits', target: 'orders', value: 20 }],
        ...extra
      })
  },
  {
    name: 'DualAxisBarChart',
    fallback: /Revenue/,
    mount: (extra: NameProps, empty = false) =>
      render(DualAxisBarChart, {
        categories: empty ? [] : ['Jan', 'Feb'],
        series: empty
          ? []
          : [
              {
                name: 'Revenue',
                data: [10, 20],
                yAxisIndex: 0,
                type: 'column'
              }
            ],
        ...extra
      })
  },
  {
    name: 'FunnelChart',
    fallback: /Visits/,
    mount: (extra: NameProps, empty = false) =>
      render(FunnelChart, {
        data: empty
          ? []
          : [
              { category: 'Visits', value: 100 },
              { category: 'Orders', value: 20 }
            ],
        ...extra
      })
  }
];

const drawing = (container: HTMLElement): Element => {
  const target = container.querySelector('.chart-container > svg, .chart-empty[role="img"]');
  if (target === null) {
    throw new Error('chart drawing or static placeholder missing');
  }
  return target;
};

for (const fixture of fixtures) {
  describe(`${fixture.name} drawing semantics`, () => {
    it('names the actual group, resolves its description locally, and exposes named controls', () => {
      const { container } = fixture.mount({
        ariaLabel: 'Payment performance',
        ariaDescription: 'Compare each category.'
      });
      const svg = drawing(container);
      expect(svg.getAttribute('role')).toBe('group');
      expect(svg.getAttribute('aria-label')).toBe('Payment performance');
      const id = svg.getAttribute('aria-describedby');
      expect(id).not.toBeNull();
      expect(svg.querySelector(`[id="${id}"]`)?.textContent).toBe('Compare each category.');
      const buttons = svg.querySelectorAll('[role="button"][tabindex="0"]');
      expect(buttons.length).toBeGreaterThan(0);
      for (const button of buttons) {
        expect(button.getAttribute('aria-label')?.trim()).toBeTruthy();
        expect(button.hasAttribute('aria-describedby')).toBe(false);
      }
    });

    it('keeps empty output a named static image without point Tab stops', () => {
      const { container } = fixture.mount(
        { ariaLabel: 'Empty payments', ariaDescription: 'No payments yet.' },
        true
      );
      const image = drawing(container);
      expect(image.getAttribute('role')).toBe('img');
      expect(image.getAttribute('aria-label')).toBe('Empty payments');
      expect(image.querySelectorAll('[tabindex],button')).toHaveLength(0);
      const id = image.getAttribute('aria-describedby');
      expect(image.querySelector(`[id="${id}"]`)?.textContent).toBe('No payments yet.');
    });

    it('updates names and descriptions on the mounted chart and removes blank descriptions', async () => {
      const { container, rerender } = fixture.mount({
        ariaLabel: 'Before',
        ariaDescription: 'Old context.'
      });
      await rerender({ ariaLabel: 'After', ariaDescription: 'New context.' });
      expect(drawing(container).getAttribute('aria-label')).toBe('After');
      expect(container.querySelector('desc')?.textContent).toBe('New context.');
      await rerender({ ariaLabel: ' ', ariaDescription: '' });
      expect(drawing(container).getAttribute('aria-label')).toMatch(fixture.fallback);
      expect(drawing(container).hasAttribute('aria-describedby')).toBe(false);
      expect(container.querySelector('desc')).toBeNull();
    });

    it('gives two drawings distinct instance IDs', () => {
      const first = fixture.mount({ ariaDescription: 'First chart.' });
      const second = fixture.mount({ ariaDescription: 'Second chart.' });
      const a = drawing(first.container).getAttribute('aria-describedby');
      const b = drawing(second.container).getAttribute('aria-describedby');
      expect(a).not.toBeNull();
      expect(b).not.toBeNull();
      expect(a).not.toBe(b);
    });
  });
}

it('does not leave Tab stops on an all-zero pie drawing', () => {
  const { container } = render(PieChart, {
    data: [{ label: 'Unallocated', value: 0 }],
    ariaLabel: 'Unallocated budget'
  });
  expect(drawing(container).getAttribute('role')).toBe('img');
  expect(drawing(container).querySelectorAll('[tabindex]')).toHaveLength(0);
});

it('keeps a supplied center action exposed when a pie has no slices', () => {
  const center = createRawSnippet(() => ({
    render: () => '<button>Reset empty distribution</button>'
  }));
  const { container } = render(PieChart, {
    data: [],
    innerRadius: 0.6,
    center,
    ariaLabel: 'Empty allocation'
  });
  expect(drawing(container).getAttribute('role')).toBe('group');
  expect(drawing(container).querySelector('button')?.textContent).toBe('Reset empty distribution');
  expect(drawing(container).querySelectorAll('path[tabindex]')).toHaveLength(0);
});

it('keeps zero-valued structural funnel stages operable without a custom empty snippet', async () => {
  const stage = { category: 'Orders', value: 0 };
  const onstageclick = vi.fn();
  const { container } = render(FunnelChart, { data: [stage], onstageclick });
  expect(drawing(container).getAttribute('role')).toBe('group');
  const control = container.querySelector('.funnel-bar');
  expect(control?.getAttribute('tabindex')).toBe('0');
  expect(control?.getAttribute('aria-label')).toBe('Orders: 0  |  0%');
  if (control === null) {
    throw new Error('zero stage control missing');
  }
  await fireEvent.keyDown(control, { key: 'Enter' });
  expect(onstageclick).toHaveBeenCalledWith({ index: 0, stage });
});

it('keeps DualAxis visual glyphs while the category controls provide their complete names', () => {
  const { container } = render(DualAxisBarChart, {
    categories: ['Jan'],
    series: [
      { name: 'Revenue', data: [20], yAxisIndex: 0, type: 'column' },
      { name: 'Conversion', data: [2], yAxisIndex: 1, type: 'line' }
    ]
  });
  expect(container.querySelector('.hover-target')?.getAttribute('aria-label')).toBe(
    'Jan: Revenue 20, Conversion 2'
  );
  for (const glyph of container.querySelectorAll('.bar-shape, .line-dot')) {
    expect(glyph.getAttribute('aria-hidden')).toBe('true');
  }
  expect(container.querySelectorAll('.bar-shape, .line-dot')).toHaveLength(2);
});

it('names missing DualAxis readings as unavailable rather than fabricating a zero', () => {
  const { container } = render(DualAxisBarChart, {
    categories: ['Jan', 'Feb'],
    series: [
      { name: 'Revenue', data: [10, Number.NaN], yAxisIndex: 0, type: 'column' },
      { name: 'Orders', data: [1, 2], yAxisIndex: 1, type: 'column' }
    ]
  });
  expect(container.querySelectorAll('.hover-target')[1].getAttribute('aria-label')).toBe(
    'Feb: Revenue not available, Orders 2'
  );
});
