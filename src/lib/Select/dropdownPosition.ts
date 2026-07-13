type TriggerRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
};

type Size = { width: number; height: number };

export type SelectDropdownPlacement = {
  left: number;
  top: number;
  /** Floor width for the panel — always at least the trigger width. */
  minWidth: number;
  /**
   * Explicit width (px) for a left-aligned panel so it matches the trigger,
   * reproducing the in-flow `left:0; right:0` default. `null` for a
   * right-aligned panel, which keeps its content/`max-content` width.
   */
  width: number | null;
  /** True when the panel was flipped above the trigger for lack of room below. */
  flippedUp: boolean;
};

/**
 * Pure placement for a portaled Select dropdown. Coordinates are viewport
 * coordinates for a `position: fixed` panel anchored to `trigger`. Left-aligned
 * panels match the trigger width; right-aligned panels hang leftward from the
 * trigger's right edge using their measured content width. The panel flips above
 * the trigger only when it cannot fit below and there is more room above, and is
 * clamped horizontally to a viewport margin.
 */
export function computeSelectDropdownPosition(opts: {
  trigger: TriggerRect;
  dropdown: Size;
  viewport: Size;
  align: 'left' | 'right';
  gap: number;
  margin?: number;
}): SelectDropdownPlacement {
  const margin = opts.margin ?? 8;
  const { trigger, dropdown, viewport, align, gap } = opts;

  const minWidth = trigger.width;
  const width = align === 'left' ? trigger.width : null;
  const effectiveWidth = Math.max(
    align === 'right' ? dropdown.width : trigger.width,
    trigger.width
  );

  let left = align === 'right' ? trigger.right - effectiveWidth : trigger.left;
  if (Number.isFinite(viewport.width)) {
    const maxLeft = viewport.width - effectiveWidth - margin;
    left = Math.max(margin, Math.min(left, maxLeft));
  }

  const spaceBelow = viewport.height - trigger.bottom;
  const spaceAbove = trigger.top;
  const flippedUp =
    dropdown.height > 0 && spaceBelow < dropdown.height + gap && spaceAbove > spaceBelow;
  const top = flippedUp ? trigger.top - gap - dropdown.height : trigger.bottom + gap;

  return { left, top, minWidth, width, flippedUp };
}
