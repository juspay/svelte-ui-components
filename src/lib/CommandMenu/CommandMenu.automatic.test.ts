import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import CommandMenu from './CommandMenu.svelte';
import CommandMenuQuery from './CommandMenuQuery.test.svelte';
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

describe('CommandMenu query contract', () => {
  it('keeps uncontrolled case-insensitive label search and resets on close', async () => {
    const onquerychange = vi.fn();
    const { getByRole, getAllByRole, container } = await openAndSettle({ onquerychange });
    const input = getByRole('combobox') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'OPEN' } });
    expect(getAllByRole('option').map((item) => item.textContent?.trim())).toEqual(['Open file']);
    expect(onquerychange).toHaveBeenLastCalledWith('OPEN');

    await fireEvent.click(container.querySelector('.command-menu-overlay') as Element);
    expect(onquerychange.mock.calls).toEqual([['OPEN'], ['']]);
    pressCtrlK();
    await waitFor(() => expect(input.value).toBe(''));
    expect(getAllByRole('option')).toHaveLength(2);
  });

  it('accepts external query changes without echoing callbacks and resets stale navigation', async () => {
    const onquerychange = vi.fn();
    const onselect = vi.fn();
    const { getByRole, getAllByRole, rerender } = await openAndSettle({ onquerychange, onselect });
    const input = getByRole('combobox') as HTMLInputElement;
    await fireEvent.keyDown(input, { key: 'ArrowDown' });
    await rerender({ query: 'New' });
    expect(input.value).toBe('New');
    expect(getAllByRole('option')).toHaveLength(1);
    expect(input.getAttribute('aria-activedescendant')).toBe(getByRole('option').id);
    expect(onquerychange).not.toHaveBeenCalled();
    await fireEvent.keyDown(input, { key: 'Enter' });
    expect(onselect).toHaveBeenCalledWith(items[0]);
    expect(onquerychange).toHaveBeenCalledExactlyOnceWith('');
  });

  it('binds query to a caller-generated Ask item and selects it before clearing', async () => {
    const onselect = vi.fn();
    const { getByRole } = render(CommandMenuQuery, { onselect });
    const input = getByRole('combobox');
    await fireEvent.input(input, { target: { value: 'explain declines' } });
    expect(getByRole('status', { name: 'Caller query' }).textContent).toBe('explain declines');
    expect(getByRole('option').textContent).toContain('Ask: explain declines');
    await fireEvent.keyDown(input, { key: 'Enter' });
    expect(onselect).toHaveBeenCalledExactlyOnceWith({
      label: 'Ask: explain declines',
      value: 'ask'
    });
    expect(getByRole('status', { name: 'Caller query' }).textContent).toBe('');
  });

  it('reports the event value before a controlled caller replaces its items', async () => {
    const onquerychange = vi.fn();
    const onselect = vi.fn();
    const { getByRole, rerender } = await openAndSettle({ query: 'New', onquerychange, onselect });
    await fireEvent.input(getByRole('combobox'), { target: { value: 'why?' } });
    expect(onquerychange).toHaveBeenCalledExactlyOnceWith('why?');
    await rerender({ query: 'why?', items: [{ label: 'Ask: why?', value: 'ask' }] });
    await fireEvent.click(getByRole('option'));
    expect(onselect).toHaveBeenCalledWith({ label: 'Ask: why?', value: 'ask' });
  });

  it('skips disabled options, keeps groups, and drops active descendant for empty results', async () => {
    const grouped = [
      { label: 'Open one', value: 'one', group: 'Files' },
      { label: 'Open disabled', value: 'disabled', disabled: true, group: 'Files' },
      { label: 'Open two', value: 'two', group: 'Other' }
    ];
    const { getByRole, container } = await openAndSettle({ items: grouped });
    const input = getByRole('combobox');
    await fireEvent.input(input, { target: { value: 'open' } });
    await fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(getByRole('option', { name: 'Open two' }).getAttribute('aria-selected')).toBe('true');
    expect(container.querySelectorAll('.command-menu-group-heading')).toHaveLength(2);
    await fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(getByRole('option', { name: 'Open one' }).getAttribute('aria-selected')).toBe('true');
    await fireEvent.input(input, { target: { value: 'missing' } });
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('does not select or navigate while IME composition owns Enter/arrows', async () => {
    const onselect = vi.fn();
    const onclose = vi.fn();
    const { getByRole } = await openAndSettle({ onselect, onclose });
    const input = getByRole('combobox');
    await fireEvent.keyDown(input, { key: 'ArrowDown', isComposing: true });
    expect(getByRole('option', { name: 'New file' }).getAttribute('aria-selected')).toBe('true');
    await fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    await fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    expect(onselect).not.toHaveBeenCalled();
    expect(onclose).not.toHaveBeenCalled();
    await fireEvent.keyDown(input, { key: 'Enter' });
    expect(onselect).toHaveBeenCalledExactlyOnceWith(items[0]);
  });
});

