<script lang="ts">
  import type { CommandMenuProperties, CommandItem } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';
  import { tick, onMount, onDestroy } from 'svelte';
  import { lockBodyScroll, unlockBodyScroll } from '../utils';
  import { SvelteMap } from 'svelte/reactivity';
  import Img from '$lib/Img/Img.svelte';
  import searchSvg from '$lib/assets/search.svg?raw';

  let {
    items,
    open = $bindable(false),
    placeholder = 'Search commands...',
    emptyText = 'No results found.',
    testId,
    itemIcon,
    searchIcon,
    onselect: onselectProp,
    onSelect,
    onclose: oncloseProp,
    onClose,
    classes
  }: CommandMenuProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onclose = $derived(
    resolveDeprecatedProp('CommandMenu', 'onClose', 'onclose', onClose, oncloseProp)
  );
  const onselect = $derived(
    resolveDeprecatedProp('CommandMenu', 'onSelect', 'onselect', onSelect, onselectProp)
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(onclose, onselect);
  });

  let query = $state('');
  let activeIndex = $state(0);
  let inputElement: HTMLInputElement | null = $state(null);
  let listElement: HTMLDivElement | null = $state(null);

  let filteredItems = $derived.by(() => {
    if (query.trim() === '') {
      return items;
    }
    const lower = query.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(lower));
  });

  let groupedItems = $derived.by(() => {
    const groups = new SvelteMap<string, CommandItem[]>();
    for (const item of filteredItems) {
      const group = item.group ?? '';
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      const groupList = groups.get(group);
      if (Array.isArray(groupList)) {
        groupList.push(item);
      }
    }
    return groups;
  });

  let flatItems = $derived.by(() => {
    const result: CommandItem[] = [];
    for (const [, groupItems] of groupedItems) {
      for (const item of groupItems) {
        result.push(item);
      }
    }
    return result;
  });

  let flatIndexLookup = $derived.by(() => {
    const map = new SvelteMap<string, number>();
    for (let i = 0; i < flatItems.length; i++) {
      const item = flatItems.at(i);
      if (typeof item === 'object') {
        map.set(item.value, i);
      }
    }
    return map;
  });

  function close() {
    open = false;
    query = '';
    activeIndex = 0;
    onclose?.();
  }

  function selectItem(item: CommandItem) {
    if (item.disabled) {
      return;
    }
    onselect?.(item);
    close();
  }

  function findNextActive(from: number, delta: 1 | -1): number {
    let candidate = from + delta;
    while (candidate >= 0 && candidate < flatItems.length) {
      const item = flatItems.at(candidate);
      if (typeof item === 'object' && !item.disabled) {
        return candidate;
      }
      candidate += delta;
    }
    return -1;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!open) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = findNextActive(activeIndex, 1);
        if (next >= 0) {
          activeIndex = next;
          scrollActiveIntoView();
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prev = findNextActive(activeIndex, -1);
        if (prev >= 0) {
          activeIndex = prev;
          scrollActiveIntoView();
        }
        break;
      }
      case 'Enter': {
        event.preventDefault();
        const item = flatItems.at(activeIndex);
        if (typeof item === 'object' && !item.disabled) {
          selectItem(item);
        }
        break;
      }
      case 'Escape': {
        event.preventDefault();
        close();
        break;
      }
    }
  }

  async function scrollActiveIntoView() {
    await tick();
    if (listElement !== null) {
      const activeEl = listElement.querySelector('[data-active="true"]');
      if (activeEl !== null) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  function handleGlobalKeyDown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      if (open) {
        close();
      } else {
        open = true;
      }
    }
  }

  // Lock and unlock strictly in this action so the pairing is 1:1. Svelte destroys
  // the action when the node goes away, including on component teardown, so the
  // onDestroy below must NOT unlock as well: with a shared reference count a second
  // decrement would release a lock another open surface still needs.
  function scrollLockAction(_node: HTMLElement) {
    lockBodyScroll();
    tick().then(() => {
      if (inputElement !== null) {
        inputElement.focus();
      }
    });
    return {
      destroy() {
        unlockBodyScroll();
      }
    };
  }

  onMount(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    }
  });
