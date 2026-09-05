/**
 * Focus-trap utility for Modal (#529). Pure DOM-reading functions, no Svelte
 * runtime dependency, so they can be unit tested without mounting the
 * component -- mirrors the split Tooltip already uses for its action logic
 * (see tooltip-action.test.ts).
 *
 * Modal.svelte owns the event wiring (which key was pressed, calling
 * .focus()); this module owns the two decisions that wiring needs answered:
 * "what are the edges of the tab order in here" and "given where focus is and
 * which way Tab was pressed, should it wrap, and to where".
 */

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type FocusTrapBoundary = {
  readonly first: HTMLElement | null;
  readonly last: HTMLElement | null;
};

/**
 * The first and last focusable descendants of `container`, in DOM order.
 * Both are null when the container is null or holds nothing focusable.
 */
export function getFocusTrapBoundary(container: ParentNode | null): FocusTrapBoundary {
  if (container === null) {
    return { first: null, last: null };
  }
  const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return { first: focusable.item(0), last: focusable.item(focusable.length - 1) };
}

/**
 * Given a Tab/Shift+Tab keydown inside a focus-trapped container, returns the
 * element focus should move to, or null when the default browser behavior
 * (move to the next/previous focusable element) should be left alone.
 *
 * Wrapping only happens exactly at an edge: focus sits on the last focusable
 * element and Tab (not Shift+Tab) was pressed, or focus sits on the first and
 * Shift+Tab was pressed. Anywhere else in the middle of the tab order, the
 * browser's own handling is correct and this returns null.
 */
export function focusTrapTabTarget(params: {
  readonly container: ParentNode | null;
  readonly activeElement: Element | null;
  readonly shiftKey: boolean;
}): HTMLElement | null {
  const { first, last } = getFocusTrapBoundary(params.container);
  if (first === null || last === null) {
    return null;
  }
  const edge = params.shiftKey ? first : last;
  if (params.activeElement !== edge) {
    return null;
  }
  return params.shiftKey ? last : first;
}

/**
 * Moves focus into `container` -- its first focusable descendant, or the
 * container itself as a fallback for a modal with no focusable content (it
 * must carry tabindex="-1" for that fallback to actually take focus). A no-op
 * when the container is null.
 */
export function focusEntryPoint(container: HTMLElement | null): void {
  if (container === null) {
    return;
  }
  const { first } = getFocusTrapBoundary(container);
  (first ?? container).focus();
}
