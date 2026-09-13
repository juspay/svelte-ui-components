/**
 * Unit tests for the shared focus-trap module (src/lib/_interaction/focus.ts).
 * Migrated from Modal/focus-trap.test.ts once Modal, Sheet and
 * DateRangePicker's independent copies of this logic were consolidated here
 * -- see focus.ts's module docblock for the full history.
 *
 * Pure logic, no Svelte runtime and no real DOM -- a minimal stub satisfying
 * only the `querySelectorAll(selector).item(i)` / `.length` shape the module
 * actually calls, same approach as tooltip-action.test.ts. The gap-fix cases
 * below (hidden/aria-disabled/inert) additionally stub `hasAttribute` /
 * `getAttribute` / `closest` -- the exact three methods `canReceiveFocus`
 * reads -- rather than switching this file to jsdom, so it keeps testing the
 * same pure, mount-free logic the rest of the suite does.
 *
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest';
import { focusEntryPoint, focusTrapTabTarget, getFocusTrapBoundary } from './focus';

type StubFocusable = {
  focus: () => void;
  hasAttribute?: (name: string) => boolean;
  getAttribute?: (name: string) => string | null;
  closest?: (selector: string) => StubFocusable | null;
};

/** A bare candidate with no DOM methods beyond focus() -- the exact shape
 * Modal's original test suite used, kept to prove the gap-fix's duck-typed
 * guard still treats these as ordinary focusable candidates. */
function makeFocusable(): StubFocusable {
  return { focus: vi.fn() };
}

/** A candidate shaped like a real element for the three gap checks: none of
 * them trigger exclusion, unless overridden. */
function makeRealisticCandidate(overrides: Partial<StubFocusable> = {}): StubFocusable {
  return {
    focus: vi.fn(),
    hasAttribute: () => false,
    getAttribute: () => null,
    closest: () => null,
    ...overrides
  };
}

function makeHiddenCandidate(): StubFocusable {
  return makeRealisticCandidate({ hasAttribute: (name) => name === 'hidden' });
}

function makeAriaDisabledCandidate(): StubFocusable {
  return makeRealisticCandidate({
    getAttribute: (name) => (name === 'aria-disabled' ? 'true' : null)
  });
}

function makeInertDescendantCandidate(): StubFocusable {
  const inertAncestor = makeRealisticCandidate();
  return makeRealisticCandidate({
    closest: (selector) => (selector === '[inert]' ? inertAncestor : null)
  });
}

/** A container stub whose querySelectorAll always returns the given elements. */
function makeContainer(elements: readonly StubFocusable[]): ParentNode {
  const list = {
    item: (index: number) => elements[index] ?? null,
    length: elements.length
  };
  return { querySelectorAll: () => list } as unknown as ParentNode;
}

describe('getFocusTrapBoundary', () => {
  it('returns null/null for a null container', () => {
    expect(getFocusTrapBoundary(null)).toEqual({ first: null, last: null });
  });

  it('returns null/null when nothing inside is focusable', () => {
    expect(getFocusTrapBoundary(makeContainer([]))).toEqual({ first: null, last: null });
  });

  it('returns the same element as both first and last when there is exactly one', () => {
    const only = makeFocusable();
    const boundary = getFocusTrapBoundary(makeContainer([only]));
    expect(boundary.first).toBe(only);
    expect(boundary.last).toBe(only);
  });

  it('returns the first and last of several focusable descendants', () => {
    const a = makeFocusable();
    const b = makeFocusable();
    const c = makeFocusable();
    const boundary = getFocusTrapBoundary(makeContainer([a, b, c]));
    expect(boundary.first).toBe(a);
    expect(boundary.last).toBe(c);
  });

  it('skips a candidate hidden via the hidden attribute', () => {
    const hidden = makeHiddenCandidate();
    const visible = makeRealisticCandidate();
    const boundary = getFocusTrapBoundary(makeContainer([hidden, visible]));
    expect(boundary.first).toBe(visible);
    expect(boundary.last).toBe(visible);
  });

  it('skips a candidate carrying aria-disabled="true"', () => {
    const disabled = makeAriaDisabledCandidate();
    const enabled = makeRealisticCandidate();
    const boundary = getFocusTrapBoundary(makeContainer([disabled, enabled]));
    expect(boundary.first).toBe(enabled);
    expect(boundary.last).toBe(enabled);
  });

  it('skips a candidate inside an inert subtree', () => {
    const inertDescendant = makeInertDescendantCandidate();
    const normal = makeRealisticCandidate();
    const boundary = getFocusTrapBoundary(makeContainer([inertDescendant, normal]));
    expect(boundary.first).toBe(normal);
    expect(boundary.last).toBe(normal);
  });

  it('returns null/null rather than throwing when every candidate is filtered out', () => {
    const hidden = makeHiddenCandidate();
    const disabled = makeAriaDisabledCandidate();
    const inertDescendant = makeInertDescendantCandidate();
    expect(() =>
      getFocusTrapBoundary(makeContainer([hidden, disabled, inertDescendant]))
    ).not.toThrow();
    const boundary = getFocusTrapBoundary(makeContainer([hidden, disabled, inertDescendant]));
    expect(boundary).toEqual({ first: null, last: null });
  });

  it('treats a bare stub with no DOM methods as an ordinary candidate (backward compatible)', () => {
    const bare = makeFocusable();
    const boundary = getFocusTrapBoundary(makeContainer([bare]));
    expect(boundary.first).toBe(bare);
    expect(boundary.last).toBe(bare);
  });
});

