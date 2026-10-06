<script lang="ts">
  import { onMount } from 'svelte';
  import { prefersReducedMotion } from '../utils';
  import type { ScrollerProperties, ScrollPosition } from './properties';
  import Button from '../Button/Button.svelte';
  import {
    contentElements,
    composedParent,
    hasTabbableContent,
    interactiveElements
  } from '../_interaction/focusable';
  import chevronLeft from '../assets/chevron-left.svg?raw';
  import chevronRight from '../assets/chevron-right.svg?raw';
  import chevronUp from '../assets/chevron-up.svg?raw';
  import chevronDown from '../assets/chevron-down.svg?raw';

  let {
    children,
    direction = 'horizontal',
    scrollAmount,
    showArrows = true,
    showGradient = true,
    dragToScroll = false,
    snapToItem = false,
    hideScrollbar = true,
    hideArrowsOnTouch = true,
    smoothScroll = true,
    testId,
    arrowPrevious,
    arrowNext,
    onscrollposition,
    classes,
    ariaLabel
  }: ScrollerProperties = $props();

  let containerEl: HTMLDivElement | null = $state(null);
  let canScrollPrev = $state(false);
  let canScrollNext = $state(false);
  let isTouchDevice = $state(false);
  let isDragging = $state(false);
  let isOverflowing = $state(false);
  let contentIsTabbable = $state(false);
  let dragStartPos = 0;
  let dragScrollStart = 0;
  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;
  let refreshFrame: number | null = null;
  /** Whether the frame already scheduled must also re-point the observers, not just re-scan. */
  let refreshRebinds = false;

  /** Pixels one arrow-key press scrolls, close to what a browser's own line scroll does. */
  const KEY_SCROLL_STEP = 40;

  /**
   * Attributes whose change can add or remove a Tab stop inside the content. `class` and
   * `style` are here because showing or hiding a control (`display: none`, `visibility`)
   * is almost always done through one of them, and that changes whether Tab can reach it
   * without resizing anything the resize observers watch: a control hidden inside a
   * fixed-width child leaves every box around it exactly as large as before.
   */
  const TAB_ORDER_ATTRIBUTES = [
    'tabindex',
    'disabled',
    'hidden',
    'inert',
    'href',
    'contenteditable',
    'controls',
    'open',
    'class',
    'style'
  ];

  function getScrollProps(el: HTMLElement) {
    if (direction === 'horizontal') {
      return {
        scrollOffset: el.scrollLeft,
        scrollSize: el.scrollWidth,
        clientSize: el.clientWidth
      };
    }
    return {
      scrollOffset: el.scrollTop,
      scrollSize: el.scrollHeight,
      clientSize: el.clientHeight
    };
  }

  function updateScrollState() {
    if (containerEl === null) {
      return;
    }
    const { scrollOffset, scrollSize, clientSize } = getScrollProps(containerEl);
    canScrollPrev = scrollOffset > 1;
    canScrollNext = scrollOffset < scrollSize - clientSize - 1;
    isOverflowing = scrollSize - clientSize > 1;

    if (typeof onscrollposition === 'function') {
      const maxScroll = scrollSize - clientSize;
      const position: ScrollPosition = {
        scrollOffset,
        scrollSize,
        clientSize,
        progress: maxScroll > 0 ? scrollOffset / maxScroll : 0
      };
      onscrollposition(position);
    }
  }

  function scrollBy(delta: number) {
    if (containerEl === null) {
      return;
    }
    const { clientSize } = getScrollProps(containerEl);
    const amount = scrollAmount ?? clientSize;
    const options: ScrollToOptions = {
      behavior: scrollBehavior()
    };
    if (direction === 'horizontal') {
      options.left = delta * amount;
    } else {
      options.top = delta * amount;
    }
    containerEl.scrollBy(options);
  }

  function scrollPrev() {
    scrollBy(-1);
  }

  function scrollNext() {
    scrollBy(1);
  }

  /**
   * Arrow-key scrolling for the scroll region itself, on its own axis only.
   *
   * Browsers scroll a focused overflow element with the arrow keys, but not uniformly
   * across engines and axes: in WebKit 26.4 a focused vertical region did not respond to
   * ArrowUp/ArrowDown at all, and the distance and timing of the ones that do scroll differ.
   * Handling the axis keys here makes the keyboard route do the same thing everywhere.
   * Only the keys for this component's own axis are taken, so the other axis still scrolls
   * the page, and only when the region itself holds focus -- a control inside the content
   * keeps every key it already handles.
   */
  function handleRegionKeydown(event: KeyboardEvent) {
    if (
      containerEl === null ||
      event.target !== containerEl ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }
    const [backwardKey, forwardKey] =
      direction === 'horizontal' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
    if (event.key !== backwardKey && event.key !== forwardKey) {
      return;
    }
    event.preventDefault();
    // A mandatory snap point swallows a 40px nudge -- the region settles back where it
    // started -- so snapping regions move by the same amount the arrow buttons do.
    const { clientSize } = getScrollProps(containerEl);
    const step = snapToItem ? (scrollAmount ?? clientSize) : KEY_SCROLL_STEP;
    const delta = event.key === forwardKey ? step : -step;
    // Immediate, not animated: a smooth scrollBy measures from wherever the previous
    // animation currently is, so held or rapid presses fell short of their total in
    // Firefox (four presses landed at about 115px instead of 160px) while Chromium
    // reached it. A jump keeps the distance exact in every engine, and is also what the
    // OS reduced-motion setting asks for.
    const options: ScrollToOptions = { behavior: 'instant' };
    if (direction === 'horizontal') {
      options.left = delta;
    } else {
      options.top = delta;
    }
    containerEl.scrollBy(options);
  }

  function handleDragStart(event: MouseEvent) {
    if (!dragToScroll || containerEl === null) {
      return;
    }
    isDragging = true;
    dragStartPos = direction === 'horizontal' ? event.clientX : event.clientY;
    dragScrollStart = direction === 'horizontal' ? containerEl.scrollLeft : containerEl.scrollTop;
    containerEl.style.scrollBehavior = 'auto';
    containerEl.style.userSelect = 'none';
  }

  function handleDragMove(event: MouseEvent) {
    if (!isDragging || containerEl === null) {
      return;
    }
    const currentPos = direction === 'horizontal' ? event.clientX : event.clientY;
    const delta = dragStartPos - currentPos;
    if (direction === 'horizontal') {
      containerEl.scrollLeft = dragScrollStart + delta;
    } else {
      containerEl.scrollTop = dragScrollStart + delta;
    }
  }

  /**
   * Whether a scroll should animate.
   *
   * `smoothScroll` is the consumer's preference and the OS setting overrides it, so
   * both are consulted. Deliberately a function called at each use rather than a value
   * captured once: the preference can change while the component is mounted, and the
   * three call sites below run on interaction, not on render.
   *
   * This has to live in script. Two of the three sites are unreachable by any
   * stylesheet -- a `ScrollToOptions.behavior` value is not a style at all, and an
   * inline `style.scrollBehavior` write outranks every rule in this component's own
   * stylesheet, media query included. A `@media (prefers-reduced-motion: reduce)`
   * block here would read correctly in review and lose at runtime.
   *
   * (Written without the style tag spelled out: Svelte scans a script block as raw
   * text looking for its closing tag, and a literal style tag inside a comment here
   * ends that scan early -- the whole component then fails to compile with
   * "`<script>` was left open" pointing at the last line of the file.)
   */
  function scrollBehavior(): ScrollBehavior {
    return smoothScroll && !prefersReducedMotion() ? 'smooth' : 'auto';
  }

  function handleDragEnd() {
    if (!isDragging || containerEl === null) {
      return;
    }
    isDragging = false;
    containerEl.style.scrollBehavior = scrollBehavior();
    containerEl.style.userSelect = '';
  }

  /**
   * Re-points both observers at what the region currently contains. The region's own size
   * is not the only thing that decides overflow: content that grows, shrinks or is swapped
   * changes `scrollWidth` without resizing the region, so each piece of content is watched
   * too. Through `<sui-scroller>` the content is slotted light-DOM markup that a mutation
   * observer on the region cannot see, hence `contentElements` and the per-element
   * subtree observers.
   */
  function observeContent() {
    if (containerEl === null || resizeObserver === null || mutationObserver === null) {
      return;
    }
    resizeObserver.disconnect();
    mutationObserver.disconnect();
    resizeObserver.observe(containerEl);
    mutationObserver.observe(containerEl, { childList: true, subtree: true, characterData: true });
    // An enclosing fieldset can disable the only child control without changing
    // any content box or any attribute inside the region (including slotted WCs).
    for (
      let ancestor = composedParent(containerEl);
      ancestor;
      ancestor = composedParent(ancestor)
    ) {
      mutationObserver.observe(ancestor, {
        attributes: true,
        childList: true,
        attributeFilter: TAB_ORDER_ATTRIBUTES
      });
    }
    for (const element of contentElements(containerEl)) {
      resizeObserver.observe(element);
      mutationObserver.observe(element, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: TAB_ORDER_ATTRIBUTES
      });
    }
    // A stylesheet can hide or show a control with no write to the content and no change to
    // any box above: a class on an ancestor outside this component, a media query. The
    // control itself is the one thing that always changes then -- its box goes to nothing
    // or comes back -- so each one is watched too, including those hidden right now.
    for (const control of interactiveElements(containerEl, { includeHidden: true })) {
      resizeObserver.observe(control);
    }
  }

  /** Whether anything inside the content is reachable with Tab right now. */
  function scanTabbableContent() {
    if (containerEl !== null) {
      contentIsTabbable = hasTabbableContent(containerEl);
    }
  }

  /**
   * Content was added, removed or swapped: re-aim the observers at what is there now,
   * then re-measure and re-scan for Tab stops.
   */
  function refreshContent() {
    if (containerEl === null) {
      return;
    }
    observeContent();
    updateScrollState();
    scanTabbableContent();
  }

  /**
   * Content kept its structure but may have changed size or visibility -- a class or
   * inline style hid or showed a control, a media query flipped, the viewport moved.
   * Re-measures overflow and re-scans Tab stops without re-aiming the observers, which is
   * the expensive part and unnecessary here. Deliberately does not report a scroll position:
   * nothing scrolled, and a content element animating its style would otherwise make
   * `onscrollposition` fire every frame.
   */
  function rescanTabOrder() {
    if (containerEl === null) {
      return;
    }
    const { scrollSize, clientSize } = getScrollProps(containerEl);
    isOverflowing = scrollSize - clientSize > 1;
    scanTabbableContent();
  }

  /** One refresh per frame however many mutations arrive; a structural one wins over a rescan. */
  function scheduleRefresh(rebind: boolean) {
    refreshRebinds ||= rebind;
    if (refreshFrame !== null) {
      return;
    }
    refreshFrame = requestAnimationFrame(() => {
      refreshFrame = null;
      const rebinds = refreshRebinds;
      refreshRebinds = false;
      if (rebinds) {
        refreshContent();
      } else {
        rescanTabOrder();
      }
    });
  }

  const handleSlotChange = () => scheduleRefresh(true);
  // A media query can show or hide a control with no change to the DOM or to any box the
  // observers watch, so a viewport change is its own trigger.
  const handleWindowResize = () => scheduleRefresh(false);

  onMount(() => {
    isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (containerEl !== null) {
      resizeObserver = new ResizeObserver(() => {
        // Content that resizes can fit or overflow, and can also be a control that was
        // hidden and is now back, so a resize re-scans the Tab order as well as the offsets.
        updateScrollState();
        scanTabbableContent();
      });
      mutationObserver = new MutationObserver((records) => {
        scheduleRefresh(records.some((record) => record.type !== 'attributes'));
      });
      refreshContent();
      // Slot assignment changes (a `sui-scroller` whose slotted content is replaced)
      // bubble up from the slot element that the web-component wrapper renders.
      containerEl.addEventListener('slotchange', handleSlotChange);
      window.addEventListener('resize', handleWindowResize);

      if (dragToScroll) {
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
      }
    }
    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      containerEl?.removeEventListener('slotchange', handleSlotChange);
      window.removeEventListener('resize', handleWindowResize);
      if (refreshFrame !== null) {
        cancelAnimationFrame(refreshFrame);
        refreshFrame = null;
      }
      if (dragToScroll) {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      }
    };
  });

  let showArrowControls = $derived(showArrows && !(hideArrowsOnTouch && isTouchDevice));
  let showGradientOverlay = $derived(showGradient && !(hideArrowsOnTouch && isTouchDevice));

  /**
   * The region is a Tab stop only while it is the sole keyboard route to its content:
   * it overflows, no arrow buttons are rendered to scroll it, and nothing inside it is
   * focusable already (focus moving to such a child scrolls it into view by itself).
   * Anything else would add a stop that leads nowhere, or one more stop before the
   * controls that already work.
   */
  let regionIsKeyboardRoute = $derived(isOverflowing && !showArrowControls && !contentIsTabbable);
  // A focusable region must be named; a region the consumer named keeps that name always.
  let regionLabel = $derived(ariaLabel ?? (regionIsKeyboardRoute ? 'Scrollable content' : null));
