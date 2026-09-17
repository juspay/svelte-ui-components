import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Gauge from './Gauge.svelte';

describe('Gauge default rendering (animateValue unset)', () => {
  it('renders the label as a plain text node, with no AnimatedNumber markup', () => {
    const { getByRole } = render(Gauge, { value: 75 });
    const root = getByRole('progressbar');
    const label = root.querySelector('.label');

    expect(label?.textContent).toBe('75%');
    // Byte-identical to pre-AnimatedNumber markup: no odometer structure at all.
    expect(root.querySelector('.animated-number')).toBeNull();
    expect(root.querySelector('[role="img"]')).toBeNull();
  });

  it('keeps role="progressbar" and its aria wiring exactly as before', () => {
    const { getByRole } = render(Gauge, { value: 50, max: 200 });
    const root = getByRole('progressbar');

    expect(root.getAttribute('aria-valuenow')).toBe('25');
    expect(root.getAttribute('aria-valuemin')).toBe('0');
    expect(root.getAttribute('aria-valuemax')).toBe('100');
    expect(root.getAttribute('aria-label')).toBe('25%');
  });
});

describe('Gauge with animateValue and no labelFormatter', () => {
  it('renders the rounded percentage through AnimatedNumber, with the % inside its accessible name', () => {
    const { getByRole } = render(Gauge, { value: 75, animateValue: true });
    const root = getByRole('progressbar');
    const label = root.querySelector('.label');
    const animated = label?.querySelector('[role="img"]');

    expect(animated).not.toBeNull();
    // The % is INSIDE AnimatedNumber's accessible name, not a sibling beside it.
    // It used to be a sibling, which read correctly to a linear screen-reader pass
    // but disappeared for anyone navigating by graphic: the rotor lands on the
    // role="img" element and announces only its own label, so the unit was lost.
    expect(animated?.getAttribute('aria-label')).toBe('75%');
    // And nothing is left outside it -- proven by removing that subtree and reading
    // what remains, rather than scraping .label's textContent, which would also pick
    // up the nine off-screen glyphs every odometer column keeps for the roll.
    const withoutAnimated = label?.cloneNode(true) as HTMLElement;
    withoutAnimated.querySelector('[role="img"]')?.remove();
    expect(withoutAnimated.textContent?.trim()).toBe('');
    // Only the digits roll; the % rides along as a static literal column.
    expect(animated?.querySelectorAll('.animated-number-digit')).toHaveLength(2);
  });

  it('does not disturb the progressbar aria wiring or the outer label text', () => {
    const { getByRole } = render(Gauge, { value: 50, max: 200, animateValue: true });
    const root = getByRole('progressbar');

    expect(root.getAttribute('aria-valuenow')).toBe('25');
    expect(root.getAttribute('aria-label')).toBe('25%');
  });
});

describe('Gauge with animateValue and a labelFormatter', () => {
  it('passes the formatter output string straight through to AnimatedNumber', () => {
    const labelFormatter = (value: number, max: number) => `${value} / ${max}`;
    const { getByRole } = render(Gauge, {
      value: 50,
      max: 200,
      animateValue: true,
      labelFormatter
    });
    const root = getByRole('progressbar');
    const label = root.querySelector('.label');
    const animated = label?.querySelector('[role="img"]');

    expect(animated).not.toBeNull();
    // The whole formatter string is the AnimatedNumber value -- no extra % appended
    // alongside it, since the formatter already owns the full label text.
    expect(animated?.getAttribute('aria-label')).toBe('50 / 200');
    // Nothing else sits in the label beside the AnimatedNumber root -- no static
    // suffix text, unlike the no-formatter case above. Same removal technique as
    // that test, since the label's own childNodes include Svelte's {#if} anchors.
    const withoutAnimated = label?.cloneNode(true) as HTMLElement;
    withoutAnimated.querySelector('[role="img"]')?.remove();
    expect(withoutAnimated.textContent?.trim()).toBe('');
  });
});

describe('Gauge showLabel=false', () => {
  it('renders no label at all, with animateValue on', () => {
    const { getByRole } = render(Gauge, { value: 75, animateValue: true, showLabel: false });
    const root = getByRole('progressbar');

    expect(root.querySelector('.label')).toBeNull();
  });
});