describe('CommandMenu global shortcut ownership', () => {
  it('allows a caller to disable shortcuts without consuming host key events', async () => {
    const onclose = vi.fn();
    const { container } = await openAndSettle({ shortcutEnabled: false, onclose });
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(onclose).not.toHaveBeenCalled();
    expect((container.querySelector('.command-menu-dialog') as HTMLElement).inert).toBe(false);
  });

  it('keeps the default shortcut and recognizes uppercase Cmd+K exactly once', async () => {
    const { getByRole } = render(CommandMenu, { items });
    await fireEvent.keyDown(window, { key: 'K', metaKey: true });
    expect(getByRole('dialog', { name: 'Command menu' })).toBeTruthy();
  });

  it.each([{ altKey: true }, { isComposing: true }, { keyCode: 229 }, { repeat: true }])(
    'yields the shortcut with disallowed event state %j',
    async (state) => {
      const { queryByRole } = render(CommandMenu, { items });
      await fireEvent.keyDown(window, { key: 'k', ctrlKey: true, ...state });
      expect(queryByRole('dialog')).toBeNull();
    }
  );

  it('does not handle an already prevented shortcut', async () => {
    const { queryByRole } = render(CommandMenu, { items });
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    event.preventDefault();
    window.dispatchEvent(event);
    await fireEvent.keyUp(window, { key: 'k' });
    expect(queryByRole('dialog')).toBeNull();
  });

  it.each(['dialog', 'alertdialog'])(
    'preserves another %s ownership across a shadow root',
    async (role) => {
      const { queryByRole } = render(CommandMenu, { items });
      const dialog = document.createElement('section');
      dialog.setAttribute('role', role);
      const host = document.createElement('div');
      dialog.append(host);
      const target = document.createElement('input');
      host.attachShadow({ mode: 'open' }).append(target);
      document.body.append(dialog);
      try {
        target.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'k',
            ctrlKey: true,
            bubbles: true,
            composed: true,
            cancelable: true
          })
        );
        await fireEvent.keyUp(window, { key: 'k' });
        expect(queryByRole('dialog', { name: 'Command menu' })).toBeNull();
      } finally {
        dialog.remove();
      }
    }
  );

  it('allows closing its own dialog but yields to a nested dialog', async () => {
    const onclose = vi.fn();
    const { getByRole, container } = await openAndSettle({ onclose });
    const nested = document.createElement('section');
    nested.setAttribute('aria-modal', 'true');
    const target = document.createElement('input');
    nested.append(target);
    container.querySelector('.command-menu-dialog')?.append(nested);
    await fireEvent.keyDown(target, { key: 'k', ctrlKey: true });
    expect(onclose).not.toHaveBeenCalled();
    nested.remove();
    await fireEvent.keyDown(getByRole('combobox'), { key: 'k', ctrlKey: true });
    expect(onclose).toHaveBeenCalledTimes(1);
  });
});
