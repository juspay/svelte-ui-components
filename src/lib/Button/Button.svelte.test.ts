// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Button from './Button.svelte';

const button = (container: HTMLElement): HTMLButtonElement => {
  const node = container.querySelector('button');
  if (!(node instanceof HTMLButtonElement)) {
    throw new Error('Button element is missing');
  }
  return node;
};

describe('Button ariaPressed', () => {
  it('renders aria-pressed true and false for a toggle', () => {
    const on = render(Button, { text: 'Bold', ariaPressed: true });
    expect(button(on.container).getAttribute('aria-pressed')).toBe('true');
    const off = render(Button, { text: 'Bold', ariaPressed: false });
    expect(button(off.container).getAttribute('aria-pressed')).toBe('false');
  });

  it('leaves the attribute off entirely when unset', () => {
    const { container } = render(Button, { text: 'Bold' });
    expect(button(container).hasAttribute('aria-pressed')).toBe(false);
  });
});

describe('Button statusText', () => {
  const region = (container: HTMLElement): HTMLElement | null =>
    container.querySelector('[role="status"]');

  it('renders a polite live region beside the button, outside it', () => {
    const { container } = render(Button, {
      text: 'Save',
      statusText: 'Saved',
      statusTestId: 'save-status'
    });
    const live = region(container);
    expect(live?.textContent?.trim()).toBe('Saved');
    expect(live?.getAttribute('aria-live')).toBe('polite');
    expect(live?.classList.contains('button-status')).toBe(true);
    expect(live?.getAttribute('data-pw')).toBe('save-status');
    expect(button(container).contains(live)).toBe(false);
  });

  it('keeps an empty region mounted for a later announcement', () => {
    const { container } = render(Button, { text: 'Save', statusText: '' });
    const live = region(container);
    expect(live).not.toBeNull();
    expect(live?.textContent?.trim()).toBe('');
  });

  it('renders nothing at all when unset', () => {
    const { container } = render(Button, { text: 'Save' });
    expect(region(container)).toBeNull();
    expect(container.querySelector('.button-status')).toBeNull();
  });
});

describe('Button shrinkable', () => {
  const root = (container: HTMLElement): HTMLElement => {
    const node = container.querySelector('.button-container');
    if (!(node instanceof HTMLElement)) {
      throw new Error('Button container is missing');
    }
    return node;
  };

  // Svelte adds its own scoping token (`svelte-<hash>`) to every class attribute.
  const classTokens = (node: HTMLElement): string[] =>
    Array.from(node.classList)
      .filter((token) => !token.startsWith('svelte-'))
      .sort();

  it('adds the opt-in class when the prop is true', () => {
    const { container } = render(Button, { text: 'Save', shrinkable: true });
    expect(root(container).classList.contains('button-shrinkable')).toBe(true);
  });

  it('adds no class when the prop is omitted or false', () => {
    const omitted = render(Button, { text: 'Save' });
    expect(root(omitted.container).classList.contains('button-shrinkable')).toBe(false);
    const explicit = render(Button, { text: 'Save', shrinkable: false });
    expect(root(explicit.container).classList.contains('button-shrinkable')).toBe(false);
  });

  it('leaves the container class list untouched for every variant, size and modifier', () => {
    const variants = ['primary', 'secondary', 'ghost', 'destructive', 'brand'] as const;
    const sizes = ['sm', 'md', 'lg'] as const;
    for (const variant of variants) {
      for (const size of sizes) {
        for (const iconOnly of [false, true]) {
          for (const fullWidth of [false, true]) {
            const { container } = render(Button, {
              text: 'Save',
              variant,
              size,
              iconOnly,
              fullWidth,
              classes: 'consumer-class'
            });
            const expected = [
              'button-container',
              `variant-${variant}`,
              `size-${size}`,
              'consumer-class',
              ...(iconOnly ? ['icon-only'] : []),
              ...(fullWidth ? ['full-width'] : [])
            ].sort();
            expect(classTokens(root(container))).toEqual(expected);
          }
        }
      }
    }
  });

  it('does not treat a consumer class named shrinkable as an opt-in', () => {
    const { container } = render(Button, { text: 'Save', classes: 'shrinkable' });
    expect(root(container).classList.contains('button-shrinkable')).toBe(false);
  });
});
