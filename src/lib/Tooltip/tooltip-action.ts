import type { TooltipActionOptions, TooltipPosition } from './properties';

/**
 * Svelte `use:tooltip` action — renderless alternative to the `<Tooltip>` component.
 *
 * Attaches hover and focus listeners to the host element without injecting any wrapper
 * div, which prevents flex-child sizing breakage inside toolbars and icon rows.
 * The tooltip bubble is mounted directly on `document.body` with `position:fixed`
 * coordinates derived from `getBoundingClientRect`, so it is never clipped by
 * `overflow:hidden` ancestors.
 *
 * Usage:
 * ```svelte
 * <script>
 *   import { tooltip } from '@juspay/svelte-ui-components';
 * </script>
 * <button use:tooltip={{ text: 'Save', position: 'top' }}>💾</button>
 * ```
 */
/** Monotonically-incrementing counter used to generate unique tooltip bubble IDs. */
let tooltipIdCounter = 0;

export const tooltip = (
  node: HTMLElement,
  options: TooltipActionOptions
): { update: (nextOptions: TooltipActionOptions) => void; destroy: () => void } => {
  let currentOptions = { ...options };
  let bubbleEl: HTMLDivElement | null = null;
  let arrowEl: HTMLDivElement | null = null;
  let delayTimer: ReturnType<typeof setTimeout> | null = null;
  const bubbleId = `sui-tooltip-${++tooltipIdCounter}`;

  const OFFSET = 8; // px — matches --tooltip-offset default
  const EDGE_MARGIN = 8; // px — minimum air between the bubble and the viewport edge
  const ARROW_INSET = 9; // px — arrow centre never closer than this to a bubble corner

  const oppositeOf = (side: TooltipPosition): TooltipPosition => {
    if (side === 'top') {
      return 'bottom';
    }
    if (side === 'bottom') {
      return 'top';
    }
    if (side === 'left') {
      return 'right';
    }
    return 'left';
  };

  // min > max (bubble wider/taller than the viewport) degrades to the raw value.
  const clampValue = (value: number, min: number, max: number): number => {
    return max < min ? value : Math.min(Math.max(value, min), max);
  };

  /**
   * Build the bubble and arrow elements and attach them to `document.body`.
   * Inline styles are used to keep the action self-contained — no stylesheet injection.
   * Sets `aria-describedby` on the host node to satisfy the ARIA tooltip pattern,
   * which requires a programmatic association between the trigger and the bubble.
   */
  const createBubble = (): void => {
    if (typeof document === 'undefined') {
      return;
    }
    bubbleEl = document.createElement('div');
    bubbleEl.setAttribute('role', 'tooltip');
    bubbleEl.id = bubbleId;
    node.setAttribute('aria-describedby', bubbleId);
    bubbleEl.style.cssText = [
      'position:fixed',
      `z-index:var(--tooltip-z-index,1000)`,
      `max-width:var(--tooltip-max-width,200px)`,
      `background:var(--tooltip-background,#333333)`,
      `color:var(--tooltip-color,#ffffff)`,
      `font-size:var(--tooltip-font-size,12px)`,
      `font-weight:var(--tooltip-font-weight,400)`,
      `font-family:var(--tooltip-font-family,inherit)`,
      `padding:var(--tooltip-padding,6px 10px)`,
      `border-radius: var(--tooltip-border-radius, var(--radius, 4px))`,
      `border:var(--tooltip-border,none)`,
      `box-shadow:var(--tooltip-box-shadow,0 2px 6px rgba(0,0,0,0.15))`,
      'white-space:normal',
      'word-wrap:break-word',
      'pointer-events:none',
      `transition:opacity var(--tooltip-opacity-duration,0.15s) ease-in-out`
    ].join(';');

    if (typeof currentOptions.classes === 'string' && currentOptions.classes.length > 0) {
      bubbleEl.className = currentOptions.classes;
    }

    arrowEl = document.createElement('div');
    arrowEl.style.cssText = 'position:absolute;width:0;height:0;border-style:solid;';

    const textNode = document.createElement('span');
    textNode.style.cssText = 'color:var(--tooltip-color,#ffffff)';
    textNode.textContent = currentOptions.text;

    bubbleEl.appendChild(arrowEl);
    bubbleEl.appendChild(textNode);
    document.body.appendChild(bubbleEl);
  };

  /**
   * Compute and apply `top`/`left` fixed coordinates plus arrow styles based on the
   * current bounding rect of the host element and the active `position` option.
   *
   * The bubble is measured after mounting and then (1) FLIPPED to the opposite
   * side when the preferred side has no room but the opposite side does, and
   * (2) CLAMPED so it never crosses the viewport edge — a tooltip on a trigger
   * near the screen edge used to spill off-screen or cover the nav beneath it.
   * The arrow is positioned in bubble-local pixels anchored to the TRIGGER
   * centre, so it keeps pointing at the trigger even when the bubble shifts.
   */
  const positionBubble = (): void => {
    if (bubbleEl === null || arrowEl === null) {
      return;
    }

    const rect = node.getBoundingClientRect();
    const preferred: TooltipPosition = currentOptions.position ?? 'top';
    const arrowSize = 5; // px — matches --tooltip-arrow-size default
    const bg = 'var(--tooltip-arrow-color,var(--tooltip-background,#333333))';
    const t = 'transparent';

    // Stubbed DOMs (unit tests) report no dimensions; clamping then no-ops.
    const bubbleWidth = bubbleEl.offsetWidth || 0;
    const bubbleHeight = bubbleEl.offsetHeight || 0;
    const viewportWidth =
      typeof window !== 'undefined' && window.innerWidth > 0
        ? window.innerWidth
        : Number.POSITIVE_INFINITY;
    const viewportHeight =
      typeof window !== 'undefined' && window.innerHeight > 0
        ? window.innerHeight
        : Number.POSITIVE_INFINITY;

    const fits = (side: TooltipPosition): boolean => {
      if (side === 'top') {
        return rect.top - OFFSET - bubbleHeight >= EDGE_MARGIN;
      }
      if (side === 'bottom') {
        return rect.bottom + OFFSET + bubbleHeight <= viewportHeight - EDGE_MARGIN;
      }
      if (side === 'left') {
        return rect.left - OFFSET - bubbleWidth >= EDGE_MARGIN;
      }
      return rect.right + OFFSET + bubbleWidth <= viewportWidth - EDGE_MARGIN;
    };

    const side: TooltipPosition =
      !fits(preferred) && fits(oppositeOf(preferred)) ? oppositeOf(preferred) : preferred;

    let top: number;
    let left: number;
    if (side === 'top' || side === 'bottom') {
      top = side === 'top' ? rect.top - OFFSET - bubbleHeight : rect.bottom + OFFSET;
      left = clampValue(
        rect.left + rect.width / 2 - bubbleWidth / 2,
        EDGE_MARGIN,
        viewportWidth - EDGE_MARGIN - bubbleWidth
      );
    } else {
      left = side === 'left' ? rect.left - OFFSET - bubbleWidth : rect.right + OFFSET;
      top = clampValue(
        rect.top + rect.height / 2 - bubbleHeight / 2,
        EDGE_MARGIN,
        viewportHeight - EDGE_MARGIN - bubbleHeight
      );
    }

    bubbleEl.style.top = `${top}px`;
    bubbleEl.style.left = `${left}px`;
    bubbleEl.style.transform = 'none';

    arrowEl.style.right = '';
    if (side === 'top' || side === 'bottom') {
      const arrowLeft = clampValue(
        rect.left + rect.width / 2 - left,
        ARROW_INSET,
        Math.max(ARROW_INSET, bubbleWidth - ARROW_INSET)
      );
      arrowEl.style.left = `${arrowLeft}px`;
      arrowEl.style.top = side === 'top' ? '100%' : `-${arrowSize}px`;
      arrowEl.style.transform = 'translateX(-50%)';
      arrowEl.style.borderWidth =
        side === 'top'
          ? `${arrowSize}px ${arrowSize}px 0 ${arrowSize}px`
          : `0 ${arrowSize}px ${arrowSize}px ${arrowSize}px`;
      arrowEl.style.borderColor = side === 'top' ? `${bg} ${t} ${t} ${t}` : `${t} ${t} ${bg} ${t}`;
    } else {
      const arrowTop = clampValue(
        rect.top + rect.height / 2 - top,
        ARROW_INSET,
        Math.max(ARROW_INSET, bubbleHeight - ARROW_INSET)
      );
      arrowEl.style.top = `${arrowTop}px`;
      arrowEl.style.left = side === 'left' ? '100%' : `-${arrowSize}px`;
      arrowEl.style.transform = 'translateY(-50%)';
      arrowEl.style.borderWidth =
        side === 'left'
          ? `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`
          : `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`;
      arrowEl.style.borderColor = side === 'left' ? `${t} ${t} ${t} ${bg}` : `${t} ${bg} ${t} ${t}`;
    }
  };

  const show = (): void => {
    // Guard against overlapping events (e.g. mouseenter + focusin firing simultaneously,
    // or two delayed timers both completing) — only one bubble may exist at a time.
    // Also guard when a delay timer is already pending: a second show() call while the
    // first is waiting would schedule a second timer; clearing it first prevents stale
    // timers from re-opening the tooltip after hide() has already run.
    if (bubbleEl !== null || delayTimer !== null) {
      return;
    }

    const doShow = () => {
      // Re-check after the delay: hide() may have been called while the timer was pending.
      if (bubbleEl !== null) {
        return;
      }
      delayTimer = null;
      createBubble();
      positionBubble();
    };

    const delayMs = currentOptions.delay ?? 0;
    if (delayMs > 0) {
      delayTimer = setTimeout(doShow, delayMs);
    } else {
      doShow();
    }
  };

  const hide = (): void => {
    if (delayTimer !== null) {
      clearTimeout(delayTimer);
      delayTimer = null;
    }
    if (bubbleEl !== null) {
      bubbleEl.remove();
      bubbleEl = null;
      arrowEl = null;
      node.removeAttribute('aria-describedby');
    }
  };

  /**
   * Reposition the bubble when the viewport changes (scroll or resize) so the tooltip
   * stays anchored to the trigger element while it is visible.
   */
  const handleReposition = (): void => {
    if (bubbleEl !== null) {
      positionBubble();
    }
  };

  node.addEventListener('mouseenter', show);
  node.addEventListener('mouseleave', hide);
  node.addEventListener('focusin', show);
  node.addEventListener('focusout', hide);

  // Guard window access: Svelte actions run after mount (client-side only), but an
  // explicit check keeps the action safe if it is somehow called during SSR.
  const hasWindow = typeof window !== 'undefined';
  if (hasWindow) {
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
  }

  return {
    update(nextOptions: TooltipActionOptions): void {
      currentOptions = { ...nextOptions };
      // If bubble is currently visible, re-render it with new options.
      if (bubbleEl !== null) {
        hide();
        show();
      }
    },
    destroy(): void {
      hide();
      node.removeEventListener('mouseenter', show);
      node.removeEventListener('mouseleave', hide);
      node.removeEventListener('focusin', show);
      node.removeEventListener('focusout', hide);
      if (hasWindow) {
        window.removeEventListener('resize', handleReposition);
        window.removeEventListener('scroll', handleReposition, true);
      }
    }
  };
};
