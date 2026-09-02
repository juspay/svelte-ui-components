<script lang="ts">
  import { tick } from 'svelte';
  import type { TabItem, TabsProperties } from './properties';
  import Img from '../Img/Img.svelte';
  import chevronLeftSvg from '$lib/assets/chevron-left.svg?raw';
  import chevronRightSvg from '$lib/assets/chevron-right.svg?raw';
  import chevronUpSvg from '$lib/assets/chevron-up.svg?raw';
  import chevronDownSvg from '$lib/assets/chevron-down.svg?raw';

  let {
    items,
    activeIndex = $bindable(0),
    activeKey,
    disabled = false,
    orientation = 'horizontal',
    testId,
    scrollLeftIcon,
    scrollRightIcon,
    tab,
    classes,
    onchange: onchangeLegacy,
    onChange,
    onkeychange: onkeychangeLegacy,
    onKeyChange
  }: TabsProperties = $props();

  // Event-casing phase 1: both spellings accepted, the correct one wins.
  const onchange = $derived(onChange ?? onchangeLegacy);
  const onkeychange = $derived(onKeyChange ?? onkeychangeLegacy);

  const isVertical = $derived(orientation === 'vertical');

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
  let canScrollUp = $state(false);
  let canScrollDown = $state(false);

  // Sliding indicator state — horizontal tracks left/width, vertical tracks top/height.
  let indicatorLeft = $state(0);
  let indicatorWidth = $state(0);
  let indicatorTop = $state(0);
  let indicatorHeight = $state(0);
  let indicatorReady = $state(false);

  const showStartArrow = $derived(isVertical ? canScrollUp : canScrollLeft);
  const showEndArrow = $derived(isVertical ? canScrollDown : canScrollRight);

  function updateOverflow(): void {
    if (scrollContainer === null) {
      return;
    }
    if (isVertical) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      canScrollUp = scrollTop > 1;
      canScrollDown = scrollTop + clientHeight < scrollHeight - 1;
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
      indicatorTop = 0;
      indicatorHeight = 0;
      return;
    }
    if (isVertical) {
      indicatorTop = activeEl.offsetTop;
      indicatorHeight = activeEl.offsetHeight;
    } else {
      indicatorLeft = activeEl.offsetLeft;
      indicatorWidth = activeEl.offsetWidth;
    }
    indicatorReady = true;
  }

  function scroll(edge: 'start' | 'end'): void {
    if (scrollContainer === null) {
      return;
    }
    if (isVertical) {
      const amount = scrollContainer.clientHeight * 0.6;
      scrollContainer.scrollBy({
        top: edge === 'start' ? -amount : amount,
        behavior: 'smooth'
      });
      return;
    }
    const amount = scrollContainer.clientWidth * 0.6;
    scrollContainer.scrollBy({
      left: edge === 'start' ? -amount : amount,
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

  // After a keyboard-driven selection the active item changes (directly in
  // string mode; via the consumer's activeKey update in object mode), and the
  // roving tabindex re-roves with it. Move DOM focus onto the newly active tab
  // so the user can keep arrowing — without this, focus is stranded on a
  // tabindex="-1" item and the roving pattern breaks down.
  function moveFocusToActiveTab(): void {
    void tick().then(() => {
      const activeTab = scrollContainer?.querySelector<HTMLElement>('[role="tab"][tabindex="0"]');
      activeTab?.focus();
    });
  }

  // WAI-ARIA APG tablist keyboard contract with activation-follows-focus:
  // Arrow keys (orientation-aware) move selection to the adjacent tab with
  // wrap-around, Home/End jump to the first/last tab. Without this, the roving
  // tabindex makes every non-active tab keyboard-unreachable.
  function handleKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTabClick(index);
      return;
    }
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    const previousKey = isVertical ? 'ArrowUp' : 'ArrowLeft';
    let targetIndex: number | null = null;
    if (event.key === nextKey) {
      targetIndex = (index + 1) % items.length;
    } else if (event.key === previousKey) {
      targetIndex = (index - 1 + items.length) % items.length;
    } else if (event.key === 'Home') {
      targetIndex = 0;
    } else if (event.key === 'End') {
      targetIndex = items.length - 1;
    }
    if (targetIndex === null) {
      return;
    }
    event.preventDefault();
    if (disabled || targetIndex === index) {
      return;
    }
    handleTabClick(targetIndex);
    moveFocusToActiveTab();
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

<div class={rootClass} class:disabled class:vertical={isVertical} data-pw={testId} testID={testId}>
  {#if showStartArrow}
    <button
      class="tabs-arrow tabs-arrow-start"
      aria-label={isVertical ? 'Scroll tabs up' : 'Scroll tabs left'}
      onclick={() => scroll('start')}
    >
      {#if typeof scrollLeftIcon === 'function'}
        {@render scrollLeftIcon()}
      {:else}
        <!-- eslint-disable svelte/no-at-html-tags -->
        {@html isVertical ? chevronUpSvg : chevronLeftSvg}
      {/if}
    </button>
  {/if}
  <div
    class="tabs-bar"
    class:fade-left={canScrollLeft}
    class:fade-right={canScrollRight}
    class:fade-top={canScrollUp}
    class:fade-bottom={canScrollDown}
    role="tablist"
    aria-orientation={isVertical ? 'vertical' : null}
    {@attach initOverflow}
    onscroll={updateOverflow}
  >
    {#each items as item, index (isObjectMode ? (toTabItem(item)?.key ?? index) : index)}
      {@const tabItem = toTabItem(item)}
      {@const label = toStringLabel(item)}
      {#if typeof tabItem?.sectionLabel === 'string' && tabItem.sectionLabel.length > 0}
        <div class="tabs-section-label" aria-hidden="true">{tabItem.sectionLabel}</div>
      {/if}
      <div
        class="tabs-item"
        class:active={isActiveItem(index)}
        role="tab"
        aria-selected={isActiveItem(index)}
        aria-disabled={disabled ? true : null}
        tabindex={isActiveItem(index) ? 0 : -1}
        data-pw={tabItem?.testId}
        testID={tabItem?.testId}
        onclick={() => handleTabClick(index)}
        onkeydown={(event) => handleKeydown(event, index)}
      >
        {#if typeof tab === 'function'}
          {@render tab({
            label,
            index,
            active: isActiveItem(index),
            subtitle: tabItem?.subtitle,
            icon: tabItem?.icon,
            status: tabItem?.status
          })}
        {:else}
          {#if typeof tabItem?.icon === 'string' && tabItem.icon.length > 0}
            <Img inlineSvg src={tabItem.icon} alt="" fallback="" classes="tabs-item-icon" />
          {/if}
          <span class="tabs-item-label" data-text={label}>{label}</span>
          {#if tabItem?.status && tabItem.status !== 'none'}
            <span class="tabs-item-status status-{tabItem.status}" aria-hidden="true"></span>
          {/if}
        {/if}
      </div>
    {/each}
    {#if indicatorReady}
      <span
        class="tabs-indicator"
        aria-hidden="true"
        style={isVertical
          ? `top: ${indicatorTop}px; height: ${indicatorHeight}px;`
          : `left: ${indicatorLeft}px; width: ${indicatorWidth}px;`}
      ></span>
    {/if}
  </div>
  {#if showEndArrow}
    <button
      class="tabs-arrow tabs-arrow-end"
      aria-label={isVertical ? 'Scroll tabs down' : 'Scroll tabs right'}
      onclick={() => scroll('end')}
    >
      {#if typeof scrollRightIcon === 'function'}
        {@render scrollRightIcon()}
      {:else}
        <!-- eslint-disable svelte/no-at-html-tags -->
        {@html isVertical ? chevronDownSvg : chevronRightSvg}
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
    gap: var(--tabs-item-gap, 8px);
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

  .tabs-item :global(.tabs-item-icon) {
    --image-width: var(--tabs-item-icon-size, 16px);
    --image-height: var(--tabs-item-icon-size, 16px);
    --image-object-fit: contain;

    color: var(--tabs-item-icon-color, inherit);
    flex-shrink: 0;
  }

  /* Reserves the active-state (bolder) width of the label so selecting a tab
     never reflows the tab bar: without this, .tabs-item.active's font-weight
     jump makes the tab (and every tab after it) physically resize, which
     visibly shifts sibling tabs and defeats the indicator's slide animation
     with a jump. The ::after ghost renders data-text at the active weight
     with height:0/visibility:hidden -- invisible, but its width still sets
     the shrink-to-fit width of the inline-block label, so the box is already
     as wide as the active state needs even while showing the lighter weight. */
  .tabs-item-label {
    position: relative;
    display: inline-block;
  }

  .tabs-item-label::after {
    content: attr(data-text);
    display: block;
    height: 0;
    overflow: hidden;
    visibility: hidden;
    font-weight: var(--tabs-active-font-weight, 600);
  }

  /* Trailing status dot for nav/menu tabs. margin-left:auto pushes it to the row's
     end (e.g. a settings menu); harmless on a normal tab bar where the item shrinks
     to content. */
  .tabs-item-status {
    width: var(--tabs-item-status-size, 8px);
    height: var(--tabs-item-status-size, 8px);
    margin-left: auto;
    border-radius: 50%;
    flex-shrink: 0;
    background: transparent;
  }

  /* Neutral "has activity / configured" dot — blue by default, matching the app's
     --text-color-focus. Maps from a settings menu's Default circle type. */
  .tabs-item-status.status-default {
    background: var(--tabs-item-status-default-color, #1a73e8);
  }

  .tabs-item-status.status-pending {
    background: var(--tabs-item-status-pending-color, #f59e0b);
  }

  .tabs-item-status.status-error {
    background: var(--tabs-item-status-error-color, #e7000b);
  }

  .tabs-item-status.status-success {
    background: var(--tabs-item-status-success-color, #16a34a);
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

  /* ---------- Vertical orientation (nav / menu rail) ---------- */
  .tabs-wrapper.vertical {
    flex-direction: column;
    align-items: stretch;
    max-width: none;
    border-bottom: none;
  }

  .tabs-wrapper.vertical .tabs-bar {
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .tabs-wrapper.vertical .tabs-item {
    /* Full-width rows: label sits at the leading edge, the status dot's margin-left:auto
       pushes it to the trailing edge (the settings-menu look). */
    width: 100%;
    box-sizing: border-box;
    justify-content: flex-start;
  }

  .tabs-bar.fade-top {
    mask-image: linear-gradient(
      to bottom,
      transparent var(--tabs-fade-solid, 8px),
      black var(--tabs-fade-size, 32px)
    );
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent var(--tabs-fade-solid, 8px),
      black var(--tabs-fade-size, 32px)
    );
  }

  .tabs-bar.fade-bottom {
    mask-image: linear-gradient(
      to top,
      transparent var(--tabs-fade-solid, 8px),
      black var(--tabs-fade-size, 32px)
    );
    -webkit-mask-image: linear-gradient(
      to top,
      transparent var(--tabs-fade-solid, 8px),
      black var(--tabs-fade-size, 32px)
    );
  }

  .tabs-bar.fade-top.fade-bottom {
    mask-image: linear-gradient(
      to bottom,
      transparent var(--tabs-fade-solid, 8px),
      black var(--tabs-fade-size, 32px),
      black calc(100% - var(--tabs-fade-size, 32px)),
      transparent calc(100% - var(--tabs-fade-solid, 8px))
    );
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent var(--tabs-fade-solid, 8px),
      black var(--tabs-fade-size, 32px),
      black calc(100% - var(--tabs-fade-size, 32px)),
      transparent calc(100% - var(--tabs-fade-solid, 8px))
    );
  }

  .tabs-wrapper.vertical .tabs-indicator {
    top: 0;
    bottom: auto;
    left: 0;
    width: var(--tabs-indicator-height, 2px);
    height: var(--tabs-indicator-height, 2px);
    border-radius: var(--tabs-indicator-border-radius-vertical, 0 2px 2px 0);
    transition: var(--tabs-indicator-transition-vertical, top 0.3s ease, height 0.3s ease);
  }

  /* Section header rendered above a group of vertical nav items. */
  .tabs-section-label {
    padding: var(--tabs-section-label-padding, 12px 16px 4px);
    font-size: var(--tabs-section-label-font-size, 11px);
    font-weight: var(--tabs-section-label-font-weight, 700);
    letter-spacing: var(--tabs-section-label-letter-spacing, 0.04em);
    text-transform: var(--tabs-section-label-text-transform, uppercase);
    color: var(--tabs-section-label-color, var(--tabs-item-color, #999999));
    white-space: nowrap;
    user-select: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .tabs-indicator,
    .tabs-wrapper.vertical .tabs-indicator {
      transition: none;
    }
  }
</style>
