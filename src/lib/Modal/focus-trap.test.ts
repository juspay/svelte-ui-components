/**
 * Unit tests for Modal's focus-trap utility (#529: "no Tab-cycling").
 *
 * Pure logic, no Svelte runtime and no real DOM -- a minimal stub satisfying
 * only the `querySelectorAll(selector).item(i)` / `.length` shape the module
 * actually calls, same approach as tooltip-action.test.ts.
 *
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest';
import { focusEntryPoint, focusTrapTabTarget, getFocusTrapBoundary } from './focus-trap';

type StubFocusable = {
  focus: () => void;
};

function makeFocusable(): StubFocusable {
  return { focus: vi.fn() };
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
});
