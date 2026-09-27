// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ArmedButton from './ArmedButton.svelte';

const root = (container: HTMLElement): HTMLElement => {
  const node = container.querySelector('.armed-button');
  if (!(node instanceof HTMLElement)) {
    throw new Error('ArmedButton root is missing');
  }
  return node;
};
const button = (container: HTMLElement): HTMLButtonElement => {
  const node = container.querySelector('button');
  if (!(node instanceof HTMLButtonElement)) {
    throw new Error('ArmedButton button is missing');
  }
  return node;
};
const isArmed = (container: HTMLElement): boolean => root(container).dataset.armed === 'true';

describe('ArmedButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('rests on its label, unarmed', () => {
    const { container } = render(ArmedButton, { label: 'Kill', onconfirm: vi.fn() });
    expect(isArmed(container)).toBe(false);
    expect(button(container).textContent?.trim()).toBe('Kill');
    expect(button(container).title).toBe('Kill');
  });

  it('arms on the first click without confirming', async () => {
    const onconfirm = vi.fn();
    const { container } = render(ArmedButton, { label: 'Kill', onconfirm });
    await fireEvent.click(button(container));
    expect(isArmed(container)).toBe(true);
    expect(button(container).textContent?.trim()).toBe('sure?');
    expect(button(container).title).toBe('click again to kill');
    expect(button(container).getAttribute('aria-label')).toBe('confirm: Kill');
    expect(onconfirm).not.toHaveBeenCalled();
  });

  it('confirms on the second click, and disarms BEFORE the confirm settles', async () => {
    // A confirm that never resolves: if disarming waited for it, the button
    // would sit "armed" for the whole call and read as still awaiting a click.
    const onconfirm = vi.fn(() => new Promise<void>(() => {}));
    const { container } = render(ArmedButton, { label: 'Kill', onconfirm });
    await fireEvent.click(button(container));
    await fireEvent.click(button(container));
    expect(onconfirm).toHaveBeenCalledTimes(1);
    expect(isArmed(container)).toBe(false);
    expect(button(container).textContent?.trim()).toBe('Kill');
  });

  it('lapses on its own after armedMs, without confirming', async () => {
    const onconfirm = vi.fn();
    const { container } = render(ArmedButton, { label: 'Kill', onconfirm, armedMs: 1500 });
    await fireEvent.click(button(container));
    expect(isArmed(container)).toBe(true);
    await vi.advanceTimersByTimeAsync(1499);
    expect(isArmed(container)).toBe(true);
    await vi.advanceTimersByTimeAsync(2);
    expect(isArmed(container)).toBe(false);
    expect(onconfirm).not.toHaveBeenCalled();
  });

  it('disarms when focus leaves it', async () => {
    const { container } = render(ArmedButton, { label: 'Kill', onconfirm: vi.fn() });
    await fireEvent.click(button(container));
    expect(isArmed(container)).toBe(true);
    await fireEvent.focusOut(root(container));
    expect(isArmed(container)).toBe(false);
  });

  it('leaves no timer behind when it unmounts while armed', async () => {
    const { container, unmount } = render(ArmedButton, { label: 'Kill', onconfirm: vi.fn() });
    await fireEvent.click(button(container));
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('uses an icon at rest and the confirm label as text once armed', async () => {
    const icon = createRawSnippet(() => ({ render: () => '<svg class="glyph"></svg>' }));
    const { container } = render(ArmedButton, { label: 'Kill', onconfirm: vi.fn(), icon });
    expect(container.querySelector('.glyph')).not.toBeNull();
    await fireEvent.click(button(container));
    expect(container.querySelector('.glyph')).toBeNull();
    expect(button(container).textContent?.trim()).toBe('sure?');
  });

  it('does nothing while disabled', async () => {
    const onconfirm = vi.fn();
    const { container } = render(ArmedButton, { label: 'Kill', onconfirm, disabled: true });
    await fireEvent.click(button(container));
    expect(isArmed(container)).toBe(false);
    expect(onconfirm).not.toHaveBeenCalled();
  });
});
