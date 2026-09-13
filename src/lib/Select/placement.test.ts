import { fireEvent, render } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import Select from './Select.svelte';

const items = ['Apple', 'Banana', 'Cherry'];

// Select observes its trigger to keep a portaled panel anchored; jsdom ships no
// ResizeObserver, and without one the component throws on mount.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});
afterAll(() => {
  vi.unstubAllGlobals();
});

/** Opens the dropdown the way a user does, and hands back the panel element. */
const openPanel = async (container: HTMLElement): Promise<HTMLElement> => {
  const trigger = container.querySelector('.select-trigger');
  expect(trigger).not.toBeNull();
  if (trigger !== null) {
    await fireEvent.click(trigger);
  }
  const panel = container.querySelector('.select-dropdown');
  expect(panel).not.toBeNull();
  if (panel === null) {
    throw new Error('dropdown did not open');
  }
  return panel as HTMLElement;
};

/*
 * The in-flow panel is CSS-positioned, so which side it opens on is carried by a
 * class rather than an inline style -- jsdom computes no layout, and asserting on
 * the class is asserting on the thing that actually does the positioning.
 */
describe('Select dropdown placement', () => {
  it('opens downward by default, as it always has', async () => {
    const { container } = render(Select, { items });
    const panel = await openPanel(container);

    expect(panel.classList.contains('select-dropdown-up')).toBe(false);
    expect(panel.dataset.placement).toBe('bottom-left');
  });

  it('opens upward when placement pins the top', async () => {
    const { container } = render(Select, { items, placement: 'top-left' });
    const panel = await openPanel(container);

    expect(panel.classList.contains('select-dropdown-up')).toBe(true);
    expect(panel.dataset.placement).toBe('top-left');
  });

  it('carries the horizontal half of placement too', async () => {
    const { container } = render(Select, { items, placement: 'top-right' });
    const panel = await openPanel(container);

    expect(panel.classList.contains('select-dropdown-up')).toBe(true);
    expect(panel.classList.contains('select-dropdown-right')).toBe(true);
    expect(panel.dataset.placement).toBe('top-right');
  });

  /*
   * `dropdownAlign` is deprecated but still shipped, so both the old spelling
   * alone and the precedence between the two have to keep working until 5.0.0.
   */
  it('still honours a deprecated dropdownAlign when placement is unset', async () => {
    const { container } = render(Select, { items, dropdownAlign: 'right' });
    const panel = await openPanel(container);

    expect(panel.classList.contains('select-dropdown-right')).toBe(true);
    expect(panel.classList.contains('select-dropdown-up')).toBe(false);
    expect(panel.dataset.placement).toBe('bottom-right');
  });

  it('lets placement win over a conflicting dropdownAlign', async () => {
    const { container } = render(Select, {
      items,
      dropdownAlign: 'right',
      placement: 'top-left'
    });
    const panel = await openPanel(container);

    expect(panel.classList.contains('select-dropdown-right')).toBe(false);
    expect(panel.dataset.placement).toBe('top-left');
  });

  /*
   * `'auto'` renders hidden for one tick to measure the panel. jsdom reports zero
   * for every rect, so the resolver finds no overflow and settles on the default
   * corner -- what this pins is that the measuring pass ends and does not leave
   * the panel permanently invisible.
   */
  it('clears the measuring state after an auto open settles', async () => {
    const { container } = render(Select, { items, placement: 'auto' });
    const panel = await openPanel(container);
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(panel.classList.contains('select-dropdown-measuring')).toBe(false);
    expect(panel.dataset.placement).toBe('bottom-left');
  });
});

/*
 * `open` is bindable and documented as something a parent can drive, so the
 * panel can appear without `openDropdown()` ever running. Placement has to be
 * resolved from the props rather than assigned on the click path, or an
 * explicitly placed Select renders at the default corner whenever its parent
 * opens it.
 */
describe('Select placement with parent-controlled open', () => {
  it('honours an explicit placement when the parent opens it', () => {
    const { container } = render(Select, { items, placement: 'top-right', open: true });
    const panel = container.querySelector('.select-dropdown');
    expect(panel).not.toBeNull();

    expect(panel?.getAttribute('data-placement')).toBe('top-right');
    expect(panel?.classList.contains('select-dropdown-up')).toBe(true);
    expect(panel?.classList.contains('select-dropdown-right')).toBe(true);
  });

  it('honours it when the parent flips open after mount', async () => {
    const { container, rerender } = render(Select, { items, placement: 'top-left', open: false });
    await rerender({ items, placement: 'top-left', open: true });

    const panel = container.querySelector('.select-dropdown');
    expect(panel?.getAttribute('data-placement')).toBe('top-left');
    expect(panel?.classList.contains('select-dropdown-up')).toBe(true);
  });
});

/*
 * With `placement` unset, a portaled panel still flips on fit -- that is the
 * pre-existing behaviour this PR preserves. `data-placement` has to report where
 * the panel actually went, not what was requested, or the attribute contradicts
 * the screen for exactly the callers who rely on it to style the flipped state.
 */
describe('Select data-placement follows the portaled geometry', () => {
  const stubGeometry = (): (() => void) => {
    const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect');
    // Trigger parked at the very bottom of a 768px jsdom viewport: no room
    // below for the panel, plenty above.
    rect.mockReturnValue({
      x: 0,
      y: 700,
      left: 0,
      right: 200,
      top: 700,
      bottom: 740,
      width: 200,
      height: 40,
      toJSON: () => ({})
    });
    const height = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight');
    Object.defineProperty(Element.prototype, 'clientHeight', {
      configurable: true,
      get: () => 300
    });
    return () => {
      rect.mockRestore();
      if (height) {
        Object.defineProperty(Element.prototype, 'clientHeight', height);
      }
    };
  };

  it('reports top-* when an unset placement flips the portaled panel upward', async () => {
    const restore = stubGeometry();
    try {
      const { container } = render(Select, { items, usePortal: true, open: true });
      await new Promise((resolve) => setTimeout(resolve, 0));
      const panel =
        document.querySelector('.select-dropdown') ?? container.querySelector('.select-dropdown');

      expect(panel?.getAttribute('data-placement')).toBe('top-left');
      // The positioning class is in-flow only; a portaled panel is driven by the
      // inline `top`, and adding `bottom: 100%` there would fight it.
      expect(panel?.classList.contains('select-dropdown-up')).toBe(false);
    } finally {
      restore();
    }
  });
});
