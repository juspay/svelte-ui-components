<script lang="ts">
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
    activationMode = 'automatic',
    loop = true,
    dir,
    testId,
    scrollLeftIcon,
    scrollRightIcon,
    tab,
    classes,
    onchange,
    onkeychange
  }: TabsProperties = $props();

  const isVertical = $derived(orientation === 'vertical');

  const isObjectMode = $derived(items.length > 0 && typeof items.at(0) === 'object');

  function toTabItem(item: string | TabItem): TabItem | null {
    return typeof item === 'object' ? item : null;
  }

  function toStringLabel(item: string | TabItem): string {
    return typeof item === 'string' ? item : item.label;
  }

  // What "the focused tab" means across a re-render. A keyed item keeps its identity
  // when the list is reordered or trimmed; a plain string list has nothing stabler
  // than its position.
  function identityOf(item: string | TabItem, index: number): string {
    return typeof item === 'object' ? item.key : String(index);
  }

  function isItemDisabled(index: number): boolean {
    if (disabled) {
      return true;
    }
    const item = items.at(index);
    return typeof item === 'object' && item.disabled === true;
  }

  // -1 whenever nothing is selected: an out-of-range or non-integer `activeIndex`, an
  // `activeKey` matching no item, or object items with no `activeKey` at all. The list
  // then shows no selection rather than inventing one, and still offers a way in.
  const selectedIndex = $derived.by(() => {
    if (isObjectMode) {
      return typeof activeKey === 'string'
        ? items.findIndex((item) => toTabItem(item)?.key === activeKey)
        : -1;
    }
    return Number.isInteger(activeIndex) && activeIndex >= 0 && activeIndex < items.length
      ? activeIndex
      : -1;
  });

  function isActiveItem(index: number): boolean {
    return index === selectedIndex;
  }

  let focusedKey: string | null = $state(null);

  const focusedIndex = $derived(
    focusedKey === null
      ? -1
      : items.findIndex((item, index) => identityOf(item, index) === focusedKey)
  );

  const firstEnabledIndex = $derived(items.findIndex((_, index) => !isItemDisabled(index)));

  // A tablist is one tab stop. It is the focused tab while the user is inside the
  // list, the selected tab otherwise, and the first enabled tab when nothing is
  // selected — so a list with no selection, or one whose selection is disabled, can
  // still be reached by Tab. A fully disabled list has no tab stop at all.
  const tabStopIndex = $derived.by(() => {
    if (disabled) {
      return -1;
    }
    if (focusedIndex >= 0 && !isItemDisabled(focusedIndex)) {
      return focusedIndex;
    }
    if (selectedIndex >= 0 && !isItemDisabled(selectedIndex)) {
      return selectedIndex;
    }
    return firstEnabledIndex;
  });

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

  const explicitDir: 'ltr' | 'rtl' | null = $derived(dir === 'rtl' || dir === 'ltr' ? dir : null);

  function tabElements(): HTMLElement[] {
    return scrollContainer === null
      ? []
      : Array.from(scrollContainer.querySelectorAll<HTMLElement>('[role="tab"]'));
  }

  // Read at the moment a key is pressed rather than tracked as state: the direction
  // that matters is the one in effect now, and it can come from an ancestor's `dir`
  // attribute or from CSS, neither of which is reactive.
  function isRightToLeft(): boolean {
    if (explicitDir !== null) {
      return explicitDir === 'rtl';
    }
    if (scrollContainer === null) {
      return false;
    }
    const declared = scrollContainer.closest('[dir]');
    if (declared !== null) {
      const value = declared.getAttribute('dir');
      if (value === 'rtl' || value === 'ltr') {
        return value === 'rtl';
      }
    }
    return getComputedStyle(scrollContainer).direction === 'rtl';
  }

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

  function activate(index: number): void {
    if (isItemDisabled(index)) {
      return;
    }
    const rawItem = items.at(index);
    if (isObjectMode) {
      if (typeof rawItem !== 'object') {
        return;
      }
      if (rawItem.key === activeKey) {
        return;
      }
      onkeychange?.(rawItem.key);
      return;
    }
    if (typeof rawItem !== 'string' || index === activeIndex) {
      return;
    }
    activeIndex = index;
    onchange?.(index, rawItem);
  }

  function handleTabClick(index: number): void {
    activate(index);
  }

  function focusTabAt(index: number): void {
    const item = items.at(index);
    if (typeof item !== 'string' && typeof item !== 'object') {
      return;
    }
    focusedKey = identityOf(item, index);
    tabElements().at(index)?.focus();
  }

  /** Next enabled item in `step`'s direction, or -1 when there is none to move to. */
  function nextEnabledIndex(from: number, step: number): number {
    const count = items.length;
    if (count === 0) {
      return -1;
    }
    let index = from;
    for (let moved = 0; moved < count; moved += 1) {
      index += step;
      if (index < 0 || index >= count) {
        if (!loop) {
          return -1;
        }
        index = ((index % count) + count) % count;
      }
      if (!isItemDisabled(index)) {
        return index;
      }
    }
    return -1;
  }

  function edgeIndex(edge: 'start' | 'end'): number {
    return edge === 'start'
      ? items.findIndex((_, index) => !isItemDisabled(index))
      : items.reduce((found: number, _, index) => (isItemDisabled(index) ? found : index), -1);
  }

  // WAI-ARIA APG tablist keyboard contract: orientation-aware arrow keys move through
  // the enabled tabs, Home/End jump to the ends, and Enter/Space select. Whether
  // moving also selects is `activationMode`'s decision.
  function handleKeydown(event: KeyboardEvent, index: number): void {
    // A tablist owns bare arrow keys, not the browser's and the OS's shortcuts built
    // on them. Consuming Ctrl+Home or Shift+ArrowRight would take away scroll-to-top
    // and text selection while the tablist happens to hold focus.
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    if (disabled) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(index);
      return;
    }
    const rightToLeft = !isVertical && isRightToLeft();
    const forwardKey = isVertical ? 'ArrowDown' : rightToLeft ? 'ArrowLeft' : 'ArrowRight';
    const backwardKey = isVertical ? 'ArrowUp' : rightToLeft ? 'ArrowRight' : 'ArrowLeft';
    let targetIndex: number;
    if (event.key === forwardKey) {
      targetIndex = nextEnabledIndex(index, 1);
    } else if (event.key === backwardKey) {
      targetIndex = nextEnabledIndex(index, -1);
    } else if (event.key === 'Home') {
      targetIndex = edgeIndex('start');
    } else if (event.key === 'End') {
      targetIndex = edgeIndex('end');
    } else {
      return;
    }
    event.preventDefault();
    if (targetIndex < 0 || targetIndex === index) {
      return;
    }
    focusTabAt(targetIndex);
    if (activationMode === 'automatic') {
      activate(targetIndex);
    }
  }

  function handleFocusIn(event: FocusEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const index = tabElements().indexOf(target);
    const item = items.at(index);
    if (index < 0 || (typeof item !== 'string' && typeof item !== 'object')) {
      return;
    }
    focusedKey = identityOf(item, index);
  }

  function handleFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof HTMLElement && tabElements().includes(next)) {
      return;
    }
    focusedKey = null;
  }

  /** Identity of the selected item, for noticing that the selection itself changed. */
  let lastSelectionKey: string | null = null;

  // Keeps DOM focus and the roving tab stop honest after the list changes underneath
  // them: the selection moved, the focused item was removed, reordered, or disabled.
  // Runs from the same MutationObserver that already tracks overflow, so nothing here
  // needs an effect. It never pulls focus into a list the user is not already in.
  function reconcileFocus(): void {
    const elements = tabElements();
    const active = document.activeElement;
    const isInside = active instanceof HTMLElement && elements.includes(active);
    const selectedItem = items.at(selectedIndex);
    const selectionKey =
      selectedIndex >= 0 && (typeof selectedItem === 'string' || typeof selectedItem === 'object')
        ? identityOf(selectedItem, selectedIndex)
        : null;
    const selectionChanged = selectionKey !== lastSelectionKey;
    lastSelectionKey = selectionKey;
    if (tabStopIndex < 0) {
      if (isInside && active instanceof HTMLElement) {
        active.blur();
      }
      focusedKey = null;
      return;
    }
    if (!isInside && focusedKey === null) {
      return;
    }
    // Focus follows a selection made elsewhere, so a parent switching tabs does not
    // strand the user on a tab that is no longer the selected one.
    const targetIndex =
      selectionChanged && selectedIndex >= 0 && !isItemDisabled(selectedIndex)
        ? selectedIndex
        : tabStopIndex;
    const target = elements.at(targetIndex);
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const item = items.at(targetIndex);
    if (typeof item === 'string' || typeof item === 'object') {
      focusedKey = identityOf(item, targetIndex);
    }
    if (document.activeElement !== target) {
      target.focus();
    }
  }

  function initOverflow(node: HTMLDivElement): () => void {
    scrollContainer = node;
    updateOverflow();
    updateIndicator();
    reconcileFocus();
    const observer = new MutationObserver(() => {
      updateOverflow();
      updateIndicator();
      reconcileFocus();
    });
    observer.observe(node, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'tabindex', 'aria-selected', 'aria-disabled']
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

<div
  class={rootClass}
  class:disabled
  class:vertical={isVertical}
  {...explicitDir === null ? {} : { dir: explicitDir }}
  data-pw={testId}
  testID={testId}
>
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
    data-orientation={orientation}
    {@attach initOverflow}
    onscroll={updateOverflow}
    onfocusin={handleFocusIn}
    onfocusout={handleFocusOut}
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
        aria-disabled={isItemDisabled(index) ? 'true' : null}
        tabindex={index === tabStopIndex ? 0 : -1}
        data-state={isActiveItem(index) ? 'active' : 'inactive'}
        data-disabled={isItemDisabled(index) ? '' : null}
        data-orientation={orientation}
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
