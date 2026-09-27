// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import WindowedList from './WindowedList.svelte';
import type { WindowedListRow } from './properties';

type Item = { id: string };
const list = (from: number, to: number, prefix = 'm'): Item[] =>
  Array.from({ length: to - from }, (_, i) => ({ id: `${prefix}${from + i}` }));
const row = createRawSnippet((r: () => WindowedListRow<Item>) => ({
  render: () =>
    `<p class="row" data-index="${r().index}" data-first="${r().isFirst}">${r().item.id}</p>`
}));
const getKey = (item: Item): string => item.id;
const ids = (container: HTMLElement): string[] =>
  Array.from(container.querySelectorAll('.row')).map((n) => n.textContent ?? '');
const button = (container: HTMLElement): HTMLButtonElement | null =>
  container.querySelector('.windowed-list-earlier button');

describe('WindowedList', () => {
  it('renders everything, with no control, when the list fits', () => {
    const { container } = render(WindowedList<Item>, {
      items: list(0, 5),
      getKey,
      row,
      initialCount: 10
    });
    expect(ids(container)).toEqual(['m0', 'm1', 'm2', 'm3', 'm4']);
    expect(button(container)).toBeNull();
  });

  it('renders the newest initialCount with full-list indexes', () => {
    const { container } = render(WindowedList<Item>, {
      items: list(0, 10),
      getKey,
      row,
      initialCount: 3
    });
    expect(ids(container)).toEqual(['m7', 'm8', 'm9']);
    const first = container.querySelector('.row');
    expect(first?.getAttribute('data-index')).toBe('7');
    expect(first?.getAttribute('data-first')).toBe('true');
    expect(button(container)?.textContent?.trim()).toBe('Show 7 earlier (7 hidden)');
  });

  it('reveals step more per click, then drops the control', async () => {
    const { container } = render(WindowedList<Item>, {
      items: list(0, 10),
      getKey,
      row,
      initialCount: 3,
      step: 4
    });
    const reveal = async (): Promise<void> => {
      const node = button(container);
      if (node !== null) {
        await fireEvent.click(node);
      }
      await tick();
    };
    await reveal();
    expect(ids(container)[0]).toBe('m3');
    expect(button(container)?.textContent?.trim()).toBe('Show 3 earlier (3 hidden)');
    await reveal();
    expect(ids(container)).toHaveLength(10);
    expect(button(container)).toBeNull();
  });

  it('keeps its first row when items are appended', async () => {
    const { container, rerender } = render(WindowedList<Item>, {
      items: list(0, 10),
      getKey,
      row,
      initialCount: 3
    });
    await rerender({ items: list(0, 14), getKey, row, initialCount: 3 });
    expect(ids(container)).toEqual(['m7', 'm8', 'm9', 'm10', 'm11', 'm12', 'm13']);
  });

  it('re-anchors to the newest rows when the list is replaced', async () => {
    const { container, rerender } = render(WindowedList<Item>, {
      items: list(0, 10),
      getKey,
      row,
      initialCount: 3
    });
    await rerender({ items: list(0, 6, 'x'), getKey, row, initialCount: 3 });
    expect(ids(container)).toEqual(['x3', 'x4', 'x5']);
  });

  // The anchor a reveal set can vanish (the list is truncated) while the key the
  // window STARTED from is still present. Falling back to that older anchor
  // restored a window the reader had already moved past.
  it('re-anchors to the newest rows when a revealed anchor is truncated away', async () => {
    const { container, rerender } = render(WindowedList<Item>, {
      items: list(0, 20),
      getKey,
      row,
      initialCount: 5,
      step: 5
    });
    expect(ids(container)).toEqual(['m15', 'm16', 'm17', 'm18', 'm19']);
    const node = button(container);
    if (node !== null) {
      await fireEvent.click(node);
    }
    await tick();
    expect(ids(container)[0]).toBe('m10');

    // m10 (the revealed anchor) is gone; m15 (where the window began) is not.
    await rerender({ items: list(11, 25), getKey, row, initialCount: 5, step: 5 });
    expect(ids(container)).toEqual(['m20', 'm21', 'm22', 'm23', 'm24']);

    // The new anchor then holds through appends, like any other.
    await rerender({ items: list(11, 27), getKey, row, initialCount: 5, step: 5 });
    expect(ids(container)).toEqual(['m20', 'm21', 'm22', 'm23', 'm24', 'm25', 'm26']);
  });

  it('still reveals after a re-anchor, even to a key it revealed to before', async () => {
    const { container, rerender } = render(WindowedList<Item>, {
      items: list(0, 20),
      getKey,
      row,
      initialCount: 5,
      step: 5
    });
    const reveal = async (): Promise<void> => {
      const node = button(container);
      if (node !== null) {
        await fireEvent.click(node);
      }
      await tick();
    };
    await reveal();
    expect(ids(container)[0]).toBe('m10');
    await rerender({ items: list(11, 25), getKey, row, initialCount: 5, step: 5 });
    expect(ids(container)[0]).toBe('m20');
    // The full list returns: the window is still at m20, and one click reveals m15..m19 again.
    await rerender({ items: list(0, 25), getKey, row, initialCount: 5, step: 5 });
    expect(ids(container)[0]).toBe('m20');
    await reveal();
    expect(ids(container)[0]).toBe('m15');
  });

  it('hands a custom control the counts and the reveal', async () => {
    const earlier = createRawSnippet(
      (e: () => { hidden: number; next: number; showEarlier: () => void }) => ({
        render: () => `<a class="more" href="#">${e().next} of ${e().hidden}</a>`,
        setup: (node: Element) => {
          node.addEventListener('click', (event) => {
            event.preventDefault();
            e().showEarlier();
          });
        }
      })
    );
    const { container } = render(WindowedList<Item>, {
      items: list(0, 10),
      getKey,
      row,
      initialCount: 8,
      earlier
    });
    const more = container.querySelector('.more');
    expect(more?.textContent).toBe('2 of 2');
    if (more !== null) {
      await fireEvent.click(more);
    }
    await tick();
    expect(ids(container)).toHaveLength(10);
  });
});
