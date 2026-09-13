import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import Sheet from './Sheet.svelte';
import SheetHarness from './Sheet.test.svelte';
import { fly } from 'svelte/transition';
import { registerDismissible } from '../_interaction/dismissal';

/*
 * Spies on `fly` (wrapping the real implementation, the same shape
 * VoiceOrb.svelte.test.ts uses on orbMath) so the params it is actually
 * called with -- not just the transition's visible effect, which jsdom's
 * stubbed Element.prototype.animate below cannot render -- are directly
 * observable.
 */
vi.mock('svelte/transition', async (importOriginal) => {
  const actual = await importOriginal<typeof import('svelte/transition')>();
  return { ...actual, fly: vi.fn(actual.fly) };
});

const flyMock = vi.mocked(fly);

type ReducedMotionChangeListener = (event: MediaQueryListEvent) => void;

/*
 * reduced-motion.svelte.ts decides, once at import time, whether
 * `window.matchMedia` exists and takes out its one subscription right then --
 * there is no later hook to intercept. `vi.hoisted` is the one thing Vitest
 * moves above every import in this file (per the vi.mock docs), which is what
 * lets this stub be in place before Sheet.svelte's own static import chain --
 * reduced-motion.svelte.ts included -- runs. A `vi.stubGlobal` call at
 * ordinary top level would not run until after those imports already had,
 * same as inside a `beforeAll`.
 */
const reducedMotionMedia = vi.hoisted(() => {
  let matches = false;
  const listeners = new Set<ReducedMotionChangeListener>();
  const fakeMatchMedia = (query: string): MediaQueryList =>
    ({
      matches,
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: ReducedMotionChangeListener): void => {
        listeners.add(listener);
      },
      removeEventListener: (_type: string, listener: ReducedMotionChangeListener): void => {
        listeners.delete(listener);
      },
      addListener: (): void => {},
      removeListener: (): void => {},
      dispatchEvent: (): boolean => false
    }) as MediaQueryList;

  (globalThis as unknown as { matchMedia: typeof fakeMatchMedia }).matchMedia = fakeMatchMedia;

  return {
    emit(next: boolean): void {
      matches = next;
      listeners.forEach((listener) => listener({ matches: next } as MediaQueryListEvent));
    }
  };
});

const press = (key: string): boolean =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

// Sheet opens with transition:fly/fade, and Svelte 5 drives transitions through
// the Web Animations API, which jsdom does not implement. Stubbed here rather
// than in vitest-setup.ts: a global stub would apply to every suite in the repo
// and could hide a real animation fault in a component that is not under test.
beforeAll(() => {
  if (typeof Element.prototype.animate !== 'function') {
    // A test double for the two members Svelte's transition teardown touches.
    // `as unknown as Animation` matches how this repo's other suites stand in
    // for DOM types (tooltip-action.test.ts does the same); spelling out all
    // 21 Animation members would be noise for a stub nothing reads.
    const stub = { cancel: () => {}, finished: Promise.resolve() };
    Element.prototype.animate = () => stub as unknown as Animation;
  }
});

// `content` is a required snippet; Sheet renders it unconditionally.
const content = createRawSnippet(() => ({ render: () => '<p>Sheet body</p>' }));