describe('focusTrapTabTarget', () => {
  it('wraps Tab from the last focusable element back to the first', () => {
    const first = makeFocusable();
    const last = makeFocusable();
    const container = makeContainer([first, last]);

    const target = focusTrapTabTarget({
      container,
      activeElement: last as unknown as Element,
      shiftKey: false
    });

    expect(target).toBe(first);
  });

  it('wraps Shift+Tab from the first focusable element back to the last', () => {
    const first = makeFocusable();
    const last = makeFocusable();
    const container = makeContainer([first, last]);

    const target = focusTrapTabTarget({
      container,
      activeElement: first as unknown as Element,
      shiftKey: true
    });

    expect(target).toBe(last);
  });

  it('treats the last unfiltered candidate as the wrap edge, skipping a trailing hidden one', () => {
    const first = makeFocusable();
    const middle = makeFocusable();
    const trailingHidden = makeHiddenCandidate();
    const container = makeContainer([first, middle, trailingHidden]);

    const target = focusTrapTabTarget({
      container,
      activeElement: middle as unknown as Element,
      shiftKey: false
    });

    expect(target).toBe(first);
  });

  it('leaves the browser default alone when focus is not at an edge', () => {
    const first = makeFocusable();
    const middle = makeFocusable();
    const last = makeFocusable();
    const container = makeContainer([first, middle, last]);

    const target = focusTrapTabTarget({
      container,
      activeElement: middle as unknown as Element,
      shiftKey: false
    });

    expect(target).toBeNull();
  });

  it('does nothing when there is nothing focusable to trap between', () => {
    const target = focusTrapTabTarget({
      container: makeContainer([]),
      activeElement: null,
      shiftKey: false
    });

    expect(target).toBeNull();
  });
});

describe('focusEntryPoint', () => {
  it('focuses the first focusable descendant when there is one', () => {
    const first = makeFocusable();
    const second = makeFocusable();
    const container = makeContainer([first, second]);

    focusEntryPoint(container as unknown as HTMLElement);

    expect(first.focus).toHaveBeenCalledTimes(1);
    expect(second.focus).not.toHaveBeenCalled();
  });

  it('falls back to focusing the container itself when nothing inside is focusable', () => {
    const container = makeContainer([]);
    const focusSpy = vi.fn();
    const containerWithFocus = Object.assign(container, { focus: focusSpy });

    focusEntryPoint(containerWithFocus as unknown as HTMLElement);

    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  it('is a no-op for a null container', () => {
    expect(() => focusEntryPoint(null)).not.toThrow();
  });

  it('skips a hidden first candidate and focuses the next real one', () => {
    const hiddenFirst = makeHiddenCandidate();
    const realSecond = makeRealisticCandidate();
    const container = makeContainer([hiddenFirst, realSecond]);

    focusEntryPoint(container as unknown as HTMLElement);

    expect(hiddenFirst.focus).not.toHaveBeenCalled();
    expect(realSecond.focus).toHaveBeenCalledTimes(1);
  });
});
