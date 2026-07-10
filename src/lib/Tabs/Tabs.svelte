<script lang="ts">
  import type { TabItem, TabsProperties } from './properties';
  import chevronLeftSvg from '$lib/assets/chevron-left.svg?raw';
  import chevronRightSvg from '$lib/assets/chevron-right.svg?raw';

  let {
    items,
    activeIndex = $bindable(0),
    activeKey,
    disabled = false,
    testId,
    scrollLeftIcon,
    scrollRightIcon,
    tab,
    classes,
    onchange,
    onkeychange
  }: TabsProperties = $props();

  const isObjectMode = $derived(items.length > 0 && typeof items.at(0) === 'object');

  function toTabItem(item: string | TabItem): TabItem | null {
    return typeof item === 'object' ? item : null;
  }

  function toStringLabel(item: string | TabItem): string {
    return typeof item === 'string' ? item : item.label;
  }

  const resolvedActiveIndex = $derived(
    isObjectMode
      ? items.findIndex((item) => {
          const tabItem = toTabItem(item);
          return tabItem !== null && tabItem.key === activeKey;
        })
      : activeIndex
  );

  function isActiveItem(index: number): boolean {
    return index === resolvedActiveIndex;
  }

  let scrollContainer: HTMLDivElement | null = null;
  let canScrollLeft = $state(false);
  let canScrollRight = $state(false);

  // Sliding indicator state
  let indicatorLeft = $state(0);
  let indicatorWidth = $state(0);
  let indicatorReady = $state(false);

  function updateOverflow(): void {
    if (scrollContainer === null) {
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
    canScrollLeft = scrollLeft > 1;
    canScrollRight = scrollLeft + clientWidth < scrollWidth - 1;
  }

  function updateIndicator(): void {
    if (scrollContainer === null) {
      return;
    }
    const activeEl = scrollContainer.querySelector<HTMLElement>('.tabs-item.active');
    if (activeEl === null) {
      indicatorReady = false;
      indicatorLeft = 0;
      indicatorWidth = 0;
      return;
    }
    indicatorLeft = activeEl.offsetLeft;
    indicatorWidth = activeEl.offsetWidth;
    indicatorReady = true;
  }

  function scroll(direction: 'left' | 'right'): void {
    if (scrollContainer === null) {
      return;
    }
    const amount = scrollContainer.clientWidth * 0.6;
    scrollContainer.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  }

  function handleTabClick(index: number): void {
    if (disabled) {
      return;
    }
    if (isObjectMode) {
      const rawItem = items.at(index);
      if (typeof rawItem !== 'object') {
        return;
      }
      const tabItem = toTabItem(rawItem);
      if (tabItem === null) {
        return;
      }
      if (tabItem.key === activeKey) {
        return;
      }
      onkeychange?.(tabItem.key);
    } else {
      if (index === activeIndex) {
        return;
      }
      const rawLabel = items.at(index);
      if (typeof rawLabel !== 'string') {
        return;
      }
      activeIndex = index;
      onchange?.(index, rawLabel);
    }
  }

  function handleKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTabClick(index);
    }
  }

  function initOverflow(node: HTMLDivElement): () => void {
    scrollContainer = node;
    updateOverflow();
    updateIndicator();
    const observer = new MutationObserver(() => {
      updateOverflow();
      updateIndicator();
    });
    observer.observe(node, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
    const resizeObserver = new ResizeObserver(() => {
      updateOverflow();
      updateIndicator();
    });
    resizeObserver.observe(node);
    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      scrollContainer = null;
    };
  }

  let rootClass = $derived(
    ['tabs-wrapper', classes ?? ''].filter((cls) => cls.length > 0).join(' ')
  );
</script>

