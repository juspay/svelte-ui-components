<script lang="ts">
  import { mount, unmount, onDestroy } from 'svelte';
  import type { TooltipProperties, TooltipPosition } from './properties';
  import PortalContentRenderer from './PortalContentRenderer.svelte';

  let {
    text,
    position = 'top',
    delay = 0,
    testId,
    classes,
    children,
    icon,
    content,
    usePortal = false
  }: TooltipProperties = $props();

  let visible = $state(false);
  let delayTimeout = $state<ReturnType<typeof setTimeout> | null>(null);

  /** Inline (non-portal) bubble element, measured for viewport-edge clamping. */
  let bubbleEl: HTMLDivElement | null = $state(null);

  /**
   * Cross-axis shift (px) applied to the inline bubble so it stays inside the
   * viewport: horizontal for top/bottom tooltips, vertical for left/right ones.
   * The arrow compensates by the same amount, so it keeps pointing at the trigger.
   */
  let bubbleShift = $state(0);

  /** Minimum gap kept between the bubble and the viewport edge. */
  const VIEWPORT_MARGIN = 8;

  // Once the inline bubble renders, measure its natural position and shift it
  // back inside the viewport if it overflows — near the right screen edge a
  // centred bottom-tooltip otherwise gets clipped and its text is unreadable.
  $effect(() => {
    if (!visible || usePortal || bubbleEl === null || typeof window === 'undefined') {
      bubbleShift = 0;
      return;
    }
    const bubbleRect = bubbleEl.getBoundingClientRect();
    const alreadyShifted = bubbleShift;
    if (position === 'top' || position === 'bottom') {
      const overflowRight =
        bubbleRect.right - alreadyShifted - (window.innerWidth - VIEWPORT_MARGIN);
      const overflowLeft = VIEWPORT_MARGIN - (bubbleRect.left - alreadyShifted);
      bubbleShift = overflowRight > 0 ? -overflowRight : overflowLeft > 0 ? overflowLeft : 0;
    } else {
      const overflowBottom =
        bubbleRect.bottom - alreadyShifted - (window.innerHeight - VIEWPORT_MARGIN);
      const overflowTop = VIEWPORT_MARGIN - (bubbleRect.top - alreadyShifted);
      bubbleShift = overflowBottom > 0 ? -overflowBottom : overflowTop > 0 ? overflowTop : 0;
    }
  });

  /** Reference to the trigger wrapper element, used for `getBoundingClientRect` in portal mode. */
  let containerEl: HTMLDivElement | null = $state(null);

  /**
   * Imperatively managed portal bubble element.
   * Created in `showTooltip` and removed in `hideTooltip` when `usePortal=true`.
   * All styles are applied inline so the element is not subject to Svelte's CSS scoping.
   */
  let portalBubbleEl: HTMLDivElement | null = null;

  /**
   * Mounted Svelte component instance used to render the `content` snippet into the
   * portal bubble. Stored so it can be unmounted when the bubble is removed.
   */
  let portalContentMount: Record<string, unknown> | null = null;

  const computePortalCoords = (
    rect: DOMRect,
    pos: TooltipPosition
  ): { top: number; left: number; transform: string } => {
    const offset = 8; // matches --tooltip-offset default
    if (pos === 'top') {
      return {
        top: rect.top - offset,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, -100%)'
      };
    }
    if (pos === 'bottom') {
      return {
        top: rect.bottom + offset,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, 0)'
      };
    }
    if (pos === 'left') {
      return {
        top: rect.top + rect.height / 2,
        left: rect.left - offset,
        transform: 'translate(-100%, -50%)'
      };
    }
    // right
    return {
      top: rect.top + rect.height / 2,
      left: rect.right + offset,
      transform: 'translate(0, -50%)'
    };
  };

  const computeArrowStyle = (pos: TooltipPosition): string => {
    const arrowSize = 5; // matches --tooltip-arrow-size default
    const bg = 'var(--tooltip-arrow-color,var(--tooltip-background,#333333))';
    const t = 'transparent';
    const base = 'position:absolute;width:0;height:0;border-style:solid;';
    if (pos === 'top') {
      return `${base}top:100%;left:50%;transform:translateX(-50%);border-width:${arrowSize}px ${arrowSize}px 0 ${arrowSize}px;border-color:${bg} ${t} ${t} ${t};`;
    }
    if (pos === 'bottom') {
      return `${base}bottom:100%;left:50%;transform:translateX(-50%);border-width:0 ${arrowSize}px ${arrowSize}px ${arrowSize}px;border-color:${t} ${t} ${bg} ${t};`;
    }
    if (pos === 'left') {
      return `${base}top:50%;left:100%;transform:translateY(-50%);border-width:${arrowSize}px 0 ${arrowSize}px ${arrowSize}px;border-color:${t} ${t} ${t} ${bg};`;
    }
    // right
    return `${base}top:50%;right:100%;transform:translateY(-50%);border-width:${arrowSize}px ${arrowSize}px ${arrowSize}px 0;border-color:${t} ${bg} ${t} ${t};`;
  };

  /**
   * Shifts an appended portal bubble back inside the viewport (cross-axis only)
   * and moves its arrow the opposite way so it still points at the trigger.
   * Margins are used so the shift composes with the centring transform.
   */
  const clampPortalBubble = (bubble: HTMLDivElement, pos: TooltipPosition): void => {
    if (typeof window === 'undefined') {
      return;
    }
    const bubbleRect = bubble.getBoundingClientRect();
    let shiftX = 0;
    let shiftY = 0;
    if (pos === 'top' || pos === 'bottom') {
      if (bubbleRect.right > window.innerWidth - VIEWPORT_MARGIN) {
        shiftX = window.innerWidth - VIEWPORT_MARGIN - bubbleRect.right;
      } else if (bubbleRect.left < VIEWPORT_MARGIN) {
        shiftX = VIEWPORT_MARGIN - bubbleRect.left;
      }
    } else {
      if (bubbleRect.bottom > window.innerHeight - VIEWPORT_MARGIN) {
        shiftY = window.innerHeight - VIEWPORT_MARGIN - bubbleRect.bottom;
      } else if (bubbleRect.top < VIEWPORT_MARGIN) {
        shiftY = VIEWPORT_MARGIN - bubbleRect.top;
      }
    }
    if (shiftX === 0 && shiftY === 0) {
      return;
    }
    bubble.style.marginLeft = `${shiftX}px`;
    bubble.style.marginTop = `${shiftY}px`;
    const arrowEl = bubble.firstElementChild as HTMLElement | null;
    if (arrowEl !== null) {
      if (shiftX !== 0) {
        arrowEl.style.left = `calc(50% - ${shiftX}px)`;
      }
      if (shiftY !== 0) {
        arrowEl.style.top = `calc(50% - ${shiftY}px)`;
      }
    }
  };

  const createPortalBubble = (rect: DOMRect, pos: TooltipPosition): HTMLDivElement | null => {
    if (typeof document === 'undefined') {
      return null;
    }
    const bubble = document.createElement('div');
    bubble.setAttribute('role', 'tooltip');

    const coords = computePortalCoords(rect, pos);
    bubble.style.cssText = [
      `position:fixed`,
      `top:${coords.top}px`,
      `left:${coords.left}px`,
      `transform:${coords.transform}`,
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
      `white-space:normal`,
      `word-wrap:break-word`,
      `pointer-events:none`,
      `transition:opacity var(--tooltip-opacity-duration,0.15s) ease-in-out`
    ].join(';');

    const arrowEl = document.createElement('div');
    arrowEl.style.cssText = computeArrowStyle(pos);
    bubble.appendChild(arrowEl);

    // Render rich `content` snippet when provided; fall back to plain text.
    if (typeof content === 'function') {
      const contentContainer = document.createElement('span');
      bubble.appendChild(contentContainer);
      portalContentMount = mount(PortalContentRenderer, {
        target: contentContainer,
        props: { snippet: content }
      });
    } else {
      const textEl = document.createElement('span');
      textEl.style.cssText = `color:var(--tooltip-color,#ffffff)`;
      textEl.textContent = text;
      bubble.appendChild(textEl);
    }

    return bubble;
  };

  const showTooltip = () => {
    // Guard: if a delay timer is already pending, a second showTooltip() call (e.g. rapid
    // mouseenter + focusin) would schedule another timer. Return early so only one timer
    // is ever pending at a time, preventing stale callbacks from re-showing after hide.
    if (delayTimeout !== null) {
      return;
    }

    const doShow = () => {
      delayTimeout = null;
      visible = true;
      if (usePortal && containerEl !== null && typeof document !== 'undefined') {
        const rect = containerEl.getBoundingClientRect();
        const pos = position;
        // Guard: only one portal bubble may exist at a time (overlapping events protection).
        if (portalBubbleEl !== null) {
          return;
        }
        portalBubbleEl = createPortalBubble(rect, pos);
        if (portalBubbleEl !== null) {
          document.body.appendChild(portalBubbleEl);
          clampPortalBubble(portalBubbleEl, pos);
        }
      }
    };

    if (delay > 0) {
      delayTimeout = setTimeout(doShow, delay);
    } else {
      doShow();
    }
  };

  const hideTooltip = () => {
    if (delayTimeout !== null) {
      clearTimeout(delayTimeout);
      delayTimeout = null;
    }
    visible = false;
    if (portalContentMount !== null) {
      unmount(portalContentMount);
      portalContentMount = null;
    }
    if (portalBubbleEl !== null && typeof document !== 'undefined') {
      portalBubbleEl.remove();
      portalBubbleEl = null;
    }
  };

  // Ensure the portal bubble and any pending delay timer are cleaned up when
  // the component unmounts — prevents orphaned DOM nodes and memory leaks when
  // Tooltip is used in dynamic lists or conditional rendering contexts.
  onDestroy(() => {
    if (delayTimeout !== null) {
      clearTimeout(delayTimeout);
    }
    if (portalContentMount !== null) {
      unmount(portalContentMount);
    }
    if (portalBubbleEl !== null && typeof document !== 'undefined') {
      portalBubbleEl.remove();
    }
  });
