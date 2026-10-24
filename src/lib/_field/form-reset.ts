/** Observe native reset in the control's own tree, including shadow-root forms. */
export function watchFormReset(
  control: HTMLInputElement | HTMLTextAreaElement,
  callback: (event: Event) => void,
  getForm: () => HTMLFormElement | null = () => control.form
): () => void {
  const roots = new Set<EventTarget>();
  let alive = true;
  const reset = (event: Event) => {
    if (event.target === getForm()) {
      callback(event);
    }
  };
  const observe = (root: EventTarget) => {
    if (!roots.has(root)) {
      roots.add(root);
      root.addEventListener('reset', reset, true);
    }
  };
  observe(control.ownerDocument);
  const observeShadowRoot = () => {
    if (!alive) {
      return;
    }
    const root = control.getRootNode();
    if (root instanceof ShadowRoot) {
      observe(root);
    }
  };
  observeShadowRoot();
  // Snippet bindings can attach before their fragment enters its final tree.
  queueMicrotask(observeShadowRoot);
  return () => {
    alive = false;
    roots.forEach((root) => root.removeEventListener('reset', reset, true));
    roots.clear();
  };
}
