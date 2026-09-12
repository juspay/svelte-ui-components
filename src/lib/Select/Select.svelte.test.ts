import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import Select from './Select.svelte';
import type { SelectItem } from './properties';

const fruits: SelectItem[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'banana', label: 'Banana' },
  { id: 'cherry', label: 'Cherry' },
  { id: 'date', label: 'Date' }
];

const withDisabledEnds: SelectItem[] = [
  { id: 'apple', label: 'Apple', disabled: true },
  { id: 'banana', label: 'Banana' },
  { id: 'cherry', label: 'Cherry' },
  { id: 'date', label: 'Date', disabled: true }
];

// The dropdown panel binds clientWidth/clientHeight, which Svelte 5 observes
// via ResizeObserver -- absent from jsdom, so it must be stubbed.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('Select Home/End keyboard navigation', () => {
  let originalScrollIntoView: typeof Element.prototype.scrollIntoView;
  let scrollIntoViewMock: Mock<(options?: boolean | ScrollIntoViewOptions) => void>;

  beforeEach(() => {
    // jsdom implements no layout/scrolling APIs at all -- scrollIntoView is
    // simply absent, so calling it unstubbed throws.
    originalScrollIntoView = Element.prototype.scrollIntoView;
    // Typed to Element.scrollIntoView's own signature, so assigning it onto the
    // prototype below does not need a cast the repo lint forbids.
    scrollIntoViewMock = vi.fn((_options?: boolean | ScrollIntoViewOptions) => {});
    Element.prototype.scrollIntoView = scrollIntoViewMock;
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  });

  afterEach(() => {
    Element.prototype.scrollIntoView = originalScrollIntoView;
    vi.unstubAllGlobals();
  });

  it('End moves the highlight to the last option and Home back to the first', async () => {
    const { getByRole, getAllByRole } = render(Select, { items: fruits });
    const trigger = getByRole('combobox');
    await fireEvent.click(trigger);
    await fireEvent.keyDown(trigger, { key: 'ArrowDown' });

    const options = getAllByRole('option');
    expect(options[0].classList.contains('highlighted')).toBe(true);

    await fireEvent.keyDown(trigger, { key: 'End' });
    expect(options.at(-1)?.classList.contains('highlighted')).toBe(true);
    expect(trigger.getAttribute('aria-activedescendant')).toBe(options.at(-1)?.id);
    expect(options[0].classList.contains('highlighted')).toBe(false);

    await fireEvent.keyDown(trigger, { key: 'Home' });
    expect(options[0].classList.contains('highlighted')).toBe(true);
    expect(trigger.getAttribute('aria-activedescendant')).toBe(options[0].id);
    expect(options.at(-1)?.classList.contains('highlighted')).toBe(false);
  });

  it('scrolls the newly highlighted option into view the same way arrow navigation does', async () => {
    const { getByRole } = render(Select, { items: fruits });
    const trigger = getByRole('combobox');
    await fireEvent.click(trigger);
    scrollIntoViewMock.mockClear();

    await fireEvent.keyDown(trigger, { key: 'End' });
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ block: 'nearest' });
  });

  it('does nothing on Home or End when the option list is empty', async () => {
    const { getByRole, queryAllByRole } = render(Select, { items: [] });
    const trigger = getByRole('combobox');
    await fireEvent.click(trigger);
    expect(queryAllByRole('option').length).toBe(0);

    await fireEvent.keyDown(trigger, { key: 'End' });
    await fireEvent.keyDown(trigger, { key: 'Home' });

    expect(trigger.getAttribute('aria-activedescendant')).toBeNull();
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });

  it('skips disabled rows at the ends, landing on the nearest selectable option', async () => {
    const { getByRole, getAllByRole } = render(Select, { items: withDisabledEnds });
    const trigger = getByRole('combobox');
    await fireEvent.click(trigger);

    await fireEvent.keyDown(trigger, { key: 'Home' });
    const options = getAllByRole('option');
    expect(options[1].classList.contains('highlighted')).toBe(true); // banana
    expect(options[0].classList.contains('highlighted')).toBe(false); // apple (disabled)

    await fireEvent.keyDown(trigger, { key: 'End' });
    expect(options[2].classList.contains('highlighted')).toBe(true); // cherry
    expect(options[3].classList.contains('highlighted')).toBe(false); // date (disabled)
  });

  it('does not consume Home/End while the dropdown is closed', async () => {
    const { getByRole, queryByRole } = render(Select, { items: fruits });
    const trigger = getByRole('combobox');

    await fireEvent.keyDown(trigger, { key: 'End' });
    await fireEvent.keyDown(trigger, { key: 'Home' });

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(queryByRole('listbox')).toBeNull();
  });

  it('lets Home/End move the caret in a focused search input instead of the highlight', async () => {
    const { getByRole, getAllByRole } = render(Select, { items: fruits, searchable: true });
    const trigger = getByRole('combobox');
    await fireEvent.click(trigger);
    await fireEvent.keyDown(trigger, { key: 'ArrowDown' });

    const options = getAllByRole('option');
    expect(options[0].classList.contains('highlighted')).toBe(true);

    const search = getByRole('textbox');
    await fireEvent.focus(search);
    await fireEvent.keyDown(search, { key: 'End' });

    expect(options[0].classList.contains('highlighted')).toBe(true);
    expect(options.at(-1)?.classList.contains('highlighted')).toBe(false);
  });

  it('ignores Home/End when a modifier key is held', async () => {
    const { getByRole, getAllByRole } = render(Select, { items: fruits });
    const trigger = getByRole('combobox');
    await fireEvent.click(trigger);
    await fireEvent.keyDown(trigger, { key: 'ArrowDown' });

    const options = getAllByRole('option');
    expect(options[0].classList.contains('highlighted')).toBe(true);

    await fireEvent.keyDown(trigger, { key: 'End', ctrlKey: true });
    expect(options[0].classList.contains('highlighted')).toBe(true);
    expect(options.at(-1)?.classList.contains('highlighted')).toBe(false);

    await fireEvent.keyDown(trigger, { key: 'Home', metaKey: true });
    expect(options[0].classList.contains('highlighted')).toBe(true);
  });

  it('does not let Home/End select a disabled row that arrow navigation highlighted', async () => {
    const onchange = vi.fn();
    const { getByRole } = render(Select, { items: withDisabledEnds, onchange });
    const trigger = getByRole('combobox');
    await fireEvent.click(trigger);

    // Arrow-key navigation is unchanged by this feature and can still land on
    // a disabled row (index 0); selecting it must still be a no-op.
    await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    await fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onchange).not.toHaveBeenCalled();
  });
});
