import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Menu from './Menu.svelte';
import { dismissibleLayerCount, registerDismissible } from '../_interaction/dismissal';
import type { MenuItem } from './properties';

const press = (key: string): boolean =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

const pointerDownOn = (node: Node): boolean =>
  node.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));

const items: MenuItem[] = [
  { label: 'Rename', value: 'rename' },
  { label: 'Duplicate', value: 'duplicate' },
  { label: 'Delete', value: 'delete', danger: true }
];

// The dropdown binds clientWidth/clientHeight, which Svelte 5 observes via
// ResizeObserver -- absent from jsdom, so it must be stubbed (same stub as
// Select.svelte.test.ts uses for the same reason).
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Menu used to own its outside-close directly (a `click` listener added to
// `document` in onMount) and its own Escape case in handleMenuKeydown, with
// nothing coordinating either against a Modal/Sheet/another Menu opened on
// top -- one Escape or one outside press could reach a Menu that was not the
// topmost surface. These cases exercise Menu's adoption of the shared
// dismissal module (src/lib/_interaction/dismissal.ts) against that module's
// real ownership stack, standing in for a layer like Modal/Sheet that this
// task does not own.
describe('Menu dismissal ownership', () => {
  it('yields Escape to a layer registered after it, and regains ownership once that layer releases', () => {
    const onclose = vi.fn();
    render(Menu, { items, open: true, onclose });

    const coveringEscape = vi.fn();
    const releaseCovering = registerDismissible({
      element: () => null,
      onEscape: coveringEscape
    });

    press('Escape');
    expect(coveringEscape).toHaveBeenCalledTimes(1);
    expect(onclose).not.toHaveBeenCalled();

    releaseCovering();
    press('Escape');
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape when it is the only open layer', () => {
    const onclose = vi.fn();
    render(Menu, { items, open: true, onclose });

    press('Escape');
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('closes on a pointerdown outside the trigger and dropdown', () => {
    const onclose = vi.fn();
    render(Menu, { items, open: true, onclose });

    pointerDownOn(document.body);
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('does not close on a pointerdown inside the dropdown', () => {
    const onclose = vi.fn();
    const { container } = render(Menu, { items, open: true, onclose });
    const item = container.querySelector('.menu-item');
    expect(item).not.toBeNull();

    pointerDownOn(item as Element);
    expect(onclose).not.toHaveBeenCalled();
  });

  it('does not close on a pointerdown inside a portaled dropdown', () => {
    const onclose = vi.fn();
    render(Menu, { items, open: true, usePortal: true, onclose });
    const portaledItem = document.body.querySelector('.menu-item');
    expect(portaledItem).not.toBeNull();

    pointerDownOn(portaledItem as Element);
    expect(onclose).not.toHaveBeenCalled();
  });

  it('releases its dismissible layer on unmount while still open, leaving none stale', () => {
    const { unmount } = render(Menu, { items, open: true });
    expect(dismissibleLayerCount()).toBeGreaterThan(0);

    unmount();
    expect(dismissibleLayerCount()).toBe(0);
  });
});

describe('Menu focus return', () => {
  it('returns focus to the trigger when Escape closes the menu', async () => {
    const { container } = render(Menu, { items });
    const trigger = container.querySelector('.menu-trigger');
    expect(trigger).not.toBeNull();

    await fireEvent.click(trigger as Element);
    await waitFor(() => {
      expect(container.querySelector('.menu-dropdown')).not.toBeNull();
    });

    press('Escape');
    expect(document.activeElement).toBe(trigger);
  });
});

// Regression coverage: item navigation must keep working once Escape/outside
// handling moves off Menu's own listeners and onto the shared module.
describe('Menu keyboard navigation (regression)', () => {
  it('moves focus through items with Home/End', async () => {
    const { container } = render(Menu, { items, open: true });
    const dropdown = container.querySelector('.menu-dropdown');
    expect(dropdown).not.toBeNull();
    const menuItems = container.querySelectorAll('.menu-item');

    await fireEvent.keyDown(dropdown as Element, { key: 'End' });
    expect(document.activeElement).toBe(menuItems[menuItems.length - 1]);

    await fireEvent.keyDown(dropdown as Element, { key: 'Home' });
    expect(document.activeElement).toBe(menuItems[0]);
  });
});
