/**
 * Who owns a dismissal, when several overlays are open at once.
 *
 * Before this module each overlay listened wherever suited it: Modal on the
 * window, Sheet only on its own overlay element, Menu and ContextMenu on the
 * document, CommandMenu on the window again. Nothing coordinated them, so one
 * Escape reached every listener and a menu opened inside a modal closed both --
 * the menu the user meant, and the modal behind it they did not.
 *
 * Ownership here is an explicit registration order, not something inferred from
 * DOM nesting. Nesting is the wrong signal: a portaled dropdown is a sibling of
 * the modal it visually sits inside, and a menu anchored in the light DOM is not
 * a descendant of the shadow root that opened it. What actually decides which
 * overlay a dismissal belongs to is which one opened last, and only the overlay
 * itself knows when that happened -- so it says so, and says so again when it
 * closes.
 *
 * Registration returns its own release function rather than exposing the stack,
 * so a layer can only ever remove itself, and removal from the middle is safe:
 * an overlay that closes underneath another leaves the one above it topmost.
 */

export type DismissibleLayer = {
  /**
   * What counts as "inside" this layer, read at event time rather than captured
   * at registration -- the element frequently does not exist yet when a layer
   * registers, and can be replaced while it stays open.
   */
  readonly element: () => Node | null;
  /** Escape was pressed while this layer was topmost. */
  readonly onEscape?: () => void;
  /** A pointer went down outside this layer while it was topmost. */
  readonly onOutside?: (event: Event) => void;
};

const stack: DismissibleLayer[] = [];

function topmost(): DismissibleLayer | null {
  return stack.length === 0 ? null : stack[stack.length - 1];
}

/**
 * Whether the event started inside `node`. Uses the composed path so a press
 * inside a `sui-*` element's shadow root still counts as inside: `event.target`
 * is retargeted to the shadow host by the time a document listener sees it,
 * which would report every press inside a custom element as an outside click.
 */
function startedInside(event: Event, node: Node | null): boolean {
  return eventHitsInside(node, event);
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') {
    return;
  }
  topmost()?.onEscape?.();
}

function handlePointerdown(event: Event): void {
  const layer = topmost();
  if (layer === null || startedInside(event, layer.element())) {
    return;
  }
  layer.onOutside?.(event);
}

// Capture phase, so the owning layer is decided before any component's own
// handlers run and before a click can be swallowed by something in between.
const LISTENER_OPTIONS = { capture: true } as const;

function setListeners(attach: boolean): void {
  if (typeof document === 'undefined') {
    return;
  }
  const apply = attach
    ? document.addEventListener.bind(document)
    : document.removeEventListener.bind(document);
  apply('keydown', handleKeydown, LISTENER_OPTIONS);
  apply('pointerdown', handlePointerdown, LISTENER_OPTIONS);
}

/**
 * Registers `layer` as the topmost dismissible surface and returns the function
 * that removes it again. Calling that function more than once is harmless.
 */
export function registerDismissible(layer: DismissibleLayer): () => void {
  stack.push(layer);
  if (stack.length === 1) {
    setListeners(true);
  }
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    const index = stack.lastIndexOf(layer);
    if (index !== -1) {
      stack.splice(index, 1);
    }
    if (stack.length === 0) {
      setListeners(false);
    }
  };
}

/** How many layers are currently registered. Exists for tests and diagnostics. */
export function dismissibleLayerCount(): number {
  return stack.length;
}

/**
 * Does this event's journey pass through `container`?
 *
 * `container.contains(event.target)` is the obvious test and it is wrong the
 * moment a shadow boundary is involved. Once an event crosses one, `target` is
 * retargeted to the HOST element -- an ANCESTOR of everything in the shadow
 * root -- so `contains()` returns false for a click on the container itself.
 * An outside-click handler written that way treats every click as outside and
 * closes the panel on the same click that opened it.
 *
 * `composedPath()` is unaffected: it lists every node the event actually
 * travelled through, inside shadow roots included. The `contains` fallback is
 * for a synthetic event with no composed path, which is the only case where the
 * retargeting problem cannot arise.
 */
export function eventHitsInside(container: Node | null, event: Event): boolean {
  if (container === null) {
    return false;
  }
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  if (path.length > 0) {
    return path.includes(container);
  }
  const target = event.target;
  return target instanceof Node && container.contains(target);
}

/**
 * The element the user actually acted on, not the one the DOM admits to.
 *
 * A listener on `document` sees `event.target` retargeted to the shadow HOST,
 * so `target.closest(selector)` walks the light tree and never sees the node
 * that was clicked. `composedPath()[0]` is the real innermost target, and
 * walking the path is the shadow-safe form of `closest()` -- the path already
 * spans every root the event crossed, so an ancestor search over it finds
 * matches inside the shadow tree and outside it in one pass.
 */
export function closestInEventPath(event: Event, selector: string): Element | null {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  if (path.length === 0) {
    const target = event.target;
    return target instanceof Element ? target.closest(selector) : null;
  }
  for (const node of path) {
    if (node instanceof Element && node.matches(selector)) {
      return node;
    }
  }
  return null;
}
