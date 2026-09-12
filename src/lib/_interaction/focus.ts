/**
 * Shared focus-trap primitives for any `aria-modal="true"` panel -- Modal,
 * Sheet and DateRangePicker each grew their own copy of the same selector
 * plus the same first/last edge-wrap decision. Three copies of one decision
 * is a maintenance hazard (a fix to one silently misses the other two), so
 * this is the single home for it. Originally written for Modal alone
 * (#529: "no Tab-cycling") as `Modal/focus-trap.ts`; moved here once Sheet
 * and DateRangePicker had each reimplemented it independently.
 *
 * Pure DOM-reading functions, no Svelte runtime dependency, so they stay
 * unit testable without mounting a component -- see focus.test.ts, which
 * exercises all of this against plain object stubs.
 *
 * Modal.svelte, Sheet.svelte and DateRangePicker.svelte own the event wiring
 * (which key was pressed, calling `.focus()`); this module owns the two
 * decisions that wiring needs answered: "what are the edges of the tab order
 * in here" and "given where focus is and which way Tab was pressed, should
 * it wrap, and to where".
 *
 * Lives under an underscore-prefixed directory, mirroring `src/lib/_chart/`:
 * this is an implementation detail three components happen to share, not a
 * themed, documented component with a prop/event surface of its own. It has
 * no visual output, no `classes`/`testId` escape hatch, nothing a consumer
 * configures -- there is nothing here that belongs in `src/lib/index.ts` or
 * the web-component build. Promoting it to the public API would freeze one
 * internal decision (exactly which selector, exactly which edge-wrap
 * algorithm) into a contract this library would then have to keep working
 * forever, for consumers who were never meant to reach it directly.
 */

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type FocusTrapBoundary = {
  readonly first: HTMLElement | null;
  readonly last: HTMLElement | null;
};

/**
 * True when `el` can actually take focus. `FOCUSABLE_SELECTOR` alone matches
 * candidates that pass its tag/attribute shape but still cannot receive
 * focus in a real browser: hidden via the `hidden` attribute, inside an
 * `inert` subtree, or explicitly marked `aria-disabled="true"`. Without this,
 * Tab wrapping can land focus on one of these -- worse than no trap at all,
 * since focus then effectively vanishes instead of just not being managed.
 *
 * Duck-typed rather than an `instanceof HTMLElement` check: this module is
 * also exercised against plain `{ focus() {} }` stubs that carry none of
 * these methods (see focus.test.ts, and Modal's original test suite that
 * predates this filter) -- a stub with nothing to check on has nothing to
 * filter out, so it passes through unchanged rather than throwing.
 *
 * Deliberately does not consult layout (`offsetParent`, `getClientRects`):
 * jsdom, which the test suite runs under, never computes layout, so a
 * layout-based check would either be a permanent no-op there or -- worse --
 * report every element as non-focusable and empty out every boundary under
 * test. The three checks below are all attribute/tree-shape reads, which
 * jsdom does support, so behavior under test matches behavior in a browser.
 */
function canReceiveFocus(el: HTMLElement): boolean {
  if (
    typeof el.hasAttribute !== 'function' ||
    typeof el.getAttribute !== 'function' ||
    typeof el.closest !== 'function'
  ) {
    return true;
  }
  if (el.hasAttribute('hidden')) {
    return false;
  }
  if (el.getAttribute('aria-disabled') === 'true') {
    return false;
  }
  return el.closest('[inert]') === null;
}

function collectFocusableCandidates(container: ParentNode): HTMLElement[] {
  const matches = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  const candidates: HTMLElement[] = [];
  for (let index = 0; index < matches.length; index += 1) {
    const candidate = matches.item(index);
    if (canReceiveFocus(candidate)) {
      candidates.push(candidate);
    }
  }
  return candidates;
}

/**
 * The first and last focusable descendants of `container`, in DOM order,
 * filtered to elements that can actually receive focus (see
 * `canReceiveFocus`). Both are null when the container is null or holds
 * nothing focusable.
 */
export function getFocusTrapBoundary(container: ParentNode | null): FocusTrapBoundary {
  if (container === null) {
    return { first: null, last: null };
  }
  const candidates = collectFocusableCandidates(container);
  return {
    first: candidates.length > 0 ? candidates[0] : null,
    last: candidates.length > 0 ? candidates[candidates.length - 1] : null
  };
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
 * container itself as a fallback for a panel with no focusable content (it
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

/**
 * The element that really has focus, whether `node` sits in the light DOM or
 * inside a custom element's open shadow root.
 *
 * `document.activeElement` stops at a shadow boundary and reports the shadow HOST,
 * never the element focused inside it, so a component that reads it directly gets
 * the wrong answer through the `sui-*` builds while looking correct in the Svelte
 * one. `getRootNode()` returns the shadow root when the node is shadow-hosted and
 * the owner document otherwise, and both expose `activeElement`.
 */
export function getActiveElement(node: Node | null): Element | null {
  if (node === null) {
    return null;
  }
  const root = node.getRootNode();
  return root instanceof Document || root instanceof ShadowRoot ? root.activeElement : null;
}
