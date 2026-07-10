<script lang="ts">
  import { tick, onMount } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import Img from '../Img/Img.svelte';
  import type { MenuProperties, MenuItem, MenuPlacement } from './properties';

  let {
    items,
    open = $bindable(false),
    testId,
    trigger,
    onselect,
    onopen,
    onclose,
    classes,
    selectedValue = null,
    role: menuRole = 'menu',
    ariaLabel: menuAriaLabel,
    id: menuId,
    placement = 'bottom-left'
  }: MenuProperties = $props();

  let itemRole = $derived(menuRole === 'listbox' ? 'option' : 'menuitem');

  let menuContainerEl: HTMLDivElement | null = $state(null);
  let menuListEl: HTMLDivElement | null = $state(null);
  let triggerEl: HTMLDivElement | null = $state(null);
  let focusedIndex: number = $state(-1);
  let typeaheadQuery: string = $state('');
  let typeaheadTimer: ReturnType<typeof setTimeout> | null = $state(null);

  /** Fixed corner the dropdown is currently anchored to (resolved from `placement`). */
  let resolvedPlacement: Exclude<MenuPlacement, 'auto'> = $state('bottom-left');
  /** True while an `'auto'` open is measuring the hidden panel — suppresses paint. */
  let measuringPlacement: boolean = $state(false);

  /** Viewport padding the auto placement keeps between the panel and the edges. */
  const AUTO_PLACEMENT_VIEWPORT_MARGIN = 8;

  /**
   * Resolves `'auto'` against the live geometry: the panel renders hidden at the
   * default corner first, then flips right/up only when the default overflows
   * the viewport and the opposite side actually has room for the panel.
   */
  function resolveAutoPlacement(): Exclude<MenuPlacement, 'auto'> {
    if (menuContainerEl === null || menuListEl === null) {
      return 'bottom-left';
    }
    const containerRect = menuContainerEl.getBoundingClientRect();
    const panelRect = menuListEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const overflowsRight =
      containerRect.left + panelRect.width > viewportWidth - AUTO_PLACEMENT_VIEWPORT_MARGIN;
    const fitsRightAnchored =
      containerRect.right - panelRect.width >= AUTO_PLACEMENT_VIEWPORT_MARGIN;
    const horizontal = overflowsRight && fitsRightAnchored ? 'right' : 'left';

    const overflowsBottom =
      containerRect.bottom + panelRect.height > viewportHeight - AUTO_PLACEMENT_VIEWPORT_MARGIN;
    const fitsAbove = containerRect.top - panelRect.height >= AUTO_PLACEMENT_VIEWPORT_MARGIN;
    const vertical = overflowsBottom && fitsAbove ? 'top' : 'bottom';

    return `${vertical}-${horizontal}`;
  }

  let selectableItems: MenuItem[] = $derived(
    items.filter((item) => item.separator !== true && item.disabled !== true)
  );

  let selectableIndexMap: SvelteMap<MenuItem, number> = $derived(
    new SvelteMap(selectableItems.map((item, i) => [item, i]))
  );

  function toggle() {
    if (open) {
      close();
    } else {
      openMenu();
    }
  }

  function openMenu(startIndex: number | null = null) {
    open = true;
    if (placement === 'auto') {
      // Render the panel hidden at the default corner for one tick so it has
      // real dimensions to measure, then anchor it to the resolved corner.
      resolvedPlacement = 'bottom-left';
      measuringPlacement = true;
    } else {
      resolvedPlacement = placement;
      measuringPlacement = false;
    }
    // With a known selection, opening focuses the selected option (listbox
    // convention) instead of always parking the focus highlight on item 0.
    const selectedItem =
      selectedValue != null
        ? (items.find((item) => item.value === selectedValue && item.disabled !== true) ?? null)
        : null;
    const initialIndex =
      startIndex ?? (selectedItem !== null ? getSelectableIndex(selectedItem) : 0);
    focusedIndex = initialIndex;
    onopen?.();
    tick().then(() => {
      if (placement === 'auto') {
        resolvedPlacement = resolveAutoPlacement();
        measuringPlacement = false;
      }
      focusItem(initialIndex);
    });
  }

  function close() {
    open = false;
    focusedIndex = -1;
    typeaheadQuery = '';
    onclose?.();
    if (triggerEl !== null) {
      triggerEl.focus({ preventScroll: true });
    }
  }

  function selectItem(item: MenuItem) {
    if (item.disabled === true) {
      return;
    }
    onselect?.(item);
    close();
  }

  function focusItem(index: number) {
    if (menuListEl === null) {
      return;
    }
    const focusableItems = menuListEl.querySelectorAll(
      `[role="${itemRole}"]:not([aria-disabled="true"])`
    );
    const item = focusableItems.item(index);
    if (index >= 0 && index < focusableItems.length && item instanceof HTMLElement) {
      item.focus();
    }
  }

  function getSelectableIndex(item: MenuItem): number {
    return selectableIndexMap.get(item) ?? -1;
  }

  function handleTriggerKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      openMenu();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(selectableItems.length - 1);
    }
  }

  function handleMenuKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = focusedIndex + 1;
        focusedIndex = next >= selectableItems.length ? 0 : next;
        focusItem(focusedIndex);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prev = focusedIndex - 1;
        focusedIndex = prev < 0 ? selectableItems.length - 1 : prev;
        focusItem(focusedIndex);
        break;
      }
      case 'Home': {
        event.preventDefault();
        focusedIndex = 0;
        focusItem(focusedIndex);
        break;
      }
      case 'End': {
        event.preventDefault();
        focusedIndex = selectableItems.length - 1;
        focusItem(focusedIndex);
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const selected = selectableItems.at(focusedIndex);
        if (focusedIndex >= 0 && typeof selected !== 'undefined') {
          selectItem(selected);
        }
        break;
      }
      case 'Escape': {
        event.preventDefault();
        close();
        break;
      }
      case 'Tab': {
        close();
        break;
      }
      default: {
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          handleTypeahead(event.key);
        }
        break;
      }
    }
  }

  function handleTypeahead(char: string) {
    if (typeaheadTimer !== null) {
      clearTimeout(typeaheadTimer);
    }
    typeaheadQuery += char.toLowerCase();
    typeaheadTimer = setTimeout(() => {
      typeaheadQuery = '';
    }, 500);

    const matchIndex = selectableItems.findIndex((item) =>
      item.label.toLowerCase().startsWith(typeaheadQuery)
    );
    if (matchIndex >= 0) {
      focusedIndex = matchIndex;
      focusItem(focusedIndex);
    }
  }

  function handleClickOutside(event: Event) {
    if (
      open &&
      event.target instanceof Node &&
      menuContainerEl !== null &&
      !menuContainerEl.contains(event.target)
    ) {
      close();
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      if (typeaheadTimer !== null) {
        clearTimeout(typeaheadTimer);
      }
    };
  });