</script>

{#if open}
  <div
    class="command-menu-overlay {classes ?? ''}"
    use:scrollLockAction
    onclick={handleOverlayClick}
    onkeydown={handleKeyDown}
    role="dialog"
    aria-modal="true"
    aria-label="Command menu"
    tabindex="-1"
    data-pw={typeof testId === 'string' ? testId : null}
    testID={typeof testId === 'string' ? testId : null}
  >
    <div class="command-menu-dialog">
      <div class="command-menu-input-wrapper">
        {#if typeof searchIcon === 'function'}
          {@render searchIcon()}
        {:else}
          <!-- eslint-disable svelte/no-at-html-tags -->
          <span class="command-menu-search-icon">{@html searchSvg}</span>
        {/if}
        <input
          bind:this={inputElement}
          bind:value={query}
          oninput={() => {
            activeIndex = 0;
          }}
          type="text"
          class="command-menu-input"
          {placeholder}
          autocomplete="off"
          spellcheck="false"
          data-pw={typeof testId === 'string' ? `${testId}-input` : null}
          testID={typeof testId === 'string' ? `${testId}-input` : null}
        />
      </div>

      <div class="command-menu-separator"></div>

      <div class="command-menu-list" bind:this={listElement} role="listbox">
        {#if flatItems.length === 0}
          <div class="command-menu-empty">
            {emptyText}
          </div>
        {:else}
          {#each groupedItems as [group, groupItems] (group)}
            {#if group !== ''}
              <div class="command-menu-group-heading">{group}</div>
            {/if}
            {#each groupItems as item (item.value)}
              {@const index = flatIndexLookup.get(item.value) ?? -1}
              <button
                type="button"
                class="command-menu-item"
                class:active={index === activeIndex}
                class:disabled={item.disabled}
                data-active={index === activeIndex}
                onclick={() => selectItem(item)}
                onmouseenter={() => {
                  if (!item.disabled) {
                    activeIndex = index;
                  }
                }}
                role="option"
                aria-selected={index === activeIndex}
                aria-disabled={item.disabled}
                tabindex="-1"
                data-pw={typeof testId === 'string' ? `${testId}-item-${item.value}` : null}
                testID={typeof testId === 'string' ? `${testId}-item-${item.value}` : null}
              >
                {#if typeof itemIcon === 'function'}
                  <span class="command-menu-item-icon">
                    {@render itemIcon(item)}
                  </span>
                {:else if typeof item.icon === 'string' && item.icon.length > 0}
                  <div class="command-menu-item-icon-img-wrapper">
                    <Img inlineSvg src={item.icon} alt="" />
                  </div>
                {/if}
                <span class="command-menu-item-label">{item.label}</span>
                {#if typeof item.shortcut === 'string' && item.shortcut.length > 0}
                  <span class="command-menu-item-shortcut">
                    {#each item.shortcut.split('+') as key, i (i)}
                      <kbd class="command-menu-kbd">{key.trim()}</kbd>
                    {/each}
                  </span>
                {/if}
              </button>
            {/each}
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .command-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--command-menu-overlay-background, rgba(0, 0, 0, 0.5));
    display: flex;
    align-items: var(--command-menu-overlay-align, flex-start);
    justify-content: center;
    padding-top: var(--command-menu-overlay-padding-top, 20vh);
    z-index: var(--command-menu-z-index, 50);
    -webkit-tap-highlight-color: transparent;
  }

  .command-menu-dialog {
    background-color: var(--command-menu-background, #ffffff);
    border-radius: var(--command-menu-border-radius, var(--radius, 4px));
    box-shadow: var(--command-menu-box-shadow, 0 16px 70px rgba(0, 0, 0, 0.2));
    width: var(--command-menu-width, 560px);
    max-width: var(--command-menu-max-width, 90vw);
    max-height: var(--command-menu-max-height, 60vh);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: var(--command-menu-border, 1px solid #e2e8f0);
  }

  .command-menu-input-wrapper {
    display: flex;
    align-items: center;
    padding: var(--command-menu-input-wrapper-padding, 12px 16px);
    gap: var(--command-menu-input-wrapper-gap, 10px);
  }

  .command-menu-search-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--command-menu-search-icon-size, 20px);
    height: var(--command-menu-search-icon-size, 20px);
    color: var(--command-menu-search-icon-color, #94a3b8);
    flex-shrink: 0;
  }

  .command-menu-search-icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  .command-menu-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: var(--command-menu-input-font-size, 16px);
    font-family: var(--command-menu-input-font-family, inherit);
    font-weight: var(--command-menu-input-font-weight, 400);
    color: var(--command-menu-input-color, #1e293b);
    caret-color: var(--command-menu-input-caret-color, #3b82f6);
  }

  .command-menu-input::placeholder {
    color: var(--command-menu-input-placeholder-color, #94a3b8);
  }

  .command-menu-separator {
    height: var(--command-menu-separator-height, 1px);
    background-color: var(--command-menu-separator-color, #e2e8f0);
    flex-shrink: 0;
  }

  .command-menu-list {
    overflow-y: auto;
    padding: var(--command-menu-list-padding, 8px);
    scrollbar-width: var(--command-menu-scrollbar-width, thin);
  }

  .command-menu-empty {
    padding: var(--command-menu-empty-padding, 32px 16px);
    text-align: center;
    color: var(--command-menu-empty-color, #94a3b8);
    font-size: var(--command-menu-empty-font-size, 14px);
    font-style: var(--command-menu-empty-font-style, normal);
  }

  .command-menu-group-heading {
    padding: var(--command-menu-group-heading-padding, 8px 12px 4px);
    font-size: var(--command-menu-group-heading-font-size, 12px);
    font-weight: var(--command-menu-group-heading-font-weight, 600);
    color: var(--command-menu-group-heading-color, #94a3b8);
    text-transform: var(--command-menu-group-heading-text-transform, uppercase);
    letter-spacing: var(--command-menu-group-heading-letter-spacing, 0.05em);
  }

  .command-menu-item {
    display: flex;
    align-items: center;
    padding: var(--command-menu-item-padding, 10px 12px);
    border-radius: var(--command-menu-item-border-radius, var(--radius, 4px));
    cursor: pointer;
    gap: var(--command-menu-item-gap, 10px);
    font-size: var(--command-menu-item-font-size, 14px);
    color: var(--command-menu-item-color, #334155);
    transition: background-color 0.1s;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    font-family: inherit;
  }

  .command-menu-item.active {
    background-color: var(--command-menu-item-active-background, #f1f5f9);
    color: var(--command-menu-item-active-color, #0f172a);
  }

  .command-menu-item.disabled {
    opacity: var(--command-menu-item-disabled-opacity, 0.4);
    cursor: not-allowed;
  }

  .command-menu-item-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .command-menu-item-icon-img-wrapper {
    --image-width: var(--command-menu-item-icon-size, 20px);
    --image-height: var(--command-menu-item-icon-size, 20px);

    /* Mirrors --command-menu-search-icon-color, which this component already had. */
    color: var(--command-menu-item-icon-color, inherit);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .command-menu-item-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .command-menu-item-shortcut {
    display: flex;
    align-items: center;
    gap: var(--command-menu-shortcut-gap, 4px);
    flex-shrink: 0;
  }

  .command-menu-kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--command-menu-kbd-min-width, 24px);
    height: var(--command-menu-kbd-height, 22px);
    padding: var(--command-menu-kbd-padding, 0 6px);
    border-radius: var(--command-menu-kbd-border-radius, var(--radius, 4px));
    background-color: var(--command-menu-kbd-background, #f1f5f9);
    border: var(--command-menu-kbd-border, 1px solid #e2e8f0);
    color: var(--command-menu-kbd-color, #64748b);
    font-size: var(--command-menu-kbd-font-size, 11px);
    font-family: var(--command-menu-kbd-font-family, inherit);
    font-weight: var(--command-menu-kbd-font-weight, 500);
    box-shadow: var(--command-menu-kbd-box-shadow, 0 1px 0 #e2e8f0);
  }
</style>
