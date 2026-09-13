import { eventHitsInside } from '../_interaction/dismissal';
/**
 * Shared pointer-interaction helpers used by the chart components.
 */

export type RelativePointerPosition = { x: number; y: number };

/**
 * Pointer position relative to the top-left corner of `el`, or null when the
 * element is not mounted yet.
 *
 * Takes `MouseEvent` (which `PointerEvent` extends) since it only reads
 * clientX/clientY — that also lets the mouse-only chart components (PieChart,
 * SankeyChart) share this instead of hand-rolling the same formula.
 */
export function pointerPositionIn(
  el: HTMLElement | null,
  event: MouseEvent
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
    // Through the custom-element build this listener sits outside the shadow
    // root the chart renders in, so `event.target` is the host rather than
    // anything the pointer actually hit. See eventHitsInside.
    if (containerEl !== null && !eventHitsInside(containerEl, event)) {
      onDismiss();
    }
  };
  window.addEventListener('pointerdown', dismiss);
  return () => window.removeEventListener('pointerdown', dismiss);
}
