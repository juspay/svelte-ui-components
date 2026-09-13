type TriggerRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
};

type Size = { width: number; height: number };

/**
 * Which side of the trigger the panel opens on. `'auto'` picks the side that
 * fits, which is what a portaled Select did before `placement` existed and so
 * stays the default when the option is omitted.
 */
export type SelectVerticalPlacement = 'bottom' | 'top' | 'auto';

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
 * the trigger only when it cannot fit below and there is more room above — or
 * unconditionally when `vertical` pins a side — and is clamped horizontally to a
 * viewport margin.
 */
export function computeSelectDropdownPosition(opts: {
  trigger: TriggerRect;
  dropdown: Size;
  viewport: Size;
  align: 'left' | 'right';
  vertical?: SelectVerticalPlacement;
  gap: number;
  margin?: number;
}): SelectDropdownPlacement {
  const margin = opts.margin ?? 8;
  const vertical = opts.vertical ?? 'auto';
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
  /* A pinned side is honoured even where the panel will not fit: the caller
     asked for that side, and silently overriding it is the behaviour
     `placement` exists to escape. Only `'auto'` consults the geometry. */
  const fitsBelow = !(dropdown.height > 0 && spaceBelow < dropdown.height + gap);
  const flippedUp =
    vertical === 'auto' ? !fitsBelow && spaceAbove > spaceBelow : vertical === 'top';
  const unclamped = flippedUp ? trigger.top - gap - dropdown.height : trigger.bottom + gap;
  /* The panel is `position: fixed` when portaled, so whatever a viewport edge
     cuts off cannot be scrolled back into view -- hence clamping at all. The two
     edges are not symmetric, though:

     The top edge is always held. A negative top is unreachable however the side
     was chosen.

     The bottom edge is held only for an auto-resolved side. `'auto'` picks the
     side with more room and can still overflow in a short viewport, where
     pulling the panel up is right. A *pinned* side is the caller overriding the
     fit, and dragging it back would park the panel over the very trigger it was
     pinned below -- the silent override `placement` exists to escape. */
  const bottomLimit = viewport.height - dropdown.height - margin;
  const withinViewport =
    vertical === 'auto' && Number.isFinite(viewport.height)
      ? Math.min(unclamped, bottomLimit)
      : unclamped;
  const top =
    Number.isFinite(viewport.height) && dropdown.height > 0
      ? Math.max(margin, withinViewport)
      : unclamped;

  return { left, top, minWidth, width, flippedUp };
}
