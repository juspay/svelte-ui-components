import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Select from './Select.svelte';
import type { SelectItem } from './properties';

const cities: SelectItem[] = [
  { id: 'nyc', label: 'New York' },
  { id: 'tyo', label: 'Tokyo' },
  { id: 'par', label: 'Paris' }
];

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const asInput = (element: HTMLElement): HTMLInputElement => {
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`expected an <input>, got <${element.tagName.toLowerCase()}>`);
  }
  return element;
};

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * ISSUE-023. These dispatch SYNTHETIC events in jsdom and only prove the
 * ordering contract in `handleSearchInput`. The real native Firefox sequence is
 * proven in tests/select-escape-search-clear.test.ts, which drives a real browser
 * in all three engines.
 */
describe('Select in-menu search: Escape and the native clear event (ISSUE-023)', () => {
  const openMenuSelect = async (props: Record<string, unknown> = {}) => {
    const view = render(Select, {
      items: cities,
      searchable: true,
      searchPosition: 'menu',
      ...props
    });
    const trigger = view.getByRole('combobox');
    await fireEvent.click(trigger);
    return { ...view, trigger, search: asInput(view.getByRole('searchbox')) };
  };

  it('does not reopen when an input event follows Escape before the close has flushed', async () => {
    const onopen = vi.fn();
    const onclose = vi.fn();
    const { trigger, search, queryByRole } = await openMenuSelect({ onopen, onclose });
    await fireEvent.input(search, { target: { value: 'Tokyo' } });
    onopen.mockClear();

    // Firefox clears an <input type="search"> on Escape and dispatches the input
    // event inside the same keydown, before Svelte has applied the close to the
    // DOM. Both events are fired back to back here for the same ordering.
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    search.dispatchEvent(escape);
    search.value = '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(queryByRole('listbox')).toBeNull();
    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onopen).not.toHaveBeenCalled();
  });

  it('opens with an empty query and every option after the Escape sequence', async () => {
    const { trigger, search, getAllByRole, getByRole } = await openMenuSelect();
    await fireEvent.input(search, { target: { value: 'Tokyo' } });
    expect(getAllByRole('option')).toHaveLength(1);

    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    search.value = '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    await fireEvent.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(getAllByRole('option')).toHaveLength(cities.length);
    expect(asInput(getByRole('searchbox')).value).toBe('');
  });

  it('still filters, and still clears the query, while the panel is open', async () => {
    const { trigger, search, getAllByRole } = await openMenuSelect();

    await fireEvent.input(search, { target: { value: 'par' } });
    expect(getAllByRole('option')).toHaveLength(1);

    // The native cancel button on a search field clears it with the panel open.
    await fireEvent.input(search, { target: { value: '' } });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(getAllByRole('option')).toHaveLength(cities.length);
  });

  it('still opens a closed Select when the user types into the in-trigger input', async () => {
    // The guard is for the in-menu box only: with the filter in the trigger,
    // typing into a closed Select is how it opens.
    const onopen = vi.fn();
    const { getByRole } = render(Select, {
      items: cities,
      searchable: true,
      onopen
    });
    const input = getByRole('textbox');

    await fireEvent.input(input, { target: { value: 'to' } });

    expect(getByRole('combobox').getAttribute('aria-expanded')).toBe('true');
    expect(onopen).toHaveBeenCalledTimes(1);
  });
});
