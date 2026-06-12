<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { SelectItem, SelectProperties } from './properties';
  import Pill from '$lib/Pill/Pill.svelte';
  import chevronDownSvg from '$lib/assets/chevron-down.svg?raw';

  let {
    items,
    value = $bindable([]),
    multiple = false,
    searchable = false,
    placeholder = '',
    disabled = false,
    testId,
    onchange,
    classes
  }: SelectProperties = $props();

  let isOpen = $state(false);
  let query = $state('');
  let highlightedIndex = $state(-1);
  let containerEl: HTMLDivElement | null = $state(null);
  let searchInputEl: HTMLInputElement | null = $state(null);
  let triggerEl: HTMLDivElement | null = $state(null);

  const listboxId = `select-listbox-${Math.random().toString(36).slice(2, 9)}`;

  function getLabel(id: string): string {
    const found = items.find((item) => item.id === id);
    return typeof found === 'object' ? found.label : id;
  }

  let filteredItems: SelectItem[] = $derived(
    searchable && query.length > 0
      ? items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
      : items
  );

  let displayText = $derived.by(() => {
    const firstId = value.at(0);
    if (typeof firstId !== 'string') {
      return '';
    }
    return getLabel(firstId);
  });

  let highlightedOptionId: string | null = $derived(
    highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : null
  );

  let searchPlaceholder = $derived(isOpen && displayText.length > 0 ? displayText : placeholder);

  async function open(): Promise<void> {
    if (disabled || isOpen) {
      return;
    }
    isOpen = true;
    highlightedIndex = -1;
    query = '';
    if (searchable) {
      await tick();
      if (searchInputEl !== null) {
        searchInputEl.focus();
      }
    }
  }

  function close(): void {
    isOpen = false;
    query = '';
    highlightedIndex = -1;
  }

  function selectItem(id: string): void {
    if (disabled) {
      return;
    }
    if (multiple) {
      value = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    } else {
      value = [id];
      close();
    }
    onchange?.(value);
  }

  function removeItem(id: string): void {
    if (disabled) {
      return;
    }
    value = value.filter((v) => v !== id);
    onchange?.(value);
  }

  function selectHighlighted(): void {
    if (highlightedIndex < 0 || highlightedIndex >= filteredItems.length) {
      return;
    }
    const item = filteredItems.at(highlightedIndex);
    if (typeof item === 'object' && item !== null) {
      selectItem(item.id);
    }
  }

  async function moveHighlight(delta: number): Promise<void> {
    const next = highlightedIndex + delta;
    if (next < 0 || next >= filteredItems.length) {
      return;
    }
    highlightedIndex = next;
    await tick();
    if (containerEl !== null) {
      const el = containerEl.querySelector('.select-option.highlighted');
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  function handleTriggerClick(event: MouseEvent): void {
    if (event.target instanceof HTMLInputElement) {
      if (!isOpen) {
        open();
      }
      return;
    }
    if (multiple && searchable) {
      open();
    } else if (isOpen) {
      close();
    } else {
      open();
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (disabled) {
      return;
    }
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (isOpen) {
          selectHighlighted();
        } else {
          open();
        }
        break;
      case ' ':
        if (!(event.target instanceof HTMLInputElement)) {
          event.preventDefault();
          if (isOpen) {
            selectHighlighted();
          } else {
            open();
          }
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (isOpen) {
          moveHighlight(1);
        } else {
          open();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveHighlight(-1);
        break;
      case 'Escape':
        if (isOpen) {
          close();
          if (!searchable && triggerEl !== null) {
            triggerEl.focus();
          }
        }
        break;
      case 'Backspace':
        if (multiple && query === '' && value.length > 0) {
          const lastId = value.at(-1);
          if (typeof lastId === 'string') {
            removeItem(lastId);
          }
        }
        break;
      case 'Tab':
        if (isOpen) {
          close();
        }
        break;
    }
  }

  function handleSearchInput(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    query = event.target.value;
    if (!isOpen) {
      isOpen = true;
    }
    highlightedIndex = -1;
  }

  function handleSearchFocus(): void {
    if (!isOpen) {
      open();
    }
  }

  function handleClickOutside(event: Event): void {
    if (
      event.target instanceof Node &&
      containerEl !== null &&
      !containerEl.contains(event.target)
    ) {
      close();
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div
  class="select {classes ?? ''}"
  class:open={isOpen}
  class:disabled
  bind:this={containerEl}
  {...typeof testId === 'string' ? { 'data-pw': testId } : {}}
>
  <div
    class="select-trigger"
    bind:this={triggerEl}
    onclick={handleTriggerClick}
    onkeydown={handleKeydown}
    role="combobox"
    aria-expanded={isOpen}
    aria-haspopup="listbox"
    aria-controls={listboxId}
    {...highlightedOptionId !== null ? { 'aria-activedescendant': highlightedOptionId } : {}}
    tabindex={disabled ? -1 : searchable ? -1 : 0}
  >
    {#if multiple}
      {#each value as id (id)}
        <Pill
          text={getLabel(id)}
          dismissible
          {disabled}
          ondismiss={() => removeItem(id)}
          {...typeof testId === 'string' ? { testId: `${testId}-pill-${id}` } : {}}
        />
      {/each}
      {#if searchable}
        <input
          class="select-search"
          type="text"
          value={query}
          oninput={handleSearchInput}
          onfocus={handleSearchFocus}
          bind:this={searchInputEl}
          placeholder={value.length === 0 ? placeholder : ''}
          {disabled}
          autocomplete="off"
          tabindex={disabled ? -1 : 0}
        />
      {:else if value.length === 0}
        <span class="select-placeholder">{placeholder}</span>
      {/if}
    {:else if searchable}
      <input
        class="select-search"
        type="text"
        value={isOpen ? query : displayText}
        oninput={handleSearchInput}
        onfocus={handleSearchFocus}
        bind:this={searchInputEl}
        placeholder={searchPlaceholder}
        {disabled}
        autocomplete="off"
        tabindex={disabled ? -1 : 0}
      />
    {:else}
      <span class={displayText.length > 0 ? 'select-value' : 'select-placeholder'}>
        {displayText.length > 0 ? displayText : placeholder}
      </span>
    {/if}
    <!-- eslint-disable svelte/no-at-html-tags -->
    <span class="select-arrow">{@html chevronDownSvg}</span>
  </div>

  {#if isOpen && !disabled}
    <div class="select-dropdown" role="listbox" id={listboxId} aria-multiselectable={multiple}>
      {#if filteredItems.length === 0}
        <div class="select-empty">No results</div>
      {:else}
        {#each filteredItems as item, index (item.id)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="select-option"
            class:selected={value.includes(item.id)}
            class:highlighted={index === highlightedIndex}
            role="option"
            id={`${listboxId}-option-${index}`}
            aria-selected={value.includes(item.id)}
            tabindex="-1"
            onclick={() => selectItem(item.id)}
            onmouseenter={() => (highlightedIndex = index)}
          >
            {item.label}
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .select {
    position: relative;
    width: var(--select-width, 100%);
    font-family: var(--select-font-family, inherit);
    font-size: var(--select-font-size, 14px);
    color: var(--select-color, #333333);
  }

  .select.disabled {
    opacity: var(--select-disabled-opacity, 0.5);
    cursor: var(--select-disabled-cursor, not-allowed);
    pointer-events: none;
  }

  .select-trigger {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--select-trigger-gap, 4px);
    min-height: var(--select-trigger-min-height, 40px);
    padding: var(--select-trigger-padding, 8px 12px);
    background: var(--select-trigger-background, #ffffff);
    border: var(--select-trigger-border, 1px solid #cccccc);
    border-radius: var(--select-trigger-border-radius, 6px);
    box-shadow: var(--select-trigger-box-shadow, none);
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    transition: var(--select-trigger-transition, border-color 0.15s, box-shadow 0.15s);
  }

  .select-trigger:hover:not(.disabled .select-trigger) {
    border-color: var(--select-trigger-hover-border-color, #999999);
  }

  .select-trigger:focus-within,
  .select.open .select-trigger {
    border-color: var(--select-trigger-focus-border-color, #2563eb);
    box-shadow: var(--select-trigger-focus-shadow, 0 0 0 2px rgba(37, 99, 235, 0.2));
  }

  .select-value {
    flex: 1;
    font-size: var(--select-value-font-size, inherit);
    font-weight: var(--select-value-font-weight, inherit);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .select-placeholder {
    flex: 1;
    color: var(--select-placeholder-color, #999999);
    font-size: var(--select-placeholder-font-size, inherit);
    font-weight: var(--select-placeholder-font-weight, inherit);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .select-search {
    flex: 1;
    min-width: 60px;
    border: none;
    outline: none;
    background: transparent;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    padding: 0;
    cursor: text;
  }

  .select-search::placeholder {
    color: var(--select-placeholder-color, #999999);
  }

  .select-arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--select-arrow-size, 16px);
    height: var(--select-arrow-size, 16px);
    color: var(--select-arrow-color, #666666);
    flex-shrink: 0;
    transition: transform 0.15s;
  }

  .select.open .select-arrow {
    transform: rotate(180deg);
  }

  .select-arrow :global(svg) {
    width: 100%;
    height: 100%;
  }

  .select-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: var(--select-dropdown-gap, 4px);
    background: var(--select-dropdown-background, #ffffff);
    border: var(--select-dropdown-border, 1px solid #cccccc);
    border-radius: var(--select-dropdown-border-radius, 6px);
    box-shadow: var(--select-dropdown-shadow, 0 4px 12px rgba(0, 0, 0, 0.1));
    max-height: var(--select-dropdown-max-height, 200px);
    overflow-y: auto;
    z-index: var(--select-dropdown-z-index, 10);
  }

  .select-option {
    padding: var(--select-option-padding, 8px 12px);
    color: var(--select-option-color, #333333);
    font-size: var(--select-option-font-size, inherit);
    cursor: pointer;
    transition: background 0.1s;
  }

  .select-option:hover,
  .select-option.highlighted {
    background: var(--select-option-hover-background, #f0f0f0);
    color: var(--select-option-hover-color, var(--select-option-color, #333333));
  }

  .select-option.selected {
    background: var(--select-option-selected-background, #e8f0fe);
    color: var(--select-option-selected-color, var(--select-option-color, #333333));
  }

  .select-option.selected.highlighted {
    background: var(
      --select-option-selected-hover-background,
      var(--select-option-selected-background, #e8f0fe)
    );
  }

  .select-empty {
    padding: var(--select-empty-padding, 8px 12px);
    color: var(--select-empty-color, #999999);
    font-style: var(--select-empty-font-style, italic);
    font-size: var(--select-empty-font-size, inherit);
  }

  .select-trigger :global(.pill) {
    --pill-background: var(--select-pill-background, #e0e0e0);
    --pill-color: var(--select-pill-color, #333333);
    --pill-border-radius: var(--select-pill-border-radius, 999px);
    --pill-padding: var(--select-pill-padding, 2px 8px);
    --pill-font-size: var(--select-pill-font-size, 13px);
  }
</style>
