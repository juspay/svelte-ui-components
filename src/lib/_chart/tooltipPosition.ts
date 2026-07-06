import type { TooltipAnchor } from './types';

type Size = { width: number; height: number };

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
}): { left: number; top: number } {
  const offset = opts.offset ?? 12;
  const { tooltip, container } = opts;
  const maxLeft = container.width - tooltip.width;
  const maxTop = container.height - tooltip.height;

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
    return { left: clamp(left, maxLeft), top: clamp(top, maxTop) };
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
  return { left: clamp(left, maxLeft), top: clamp(top, maxTop) };
}
