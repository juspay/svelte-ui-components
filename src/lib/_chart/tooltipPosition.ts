import type { TooltipAnchor } from './types';

type Size = { width: number; height: number };
type Rect = Size & { left: number; top: number };

const clamp = (value: number, max: number): number =>
  Math.max(0, Number.isFinite(max) ? Math.min(value, max) : value);

/**
 * Pure tooltip placement: anchor mode positions relative to a data point with
 * side-flipping; cursor mode follows the pointer with flip-then-clamp on both
 * axes. All coordinates are relative to the positioned container.
 */
export function computeTooltipPosition(opts: {
  mouseX?: number;
  mouseY?: number;
  anchor?: TooltipAnchor | null;
  tooltip: Size;
  container: Size;
  offset?: number;
  /** Painted label plates in the same coordinate space as the anchor. */
  avoidRects?: Rect[];
}): { left: number; top: number } {
  const offset = opts.offset ?? 12;
  const { tooltip, container } = opts;
  const maxLeft = container.width - tooltip.width;
  const maxTop = container.height - tooltip.height;

  const finish = (left: number, top: number) => {
    const preferred = { left: clamp(left, maxLeft), top: clamp(top, maxTop) };
    const labels = opts.avoidRects ?? [];
    const clear = (p: { left: number; top: number }) =>
      labels.every(
        (r) =>
          p.left + tooltip.width <= r.left ||
          p.left >= r.left + r.width ||
          p.top + tooltip.height <= r.top ||
          p.top >= r.top + r.height
      );
    if (clear(preferred)) {
      return preferred;
    }
    // Keep labels visible when the usual point/cursor offset intersects them.
    // Try the nearby edges first, including combinations for crowded plots.
    const candidates: Array<{ left: number; top: number }> = [];
    for (const r of labels) {
      const xs = [preferred.left, r.left - tooltip.width - offset, r.left + r.width + offset];
      const ys = [preferred.top, r.top - tooltip.height - offset, r.top + r.height + offset];
      for (const x of xs) {
        for (const y of ys) {
          if (x >= 0 && y >= 0 && x <= maxLeft && y <= maxTop) {
            candidates.push({ left: x, top: y });
          }
        }
      }
    }
    const distance = (p: { left: number; top: number }) =>
      (p.left - preferred.left) ** 2 + (p.top - preferred.top) ** 2;
    candidates.sort((a, b) => distance(a) - distance(b));
    return candidates.find(clear) ?? preferred;
  };

  const a = opts.anchor ?? null;
  if (a !== null) {
    let left: number;
    let top: number;
    if (a.side === 'top' || a.side === 'bottom') {
      left = a.x - tooltip.width / 2;
      top = a.side === 'top' ? a.y - tooltip.height - offset : a.y + offset;
      if (a.side === 'top' && top < 0) {
        top = a.y + offset;
      } else if (a.side === 'bottom' && top > maxTop) {
        top = a.y - tooltip.height - offset;
      }
    } else {
      top = a.y - tooltip.height / 2;
      left = a.side === 'right' ? a.x + offset : a.x - tooltip.width - offset;
      if (a.side === 'right' && left > maxLeft) {
        left = a.x - tooltip.width - offset;
      } else if (a.side === 'left' && left < 0) {
        left = a.x + offset;
      }
    }
    return finish(left, top);
  }

  const mouseX = opts.mouseX ?? 0;
  const mouseY = opts.mouseY ?? 0;
  let left = mouseX + offset;
  if (left + tooltip.width > container.width) {
    left = mouseX - tooltip.width - offset;
  }
  let top = mouseY - offset;
  if (top + tooltip.height > container.height) {
    top = mouseY - tooltip.height - offset;
  }
  return finish(left, top);
}