</script>

<div
  class="menu-container {classes ?? ''}"
  bind:this={menuContainerEl}
  data-pw={typeof testId === 'string' ? testId : null}
>
  <div
    class="menu-trigger"
    bind:this={triggerEl}
    onclick={toggle}
    onkeydown={handleTriggerKeydown}
    role="button"
    tabindex="0"
    aria-haspopup="menu"
    aria-expanded={open}
  >
    {#if typeof trigger === 'function'}
      {@render trigger()}
    {/if}
  </div>

  {#if open}
    <div
      class="menu-dropdown menu-dropdown-{placement === 'auto' ? resolvedPlacement : placement}"
      class:menu-dropdown-measuring={measuringPlacement}
      bind:this={menuListEl}
      role={menuRole}
      id={menuId}
      aria-label={menuAriaLabel}
      tabindex="-1"
      onkeydown={handleMenuKeydown}
    >
      {#each items as item (item.value)}
        {#if item.separator === true}
          <div class="menu-separator" role="separator"></div>
        {:else}
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <div
            class="menu-item"
            class:menu-item-danger={item.danger === true}
            class:menu-item-disabled={item.disabled === true}
            class:menu-item-selected={selectedValue != null && item.value === selectedValue}
            role={itemRole}
            id={item.id}
            tabindex={item.disabled === true || menuRole === 'listbox' ? -1 : 0}
            aria-disabled={item.disabled === true ? 'true' : null}
            aria-selected={menuRole === 'listbox'
              ? selectedValue != null
                ? item.value === selectedValue
                : focusedIndex === getSelectableIndex(item)
                  ? true
                  : null
              : null}
            onclick={() => selectItem(item)}
            onfocus={() => {
              if (item.disabled !== true) {
                focusedIndex = getSelectableIndex(item);
              }
            }}
            data-pw={typeof testId === 'string' ? `${testId}-item-${item.value}` : null}
          >
            {#if typeof item.icon === 'string'}
              <span class="menu-item-icon">
                <!-- Inline the SVG so currentColor strokes/fills inherit the item's
                     text colour (danger items tint their icon red, dark theme works);
                     non-SVG URLs fall back to the plain <img> render automatically. -->
                <Img inlineSvg src={item.icon} alt="" fallback="" />
              </span>
            {/if}
            <span class="menu-item-label">{item.label}</span>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .menu-container {
    position: var(--menu-container-position, relative);
    display: var(--menu-container-display, inline-block);
    font-family: var(--menu-font-family, inherit);
    font-size: var(--menu-font-size, 14px);
  }

  .menu-trigger {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .menu-trigger:focus {
    outline: var(--menu-trigger-focus-outline, none);
  }

  .menu-dropdown {
    position: absolute;
    z-index: var(--menu-z-index, 10);
    top: var(--menu-dropdown-top, 100%);
    left: var(--menu-dropdown-left, 0);
    background-color: var(--menu-background-color, #ffffff);
    border: var(--menu-border, 1px solid #e0e0e0);
    border-radius: var(--menu-border-radius, var(--radius, 4px));
    box-shadow: var(--menu-box-shadow, 0px 4px 16px rgba(0, 0, 0, 0.12));
    min-width: var(--menu-min-width, 160px);
    max-height: var(--menu-max-height, 240px);
    overflow-y: auto;
    padding: var(--menu-padding, 4px 0);
    margin: var(--menu-margin, 4px 0);
  }

  /* Placement corners — `bottom-left` is the base rule above (and stays fully
     driven by the --menu-dropdown-top/left consumer tokens); the other corners
     override the anchoring sides. The chained selector outweighs the base rule
     regardless of source order. */
  .menu-dropdown.menu-dropdown-bottom-right {
    left: auto;
    right: 0;
  }

  .menu-dropdown.menu-dropdown-top-left {
    top: auto;
    bottom: 100%;
  }

  .menu-dropdown.menu-dropdown-top-right {
    top: auto;
    bottom: 100%;
    left: auto;
    right: 0;
  }

  /* One-tick measuring pass for placement="auto": the panel needs rendered
     dimensions before the corner is chosen, without a visible flash. */
  .menu-dropdown.menu-dropdown-measuring {
    visibility: hidden;
  }

  .menu-item {
    display: flex;
    align-items: center;
    padding: var(--menu-item-padding, 8px 12px);
    cursor: pointer;
    color: var(--menu-item-color, #333333);
    background-color: var(--menu-item-background-color, transparent);
    gap: var(--menu-item-gap, 8px);
    white-space: var(--menu-item-white-space, nowrap);
    -webkit-tap-highlight-color: transparent;
  }

  .menu-item:hover {
    background-color: var(--menu-item-hover-background-color, #f5f5f5);
    color: var(--menu-item-hover-color, var(--menu-item-color, #333333));
  }

  .menu-item:focus {
    background-color: var(--menu-item-focus-background-color, #f0f0f0);
    outline: var(--menu-item-focus-outline, none);
  }

  /* True selection (selectedValue match) — distinct from transient focus so the
     highlight follows the chosen option, not wherever keyboard focus landed. */
  .menu-item-selected {
    background-color: var(--menu-item-selected-background-color, transparent);
    color: var(--menu-item-selected-color, inherit);
  }

  .menu-item-danger {
    color: var(--menu-item-danger-color, #dc3545);
  }

  .menu-item-danger:hover {
    background-color: var(--menu-item-danger-hover-background-color, #fff0f0);
    color: var(--menu-item-danger-hover-color, var(--menu-item-danger-color, #dc3545));
  }

  .menu-item-danger:focus {
    background-color: var(--menu-item-danger-focus-background-color, #fff0f0);
  }

  .menu-item-disabled {
    opacity: var(--menu-item-disabled-opacity, 0.4);
    cursor: var(--menu-item-disabled-cursor, not-allowed);
    pointer-events: none;
  }

  .menu-separator {
    height: var(--menu-separator-height, 1px);
    background-color: var(--menu-separator-color, #e0e0e0);
    margin: var(--menu-separator-margin, 4px 0);
  }

  .menu-item-icon {
    display: inline-flex;
    height: var(--menu-item-icon-height, 16px);
    width: var(--menu-item-icon-width, 16px);
    flex-shrink: 0;
  }

  .menu-item-icon :global(img),
  .menu-item-icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  .menu-item-label {
    flex: 1;
    font-weight: var(--menu-item-font-weight, 400);
    line-height: var(--menu-item-line-height, 1.4);
  }
</style>
