import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CustomCells from './CustomCells.test.svelte';

/**
 * A clickable row listened for Enter/Space without asking
 * where the key came from, so a caller's `cell` snippet — which deliberately
 * does not stop propagation, unlike the built-in cells — leaked every key into
 * row activation. Typing a space in an editable cell opened the record and lost
 * the space to `preventDefault()`; Enter on a cell button fired the button and
 * the row.
 *
 * Keyboard is fixed structurally: the row acts only when the row itself is the
 * event target. Click is NOT, because "click anywhere on the row" is the
 * feature; interactive cell content opts out with `data-row-activation="ignore"`.
 * That asymmetry is deliberate and is what the last two cases pin down.
 */

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const required = <T>(value: T | null, what: string): T => {
  if (value === null) {
    throw new Error(`expected ${what} to be in the document`);
  }
  return value;
};

/** Dispatches a real cancelable keydown so `defaultPrevented` can be read back. */
const pressKey = async (target: Element, key: string): Promise<KeyboardEvent> => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  await fireEvent(target, event);
  return event;
};

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Table row activation — keyboard', () => {
  it('still activates the row from the row itself, and consumes the key', async () => {
    const onrowclick = vi.fn();
    const { container } = render(CustomCells, { props: { onrowclick, onaction: vi.fn() } });
    const row = required(container.querySelector('tbody tr'), 'the first row');

    const enter = await pressKey(row, 'Enter');
    expect(onrowclick).toHaveBeenCalledTimes(1);
    expect(enter.defaultPrevented).toBe(true);

    const space = await pressKey(row, ' ');
    expect(onrowclick).toHaveBeenCalledTimes(2);
    // Space scrolls the page by default; a row that activates on it must say so.
    expect(space.defaultPrevented).toBe(true);
  });

  it('never opens the record from a key typed in an editable cell', async () => {
    const onrowclick = vi.fn();
    const { container } = render(CustomCells, { props: { onrowclick, onaction: vi.fn() } });
    const input = required(
      container.querySelector<HTMLInputElement>('[data-pw="cell-input"]'),
      'the cell input'
    );

    const space = await pressKey(input, ' ');
    expect(onrowclick).not.toHaveBeenCalled();
    // The space has to reach the input: swallowing it types nothing.
    expect(space.defaultPrevented).toBe(false);

    const enter = await pressKey(input, 'Enter');
    expect(onrowclick).not.toHaveBeenCalled();
    expect(enter.defaultPrevented).toBe(false);
  });

  it('never opens the record from Enter on a cell button, link or popup trigger', async () => {
    const onrowclick = vi.fn();
    const { container } = render(CustomCells, { props: { onrowclick, onaction: vi.fn() } });

    for (const selector of ['cell-button', 'cell-link', 'cell-popup-trigger']) {
      const control = required(container.querySelector(`[data-pw="${selector}"]`), selector);
      await pressKey(control, 'Enter');
      await pressKey(control, ' ');
    }

    expect(onrowclick).not.toHaveBeenCalled();
  });
});

describe('Table row activation — click', () => {
  it('does not activate the row from marked cell content, but the control still fires', async () => {
    const onrowclick = vi.fn();
    const onaction = vi.fn();
    const { container } = render(CustomCells, { props: { onrowclick, onaction } });

    await fireEvent.click(required(container.querySelector('[data-pw="cell-button"]'), 'button'));
    expect(onaction.mock.calls).toEqual([['button:Alice']]);
    expect(onrowclick).not.toHaveBeenCalled();

    // The marking is inherited: the trigger inside a marked wrapper is covered.
    await fireEvent.click(
      required(container.querySelector('[data-pw="cell-popup-trigger"]'), 'popup trigger')
    );
    expect(onaction.mock.calls).toEqual([['button:Alice'], ['popup']]);
    expect(onrowclick).not.toHaveBeenCalled();

    await fireEvent.click(required(container.querySelector('[data-pw="cell-link"]'), 'link'));
    expect(onrowclick).not.toHaveBeenCalled();
  });

  it('keeps activating the row from unmarked content, marked or not', async () => {
    const onrowclick = vi.fn();
    const onaction = vi.fn();
    const { container } = render(CustomCells, { props: { onrowclick, onaction } });

    // A control that does NOT opt out keeps bubbling: both fire, as before.
    await fireEvent.click(
      required(container.querySelector('[data-pw="cell-bubbling"]'), 'bubbling button')
    );
    expect(onaction.mock.calls).toEqual([['bubbling']]);
    expect(onrowclick).toHaveBeenCalledTimes(1);

    // And the row's own plain text still opens the record, which is the whole
    // reason click is not guarded by event target the way keydown is.
    const nameCell = required(container.querySelector('tbody tr td'), 'the first cell');
    await fireEvent.click(nameCell);
    expect(onrowclick).toHaveBeenCalledTimes(2);
  });

  it('reports the row the click landed on, not the one the snippet closed over', async () => {
    const onrowclick = vi.fn();
    const { container } = render(CustomCells, { props: { onrowclick, onaction: vi.fn() } });
    const secondRow = [...container.querySelectorAll('tbody tr')][1];

    await fireEvent.click(required(secondRow.querySelector('td'), 'the second row first cell'));

    expect(onrowclick.mock.calls).toEqual([[1, ['Bob', null], 1]]);
  });
});