</script>

<div
  bind:this={containerEl}
  class="tooltip-container {classes ?? ''}"
  role="none"
  onmouseenter={showTooltip}
  onmouseleave={hideTooltip}
  onfocusin={showTooltip}
  onfocusout={hideTooltip}
  data-pw={testId}
>
  {#if typeof icon === 'function'}
    <span class="tooltip-icon" aria-hidden="true">{@render icon()}</span>
  {/if}
  {@render children()}
  {#if visible && !usePortal}
    <div
      bind:this={bubbleEl}
      class="tooltip-bubble {position}"
      role="tooltip"
      style:--tooltip-shift="{bubbleShift}px"
    >
      <div class="tooltip-arrow"></div>
      {#if typeof content === 'function'}
        {@render content()}
      {:else}
        <span class="tooltip-text">{text}</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .tooltip-container {
    position: relative;
    display: var(--tooltip-container-display, inline-flex);
  }

  .tooltip-icon {
    display: contents;
    color: var(--tooltip-icon-color, currentColor);
  }

  .tooltip-bubble {
    position: absolute;
    z-index: var(--tooltip-z-index, 1000);
    max-width: var(--tooltip-max-width, 200px);
    background: var(--tooltip-background, #333333);
    color: var(--tooltip-color, #ffffff);
    font-size: var(--tooltip-font-size, 12px);
    font-weight: var(--tooltip-font-weight, 400);
    font-family: var(--tooltip-font-family);
    padding: var(--tooltip-padding, 6px 10px);
    border-radius: var(--tooltip-border-radius, var(--radius, 4px));
    border: var(--tooltip-border, none);
    box-shadow: var(--tooltip-box-shadow, 0 2px 6px rgba(0, 0, 0, 0.15));
    white-space: normal;
    word-wrap: break-word;
    pointer-events: none;
    opacity: 1;
    transition: opacity var(--tooltip-opacity-duration, 0.15s) ease-in-out;
  }

  .tooltip-arrow {
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
  }

  /* Top position. --tooltip-shift is the viewport-edge clamp: the bubble slides
     along its cross axis to stay on screen while the arrow compensates the other
     way so it keeps pointing at the trigger. */
  .top {
    bottom: calc(100% + var(--tooltip-offset, 8px));
    left: 50%;
    transform: translateX(calc(-50% + var(--tooltip-shift, 0px)));
  }

  .top .tooltip-arrow {
    top: 100%;
    left: calc(50% - var(--tooltip-shift, 0px));
    transform: translateX(-50%);
    border-width: var(--tooltip-arrow-size, 5px) var(--tooltip-arrow-size, 5px) 0
      var(--tooltip-arrow-size, 5px);
    border-color: var(--tooltip-arrow-color, var(--tooltip-background, #333333)) transparent
      transparent transparent;
  }

  /* Bottom position */
  .bottom {
    top: calc(100% + var(--tooltip-offset, 8px));
    left: 50%;
    transform: translateX(calc(-50% + var(--tooltip-shift, 0px)));
  }

  .bottom .tooltip-arrow {
    bottom: 100%;
    left: calc(50% - var(--tooltip-shift, 0px));
    transform: translateX(-50%);
    border-width: 0 var(--tooltip-arrow-size, 5px) var(--tooltip-arrow-size, 5px)
      var(--tooltip-arrow-size, 5px);
    border-color: transparent transparent
      var(--tooltip-arrow-color, var(--tooltip-background, #333333)) transparent;
  }

  /* Left position */
  .left {
    right: calc(100% + var(--tooltip-offset, 8px));
    top: 50%;
    transform: translateY(calc(-50% + var(--tooltip-shift, 0px)));
  }

  .left .tooltip-arrow {
    left: 100%;
    top: calc(50% - var(--tooltip-shift, 0px));
    transform: translateY(-50%);
    border-width: var(--tooltip-arrow-size, 5px) 0 var(--tooltip-arrow-size, 5px)
      var(--tooltip-arrow-size, 5px);
    border-color: transparent transparent transparent
      var(--tooltip-arrow-color, var(--tooltip-background, #333333));
  }

  /* Right position */
  .right {
    left: calc(100% + var(--tooltip-offset, 8px));
    top: 50%;
    transform: translateY(calc(-50% + var(--tooltip-shift, 0px)));
  }

  .right .tooltip-arrow {
    right: 100%;
    top: calc(50% - var(--tooltip-shift, 0px));
    transform: translateY(-50%);
    border-width: var(--tooltip-arrow-size, 5px) var(--tooltip-arrow-size, 5px)
      var(--tooltip-arrow-size, 5px) 0;
    border-color: transparent var(--tooltip-arrow-color, var(--tooltip-background, #333333))
      transparent transparent;
  }

  .tooltip-text {
    color: var(--tooltip-color, #ffffff);
  }
</style>
