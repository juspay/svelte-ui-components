import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ProportionBar from './ProportionBar.svelte';

const segments = [
  { label: 'UPI', value: 4820 },
  { label: 'Cards', value: 2150 }
];

describe('ProportionBar legend value, animateValue unset (default)', () => {
  it('renders the formatted value as a plain text node, with no AnimatedNumber', () => {
    const { container } = render(ProportionBar, { segments });

    const valueEl = container.querySelector('.proportion-bar-legend-value');
    expect(valueEl?.textContent?.trim()).toBe('4,820 (69%)');
    expect(valueEl?.querySelector('.animated-number')).toBeNull();
  });
});

describe('ProportionBar legend value, animateValue on', () => {
  it('routes the legend value through AnimatedNumber, passing the formatted string', () => {
    // A prefix/suffix a raw-number Intl.NumberFormat pass could never produce
    // on its own -- if this shows up on screen, the formatted STRING was
    // handed to AnimatedNumber, not the underlying numeric value.
    const valueFormat = (value: number): string => `v:${value}`;
    const { container } = render(ProportionBar, { segments, animateValue: true, valueFormat });

    const valueEl = container.querySelector('.proportion-bar-legend-value');
    const animated = valueEl?.querySelector('.animated-number');
    expect(animated).not.toBeNull();
    expect(animated?.getAttribute('role')).toBe('img');
    expect(animated?.getAttribute('aria-label')).toBe('v:4820');
  });

  it('still renders the same formatted text for the default formatter', () => {
    const { container } = render(ProportionBar, { segments, animateValue: true });

    const animated = container.querySelector('.proportion-bar-legend-value .animated-number');
    expect(animated?.getAttribute('aria-label')).toBe('4,820 (69%)');
  });
});

describe('ProportionBar assistive-technology fallback, unaffected by animateValue', () => {
  it('keeps the hidden-legend SVG aria-label as plain formatted text either way', () => {
    const { container: withoutAnimation } = render(ProportionBar, {
      segments,
      showLegend: false
    });
    const { container: withAnimation } = render(ProportionBar, {
      segments,
      showLegend: false,
      animateValue: true
    });

    const expected = 'UPI: 4,820 (69%), Cards: 2,150 (31%)';
    expect(withoutAnimation.querySelector('svg')?.getAttribute('aria-label')).toBe(expected);
    expect(withAnimation.querySelector('svg')?.getAttribute('aria-label')).toBe(expected);
    expect(withAnimation.querySelector('.animated-number')).toBeNull();
  });
});
