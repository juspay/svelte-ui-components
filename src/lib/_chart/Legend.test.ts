import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Legend from './Legend.svelte';

const items = [
  { label: 'Revenue', color: '#4e79a7' },
  { label: 'Users', color: '#f28e2b' }
];

describe('Legend aggregate rendering', () => {
  it('renders no .legend-aggregate element when no item carries one (default, byte-identical case)', () => {
    const { container } = render(Legend, { items });
    expect(container.querySelectorAll('.legend-aggregate')).toHaveLength(0);
  });

  it('renders no .legend-aggregate element when aggregateLabel is explicitly null', () => {
    const { container } = render(Legend, {
      items: items.map((item) => ({ ...item, aggregateLabel: null }))
    });
    expect(container.querySelectorAll('.legend-aggregate')).toHaveLength(0);
  });

  it('renders the formatted aggregate text beside the label, static legend', () => {
    const { container, getByText } = render(Legend, {
      items: [{ ...items[0], aggregateLabel: '$128K' }, items[1]]
    });
    expect(getByText('$128K')).toBeTruthy();
    expect(container.querySelectorAll('.legend-aggregate')).toHaveLength(1);
  });

  it('keeps the aggregate OUT of the toggle button, so the control has a stable name', () => {
    // Every bit of text inside a button becomes part of its accessible name.
    // An aggregate inside it makes that name change whenever the data does,
    // which breaks voice-control targeting and any consumer test matching the
    // name exactly -- Testing Library's getByRole matches the whole string by
    // default, so this breaks their suites while passing Playwright's
    // substring default. The figure belongs beside the control, not in it.
    const { container } = render(Legend, {
      items: [{ ...items[0], aggregateLabel: '$128K' }, items[1]],
      onToggle: () => {}
    });

    const button = container.querySelector('[data-pw="legend-toggle-0"]');
    expect(button?.querySelector('.legend-aggregate')).toBeNull();
    expect(button?.textContent?.trim()).toBe(items[0].label);

    // Still rendered, still visible -- as a sibling inside the legend item.
    const item = button?.closest('.legend-item');
    expect(item?.querySelector('.legend-aggregate')?.textContent).toBe('$128K');
  });

  it('does not make the aggregate a click target for toggling the series', () => {
    let toggled = 0;
    const { container } = render(Legend, {
      items: [{ ...items[0], aggregateLabel: '$128K' }, items[1]],
      onToggle: () => {
        toggled += 1;
      }
    });
    const aggregate = container.querySelector('.legend-aggregate');
    expect(aggregate).toBeTruthy();
    expect(aggregate?.closest('button')).toBeNull();
    expect(toggled).toBe(0);
  });

  it('only decorates the item that carries an aggregate, not its siblings', () => {
    const { container } = render(Legend, {
      items: [{ ...items[0], aggregateLabel: '$128K' }, items[1]]
    });
    const aggregates = container.querySelectorAll('.legend-aggregate');
    expect(aggregates).toHaveLength(1);
    expect(aggregates[0].textContent).toBe('$128K');
  });
});