/*
 * The shared `beforeAll` stub above never invokes the `onfinish` callback
 * Svelte's transition runtime assigns onto its `element.animate(...)` calls
 * (see svelte/internal/client/dom/elements/transitions.js), which is exactly
 * why the file comment above "Sheet dismissal ownership" says the outro never
 * completes and the panel is never removed -- correct for every other suite
 * here, none of which close the same instance and check on it again. The
 * reduced-motion reactivity test below needs the opposite: a real close, so
 * that a genuine second intro (not a reversed, still-in-flight outro) is what
 * picks up the changed preference. This factory produces a completing
 * stand-in, installed only for that one test's duration and restored after,
 * that auto-invokes whatever gets assigned to `onfinish` on a microtask --
 * mimicking a zero-duration animation finishing on its own.
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

// The overlay's accessible name is asserted end-to-end in
// tests/sheet-overlay-a11y.test.ts, which drives the real demo page. These
// cases live here instead because they are only reachable through the Svelte
// prop path: `<sui-sheet overlay-aria-label="">` maps an empty attribute to
// `undefined` before Sheet ever sees it, so the web component cannot express
// "explicitly passed an empty string" at all. Verified rather than assumed —
// the wc spelling of these cases passes with or without the fix.
describe('Sheet overlay accessible name', () => {
  const open = (overlayAriaLabel?: string): HTMLElement => {
    const { container } = render(Sheet, {
      open: true,
      dismissOnOutsideClick: true,
      overlayAriaLabel,
      content
    });
    const overlay = container.querySelector<HTMLElement>('.sheet-overlay');
    expect(overlay).not.toBeNull();
    return overlay as HTMLElement;
  };

  it('falls back to the default name when the override is an empty string', () => {
    // `??` forwards '' — leaving role="button" with aria-label="", announced
    // as an unnamed button. That is the exact defect the conditional role
    // exists to prevent, reintroduced through the override.
    expect(open('').getAttribute('aria-label')).toBe('Close sheet');
  });

  it('falls back when the override is whitespace only', () => {
    expect(open('   ').getAttribute('aria-label')).toBe('Close sheet');
  });

  it('still forwards a real override unchanged', () => {
    expect(open('Fermer').getAttribute('aria-label')).toBe('Fermer');
  });

  it('still uses the default when no override is passed', () => {
    expect(open().getAttribute('aria-label')).toBe('Close sheet');
  });
});

// Sheet's Tab handler previously reimplemented the same selector and edge-wrap
// Modal already had tested (see _interaction/focus.test.ts) -- these cases
// prove the adoption of the shared focusTrapTabTarget preserves that
// behavior for Sheet specifically, since nothing here was covered before.
describe('Sheet focus trap (Tab cycling within the panel)', () => {
  const footerWithOneAction = createRawSnippet(() => ({
    render: () => '<button type="button">Footer action</button>'
  }));

  // scrollLockAction moves initial focus onto the panel itself via
  // tick().then(...) -- awaited here before each test drives its own Tab
  // presses, otherwise that deferred initial-focus microtask can resolve
  // *after* fireEvent.keyDown below and steal focus back onto the panel,
  // which is a race in the test's own setup rather than real product timing
  // (a real Tab keypress cannot happen before the sheet has finished opening).
  // Returns `utils` and `panel` as siblings rather than merging `panel` into
  // `utils` -- testing-library's render result carries a dynamic index
  // signature (for its getByX/queryByX/findByX methods) that a plain
  // `HTMLElement` property collides with under TypeScript, poisoning every
  // getByRole(...) call site's inferred return type back to that signature's
  // broad union instead of the real, specific overload. No explicit return
  // type annotation either: `render` is generic over the component type, so
  // spelling the annotation out as `ReturnType<typeof render>` drops that
  // inference and falls back to render's unconstrained default type
  // parameters, which is a *different, incompatible* RenderResult shape from
  // what the actual `render(Sheet, ...)` call below produces. Leaving the
  // return type to be inferred keeps it tied to the real call.
  async function openSheetAndSettle(props: Record<string, unknown>) {
    const utils = render(Sheet, { open: true, showCloseButton: true, content, ...props });
    const panel = utils.container.querySelector<HTMLElement>('.sheet-panel');
    expect(panel).not.toBeNull();
    await waitFor(() => {
      expect(document.activeElement).toBe(panel);
    });
    return { utils, panel: panel as HTMLElement };
  }

  it('wraps Tab from the last focusable element back to the first', async () => {
    const { utils } = await openSheetAndSettle({ footer: footerWithOneAction });
    const { getByRole } = utils;

    const closeButton = getByRole('button', { name: 'Close' });
    const footerButton = getByRole('button', { name: 'Footer action' });

    footerButton.focus();
    expect(document.activeElement).toBe(footerButton);

    await fireEvent.keyDown(footerButton, { key: 'Tab' });
    expect(document.activeElement).toBe(closeButton);
  });

  it('wraps Shift+Tab from the first focusable element back to the last', async () => {
    const { utils } = await openSheetAndSettle({ footer: footerWithOneAction });
    const { getByRole } = utils;

    const closeButton = getByRole('button', { name: 'Close' });
    const footerButton = getByRole('button', { name: 'Footer action' });

    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);

    await fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(footerButton);
  });

  it('does not move focus when Tab is pressed away from either edge', async () => {
    // createRawSnippet requires the render() callback to return HTML for a
    // single root element, hence the wrapping <div> -- it does not change
    // which elements the trap sees, since querySelectorAll traverses the
    // whole subtree regardless of nesting.
    const footerWithTwoActions = createRawSnippet(() => ({
      render: () =>
        '<div><button type="button">First footer action</button><button type="button">Second footer action</button></div>'
    }));
    const { utils } = await openSheetAndSettle({ footer: footerWithTwoActions });
    const { getByRole } = utils;

    const middleButton = getByRole('button', { name: 'First footer action' });
    middleButton.focus();
    expect(document.activeElement).toBe(middleButton);

    await fireEvent.keyDown(middleButton, { key: 'Tab' });
    // Not an edge -- the trap leaves the key alone (jsdom does not itself move
    // focus on Tab, so this just confirms nothing was force-moved by the handler).
    expect(document.activeElement).toBe(middleButton);
  });

  // Regression coverage for the gap fixed while extracting this logic: a hidden
  // trailing candidate used to still count as "last", so wrapping Tab from it
  // called .focus() on an invisible button -- jsdom (like a real browser) still
  // accepts that focus() call, so without the fix this assertion would find
  // document.activeElement on the hidden button instead of back at Close.
  it('treats a hidden trailing footer action as unreachable, wrapping past it', async () => {
    const footerWithHiddenAction = createRawSnippet(() => ({
      render: () =>
        '<div><button type="button">Footer action</button><button type="button" hidden>Hidden action</button></div>'
    }));
    const { utils } = await openSheetAndSettle({ footer: footerWithHiddenAction });
    const { getByRole, container } = utils;

    const closeButton = getByRole('button', { name: 'Close' });
    const footerButton = getByRole('button', { name: 'Footer action' });
    const hiddenButton = container.querySelector<HTMLElement>('button[hidden]');
    expect(hiddenButton).not.toBeNull();

    footerButton.focus();
    await fireEvent.keyDown(footerButton, { key: 'Tab' });

    expect(document.activeElement).toBe(closeButton);
    expect(document.activeElement).not.toBe(hiddenButton);
  });
});

// Focus restoration on close is asserted in a real browser
// (tests/sheet-focus-restoration.spec.ts) rather than here: Sheet's panel closes
// through transition:fly, and Svelte drives outros with the Web Animations API,
// which jsdom does not implement. With `animate` stubbed the outro never
// completes, so the panel is never removed and the action's `destroy` -- which
// releases the scroll lock and returns focus -- never runs at all. A jsdom test
// of it would be asserting on the stub, not on the component.

// Sheet used to answer Escape itself whenever the keydown reached its own
// handler, with nothing coordinating it against another overlay (a Menu, or
// another Sheet) opened on top. These cases exercise Sheet's adoption of the
// shared dismissal module (src/lib/_interaction/dismissal.ts) against that
// module's real ownership stack, standing in for a layer like Menu/CommandMenu
// that this task does not own. Release-on-close itself is not covered here --
// see the comment above: the outro that would run scrollLockAction's destroy
// never completes in jsdom, so that transition is asserted in the Playwright
// spec instead (deferred).
describe('Sheet dismissal ownership', () => {
  it('yields Escape to a layer registered after it, and regains ownership once that layer releases', async () => {
    const onclose = vi.fn();
    const { container } = render(Sheet, { open: true, content, onclose });
    const panel = container.querySelector<HTMLElement>('.sheet-panel');
    expect(panel).not.toBeNull();
    await waitFor(() => {
      expect(document.activeElement).toBe(panel);
    });

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
});

// Sheet's own demo (src/routes/components/sheet/+page.svelte) keeps one
// instance mounted across many open/close cycles -- `{#if open}` lives
// inside Sheet, not around it, unlike Toast/ModalAnimation -- so `flyParams`
// has to notice a preference the user toggles mid-session rather than
// latching whatever it read on its first evaluation. `reducedMotionMedia`
// (declared with the rest of this file's hoisted setup, above) is the fake
// `matchMedia` reduced-motion.svelte.ts picked up when Sheet was first
// imported; `.emit` fires its `change` event the way a user toggling the OS
// setting would.
describe('Sheet reduced-motion preference reactivity', () => {
  it('reaches an already-mounted Sheet when the OS preference changes between a close and a reopen', async () => {
    const sharedAnimate = Element.prototype.animate;
    Element.prototype.animate = () => makeCompletingAnimation();

    try {
      // SheetHarness owns `open` itself and binds it to Sheet for real
      // (`bind:open`), the same two-way binding Sheet's own demo page uses --
      // unlike driving `open` through testing-library's `rerender`, which
      // would mask this exact bug (see the harness file's own comment).
      const { container, component, getByRole } = render(SheetHarness, { content });
      await waitFor(() => {
        expect(container.querySelector('.sheet-panel')).not.toBeNull();
      });
      // Fresh mount, preference off, default side="right": the un-degraded case.
      expect(flyMock.mock.calls.at(-1)?.[1]).toMatchObject({ x: 400, y: 0 });

      // A real close, through Sheet's own Close button -- an internal write
      // to its bindable `open`, exactly like a user dismissing it.
      await fireEvent.click(getByRole('button', { name: 'Close' }));
      // Wait for the outro to genuinely finish and remove the panel, rather
      // than reopening while it's still in flight -- a reversed, in-progress
      // outro reuses the transition already running instead of starting a
      // fresh intro, which would prove nothing about flyParams recomputing.
      await waitFor(() => {
        expect(container.querySelector('.sheet-panel')).toBeNull();
      });

      // The user flips the OS setting while the sheet is closed.
      reducedMotionMedia.emit(true);

      component.reopen();
      await waitFor(() => {
        expect(container.querySelector('.sheet-panel')).not.toBeNull();
      });

      // Latched (the bug): still { x: 400, y: 0 }, the pre-toggle value. Fixed:
      // the panel degrades to the reduced-motion params on this second open.
      expect(flyMock.mock.calls.at(-1)?.[1]).toMatchObject({ x: 0, y: 0, duration: 300 });
    } finally {
      Element.prototype.animate = sharedAnimate;
    }
  });
});
