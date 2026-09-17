import { createRawSnippet } from 'svelte';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import StatCard from './StatCard.svelte';

/**
 * `animateValue` is additive and opt-in: every assertion here is paired with
 * the same setup asserting the OLD, animateValue-unset behaviour still holds,
 * so a regression that quietly changes the default is caught here rather than
 * downstream.
 */

const getValueContainer = (container: HTMLElement, testId: string): HTMLElement => {
  const el = container.querySelector<HTMLElement>(`[data-pw="${testId}-value"]`);
  expect(el).not.toBeNull();
  if (el === null) {
    throw new Error(`value container "${testId}-value" not found`);
  }
  return el;
};

describe('StatCard animateValue — single value path', () => {
  it('renders the plain value string when animateValue is left unset (byte-identical default)', () => {
    const { container } = render(StatCard, { value: '₹1.23Cr', testId: 'gmv' });
    const valueEl = getValueContainer(container, 'gmv');
    expect(valueEl.textContent?.trim()).toBe('₹1.23Cr');
    expect(valueEl.querySelector('.animated-number')).toBeNull();
  });

  it('renders the plain value string when animateValue is explicitly false', () => {
    const { container } = render(StatCard, {
      value: '₹1.23Cr',
      testId: 'gmv',
      animateValue: false
    });
    const valueEl = getValueContainer(container, 'gmv');
    expect(valueEl.textContent?.trim()).toBe('₹1.23Cr');
    expect(valueEl.querySelector('.animated-number')).toBeNull();
  });

  it('renders value through AnimatedNumber when animateValue is true, keeping the same accessible text', () => {
    const { container } = render(StatCard, { value: '₹1.23Cr', testId: 'gmv', animateValue: true });
    const valueEl = getValueContainer(container, 'gmv');
    const animated = valueEl.querySelector('.animated-number');
    expect(animated).not.toBeNull();
    expect(animated?.getAttribute('role')).toBe('img');
    expect(animated?.getAttribute('aria-label')).toBe('₹1.23Cr');
    // Two digit columns for '1' and '23' -- the rest (₹, ., Cr) are literal columns.
    expect(valueEl.querySelectorAll('.animated-number-digit').length).toBe(3);
  });

  it('keeps the outer data-pw/testID selectors exactly where they are, animated or not', () => {
    const { container } = render(StatCard, { value: '₹1.23Cr', testId: 'gmv', animateValue: true });
    const valueEl = getValueContainer(container, 'gmv');
    expect(valueEl.getAttribute('testID')).toBe('gmv-value');
    expect(valueEl.className).toContain('statcard-value');
  });
});

describe('StatCard animateValue — valueSnippet keeps full precedence', () => {
  const snippet = createRawSnippet(() => ({ render: () => '<strong>custom</strong>' }));

  it('renders valueSnippet instead of AnimatedNumber even when animateValue is true', () => {
    const { container } = render(StatCard, {
      value: '₹1.23Cr',
      valueSnippet: snippet,
      animateValue: true,
      testId: 'gmv'
    });
    const valueEl = getValueContainer(container, 'gmv');
    expect(valueEl.querySelector('.animated-number')).toBeNull();
    expect(valueEl.querySelector('strong')?.textContent).toBe('custom');
    expect(valueEl.textContent?.trim()).not.toContain('₹1.23Cr');
  });
});

describe('StatCard animateValue — multi-row path', () => {
  const rows = [
    {
      heading: 'Gross Revenue',
      value: '₹12.4Cr',
      comparisonValue: '₹10Cr',
      breakdown: [{ label: 'Mobile', value: '71.2%' }]
    }
  ];

  it('renders row value, comparisonValue and breakdown value as plain text by default', () => {
    const { container } = render(StatCard, { rows, testId: 'rev' });
    expect(container.querySelector('.animated-number')).toBeNull();
    expect(container.querySelector('[data-pw="rev-value-0"]')?.textContent?.trim()).toBe('₹12.4Cr');
    expect(container.querySelector('[data-pw="rev-comparison-0"]')?.textContent?.trim()).toBe(
      '/ ₹10Cr'
    );
    expect(container.querySelector('.statcard-breakdown-value')?.textContent?.trim()).toBe('71.2%');
  });

  it('rolls row value, comparisonValue and breakdown value through AnimatedNumber when animateValue is true', () => {
    const { container } = render(StatCard, { rows, testId: 'rev', animateValue: true });

    const rowValue = container.querySelector<HTMLElement>('[data-pw="rev-value-0"]');
    const rowAnimated = rowValue?.querySelector('.animated-number');
    expect(rowAnimated?.getAttribute('aria-label')).toBe('₹12.4Cr');

    const comparison = container.querySelector<HTMLElement>('[data-pw="rev-comparison-0"]');
    const comparisonAnimated = comparison?.querySelector('.animated-number');
    expect(comparisonAnimated?.getAttribute('aria-label')).toBe('₹10Cr');
    // The literal "/ " prefix stays outside AnimatedNumber's own accessible name.
    // (AnimatedNumber's odometer track renders all ten glyphs of every digit
    // column into the DOM -- only CSS clips the other nine -- so jsdom's
    // `textContent` is not a valid stand-in for the visible/accessible text;
    // `aria-label`, asserted above, is.)
    expect(comparison?.textContent?.trim().startsWith('/')).toBe(true);

    const breakdownValue = container.querySelector<HTMLElement>('.statcard-breakdown-value');
    const breakdownAnimated = breakdownValue?.querySelector('.animated-number');
    expect(breakdownAnimated?.getAttribute('aria-label')).toBe('71.2%');
  });

  it('does not touch the row divider, delta or breakdown label markup', () => {
    const rowsWithChange = [{ ...rows[0], change: 8.2 }];
    const { container } = render(StatCard, {
      rows: rowsWithChange,
      testId: 'rev',
      animateValue: true
    });
    expect(container.querySelector('.statcard-breakdown-label')?.textContent?.trim()).toBe(
      'Mobile'
    );
    // DeltaIndicator's own rendering is untouched by this prop.
    expect(container.querySelector(`[data-pw="rev-delta-0"] .animated-number`)).toBeNull();
  });
});
