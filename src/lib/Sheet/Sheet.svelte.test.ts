import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import Sheet from './Sheet.svelte';
import { registerDismissible } from '../_interaction/dismissal';

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
