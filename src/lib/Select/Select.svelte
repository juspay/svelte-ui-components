<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { SelectItem, SelectProperties } from './properties';
  import Pill from '$lib/Pill/Pill.svelte';
  import chevronDownSvg from '$lib/assets/chevron-down.svg?raw';

  let {
    items,
    value = $bindable([]),
    open = $bindable(false),
    manageOpenState = true,
    multiple = false,
    searchable = false,
    placeholder = '',
    disabled = false,
    testId,
    onchange,
    onopen,
    onclose,
    classes,
    allowSelectAll = true,
    showSelectButton = false,
    bottomContent
  }: SelectProperties = $props();

  let isOpen = $state(false);
  let query = $state('');
  let highlightedIndex = $state(-1);
  let containerEl: HTMLDivElement | null = $state(null);
  let searchInputEl: HTMLInputElement | null = $state(null);
  let triggerEl: HTMLDivElement | null = $state(null);

  /**
   * Pending selection used when showSelectButton is true.
   * We only commit to `value` and fire onchange when Apply is clicked.
   */
  let pendingValue: string[] = $state([]);

  const listboxId = `select-listbox-${Math.random().toString(36).slice(2, 9)}`;

  const getLabel = (id: string): string => {
    const found = items.find((item) => item.id === id);
    return typeof found === 'object' ? found.label : id;
  };

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

  /**
   * The effective selected set shown in the dropdown checkboxes / select-all row.
   * In deferred mode this is pendingValue so the UI reflects staged choices.
   */
  let activeSelection: string[] = $derived(showSelectButton && multiple ? pendingValue : value);

  const allSelected: boolean = $derived(
    items.length > 0 && items.every((item) => activeSelection.includes(item.id))
  );

  /** Open the dropdown panel. Respects disabled and manageOpenState. */
  const openDropdown = async (): Promise<void> => {
    if (disabled) {
      return;
    }
    if (manageOpenState) {
      isOpen = true;
    }
    open = true;
    highlightedIndex = -1;
    query = '';
    if (multiple && showSelectButton) {
      pendingValue = [...value];
    }
    onopen?.();
    if (searchable) {
      await tick();
      if (searchInputEl !== null) {
        searchInputEl.focus();
      }
    }
  };

  /** Close the dropdown panel. Resets deferred state without committing. */
  const closeDropdown = (): void => {
    if (manageOpenState) {
      isOpen = false;
    }
    open = false;
    query = '';
    highlightedIndex = -1;
    pendingValue = [];
    onclose?.();
  };

  /**
   * Whether the dropdown panel is currently visible.
   * When manageOpenState is false the parent's `open` prop drives this.
   */
  const panelVisible: boolean = $derived(manageOpenState ? isOpen : open);

  const selectItem = (id: string): void => {
    if (disabled) {
      return;
    }
    if (multiple) {
      if (showSelectButton) {
        pendingValue = pendingValue.includes(id)
          ? pendingValue.filter((pendingId) => pendingId !== id)
          : [...pendingValue, id];
      } else {
        value = value.includes(id)
          ? value.filter((existingId) => existingId !== id)
          : [...value, id];
        onchange?.(value);
      }
    } else {
      value = [id];
      onchange?.(value);
      closeDropdown();
    }
  };

  const toggleSelectAll = (): void => {
    if (disabled) {
      return;
    }
    if (showSelectButton) {
      pendingValue = allSelected ? [] : items.map((item) => item.id);
    } else {
      value = allSelected ? [] : items.map((item) => item.id);
      onchange?.(value);
    }
  };

  const applySelection = (): void => {
    value = [...pendingValue];
    onchange?.(value);
    closeDropdown();
  };

  const removeItem = (id: string): void => {
    if (disabled) {
      return;
    }
    value = value.filter((existingId) => existingId !== id);
    onchange?.(value);
  };

  const selectHighlighted = (): void => {
    const itemsWithSelectAll =
      allowSelectAll && multiple ? [null, ...filteredItems] : filteredItems;
    const highlighted = itemsWithSelectAll.at(highlightedIndex);
    if (highlighted === null) {
      toggleSelectAll();
    } else if (typeof highlighted === 'object' && highlighted !== null) {
      selectItem(highlighted.id);
    }
  };

  const moveHighlight = async (delta: number): Promise<void> => {
    const rowCount = allowSelectAll && multiple ? filteredItems.length + 1 : filteredItems.length;
    const next = highlightedIndex + delta;
    if (next < 0 || next >= rowCount) {
      return;
    }
    highlightedIndex = next;
    await tick();
    if (containerEl !== null) {
      const highlighted = containerEl.querySelector(
        '.select-option.highlighted, .select-all-option.highlighted'
      );
      if (highlighted instanceof HTMLElement) {
        highlighted.scrollIntoView({ block: 'nearest' });
      }
    }
  };

  const handleTriggerClick = (event: MouseEvent): void => {
    if (event.target instanceof HTMLInputElement) {
      if (!panelVisible) {
        openDropdown();
      }
      return;
    }
    if (!manageOpenState) {
      return;
    }
    if (multiple && searchable) {
      openDropdown();
    } else if (panelVisible) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  const handleKeydown = (event: KeyboardEvent): void => {
    if (disabled) {
      return;
    }
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (panelVisible) {
          selectHighlighted();
        } else {
          openDropdown();
        }
        break;
      case ' ':
        if (!(event.target instanceof HTMLInputElement)) {
          event.preventDefault();
          if (panelVisible) {
            selectHighlighted();
          } else {
            openDropdown();
          }
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (panelVisible) {
          moveHighlight(1);
        } else {
          openDropdown();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveHighlight(-1);
        break;
      case 'Escape':
        if (panelVisible) {
          closeDropdown();
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
        if (panelVisible) {
          closeDropdown();
        }
        break;
    }
  };

  const handleSearchInput = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    query = event.target.value;
    if (!panelVisible) {
      isOpen = true;
    }
    highlightedIndex = -1;
  };

  const handleSearchFocus = (): void => {
    if (!panelVisible) {
      openDropdown();
    }
  };

  const handleClickOutside = (event: Event): void => {
    if (
      event.target instanceof Node &&
      containerEl !== null &&
      !containerEl.contains(event.target)
    ) {
      closeDropdown();
    }
  };

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div
  class="select {classes ?? ''}"
  class:open={panelVisible}
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
    aria-expanded={panelVisible}
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
        value={panelVisible ? query : displayText}
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

  {#if panelVisible && !disabled}
    <div class="select-dropdown" role="listbox" id={listboxId} aria-multiselectable={multiple}>
      <div class="select-items">
        {#if filteredItems.length === 0}
          <div class="select-empty">No results</div>
        {:else}
          {#if multiple && allowSelectAll}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="select-option select-all-option"
              class:selected={allSelected}
              class:highlighted={highlightedIndex === 0}
              role="option"
              aria-selected={allSelected}
              tabindex="-1"
              onclick={toggleSelectAll}
              onmouseenter={() => (highlightedIndex = 0)}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </div>
          {/if}
          {#each filteredItems as item, index (item.id)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="select-option"
              class:selected={activeSelection.includes(item.id)}
              class:highlighted={index ===
                (allowSelectAll && multiple ? highlightedIndex - 1 : highlightedIndex)}
              role="option"
              id={`${listboxId}-option-${index}`}
              aria-selected={activeSelection.includes(item.id)}
              tabindex="-1"
              onclick={() => selectItem(item.id)}
              onmouseenter={() =>
                (highlightedIndex = allowSelectAll && multiple ? index + 1 : index)}
            >
              {item.label}
            </div>
          {/each}
        {/if}
      </div>

      {#if multiple && showSelectButton}
        <div class="select-apply-bar">
          <button
            class="select-apply-btn"
            type="button"
            onclick={applySelection}
            {...typeof testId === 'string' ? { 'data-pw': `${testId}-apply` } : {}}
          >
            Apply
          </button>
        </div>
      {/if}

      {#if bottomContent}
        <div class="select-bottom-content">
          {@render bottomContent()}
        </div>
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .select-placeholder {
    flex: 1;
    color: var(--select-placeholder-color, #999999);
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
    overflow: hidden;
    z-index: var(--select-dropdown-z-index, 10);
  }

  .select-items {
    max-height: var(--select-dropdown-max-height, 200px);
    overflow-y: auto;
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

  .select-all-option {
    border-bottom: var(--select-all-option-border, 1px solid #eeeeee);
    font-size: var(--select-all-option-font-size, inherit);
  }

  .select-empty {
    padding: var(--select-empty-padding, 8px 12px);
    color: var(--select-empty-color, #999999);
    font-style: var(--select-empty-font-style, italic);
    font-size: var(--select-empty-font-size, inherit);
  }

  .select-apply-bar {
    display: flex;
    justify-content: flex-end;
    padding: var(--select-apply-bar-padding, 8px 12px);
    border-top: var(--select-apply-bar-border, 1px solid #eeeeee);
    background: var(--select-apply-background, #ffffff);
  }

  .select-apply-btn {
    padding: var(--select-apply-btn-padding, 6px 16px);
    background: var(--select-apply-btn-background, #2563eb);
    color: var(--select-apply-btn-color, #ffffff);
    border: none;
    border-radius: var(--select-apply-btn-border-radius, 4px);
    font-size: var(--select-apply-btn-font-size, 13px);
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .select-apply-btn:hover {
    opacity: var(--select-apply-btn-hover-opacity, 0.85);
  }

  .select-bottom-content {
    border-top: var(--select-bottom-content-border, 1px solid #eeeeee);
    background: var(--select-bottom-content-background, #ffffff);
  }

  .select-trigger :global(.pill) {
    --pill-background: var(--select-pill-background, #e0e0e0);
    --pill-color: var(--select-pill-color, #333333);
    --pill-border-radius: var(--select-pill-border-radius, 999px);
    --pill-padding: var(--select-pill-padding, 2px 8px);
    --pill-font-size: var(--select-pill-font-size, 13px);
  }
</style>
