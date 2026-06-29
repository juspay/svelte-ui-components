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

  type PositionCoords = {
    top: number;
    left: number;
    transform: string;
    arrowTop: string;
    arrowLeft: string;
    arrowRight: string;
    arrowTransform: string;
    arrowBorderWidth: string;
    arrowBorderColor: string;
  };

  const computeCoords = (rect: DOMRect, pos: TooltipPosition): PositionCoords => {
    const arrowSize = 5; // px — matches --tooltip-arrow-size default
    const bg = 'var(--tooltip-arrow-color,var(--tooltip-background,#333333))';
    const t = 'transparent';

    if (pos === 'top') {
      return {
        top: rect.top - OFFSET,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, -100%)',
        arrowTop: '100%',
        arrowLeft: '50%',
        arrowRight: '',
        arrowTransform: 'translateX(-50%)',
        arrowBorderWidth: `${arrowSize}px ${arrowSize}px 0 ${arrowSize}px`,
        arrowBorderColor: `${bg} ${t} ${t} ${t}`
      };
    }
    if (pos === 'bottom') {
      return {
        top: rect.bottom + OFFSET,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, 0)',
        arrowTop: `-${arrowSize}px`,
        arrowLeft: '50%',
        arrowRight: '',
        arrowTransform: 'translateX(-50%)',
        arrowBorderWidth: `0 ${arrowSize}px ${arrowSize}px ${arrowSize}px`,
        arrowBorderColor: `${t} ${t} ${bg} ${t}`
      };
    }
    if (pos === 'left') {
      return {
        top: rect.top + rect.height / 2,
        left: rect.left - OFFSET,
        transform: 'translate(-100%, -50%)',
        arrowTop: '50%',
        arrowLeft: '100%',
        arrowRight: '',
        arrowTransform: 'translateY(-50%)',
        arrowBorderWidth: `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`,
        arrowBorderColor: `${t} ${t} ${t} ${bg}`
      };
    }
    // right
    return {
      top: rect.top + rect.height / 2,
      left: rect.right + OFFSET,
      transform: 'translate(0, -50%)',
      arrowTop: '50%',
      arrowLeft: '',
      arrowRight: `${arrowSize}px`,
      arrowTransform: 'translateY(-50%)',
      arrowBorderWidth: `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`,
      arrowBorderColor: `${t} ${bg} ${t} ${t}`
    };
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
   */
  const positionBubble = (): void => {
    if (bubbleEl === null || arrowEl === null) {
      return;
    }

    const rect = node.getBoundingClientRect();
    const pos: TooltipPosition = currentOptions.position ?? 'top';
    const coords = computeCoords(rect, pos);

    bubbleEl.style.top = `${coords.top}px`;
    bubbleEl.style.left = `${coords.left}px`;
    bubbleEl.style.transform = coords.transform;

    arrowEl.style.top = coords.arrowTop;
    arrowEl.style.left = coords.arrowLeft;
    if (coords.arrowRight !== '') {
      arrowEl.style.right = coords.arrowRight;
    }
    arrowEl.style.transform = coords.arrowTransform;
    arrowEl.style.borderWidth = coords.arrowBorderWidth;
    arrowEl.style.borderColor = coords.arrowBorderColor;
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
