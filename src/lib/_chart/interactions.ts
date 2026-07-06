/**
 * Shared pointer-interaction helpers used by the chart components.
 */

export type RelativePointerPosition = { x: number; y: number };

/**
 * Pointer position relative to the top-left corner of `el`, or null when the
 * element is not mounted yet.
 */
export function pointerPositionIn(
  el: HTMLElement | null,
  event: PointerEvent
): RelativePointerPosition | null {
  if (el === null) {
    return null;
  }
  const rect = el.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

/**
 * Touch taps never fire pointerleave, so a tap-opened tooltip would otherwise
 * stay stuck: dismiss when a pointerdown lands outside `containerEl`.
 *
 * Attaches a window listener and returns its cleanup, making it directly
 * usable as an `$effect` body's return value. No-op during SSR.
 */
export function dismissOnOutsidePointerDown(
  containerEl: HTMLElement | null,
  onDismiss: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const dismiss = (event: PointerEvent): void => {
    const target = event.target;
    if (containerEl !== null && !(target instanceof Node && containerEl.contains(target))) {
      onDismiss();
    }
  };
  window.addEventListener('pointerdown', dismiss);
  return () => window.removeEventListener('pointerdown', dismiss);
}
