<script lang="ts">
  import { tick, onMount } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import Img from '../Img/Img.svelte';
  import type { MenuProperties, MenuItem } from './properties';

  let {
    items,
    open = $bindable(false),
    testId,
    trigger,
    onselect,
    onopen,
    onclose,
    classes,
    role: menuRole = 'menu',
    ariaLabel: menuAriaLabel,
    id: menuId
  }: MenuProperties = $props();

  let itemRole = $derived(menuRole === 'listbox' ? 'option' : 'menuitem');

  let menuContainerEl: HTMLDivElement | null = $state(null);
  let menuListEl: HTMLDivElement | null = $state(null);
  let triggerEl: HTMLDivElement | null = $state(null);
  let focusedIndex: number = $state(-1);
  let typeaheadQuery: string = $state('');
  let typeaheadTimer: ReturnType<typeof setTimeout> | null = $state(null);

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

  function openMenu(startIndex: number = 0) {
    open = true;
    focusedIndex = startIndex;
    onopen?.();
    tick().then(() => {
      focusItem(startIndex);
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
      class="menu-dropdown"
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
            role={itemRole}
            id={item.id}
            tabindex={item.disabled === true || menuRole === 'listbox' ? -1 : 0}
            aria-disabled={item.disabled === true ? 'true' : null}
            aria-selected={menuRole === 'listbox' && focusedIndex === getSelectableIndex(item)
              ? true
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
                <Img src={item.icon} alt="" />
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
    border-radius: var(--menu-border-radius, 6px);
    box-shadow: var(--menu-box-shadow, 0px 4px 16px rgba(0, 0, 0, 0.12));
    min-width: var(--menu-min-width, 160px);
    max-height: var(--menu-max-height, 240px);
    overflow-y: auto;
    padding: var(--menu-padding, 4px 0);
    margin: var(--menu-margin, 4px 0);
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

  .menu-item-icon :global(img) {
    width: 100%;
    height: 100%;
  }

  .menu-item-label {
    flex: 1;
    font-weight: var(--menu-item-font-weight, 400);
    line-height: var(--menu-item-line-height, 1.4);
  }
</style>