</script>

<div
  class="scroller {classes ?? ''}"
  class:horizontal={direction === 'horizontal'}
  class:vertical={direction === 'vertical'}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#if showArrowControls && canScrollPrev}
    <div class="arrow arrow-prev">
      <Button
        onclick={scrollPrev}
        ariaLabel="Scroll previous"
        {...typeof testId === 'string' ? { testId: `${testId}-prev` } : {}}
      >
        {#if typeof arrowPrevious === 'function'}
          {@render arrowPrevious()}
        {:else}
          <span class="arrow-icon">
            <!-- eslint-disable svelte/no-at-html-tags -->
            {@html direction === 'horizontal' ? chevronLeft : chevronUp}
          </span>
        {/if}
      </Button>
    </div>
  {/if}

  {#if showGradientOverlay && canScrollPrev}
    <div class="gradient gradient-start"></div>
  {/if}

  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="scroll-container"
    class:hide-scrollbar={hideScrollbar}
    class:snap={snapToItem}
    class:dragging={isDragging}
    bind:this={containerEl}
    onscroll={updateScrollState}
    onmousedown={dragToScroll ? handleDragStart : null}
    onkeydown={handleRegionKeydown}
    role="region"
    aria-label={regionLabel}
    tabindex={regionIsKeyboardRoute ? 0 : -1}
  >
    {@render children()}
  </div>

  {#if showGradientOverlay && canScrollNext}
    <div class="gradient gradient-end"></div>
  {/if}

  {#if showArrowControls && canScrollNext}
    <div class="arrow arrow-next">
      <Button
        onclick={scrollNext}
        ariaLabel="Scroll next"
        {...typeof testId === 'string' ? { testId: `${testId}-next` } : {}}
      >
        {#if typeof arrowNext === 'function'}
          {@render arrowNext()}
        {:else}
          <span class="arrow-icon">
            <!-- eslint-disable svelte/no-at-html-tags -->
            {@html direction === 'horizontal' ? chevronRight : chevronDown}
          </span>
        {/if}
      </Button>
    </div>
  {/if}
</div>

<style>
  .scroller {
    position: relative;
    display: flex;
    width: var(--scroller-width, 100%);
    height: var(--scroller-height, fit-content);
  }

  .scroller.horizontal {
    flex-direction: row;
    align-items: center;
  }

  .scroller.vertical {
    flex-direction: column;
    align-items: stretch;
  }

  .scroll-container {
    flex: 1;
    display: flex;
    overflow: auto;
    gap: var(--scroller-gap, 0px);
    padding: var(--scroller-padding, 0px);
  }

  .scroller.horizontal .scroll-container {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: var(--scroller-scroll-behavior, smooth);
  }

  /* The stylesheet half, for scrolls this component does not initiate -- a wheel,
     a dragged scrollbar, an anchor jump. The script half above covers the three it
     does initiate, and cannot be replaced by this: an inline style write and a
     ScrollToOptions value both outrank or bypass every rule here. */
  @media (prefers-reduced-motion: reduce) {
    .scroller.horizontal .scroll-container,
    .scroller.vertical .scroll-container {
      scroll-behavior: auto;
    }
  }

  .scroller.vertical .scroll-container {
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: var(--scroller-scroll-behavior, smooth);
  }

  .scroll-container.snap {
    scroll-snap-type: var(--scroller-snap-type, x mandatory);
  }

  .scroller.vertical .scroll-container.snap {
    scroll-snap-type: var(--scroller-snap-type, y mandatory);
  }

  .scroll-container.hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scroll-container.hide-scrollbar::-webkit-scrollbar {
    display: none;
  }

  /* Scrollbar tokens, only while a scrollbar is shown. Unset, they must change nothing, and
     a plain declaration cannot manage that: one that resolves to nothing still computes as
     unset, which wipes an inherited scrollbar-color and replaces an earlier rule of zero
     specificity such as `* { scrollbar-width: thin }`. So the pair sits in an anonymous
     layer, where any unlayered rule of the app beats it whatever its specificity, and the
     fallback is revert-layer, which hands the property back to whatever the layers before
     this one (an app's own `@layer base`, then the browser) would have given it. The
     keywords initial and inherit, tried first, restore the browser default but still
     displace that earlier layer. The selector is inside :where() so it adds no specificity.
     Chromium stops applying ::-webkit-scrollbar rules once either property is not auto, so
     setting a token replaces an app's webkit scrollbar styling instead of adding to it. */
  @layer {
    :where(.scroll-container:not(.hide-scrollbar)) {
      scrollbar-width: var(--scroller-scrollbar-width, revert-layer);
      scrollbar-color: var(--scroller-scrollbar-color, revert-layer);
    }
  }

  /* Main-axis alignment token. Unset it must change nothing, so it takes the same route as the
     scrollbar pair: its own anonymous layer and a revert-layer fallback. A plain
     `justify-content: var(--scroller-justify-content, normal)` would outrank an app's
     `.scroll-container { justify-content: center }` and any rule in an earlier layer, both of
     which win today because the library declares nothing here. */
  @layer {
    :where(.scroll-container) {
      justify-content: var(--scroller-justify-content, revert-layer);
    }
  }

  .scroll-container.dragging {
    cursor: grabbing;
  }

  /* :focus-visible so a pointer press on the region does not ring it, while the Tab stop
     it becomes when nothing else can scroll it always does. Inset by default: the ring
     sits inside the region's own box, so it is not cut off by an `overflow: hidden`
     ancestor the way an outset ring would be. */
  .scroll-container:focus-visible {
    outline: var(--scroller-focus-outline, 2px solid #2563eb);
    outline-offset: var(--scroller-focus-outline-offset, -2px);
  }

  .arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    z-index: 1;
    margin: var(--scroller-arrow-margin, 0px);

    --button-width: var(--scroller-arrow-size, 32px);
    --button-height: var(--scroller-arrow-size, 32px);
    --button-border-radius: var(--scroller-arrow-border-radius, 50%);
    --button-color: var(--scroller-arrow-background, #ffffff);
    --button-border: var(--scroller-arrow-border, 1px solid #e0e0e0);
    --button-text-color: var(--scroller-arrow-color, #333333);
    --button-padding: var(--scroller-arrow-padding, 4px);
    --button-box-shadow: var(--scroller-arrow-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.12));
    --button-hover-color: var(--scroller-arrow-hover-background, #f5f5f5);
    --button-hover-text-color: var(
      --scroller-arrow-hover-color,
      var(--scroller-arrow-color, #333333)
    );
  }

  .arrow-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
  }

  .arrow-icon :global(svg) {
    width: var(--scroller-arrow-icon-size, 16px);
    height: var(--scroller-arrow-icon-size, 16px);
  }

  .gradient {
    position: absolute;
    z-index: 1;
    pointer-events: none;
  }

  .scroller.horizontal .gradient {
    top: 0;
    bottom: 0;
    width: var(--scroller-gradient-size, 80px);
  }

  .scroller.horizontal .gradient-start {
    left: var(--scroller-arrow-size, 32px);
    background: var(
      --scroller-gradient-start,
      linear-gradient(
        to right,
        rgba(255, 255, 255, 1) 0%,
        rgba(255, 255, 255, 0.5) 40%,
        rgba(255, 255, 255, 0) 100%
      )
    );
  }

  .scroller.horizontal .gradient-end {
    right: var(--scroller-arrow-size, 32px);
    background: var(
      --scroller-gradient-end,
      linear-gradient(
        to left,
        rgba(255, 255, 255, 1) 0%,
        rgba(255, 255, 255, 0.5) 40%,
        rgba(255, 255, 255, 0) 100%
      )
    );
  }

  .scroller.vertical .gradient {
    left: 0;
    right: 0;
    height: var(--scroller-gradient-size, 80px);
  }

  .scroller.vertical .gradient-start {
    top: var(--scroller-arrow-size, 32px);
    background: var(
      --scroller-gradient-start,
      linear-gradient(
        to bottom,
        rgba(255, 255, 255, 1) 0%,
        rgba(255, 255, 255, 0.5) 40%,
        rgba(255, 255, 255, 0) 100%
      )
    );
  }

  .scroller.vertical .gradient-end {
    bottom: var(--scroller-arrow-size, 32px);
    background: var(
      --scroller-gradient-end,
      linear-gradient(
        to top,
        rgba(255, 255, 255, 1) 0%,
        rgba(255, 255, 255, 0.5) 40%,
        rgba(255, 255, 255, 0) 100%
      )
    );
  }
</style>
