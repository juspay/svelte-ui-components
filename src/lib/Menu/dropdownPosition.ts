type Rect = { left: number; right: number; top: number; bottom: number };
type Size = { width: number; height: number };

export type MenuDropdownCorner = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

/**
 * Pure placement for a portaled Menu dropdown. Returns viewport coordinates for
 * a `position: fixed` panel anchored to `container` at the resolved corner,
 * reproducing the in-flow CSS anchoring: `*-left` aligns the panel's left edge
 * to the container's left, `*-right` aligns its right edge to the container's
 * right; `bottom-*` sits below the container, `top-*` above it. A `gap` is added
 * between panel and container, and the result is clamped to a viewport margin.
 */
export function computeMenuDropdownPosition(opts: {
  container: Rect;
  dropdown: Size;
  placement: MenuDropdownCorner;
  gap: number;
  viewport: Size;
  margin?: number;
}): { left: number; top: number } {
  const margin = opts.margin ?? 8;
  const { container, dropdown, placement, gap, viewport } = opts;
  const anchorsRight = placement === 'bottom-right' || placement === 'top-right';
  const anchorsTop = placement === 'top-left' || placement === 'top-right';

  let left = anchorsRight ? container.right - dropdown.width : container.left;
  let top = anchorsTop ? container.top - dropdown.height - gap : container.bottom + gap;

  if (Number.isFinite(viewport.width)) {
    left = Math.max(margin, Math.min(left, viewport.width - dropdown.width - margin));
  }
  if (Number.isFinite(viewport.height)) {
    top = Math.max(margin, Math.min(top, viewport.height - dropdown.height - margin));
  }
  return { left, top };
}
