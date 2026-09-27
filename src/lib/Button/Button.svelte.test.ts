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
