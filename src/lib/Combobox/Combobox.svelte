<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Input from '../Input/Input.svelte';
  import type { ComboboxItem, ComboboxProperties } from './properties';

  function defaultFilter(item: ComboboxItem, query: string): boolean {
    return item.label.toLowerCase().includes(query.toLowerCase());
  }

  let {
    items,
    value = $bindable(''),
    inputValue = $bindable(''),
    open = $bindable(false),
    highlightedIndex = $bindable(-1),
    placeholder = '',
    disabled = false,
    name,
    testId,
    classes,
    noResultsText = 'No results',
    ariaLabel,
    filterFn = defaultFilter,
    inputProperties,
    inputEventProperties,
    itemSnippet,
    emptySnippet,
    inputPrefix,
    inputSuffix,
    dropdownHeader,
    dropdownFooter,
    onselect,
    oninput,
    onopen,
    onclose,
    onkeydown,
    onfocus,
    onblur
  }: ComboboxProperties = $props();

  let containerEl: HTMLDivElement | null = $state(null);
  let inputRef: ReturnType<typeof Input> | null = $state(null);

  export function getInputRef(): HTMLInputElement | HTMLTextAreaElement | null {
    return inputRef?.getInputRef() ?? null;
  }

  const listboxId = `combobox-listbox-${Math.random().toString(36).slice(2, 9)}`;

  let filteredItems: ComboboxItem[] = $derived(
    inputValue.length > 0 ? items.filter((item) => filterFn(item, inputValue)) : items
  );

  let selectableItems: ComboboxItem[] = $derived(
    filteredItems.filter((item) => item.disabled !== true)
  );

  let highlightedOptionId: string | null = $derived(
    highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : null
  );

  function openDropdown() {
    if (disabled || open) {
      return;
    }
    open = true;
    highlightedIndex = -1;
    onopen?.();
  }

  function closeDropdown() {
    if (!open) {
      return;
    }
    open = false;
    highlightedIndex = -1;
    onclose?.();
  }

  function selectItem(item: ComboboxItem) {
    if (item.disabled === true) {
      return;
    }
    value = item.id;
    inputValue = item.label;
    onselect?.(item);
    closeDropdown();
  }

  function getFilteredSelectableIndex(item: ComboboxItem): number {
    let selectableIdx = 0;
    for (let i = 0; i < filteredItems.length; i++) {
      if (filteredItems[i] === item) {
        return filteredItems[i].disabled === true ? -1 : selectableIdx;
      }
      if (filteredItems[i].disabled !== true) {
        selectableIdx++;
      }
    }
    return -1;
  }

  async function moveHighlight(delta: number): Promise<void> {
    if (selectableItems.length === 0) {
      return;
    }
    let next = highlightedIndex + delta;
    if (next < 0) {
      next = selectableItems.length - 1;
    } else if (next >= selectableItems.length) {
      next = 0;
    }
    highlightedIndex = next;
    await tick();
    if (containerEl !== null) {
      const el = containerEl.querySelector('.combobox-option.highlighted');
      if (el instanceof HTMLElement && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  function selectHighlighted() {
    if (highlightedIndex < 0 || highlightedIndex >= selectableItems.length) {
      return;
    }
    const item = selectableItems.at(highlightedIndex);
    if (typeof item === 'object' && item !== null) {
      selectItem(item);
    }
  }

  function handleInput(val: string, _event: Event) {
    inputValue = val;
    oninput?.(val);
    inputEventProperties?.onInput?.(val, _event);
    if (!open) {
      openDropdown();
    }
    highlightedIndex = -1;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (disabled) {
      return;
    }
    onkeydown?.(event);
    if (event.defaultPrevented) {
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) {
          openDropdown();
        } else {
          moveHighlight(1);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (open) {
          moveHighlight(-1);
        }
        break;
      case 'Enter':
        if (open && highlightedIndex >= 0) {
          event.preventDefault();
          selectHighlighted();
        }
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          closeDropdown();
        }
        break;
      case 'Tab':
        if (open) {
          closeDropdown();
        }
        break;
    }
  }

  function handleFocus(event: FocusEvent) {
    openDropdown();
    onfocus?.(event);
    inputEventProperties?.onFocus?.(event);
  }

  function handleBlur(event: FocusEvent) {
    onblur?.(event);
    inputEventProperties?.onBlur?.(event);
  }

  function handleClickOutside(event: Event) {
    if (
      event.target instanceof Node &&
      containerEl !== null &&
      !containerEl.contains(event.target)
    ) {
      closeDropdown();
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="combobox {classes ?? ''}" class:disabled bind:this={containerEl} data-pw={testId}>
  <div class="combobox-input-wrapper">
    {#if typeof inputPrefix === 'function'}
      <div class="combobox-input-prefix">{@render inputPrefix()}</div>
    {/if}
    <div class="combobox-input">
      <Input
        {...inputProperties}
        bind:value={inputValue}
        bind:this={inputRef}
        {placeholder}
        {name}
        disable={disabled}
        autoComplete="off"
        actionInput={true}
        testId={typeof testId === 'string' ? `${testId}-input` : ''}
        role="combobox"
        ariaExpanded={open}
        ariaAutocomplete="list"
        ariaControls={open ? listboxId : null}
        ariaActivedescendant={highlightedOptionId ?? null}
        onInput={handleInput}
        onKeyDown={handleKeydown}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </div>
    {#if typeof inputSuffix === 'function'}
      <div class="combobox-input-suffix">{@render inputSuffix()}</div>
    {/if}
  </div>

  {#if open && !disabled}
    <div class="combobox-dropdown" role="listbox" id={listboxId} aria-label={ariaLabel}>
      {#if typeof dropdownHeader === 'function'}
        <div class="combobox-dropdown-header">{@render dropdownHeader()}</div>
      {/if}
      {#if filteredItems.length === 0}
        {#if typeof emptySnippet === 'function'}
          {@render emptySnippet()}
        {:else}
          <div class="combobox-empty">{noResultsText}</div>
        {/if}
      {:else}
        {#each filteredItems as item, _index (item.id)}
          {@const selectableIndex = getFilteredSelectableIndex(item)}
          {@const isHighlighted = item.disabled !== true && selectableIndex === highlightedIndex}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="combobox-option"
            class:highlighted={isHighlighted}
            class:selected={item.id === value}
            class:combobox-option-disabled={item.disabled === true}
            role="option"
            id={`${listboxId}-option-${selectableIndex}`}
            aria-selected={item.id === value}
            aria-disabled={item.disabled === true ? 'true' : null}
            tabindex="-1"
            onclick={() => selectItem(item)}
            onmouseenter={() => {
              if (item.disabled !== true) {
                highlightedIndex = selectableIndex;
              }
            }}
            data-pw={typeof testId === 'string' ? `${testId}-option-${item.id}` : null}
          >
            {#if typeof itemSnippet === 'function'}
              {@render itemSnippet(item, isHighlighted)}
            {:else}
              {item.label}
            {/if}
          </div>
        {/each}
      {/if}
      {#if typeof dropdownFooter === 'function'}
        <div class="combobox-dropdown-footer">{@render dropdownFooter()}</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .combobox {
    position: relative;
    width: var(--combobox-width, 100%);
    font-family: var(--combobox-font-family, inherit);
    font-size: var(--combobox-font-size, 14px);
    color: var(--combobox-color, #333333);
  }

  .combobox.disabled {
    opacity: var(--combobox-disabled-opacity, 0.5);
    cursor: var(--combobox-disabled-cursor, not-allowed);
    pointer-events: none;
  }

  .combobox-input-wrapper {
    display: flex;
    align-items: center;
    background: var(--combobox-input-background, #ffffff);
    border: var(--combobox-input-border, 1px solid #cccccc);
    border-radius: var(--combobox-input-border-radius, 6px);
    transition: var(--combobox-input-transition, border-color 0.15s, box-shadow 0.15s);
  }

  .combobox-input-wrapper:hover {
    border-color: var(--combobox-input-hover-border-color, #999999);
  }

  .combobox-input-wrapper:focus-within {
    border-color: var(--combobox-input-focus-border-color, #2563eb);
    box-shadow: var(--combobox-input-focus-shadow, 0 0 0 2px rgba(37, 99, 235, 0.2));
  }

  .combobox-input-prefix {
    display: flex;
    align-items: center;
    padding-left: var(--combobox-input-prefix-padding, 8px);
    flex-shrink: 0;
  }

  .combobox-input-suffix {
    display: flex;
    align-items: center;
    padding-right: var(--combobox-input-suffix-padding, 8px);
    flex-shrink: 0;
  }

  .combobox-input {
    flex: 1;
    min-width: 0;
    --input-border: none;
    --input-focus-border: none;
    --input-box-shadow: none;
    --input-margin: 0;
    --input-width: 100%;
    --input-padding: var(--combobox-input-padding, 8px 12px);
    --input-background: transparent;
    --input-font-size: inherit;
    --input-font-family: inherit;
    --input-font-weight: inherit;
    --input-text-color: inherit;
    --input-radius: 0;
  }

  .combobox-input::placeholder {
    color: var(--combobox-placeholder-color, #999999);
  }

  .combobox-dropdown {
    position: absolute;
    top: var(--combobox-dropdown-top, 100%);
    left: var(--combobox-dropdown-left, 0);
    right: var(--combobox-dropdown-right, 0);
    margin-top: var(--combobox-dropdown-gap, 4px);
    background: var(--combobox-dropdown-background, #ffffff);
    border: var(--combobox-dropdown-border, 1px solid #cccccc);
    border-radius: var(--combobox-dropdown-border-radius, 6px);
    box-shadow: var(--combobox-dropdown-shadow, 0 4px 12px rgba(0, 0, 0, 0.1));
    max-height: var(--combobox-dropdown-max-height, 200px);
    overflow-y: auto;
    z-index: var(--combobox-dropdown-z-index, 10);
    padding: var(--combobox-dropdown-padding, 0);
  }

  .combobox-option {
    padding: var(--combobox-option-padding, 8px 12px);
    color: var(--combobox-option-color, #333333);
    font-size: var(--combobox-option-font-size, inherit);
    font-weight: var(--combobox-option-font-weight, inherit);
    cursor: pointer;
    transition: background 0.1s;
  }

  .combobox-option:hover,
  .combobox-option.highlighted {
    background: var(--combobox-option-hover-background, #f0f0f0);
    color: var(--combobox-option-hover-color, var(--combobox-option-color, #333333));
  }

  .combobox-option.selected {
    background: var(--combobox-option-selected-background, #e8f0fe);
    color: var(--combobox-option-selected-color, var(--combobox-option-color, #333333));
    font-weight: var(
      --combobox-option-selected-font-weight,
      var(--combobox-option-font-weight, inherit)
    );
  }

  .combobox-option.selected.highlighted {
    background: var(
      --combobox-option-selected-hover-background,
      var(--combobox-option-selected-background, #e8f0fe)
    );
  }

  .combobox-option-disabled {
    opacity: var(--combobox-option-disabled-opacity, 0.4);
    cursor: var(--combobox-option-disabled-cursor, not-allowed);
    pointer-events: none;
  }

  .combobox-dropdown-header {
    border-bottom: var(--combobox-dropdown-header-border, none);
    padding: var(--combobox-dropdown-header-padding, 0);
  }

  .combobox-dropdown-footer {
    border-top: var(--combobox-dropdown-footer-border, none);
    padding: var(--combobox-dropdown-footer-padding, 0);
  }

  .combobox-empty {
    padding: var(--combobox-empty-padding, 8px 12px);
    color: var(--combobox-empty-color, #999999);
    font-style: var(--combobox-empty-font-style, italic);
  }
</style>
