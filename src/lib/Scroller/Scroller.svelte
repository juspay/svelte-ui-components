<script lang="ts">
  import { onMount } from 'svelte';
  import type { ScrollerProperties, ScrollPosition } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';
  import Button from '../Button/Button.svelte';
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
    onscrollposition: onscrollpositionProp,
    onScrollPosition,
    classes
  }: ScrollerProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onscrollposition = $derived(
    resolveDeprecatedProp(
      'Scroller',
      'onScrollPosition',
      'onscrollposition',
      onScrollPosition,
      onscrollpositionProp
    )
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(onscrollposition);
  });

  let containerEl: HTMLDivElement | null = $state(null);
  let canScrollPrev = $state(false);
  let canScrollNext = $state(false);
  let isTouchDevice = $state(false);
  let isDragging = $state(false);
  let dragStartPos = 0;
  let dragScrollStart = 0;
  let resizeObserver: ResizeObserver | null = null;

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
      behavior: smoothScroll ? 'smooth' : 'auto'
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

  function handleDragEnd() {
    if (!isDragging || containerEl === null) {
      return;
    }
    isDragging = false;
    containerEl.style.scrollBehavior = smoothScroll ? 'smooth' : 'auto';
    containerEl.style.userSelect = '';
  }

  onMount(() => {
    isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (containerEl !== null) {
      updateScrollState();
      resizeObserver = new ResizeObserver(() => {
        updateScrollState();
      });
      resizeObserver.observe(containerEl);

      if (dragToScroll) {
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
      }
    }
    return () => {
      resizeObserver?.disconnect();
      if (dragToScroll) {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      }
    };
  });

  let showArrowControls = $derived(showArrows && !(hideArrowsOnTouch && isTouchDevice));
  let showGradientOverlay = $derived(showGradient && !(hideArrowsOnTouch && isTouchDevice));
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
  <div
    class="scroll-container"
    class:hide-scrollbar={hideScrollbar}
    class:snap={snapToItem}
    class:dragging={isDragging}
    bind:this={containerEl}
    onscroll={updateScrollState}
    onmousedown={dragToScroll ? handleDragStart : null}
    role="region"
    tabindex="-1"
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

  .scroll-container.dragging {
    cursor: grabbing;
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
