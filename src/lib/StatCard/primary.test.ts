import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import StatCard from './StatCard.svelte';
import { isAnimatableMetric } from './metric';

/**
 * `animatePrimary` picks ONE value, and only a metric.
 *
 * jsdom reports 0 for every font size, so 'auto' cannot be exercised here --
 * that path is measured in the browser suite. What IS testable without a layout
 * engine is the half that decides WHETHER a slot may animate at all: an explicit
 * `primary`, and the metric gate that keeps identifiers out.
 */
describe('StatCard animatePrimary', () => {
  it('animates only the named slot, not every value', () => {
    const { container } = render(StatCard, {
      title: 'Sales',
      subtitle: '60000',
      rows: [{ value: '194' }, { value: '460' }],
      animatePrimary: true,
      primary: 'subtitle',
      testId: 'card'
    });
    const odometers = container.querySelectorAll('.animated-number');
    expect(odometers).toHaveLength(1);
    expect(odometers[0]?.getAttribute('aria-label')).toBe('60000');
  });

  /**
   * `primary={0}` names the FIRST ROW. Rows carry `data-sc-slot="row-<index>"`,
   * so a bare `String(primary)` produced `'0'`, matched no slot, and animated
   * nothing at all -- a silent no-op rather than a visible error.
   */
  it('resolves a numeric primary to the row at that index', () => {
    const { container } = render(StatCard, {
      title: 'Sales',
      rows: [{ value: '194' }, { value: '460' }],
      animatePrimary: true,
      primary: 0,
      testId: 'card'
    });
    const odometers = container.querySelectorAll('.animated-number');
    expect(odometers).toHaveLength(1);
    expect(odometers[0]?.getAttribute('aria-label')).toBe('194');
  });

  it('resolves a numeric primary to a later row', () => {
    const { container } = render(StatCard, {
      title: 'Sales',
      rows: [{ value: '194' }, { value: '460' }],
      animatePrimary: true,
      primary: 1,
      testId: 'card'
    });
    const odometers = container.querySelectorAll('.animated-number');
    expect(odometers).toHaveLength(1);
    expect(odometers[0]?.getAttribute('aria-label')).toBe('460');
  });

  /** The custom element declares `primary` as a String, so the same index arrives as '1'. */
  it('resolves a numeric STRING primary the same way the custom element sends it', () => {
    const { container } = render(StatCard, {
      title: 'Sales',
      rows: [{ value: '194' }, { value: '460' }],
      animatePrimary: true,
      primary: '1' as unknown as number,
      testId: 'card'
    });
    const odometers = container.querySelectorAll('.animated-number');
    expect(odometers).toHaveLength(1);
    expect(odometers[0]?.getAttribute('aria-label')).toBe('460');
  });

  it('refuses a non-metric even when it is the named slot', () => {
    const { container } = render(StatCard, {
      rows: [{ value: 'demo-store.myshopify.com' }],
      animatePrimary: true,
      primary: 0,
      testId: 'card'
    });
    expect(container.querySelectorAll('.animated-number')).toHaveLength(0);
  });

  it('gates animateValue on the same metric test', () => {
    const { container } = render(StatCard, {
      rows: [{ value: 'Shinchan Store GA4 (987654321)' }, { value: '90%' }],
      animateValue: true,
      testId: 'card'
    });
    const odometers = container.querySelectorAll('.animated-number');
    expect(odometers).toHaveLength(1);
    expect(odometers[0]?.getAttribute('aria-label')).toBe('90%');
  });
});

describe('isAnimatableMetric', () => {
  /**
   * The accept check allows any Unicode decimal digit, so the stripper has to
   * remove the same set. With `[0-9]` it did not: an Arabic-Indic numeral was
   * accepted as a digit, survived stripping, and was then rejected as leftover
   * letters -- so a localised metric silently refused to animate.
   */
  it('accepts a metric written in non-ASCII decimal digits', () => {
    expect(isAnimatableMetric('١٢٣')).toBe(true);
    expect(isAnimatableMetric('١٢٣٤٥')).toBe(true);
  });

  it.each(['60k', '194', '90%', '₹1.23Cr', '12m 15s', '-8%', '1,234'])('accepts %s', (v) => {
    expect(isAnimatableMetric(v)).toBe(true);
  });
  it.each([
    'demo-store.myshopify.com',
    'Shinchan Store GA4 (987654321)',
    'mock-user@juspay.in',
    'Total sales',
    'N/A'
  ])('refuses %s', (v) => {
    expect(isAnimatableMetric(v)).toBe(false);
  });
});
