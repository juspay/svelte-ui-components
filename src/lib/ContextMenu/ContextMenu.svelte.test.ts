import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import ContextMenu from './ContextMenu.svelte';
import { dismissibleLayerCount, registerDismissible } from '../_interaction/dismissal';
import type { ContextMenuItem } from './properties';

// ContextMenu's dropdown now opens/closes with transition:tokenizedFly (it
// had no transition at all before the motion-token migration), and Svelte 5
// drives transitions through the Web Animations API, which jsdom does not
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

// Flushes ContextMenu's own openMenu() requestAnimationFrame (adjustPosition +
// initial item focus), the same frame its "Escape before the frame" guard
// exists to protect.
const nextFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));

const items: ContextMenuItem[] = [
  { label: 'Cut', value: 'cut' },
  { label: 'Copy', value: 'copy' },
  { label: 'Paste', value: 'paste', disabled: true }
];

function openViaRightClick(container: HTMLElement): void {
  const target = container.querySelector('.context-menu-container');
  expect(target).not.toBeNull();
  fireEvent.contextMenu(target as Element);
}

// ContextMenu used to answer Escape and an outside click itself, from its own
// `document` listeners added in onMount, with nothing coordinating either
// against a Modal/Sheet/Menu opened on top -- one Escape could reach a
// context menu that was not the topmost surface. These cases exercise its
// adoption of the shared dismissal module (src/lib/_interaction/dismissal.ts)
// against that module's real ownership stack, standing in for a layer like
// Modal/Sheet that this task does not own.
describe('ContextMenu dismissal ownership', () => {
  it('yields Escape to a layer registered after it, and regains ownership once that layer releases', async () => {
    const onclose = vi.fn();
    const { container } = render(ContextMenu, { items, onclose });
    openViaRightClick(container);
    await nextFrame();

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

  it('closes on Escape when it is the only open layer', async () => {
    const onclose = vi.fn();
    const { container } = render(ContextMenu, { items, onclose });
    openViaRightClick(container);
    await nextFrame();

    press('Escape');
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('closes on a pointerdown outside the menu', async () => {
    const onclose = vi.fn();
    const { container } = render(ContextMenu, { items, onclose });
    openViaRightClick(container);
    await nextFrame();

    pointerDownOn(document.body);
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('does not close on a pointerdown inside the menu', async () => {
    const onclose = vi.fn();
    const { container } = render(ContextMenu, { items, onclose });
    openViaRightClick(container);
    await nextFrame();

    const item = container.querySelector('.context-menu-item');
    expect(item).not.toBeNull();
    pointerDownOn(item as Element);
    expect(onclose).not.toHaveBeenCalled();
  });

  // The comment on ContextMenu's old handleDocumentKeydown explains why: for
  // one frame after the right-click the menu is open but focus has not moved
  // into it yet (openMenu's requestAnimationFrame below). A menu-only Escape
  // handler does nothing during that window. The shared module listens on
  // the document too, so this still has to work once it owns Escape instead.
  it('closes on Escape pressed before the open animation frame runs, without throwing', async () => {
    const onclose = vi.fn();
    const { container } = render(ContextMenu, { items, onclose });
    openViaRightClick(container);

    const sharedAnimate = Element.prototype.animate;
    Element.prototype.animate = () => makeCompletingAnimation();
    try {
      press('Escape');
      expect(onclose).toHaveBeenCalledTimes(1);
      // The module's listener sits outside Svelte's own event dispatch, and
      // removal now waits for the out:tokenizedFly outro to finish, not just
      // the next flush -- unlike `onclose`, called synchronously inside
      // close() itself. waitFor gives the completing-animation stub's queued
      // onfinish a turn to run.
      await waitFor(() => {
        expect(container.querySelector('.context-menu-dropdown')).toBeNull();
      });

      // Flushing the now-cancelled frame afterwards must not throw or
      // resurrect the menu / steal focus into it.
      await nextFrame();
      expect(container.querySelector('.context-menu-dropdown')).toBeNull();
    } finally {
      Element.prototype.animate = sharedAnimate;
    }
  });

  it('releases its dismissible layer on unmount while still open, leaving none stale', async () => {
    const { container, unmount } = render(ContextMenu, { items });
    openViaRightClick(container);
    await nextFrame();
    expect(dismissibleLayerCount()).toBeGreaterThan(0);

    unmount();
    expect(dismissibleLayerCount()).toBe(0);
  });
});

describe('ContextMenu focus return', () => {
  it('returns focus to the element that had it before the right-click', async () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const { container } = render(ContextMenu, { items });
    openViaRightClick(container);
    await nextFrame();
    expect(document.activeElement).not.toBe(opener);

    press('Escape');
    expect(document.activeElement).toBe(opener);

    opener.remove();
  });
});

// Regression coverage: item navigation must keep working once Escape/outside
// handling moves off ContextMenu's own document listeners and onto the
// shared module.
describe('ContextMenu keyboard navigation (regression)', () => {
  it('moves focus through selectable items with Home/End, skipping the disabled one', async () => {
    const { container } = render(ContextMenu, { items });
    openViaRightClick(container);
    await nextFrame();

    const menu = container.querySelector('.context-menu-dropdown');
    expect(menu).not.toBeNull();
    const focusable = container.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])');
    expect(focusable.length).toBe(2);

    await fireEvent.keyDown(menu as Element, { key: 'End' });
    expect(document.activeElement).toBe(focusable[focusable.length - 1]);

    await fireEvent.keyDown(menu as Element, { key: 'Home' });
    expect(document.activeElement).toBe(focusable[0]);
  });
});

describe('ContextMenu close idempotency', () => {
  it('a second Escape during the out:tokenizedFly outro does not fire onclose again', async () => {
    // The shared beforeAll stub never completes the outro (see its own comment),
    // so the dropdown -- and its Escape/dismissal wiring -- stays mounted exactly
    // like it would mid-fade with a real animation. A second Escape landing in
    // that window used to re-run close() unconditionally, firing onclose twice
    // for what a consumer sees as a single dismissal.
    const onclose = vi.fn();
    const { container } = render(ContextMenu, { items, onclose });
    openViaRightClick(container);
    await nextFrame();
    expect(container.querySelector('.context-menu-dropdown')).not.toBeNull();

    press('Escape');
    press('Escape');

    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('goes inert the instant it closes, not only once the outro finishes', async () => {
    const { container } = render(ContextMenu, { items });
    openViaRightClick(container);
    await nextFrame();
    const dropdown = container.querySelector('.context-menu-dropdown');
    expect(dropdown).not.toBeNull();
    expect((dropdown as HTMLElement).inert).toBe(false);

    press('Escape');

    await waitFor(() => {
      expect((dropdown as HTMLElement).inert).toBe(true);
    });
  });
});
