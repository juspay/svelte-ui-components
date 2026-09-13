import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Separator from './Separator.svelte';

describe('Separator', () => {
  it('defaults to a horizontal, decorative divider hidden from assistive technology', () => {
    const { container } = render(Separator);
    const el = container.querySelector('.separator');
    expect(el).not.toBeNull();
    expect(el?.getAttribute('data-orientation')).toBe('horizontal');
    expect(el?.getAttribute('aria-hidden')).toBe('true');
    // A decorative separator carries no ARIA role at all -- it should not
    // even be reachable via role queries.
    expect(el?.getAttribute('role')).toBeNull();
    expect(el?.getAttribute('aria-orientation')).toBeNull();
  });

  it('reflects a vertical orientation onto data-orientation for styling', () => {
    const { container } = render(Separator, { orientation: 'vertical' });
    const el = container.querySelector('.separator');
    expect(el?.getAttribute('data-orientation')).toBe('vertical');
    // Still decorative by default, so still no role/aria-orientation.
    expect(el?.getAttribute('role')).toBeNull();
    expect(el?.getAttribute('aria-orientation')).toBeNull();
  });

  it('exposes role="separator" with a matching aria-orientation when non-decorative', () => {
    const { getByRole } = render(Separator, { decorative: false, orientation: 'vertical' });
    const el = getByRole('separator');
    expect(el.getAttribute('aria-orientation')).toBe('vertical');
    expect(el.getAttribute('data-orientation')).toBe('vertical');
    expect(el.hasAttribute('aria-hidden')).toBe(false);
  });

  it('omits aria-orientation for a non-decorative horizontal separator (ARIA default)', () => {
    const { getByRole } = render(Separator, { decorative: false });
    const el = getByRole('separator');
    expect(el.getAttribute('aria-orientation')).toBeNull();
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('applies testId to both data-pw and testID, and appends custom classes', () => {
    const { container } = render(Separator, { testId: 'section-divider', classes: 'my-class' });
    const el = container.querySelector('.separator');
    expect(el?.getAttribute('data-pw')).toBe('section-divider');
    expect(el?.getAttribute('testID')).toBe('section-divider');
    expect(el?.classList.contains('my-class')).toBe(true);
  });
});
