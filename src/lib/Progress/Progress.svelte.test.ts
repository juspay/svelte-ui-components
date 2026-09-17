import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Progress from './Progress.svelte';

/**
 * `animateValue` is new, additive and opt-in (see properties.ts). Left unset
 * the component must render exactly the old `.label` text node; only with it
 * on does the label become an `AnimatedNumber` instance instead. jsdom has no
 * `Element.animate`, no CSS global and no `matchMedia` (see AnimatedNumber's
 * own test file), so this only asserts DOM shape -- which of the two label
 * forms is present -- never the roll itself.
 */

const label = (container: HTMLElement): HTMLElement | null => container.querySelector('.label');

describe('Progress animateValue default (off)', () => {
  it('renders the old plain-text label untouched when unset', () => {
    const { container } = render(Progress, { value: 60, showLabel: true });
    const node = label(container);
    expect(node).not.toBeNull();
    expect(node?.textContent).toBe('60%');
    expect(node?.querySelector('.animated-number')).toBeNull();
  });

  it('renders the old plain-text label untouched when explicitly false', () => {
    const { container } = render(Progress, {
      value: 60,
      showLabel: true,
      animateValue: false
    });
    const node = label(container);
    expect(node?.textContent).toBe('60%');
    expect(node?.querySelector('.animated-number')).toBeNull();
  });
});

describe('Progress animateValue on', () => {
  it('routes the percentage through AnimatedNumber, with the % inside its accessible name', () => {
    const { container } = render(Progress, {
      value: 60,
      showLabel: true,
      animateValue: true
    });
    const node = label(container);
    expect(node).not.toBeNull();
    const animated = node?.querySelector('.animated-number');
    expect(animated).not.toBeNull();
    expect(animated?.getAttribute('role')).toBe('img');
    // AnimatedNumber's own accessible name mirrors the glyphs it renders (see
    // its test file), so asserting it here is a DOM-attribute check on what
    // number it was actually given -- not a textContent scrape, which would
    // also pick up the nine off-screen glyphs every odometer column keeps in
    // the DOM for the CSS transition to roll through.
    expect(animated?.getAttribute('aria-label')).toBe('60%');
    // Two digit columns for "60"; the % is a static literal column, not a digit,
    // so it never rolls even though it lives inside the accessible name.
    expect(animated?.querySelectorAll('.animated-number-digit')).toHaveLength(2);
    // Nothing is left outside the role="img" element. A unit sitting beside it
    // reads fine in a linear pass but vanishes when a screen-reader user navigates
    // by graphic, which announces only the element's own label.
    const withoutAnimated = node?.cloneNode(true) as HTMLElement;
    withoutAnimated.querySelector('[role="img"]')?.remove();
    expect(withoutAnimated.textContent?.trim()).toBe('');
  });

  it('rounds the same way the static label does', () => {
    const { container } = render(Progress, {
      value: 1,
      max: 3,
      showLabel: true,
      animateValue: true
    });
    // (1/3) * 100 = 33.33... -> Math.round -> 33, matching labelText exactly.
    const animated = label(container)?.querySelector('.animated-number');
    expect(animated?.getAttribute('aria-label')).toBe('33%');
  });

  it('stays inert on an indeterminate bar -- no label, no AnimatedNumber', () => {
    const { container } = render(Progress, {
      value: -1,
      showLabel: true,
      animateValue: true
    });
    expect(label(container)).toBeNull();
    expect(container.querySelector('.animated-number')).toBeNull();
  });

  it('stays inert when showLabel is off', () => {
    const { container } = render(Progress, {
      value: 60,
      showLabel: false,
      animateValue: true
    });
    expect(label(container)).toBeNull();
    expect(container.querySelector('.animated-number')).toBeNull();
  });
});
