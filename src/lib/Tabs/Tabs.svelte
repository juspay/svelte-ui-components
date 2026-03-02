<script lang="ts">
  import type { TabsProperties } from './properties';
  import chevronLeftSvg from '$lib/assets/chevron-left.svg?raw';
  import chevronRightSvg from '$lib/assets/chevron-right.svg?raw';

  let {
    items,
    activeIndex = 0,
    disabled = false,
    testId,
    scrollLeftIcon,
    scrollRightIcon,
    classes,
    onchange
  }: TabsProperties = $props();

  let scrollContainer: HTMLDivElement | null = null;
  let canScrollLeft = $state(false);
  let canScrollRight = $state(false);

  function updateOverflow(): void {
    if (scrollContainer === null) {
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
    canScrollLeft = scrollLeft > 1;
    canScrollRight = scrollLeft + clientWidth < scrollWidth - 1;
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
    if (disabled || index === activeIndex) {
      return;
    }
    activeIndex = index;
    onchange?.(index, items[index]);
  }

  function initOverflow(node: HTMLDivElement): { destroy: () => void } {
    scrollContainer = node;
    updateOverflow();
    const observer = new MutationObserver(updateOverflow);
    observer.observe(node, { childList: true, subtree: true });
    return {
      destroy() {
        observer.disconnect();
      }
    };
  }
</script>

<div class="tabs-wrapper {classes ?? ''}" class:disabled data-pw={testId}>
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
    use:initOverflow
    onscroll={updateOverflow}
  >
    {#each items as label, index (index)}
      <button
        class="tabs-item"
        class:active={index === activeIndex}
        role="tab"
        aria-selected={index === activeIndex}
        tabindex={index === activeIndex ? 0 : -1}
        {disabled}
        onclick={() => handleTabClick(index)}
      >
        {label}
        {#if index === activeIndex}
          <span class="tabs-indicator"></span>
        {/if}
      </button>
    {/each}
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
  }

  .tabs-bar::-webkit-scrollbar {
    display: none;
  }

  .tabs-bar.fade-left {
    mask-image: linear-gradient(to right, transparent, black var(--tabs-fade-size, 32px));
    -webkit-mask-image: linear-gradient(to right, transparent, black var(--tabs-fade-size, 32px));
  }

  .tabs-bar.fade-right {
    mask-image: linear-gradient(to left, transparent, black var(--tabs-fade-size, 32px));
    -webkit-mask-image: linear-gradient(to left, transparent, black var(--tabs-fade-size, 32px));
  }

  .tabs-bar.fade-left.fade-right {
    mask-image: linear-gradient(
      to right,
      transparent,
      black var(--tabs-fade-size, 32px),
      black calc(100% - var(--tabs-fade-size, 32px)),
      transparent
    );
    -webkit-mask-image: linear-gradient(
      to right,
      transparent,
      black var(--tabs-fade-size, 32px),
      black calc(100% - var(--tabs-fade-size, 32px)),
      transparent
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
    position: relative;
    padding: var(--tabs-item-padding, 12px 16px);
    font-size: var(--tabs-item-font-size, 14px);
    font-weight: var(--tabs-item-font-weight, 400);
    font-family: var(--tabs-item-font-family, inherit);
    color: var(--tabs-item-color, #666666);
    cursor: var(--tabs-item-cursor, pointer);
    background: var(--tabs-item-background, transparent);
    border: none;
    border-radius: var(--tabs-item-border-radius, 0);
    outline: none;
    white-space: nowrap;
    flex-shrink: 0;
    transition: var(--tabs-transition, color 0.2s ease, background 0.2s ease);
  }

  .tabs-item:hover:not(.active):not(:disabled) {
    color: var(--tabs-hover-color, #333333);
    background: var(--tabs-hover-background, #f5f5f5);
  }

  .tabs-item.active {
    color: var(--tabs-active-color, #1a73e8);
    font-weight: var(--tabs-active-font-weight, 600);
    background: var(--tabs-active-background, transparent);
  }

  .tabs-item:disabled {
    cursor: var(--tabs-disabled-cursor, not-allowed);
  }

  .tabs-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--tabs-indicator-height, 2px);
    background-color: var(--tabs-indicator-color, #1a73e8);
    border-radius: var(--tabs-indicator-border-radius, 2px 2px 0 0);
  }
</style>
