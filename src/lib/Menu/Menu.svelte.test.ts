import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Menu from './Menu.svelte';
import { dismissibleLayerCount, registerDismissible } from '../_interaction/dismissal';
import type { MenuItem } from './properties';

// Menu's dropdown now opens/closes with transition:tokenizedFly (it had no
// transition at all before the motion-token migration), and Svelte 5 drives
// transitions through the Web Animations API, which jsdom does not
// implement. Stubbed here rather than in vitest-setup.ts: a global stub would
// apply to every suite in the repo and could hide a real animation fault in a
// component that is not under test. Same pattern as Sheet.svelte.test.ts.
beforeAll(() => {
  if (typeof Element.prototype.animate !== 'function') {
    const stub = { cancel: () => {}, finished: Promise.resolve() };
    Element.prototype.animate = () => stub as unknown as Animation;
  }
});

/*
 * The shared beforeAll stub above never invokes the `onfinish` callback
 * Svelte's transition runtime assigns onto its `element.animate(...)` calls,
 * so the outro never completes and the dropdown is never removed -- fine for
 * tests that only need open() to not throw, not for one that asserts on
 * post-close state. This stand-in auto-invokes whatever gets assigned to
 * `onfinish` on a microtask, mimicking a zero-duration animation finishing on
 * its own. Copied from Sheet.svelte.test.ts's identical need.
 */
function makeCompletingAnimation(): Animation {
  const stub = {
    cancel: () => {},
    effect: null,
    currentTime: 0,
    playState: 'finished',
    finished: Promise.resolve(),
    onfinish: null
  };
  return new Proxy(stub, {
    set(target, property, value) {
      const applied = Reflect.set(target, property, value);
      if (property === 'onfinish' && typeof value === 'function') {
        queueMicrotask(value as () => void);
      }
      return applied;
    }
  }) as unknown as Animation;
}

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

    const sharedAnimate = Element.prototype.animate;
    Element.prototype.animate = () => makeCompletingAnimation();
    try {
      press('Escape');
      // Focus restoration now waits for the out:tokenizedFly outro to finish,
      // not the next flush -- waitFor gives the completing-animation stub's
      // queued onfinish a turn to run.
      await waitFor(() => {
        expect(document.activeElement).toBe(trigger);
      });
    } finally {
      Element.prototype.animate = sharedAnimate;
    }
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

describe('Menu close idempotency', () => {
  it('a second Escape during the out:tokenizedFly outro does not fire onclose again', async () => {
    // The shared beforeAll stub never completes the outro (see its own comment),
    // so the dropdown -- and its Escape/dismissal wiring -- stays mounted exactly
    // like it would mid-fade with a real animation. A second Escape landing in
    // that window used to re-run close() unconditionally, firing onclose twice
    // (and re-running focus restoration) for what a consumer sees as a single
    // dismissal.
    const onclose = vi.fn();
    const { container } = render(Menu, { items, open: true, onclose });
    await waitFor(() => {
      expect(container.querySelector('.menu-dropdown')).not.toBeNull();
    });

    press('Escape');
    press('Escape');

    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('goes inert the instant it closes, not only once the outro finishes', async () => {
    const { container } = render(Menu, { items, open: true });
    const dropdown = container.querySelector('.menu-dropdown');
    await waitFor(() => {
      expect(dropdown).not.toBeNull();
    });
    expect((dropdown as HTMLElement).inert).toBe(false);

    press('Escape');

    await waitFor(() => {
      expect((dropdown as HTMLElement).inert).toBe(true);
    });
  });
});
