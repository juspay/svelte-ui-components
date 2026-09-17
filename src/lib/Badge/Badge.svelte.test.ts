import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Badge from './Badge.svelte';

function badgeRoot(container: HTMLElement, testId: string): HTMLElement {
  const el = container.querySelector(`[data-pw="${testId}"]`);
  if (!(el instanceof HTMLElement)) {
    throw new Error(`badge "${testId}" not found`);
  }
  return el;
}

describe('Badge default rendering (animateValue unset)', () => {
  it('renders the value as plain text, with no AnimatedNumber in the tree', () => {
    const { container } = render(Badge, { value: '3', testId: 'count' });
    const badge = badgeRoot(container, 'count');
    expect(badge.textContent).toBe('3');
    expect(badge.querySelector('.animated-number')).toBeNull();
  });

  it('is byte-identical whether animateValue is omitted or explicitly false', () => {
    const omitted = render(Badge, { value: '99+', testId: 'count' });
    const explicit = render(Badge, { value: '99+', testId: 'count', animateValue: false });
    expect(omitted.container.innerHTML).toBe(explicit.container.innerHTML);
  });
});

describe('Badge animateValue opt-in', () => {
  it('renders the standalone bubble through AnimatedNumber, diffing the string as-is', () => {
    const { container } = render(Badge, { value: '99+', testId: 'count', animateValue: true });
    const badge = badgeRoot(container, 'count');

    expect(badge.querySelector('.animated-number')).not.toBeNull();
    // '+' stays a literal column rather than becoming a digit -- proof this
    // is the string-diff path, not a parsed numeric one.
    expect(badge.querySelectorAll('.animated-number-digit')).toHaveLength(2);
    const literals = badge.querySelectorAll('.animated-number-literal');
    expect(literals).toHaveLength(1);
    expect(literals[0]?.textContent).toBe('+');
  });

  it('keeps every existing attribute on the badge root untouched', () => {
    const { container } = render(Badge, {
      value: '3',
      testId: 'count',
      ariaLabel: '3 unread',
      animateValue: true
    });
    const badge = badgeRoot(container, 'count');
    expect(badge.getAttribute('role')).toBe('status');
    expect(badge.getAttribute('aria-label')).toBe('3 unread');
    expect(badge.getAttribute('testID')).toBe('count');
  });

  it('overlays an image badge through AnimatedNumber the same way', () => {
    const { container } = render(Badge, {
      image: '/icon.png',
      value: '7',
      testId: 'icon',
      animateValue: true
    });
    const wrap = container.querySelector('[data-pw="icon"] .badge');
    expect(wrap).not.toBeNull();
    expect(wrap?.querySelector('.animated-number')).not.toBeNull();
    expect(wrap?.querySelectorAll('.animated-number-digit')).toHaveLength(1);
  });

  it('mode="dot" ignores animateValue -- no text, no AnimatedNumber', () => {
    const { container } = render(Badge, {
      value: '5',
      mode: 'dot',
      testId: 'count',
      animateValue: true
    });
    const badge = badgeRoot(container, 'count');
    expect(badge.classList.contains('badge-dot')).toBe(true);
    expect(badge.textContent).toBe('');
    expect(badge.querySelector('.animated-number')).toBeNull();
  });

  it('renders the same dot markup whether or not animateValue is set', () => {
    const off = render(Badge, { value: '5', mode: 'dot', testId: 'count' });
    const on = render(Badge, { value: '5', mode: 'dot', testId: 'count', animateValue: true });
    expect(off.container.innerHTML).toBe(on.container.innerHTML);
  });
});