<div class={rootClass} class:disabled data-pw={testId}>
  {#if canScrollLeft}
    <button
      class="tabs-arrow tabs-arrow-left"
      aria-label="Scroll tabs left"
      onclick={() => scroll('left')}
    >
      {#if typeof scrollLeftIcon === 'function'}
        {@render scrollLeftIcon()}
      {:else}
        <!-- eslint-disable svelte/no-at-html-tags -->
        {@html chevronLeftSvg}
      {/if}
    </button>
  {/if}
  <div
    class="tabs-bar"
    class:fade-left={canScrollLeft}
    class:fade-right={canScrollRight}
    role="tablist"
    {@attach initOverflow}
    onscroll={updateOverflow}
  >
    {#each items as item, index (isObjectMode ? (toTabItem(item)?.key ?? index) : index)}
      {@const tabItem = toTabItem(item)}
      {@const label = toStringLabel(item)}
      <div
        class="tabs-item"
        class:active={isActiveItem(index)}
        role="tab"
        aria-selected={isActiveItem(index)}
        aria-disabled={disabled ? true : null}
        tabindex={isActiveItem(index) ? 0 : -1}
        data-pw={tabItem?.testId}
        onclick={() => handleTabClick(index)}
        onkeydown={(event) => handleKeydown(event, index)}
      >
        {#if typeof tab === 'function'}
          {@render tab({ label, index, active: isActiveItem(index), subtitle: tabItem?.subtitle })}
        {:else}
          {label}
        {/if}
      </div>
    {/each}
    {#if indicatorReady}
      <span
        class="tabs-indicator"
        aria-hidden="true"
        style="left: {indicatorLeft}px; width: {indicatorWidth}px;"
      ></span>
    {/if}
  </div>
  {#if canScrollRight}
    <button
      class="tabs-arrow tabs-arrow-right"
      aria-label="Scroll tabs right"
      onclick={() => scroll('right')}
    >
      {#if typeof scrollRightIcon === 'function'}
        {@render scrollRightIcon()}
      {:else}
        <!-- eslint-disable svelte/no-at-html-tags -->
        {@html chevronRightSvg}
      {/if}
    </button>
  {/if}
</div>

<style>
  .tabs-wrapper {
    display: flex;
    align-items: stretch;
    position: relative;
    max-width: 100%;
    background: var(--tabs-bar-background, #ffffff);
    border-bottom: var(--tabs-bar-border-bottom, 1px solid #e0e0e0);
    border-radius: var(--tabs-bar-border-radius, 0);
  }

  .tabs-wrapper.disabled {
    opacity: var(--tabs-disabled-opacity, 0.5);
    pointer-events: none;
  }

  .tabs-bar {
    display: flex;
    flex: 1;
    min-width: 0;
    padding: var(--tabs-bar-padding, 0px);
    gap: var(--tabs-bar-gap, 0px);
    overflow-x: auto;
    scrollbar-width: none;
    position: relative;
  }

  .tabs-bar::-webkit-scrollbar {
    display: none;
  }

  /* Each fade holds FULLY transparent for the first --tabs-fade-solid px before
     ramping to opaque: a plain 0→fade-size ramp still renders the clipped tab
     label at ~20% opacity a few px from the edge, which reads as a stray glyph
     fragment beside the scroll arrow. The solid zone guarantees nothing is
     perceptible there. */
  .tabs-bar.fade-left {
    mask-image: linear-gradient(
      to right,
      transparent var(--tabs-fade-solid, 8px),
      black var(--tabs-fade-size, 32px)
    );
    -webkit-mask-image: linear-gradient(
      to right,
      transparent var(--tabs-fade-solid, 8px),
      black var(--tabs-fade-size, 32px)
    );
  }

  .tabs-bar.fade-right {
    mask-image: linear-gradient(
      to left,
      transparent var(--tabs-fade-solid, 8px),
      black var(--tabs-fade-size, 32px)
    );
    -webkit-mask-image: linear-gradient(
      to left,
      transparent var(--tabs-fade-solid, 8px),
      black var(--tabs-fade-size, 32px)
    );
  }

  .tabs-bar.fade-left.fade-right {
    mask-image: linear-gradient(
      to right,
      transparent var(--tabs-fade-solid, 8px),
      black var(--tabs-fade-size, 32px),
      black calc(100% - var(--tabs-fade-size, 32px)),
      transparent calc(100% - var(--tabs-fade-solid, 8px))
    );
    -webkit-mask-image: linear-gradient(
      to right,
      transparent var(--tabs-fade-solid, 8px),
      black var(--tabs-fade-size, 32px),
      black calc(100% - var(--tabs-fade-size, 32px)),
      transparent calc(100% - var(--tabs-fade-solid, 8px))
    );
  }

  .tabs-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--tabs-arrow-size, 28px);
    padding: var(--tabs-arrow-padding, 0);
    border: var(--tabs-arrow-border, none);
    background: var(--tabs-arrow-background, var(--tabs-bar-background, #ffffff));
    color: var(--tabs-arrow-color, var(--tabs-item-color, #666666));
    cursor: pointer;
    z-index: 1;
    transition: var(--tabs-arrow-transition, color 0.2s ease);
    font-family: inherit;
  }

  .tabs-arrow:hover {
    color: var(--tabs-arrow-hover-color, var(--tabs-active-color, #1a73e8));
    background: var(
      --tabs-arrow-hover-background,
      var(--tabs-arrow-background, var(--tabs-bar-background, #ffffff))
    );
  }

  .tabs-item {
    display: flex;
    align-items: center;
    position: relative;
    padding: var(--tabs-item-padding, 12px 16px);
    font-size: var(--tabs-item-font-size, 14px);
    font-weight: var(--tabs-item-font-weight, 400);
    font-family: var(--tabs-item-font-family, inherit);
    color: var(--tabs-item-color, #666666);
    cursor: var(--tabs-item-cursor, pointer);
    background: var(--tabs-item-background, transparent);
    border: var(--tabs-item-border, none);
    border-radius: var(--tabs-item-border-radius, 0);
    outline: none;
    white-space: nowrap;
    flex-shrink: 0;
    user-select: none;
    transition: var(--tabs-transition, color 0.2s ease, background 0.2s ease);
  }

  .tabs-item:hover:not(.active):not([aria-disabled]) {
    color: var(--tabs-hover-color, #333333);
    background: var(--tabs-hover-background, #f5f5f5);
  }

  .tabs-item.active {
    color: var(--tabs-active-color, #1a73e8);
    font-weight: var(--tabs-active-font-weight, 600);
    background: var(--tabs-active-background, transparent);
  }

  .tabs-item[aria-disabled] {
    cursor: var(--tabs-disabled-cursor, not-allowed);
  }

  .tabs-indicator {
    position: absolute;
    bottom: 0;
    height: var(--tabs-indicator-height, 2px);
    background-color: var(--tabs-indicator-color, #1a73e8);
    border-radius: var(--tabs-indicator-border-radius, 2px 2px 0 0);
    transition: var(--tabs-indicator-transition, left 0.3s ease, width 0.3s ease);
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .tabs-indicator {
      transition: none;
    }
  }
</style>
