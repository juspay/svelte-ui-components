import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import CommandMenu from './CommandMenu.svelte';
import { dismissibleLayerCount, registerDismissible } from '../_interaction/dismissal';
import type { CommandItem } from './properties';

// CommandMenu's dialog now opens/closes with transition:tokenizedFly (it had
// no transition at all before the motion-token migration), and Svelte 5
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
 * so the outro never completes and the dialog is never removed -- fine for
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

const pressCtrlK = (): boolean =>
  window.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true })
  );

const items: CommandItem[] = [
  { label: 'New file', value: 'new-file' },
  { label: 'Open file', value: 'open-file' }
];

// jsdom implements no layout/scrolling APIs -- scrollIntoView (used by
// ArrowDown/ArrowUp to keep the active option in view) is simply absent, so
// calling it unstubbed throws. Same stub as Select.svelte.test.ts.
let originalScrollIntoView: typeof Element.prototype.scrollIntoView;
let scrollIntoViewMock: Mock<(options?: boolean | ScrollIntoViewOptions) => void>;

beforeEach(() => {
  originalScrollIntoView = Element.prototype.scrollIntoView;
  scrollIntoViewMock = vi.fn((_options?: boolean | ScrollIntoViewOptions) => {});
  Element.prototype.scrollIntoView = scrollIntoViewMock;
});

afterEach(() => {
  document.body.style.overflow = '';
  Element.prototype.scrollIntoView = originalScrollIntoView;
});

async function openAndSettle(props: Record<string, unknown>) {
  const utils = render(CommandMenu, { items, open: true, ...props });
  const input = utils.container.querySelector('.command-menu-input');
  await waitFor(() => {
    expect(document.activeElement).toBe(input);
  });
  return utils;
}

// CommandMenu used to answer Escape itself, from a keydown handler on its own
// overlay, with nothing coordinating it against a Modal/Sheet/Menu opened on
// top of it -- a keydown from a nested overlay would bubble up through this
// one too, closing both. These cases exercise CommandMenu's adoption of the
// shared dismissal module (src/lib/_interaction/dismissal.ts) against that
// module's real ownership stack, standing in for a layer like Modal/Sheet
// that this task does not own.
describe('CommandMenu dismissal ownership', () => {
  it('yields Escape to a layer registered after it, and regains ownership once that layer releases', async () => {
    const onclose = vi.fn();
    await openAndSettle({ onclose });

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
    await openAndSettle({ onclose });

    press('Escape');
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('releases its dismissible layer on unmount while still open, leaving none stale', async () => {
    const { unmount } = await openAndSettle({});
    expect(dismissibleLayerCount()).toBeGreaterThan(0);

    unmount();
    expect(dismissibleLayerCount()).toBe(0);
  });
});

// The Ctrl+K listener is an OPEN shortcut, not a dismissal -- it must keep
// working while the menu is closed, which is exactly when the dismissal
// module has nothing registered for this component at all.
describe('CommandMenu global open shortcut (regression)', () => {
  it('opens the menu on Ctrl+K while it is closed', async () => {
    const { container } = render(CommandMenu, { items });
    expect(container.querySelector('.command-menu-overlay')).toBeNull();

    pressCtrlK();
    await waitFor(() => {
      expect(container.querySelector('.command-menu-overlay')).not.toBeNull();
    });
  });

  it('closes the menu on Ctrl+K again while it is open', async () => {
    const onclose = vi.fn();
    await openAndSettle({ onclose });

    pressCtrlK();
    expect(onclose).toHaveBeenCalledTimes(1);
  });
});

describe('CommandMenu focus return', () => {
  it('returns focus to the opener element on close', async () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    await openAndSettle({});

    const sharedAnimate = Element.prototype.animate;
    Element.prototype.animate = () => makeCompletingAnimation();
    try {
      press('Escape');
      // The module's listener sits outside Svelte's own event dispatch, and
      // scrollLockAction's destroy() (which restores focus) now waits for the
      // out:tokenizedFly outro to finish, not just the next flush -- waitFor
      // gives the completing-animation stub's queued onfinish a turn to run.
      await waitFor(() => {
        expect(document.activeElement).toBe(opener);
      });
    } finally {
      Element.prototype.animate = sharedAnimate;
    }

    opener.remove();
  });
});

// Regression coverage: item navigation and the overlay backdrop click must
// keep working, since scrollLockAction is the action edited to add the
// dismissible layer registration.
describe('CommandMenu behaviour (regression)', () => {
  it('moves the active item with ArrowDown', async () => {
    const { container } = await openAndSettle({});
    const overlay = container.querySelector('.command-menu-overlay');
    expect(overlay).not.toBeNull();

    await fireEvent.keyDown(overlay as Element, { key: 'ArrowDown' });
    const activeItem = container.querySelector('[data-active="true"]');
    expect(activeItem?.textContent).toContain('Open file');
  });

  it('closes on a click on the overlay backdrop', async () => {
    const onclose = vi.fn();
    const { container } = await openAndSettle({ onclose });
    const overlay = container.querySelector('.command-menu-overlay');
    expect(overlay).not.toBeNull();

    await fireEvent.click(overlay as Element);
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('a second Escape during the out:tokenizedFly outro does not fire onclose again', async () => {
    // The shared beforeAll stub never completes the outro (see its own comment),
    // so the dialog -- and its Escape/dismissal wiring -- stays mounted exactly
    // like it would mid-fade with a real animation. A second Escape landing in
    // that window used to re-run close() unconditionally, firing onclose twice
    // for what a consumer sees as a single dismissal.
    const onclose = vi.fn();
    await openAndSettle({ onclose });

    press('Escape');
    press('Escape');

    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('goes inert the instant it closes, not only once the outro finishes', async () => {
    // Checks .command-menu-dialog specifically, not .command-menu-overlay:
    // Svelte stops applying reactive attribute updates to an ancestor once a
    // descendant's own out-transition begins, so only the element actually
    // carrying out:tokenizedFly is guaranteed to keep reflecting `open` live
    // through the outro (see the template's own comment on both bindings).
    const { container } = await openAndSettle({});
    const dialog = container.querySelector('.command-menu-dialog');
    expect(dialog).not.toBeNull();
    expect((dialog as HTMLElement).inert).toBe(false);

    press('Escape');

    await waitFor(() => {
      expect((dialog as HTMLElement).inert).toBe(true);
    });
  });
});
