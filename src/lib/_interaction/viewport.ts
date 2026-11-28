/** Position reads can follow nested scroll events without running more than once per frame. */
export function watchViewport(onChange: () => void, coalesce = true): () => void {
  let frame: number | null = null;
  function schedule(): void {
    if (frame !== null) {
      return;
    }
    frame = requestAnimationFrame(() => {
      frame = null;
      onChange();
    });
  }

  const update = coalesce ? schedule : onChange;
  window.addEventListener('scroll', update, { capture: true, passive: true });
  window.addEventListener('resize', update);
  return () => {
    window.removeEventListener('scroll', update, { capture: true });
    window.removeEventListener('resize', update);
    if (frame !== null) {
      cancelAnimationFrame(frame);
    }
  };
}

/** Keep scoped CSS with its shadow root and optionally stay in the dialog's top layer. */
export function viewportPortalTarget(node: Node, withinDialog = false): Node {
  const dialog = withinDialog && node instanceof Element ? node.closest('dialog') : null;
  if (dialog !== null) {
    return dialog;
  }
  const root = node.getRootNode();
  return root instanceof ShadowRoot ? root : document.body;
}
