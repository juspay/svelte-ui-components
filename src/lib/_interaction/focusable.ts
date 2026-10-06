/**
 * Finds interactive elements the way a keyboard user meets them: through `<slot>`
 * projection and into open shadow roots.
 *
 * `querySelector` cannot do either. Inside a `sui-*` element the content a consumer
 * slotted in lives in the light DOM, so a query rooted in the shadow tree never sees
 * it; and a control rendered by a nested `sui-*` element sits one shadow root further
 * down. Menu needs this to return focus to a slotted trigger, and Scroller needs it to
 * decide whether its content already offers a Tab stop. Both answered "none" through the
 * custom-element build while answering correctly in the Svelte one.
 *
 * Pure DOM reads with no Svelte dependency, so it stays unit-testable under jsdom --
 * which is also why visibility uses `checkVisibility` only when the engine has it
 * rather than layout measurements jsdom cannot provide.
 */

const NATIVE_CONTROL_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  'audio[controls]',
  'video[controls]',
  'iframe',
  '[contenteditable=""]',
  '[contenteditable="true"]'
].join(', ');

export type FindInteractiveOptions = {
  /** Also test `root` itself, not only what it contains. */
  readonly includeRoot?: boolean;
  /**
   * Only elements a Tab press reaches. Off by default so a control carrying
   * `tabindex="-1"` still counts as somewhere focus can be put programmatically.
   */
  readonly tabbableOnly?: boolean;
  /**
   * Also yield elements that are not rendered right now (`display: none`, `hidden`, inert).
   * For a caller that wants to be told when one of them is shown or hidden again.
   */
  readonly includeHidden?: boolean;
};

/** Inert applies through shadow hosts and slot projection, beyond `closest()`'s tree. */
export function composedParent(el: Element): Element | null {
  const slot = el instanceof HTMLElement || el instanceof SVGElement ? el.assignedSlot : null;
  if (slot !== null) {
    return slot;
  }
  const root = el.getRootNode();
  return el.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
}

function isRendered(el: Element): boolean {
  if (el.hasAttribute('hidden')) {
    return false;
  }
  for (let ancestor: Element | null = el; ancestor !== null; ancestor = composedParent(ancestor)) {
    if (ancestor.hasAttribute('inert')) {
      return false;
    }
  }
  return typeof el.checkVisibility === 'function'
    ? el.checkVisibility({ visibilityProperty: true })
    : true;
}

function interactiveElement(
  el: Element,
  tabbableOnly: boolean,
  includeHidden: boolean
): HTMLElement | null {
  if (!(el instanceof HTMLElement)) {
    return null;
  }
  // Native disabledness includes a disabled fieldset, except its first legend.
  // Neither the own `disabled` property nor authored tabindex describes that
  // inherited state. The browser's predicate also handles the legend exception.
  if (el.matches(':disabled')) {
    return null;
  }
  const tabbable = el.tabIndex >= 0;
  // A native control keeps `tabindex="-1"` focusable from script. A bare `[tabindex]`
  // is only a control because of that attribute, so a negative value takes it out.
  const interactive = el.matches(NATIVE_CONTROL_SELECTOR)
    ? !tabbableOnly || tabbable
    : el.hasAttribute('tabindex') && tabbable;
  return interactive && (includeHidden || isRendered(el)) ? el : null;
}

function* childrenOf(node: Element | ShadowRoot | DocumentFragment): Generator<Element> {
  if (node instanceof HTMLSlotElement) {
    const assigned = node.assignedElements({ flatten: true });
    // An unassigned slot renders its fallback content, which is its own children.
    yield* assigned.length > 0 ? assigned : Array.from(node.children);
    return;
  }
  yield* Array.from(node.children);
}

/**
 * What an element renders inside itself: its shadow tree when it hosts one, otherwise
 * its own children. A host's light children are not rendered directly -- they appear
 * wherever the shadow tree's `<slot>`s place them, which `childrenOf` resolves -- so
 * walking the shadow tree alone visits each of them once and in the order they render.
 */
function renderedTreeOf(
  node: Element | ShadowRoot | DocumentFragment
): Element | ShadowRoot | DocumentFragment {
  return node instanceof Element && node.shadowRoot !== null ? node.shadowRoot : node;
}

function* walk(node: Element | ShadowRoot | DocumentFragment): Generator<Element> {
  for (const child of childrenOf(node)) {
    yield child;
    yield* walk(renderedTreeOf(child));
  }
}

/**
 * Every interactive element at or below `root`, in tree order. When `root` is itself a
 * host, that includes the controls its own shadow tree renders -- the case of a
 * `<sui-button>` handed over as a trigger.
 */
export function* interactiveElements(
  root: Element | ShadowRoot | DocumentFragment,
  options: FindInteractiveOptions = {}
): Generator<HTMLElement> {
  const tabbableOnly = options.tabbableOnly === true;
  const includeHidden = options.includeHidden === true;
  if (options.includeRoot === true && root instanceof Element) {
    const self = interactiveElement(root, tabbableOnly, includeHidden);
    if (self !== null) {
      yield self;
    }
  }
  for (const el of walk(renderedTreeOf(root))) {
    const found = interactiveElement(el, tabbableOnly, includeHidden);
    if (found !== null) {
      yield found;
    }
  }
}

/** The first interactive element at or below `root` in tree order, or `null`. */
export function findInteractive(
  root: Element | ShadowRoot | DocumentFragment,
  options: FindInteractiveOptions = {}
): HTMLElement | null {
  const first = interactiveElements(root, options).next();
  return first.done === true ? null : first.value;
}

/** Whether anything beneath `root` is reachable with Tab. */
export function hasTabbableContent(root: Element | ShadowRoot | DocumentFragment): boolean {
  return findInteractive(root, { tabbableOnly: true }) !== null;
}

/**
 * The direct content of `root` as the layout sees it: a `<slot>` stands in for the
 * elements assigned to it. These are the nodes whose size and attributes decide whether
 * `root`'s scrollable area, or its Tab order, changes.
 */
export function contentElements(root: Element): Element[] {
  const out: Element[] = [];
  for (const child of Array.from(root.children)) {
    if (child instanceof HTMLSlotElement) {
      out.push(...childrenOf(child));
    } else {
      out.push(child);
    }
  }
  return out;
}
