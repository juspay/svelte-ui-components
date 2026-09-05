<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Input from '../Input/Input.svelte';
  import Pill from '../Pill/Pill.svelte';
  import type { ComboboxItem, ComboboxProperties } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';

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
    // multi-select + create/action
    multiple = false,
    selected = $bindable([]),
    maxSelected,
    maxSelectedText,
    pillSnippet,
    allowCreate = false,
    createLabel = (query: string) => `Create "${query}"`,
    action,
    actionIcon,
    onselect: onselectProp,
    onSelect,
    oninput: oninputProp,
    onInput,
    onopen: onopenProp,
    onOpen,
    onclose: oncloseProp,
    onClose,
    onkeydown,
    onfocus,
    onblur,
    onchange: onchangeProp,
    onChange,
    onadd: onaddProp,
    onAdd,
    onremove: onremoveProp,
    onRemove,
    oncreate: oncreateProp,
    onCreate
  }: ComboboxProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onadd = $derived(resolveDeprecatedProp('Combobox', 'onAdd', 'onadd', onAdd, onaddProp));
  const onchange = $derived(
    resolveDeprecatedProp('Combobox', 'onChange', 'onchange', onChange, onchangeProp)
  );
  const onclose = $derived(
    resolveDeprecatedProp('Combobox', 'onClose', 'onclose', onClose, oncloseProp)
  );
  const oncreate = $derived(
    resolveDeprecatedProp('Combobox', 'onCreate', 'oncreate', onCreate, oncreateProp)
  );
  const oninput = $derived(
    resolveDeprecatedProp('Combobox', 'onInput', 'oninput', onInput, oninputProp)
  );
  const onopen = $derived(
    resolveDeprecatedProp('Combobox', 'onOpen', 'onopen', onOpen, onopenProp)
  );
  const onremove = $derived(
    resolveDeprecatedProp('Combobox', 'onRemove', 'onremove', onRemove, onremoveProp)
  );
  const onselect = $derived(
    resolveDeprecatedProp('Combobox', 'onSelect', 'onselect', onSelect, onselectProp)
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(onadd, onchange, onclose, oncreate, oninput, onopen, onremove, onselect);
  });

  let containerEl: HTMLDivElement | null = $state(null);
  let inputRef: ReturnType<typeof Input> | null = $state(null);

  export function getInputRef(): HTMLInputElement | HTMLTextAreaElement | null {
    return inputRef?.getInputRef() ?? null;
  }

  function focusInput(): void {
    inputRef?.getInputRef()?.focus();
  }

  const listboxId = `combobox-listbox-${Math.random().toString(36).slice(2, 9)}`;

  let selectedSet = $derived(new Set(selected));
  let trimmedQuery = $derived(inputValue.trim());

  let filteredItems: ComboboxItem[] = $derived(
    items.filter((item) => {
      if (multiple && selectedSet.has(item.id)) {
        return false;
      }
      return inputValue.length > 0 ? filterFn(item, inputValue) : true;
    })
  );

  let selectableItems: ComboboxItem[] = $derived(
    filteredItems.filter((item) => item.disabled !== true)
  );

  let exactMatch: ComboboxItem | null = $derived(
    items.find((item) => item.label.toLowerCase() === trimmedQuery.toLowerCase()) ?? null
  );

  let atLimit = $derived(
    multiple && typeof maxSelected === 'number' && selected.length >= maxSelected
  );

  let limitText = $derived(
    maxSelectedText ??
      (typeof maxSelected === 'number'
        ? `You can select up to ${maxSelected}.`
        : 'Selection limit reached.')
  );

  let showCreate = $derived(
    allowCreate &&
      !atLimit &&
      trimmedQuery !== '' &&
      exactMatch === null &&
      !(multiple && selectedSet.has(trimmedQuery))
  );

  // Navigable rows: selectable options (hidden at the limit) → create → action.
  let navItemCount = $derived(atLimit ? 0 : selectableItems.length);
  let createNavIndex = $derived(showCreate ? navItemCount : -1);
  let actionNavIndex = $derived(action ? navItemCount + (showCreate ? 1 : 0) : -1);
  let navCount = $derived(navItemCount + (showCreate ? 1 : 0) + (action ? 1 : 0));

  let highlightedOptionId: string | null = $derived(
    highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : null
  );

  const labelOf = (id: string): string => items.find((item) => item.id === id)?.label ?? id;

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

  function emitChange(): void {
    onchange?.([...selected]);
  }

  function addValue(id: string): void {
    if (atLimit || selectedSet.has(id)) {
      return;
    }
    selected = [...selected, id];
    inputValue = '';
    highlightedIndex = -1;
    onadd?.(id);
    emitChange();
    focusInput();
  }

  function removeValue(id: string): void {
    if (!selectedSet.has(id)) {
      return;
    }
    selected = selected.filter((current) => current !== id);
    onremove?.(id);
    emitChange();
  }

  function selectItem(item: ComboboxItem) {
    if (item.disabled === true) {
      return;
    }
    onselect?.(item);
    if (multiple) {
      addValue(item.id);
      return;
    }
    value = item.id;
    inputValue = item.label;
    closeDropdown();
  }

  function create(): void {
    const created = trimmedQuery;
    if (created === '') {
      return;
    }
    oncreate?.(created);
    if (multiple) {
      addValue(created);
      return;
    }
    value = created;
    inputValue = created;
    closeDropdown();
  }

  function runAction(): void {
    action?.onClick();
    if (!action?.keepOpen) {
      closeDropdown();
    }
  }

  async function moveHighlight(delta: number): Promise<void> {
    if (navCount === 0) {
      return;
    }
    let next = highlightedIndex + delta;
    if (next < 0) {
      next = navCount - 1;
    } else if (next >= navCount) {
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
    if (highlightedIndex < 0 || highlightedIndex >= navCount) {
      return;
    }
    if (highlightedIndex < navItemCount) {
      const item = selectableItems.at(highlightedIndex);
      if (item) {
        selectItem(item);
      }
    } else if (highlightedIndex === createNavIndex) {
      create();
    } else if (highlightedIndex === actionNavIndex) {
      runAction();
    }
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

  function handleInput(val: string, event: Event) {
    inputValue = val;
    oninput?.(val);
    inputEventProperties?.onInput?.(val, event);
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
        } else if (exactMatch && !(multiple && selectedSet.has(exactMatch.id))) {
          event.preventDefault();
          selectItem(exactMatch);
        } else if (showCreate) {
          event.preventDefault();
          create();
        }
        break;
      case 'Backspace':
        if (multiple && inputValue === '' && selected.length > 0) {
          removeValue(selected[selected.length - 1]);
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

  function handleControlClick() {
    if (multiple && !disabled) {
      focusInput();
      openDropdown();
    }
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

<div
  class="combobox {classes ?? ''}"
  class:disabled
  bind:this={containerEl}
  data-pw={testId}
  testID={testId}
>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="combobox-input-wrapper" class:multiple onclick={handleControlClick}>
    {#if typeof inputPrefix === 'function'}
      <div class="combobox-input-prefix">{@render inputPrefix()}</div>
    {/if}
    {#if multiple}
      {#each selected as id (id)}
        {#if typeof pillSnippet === 'function'}
          {@render pillSnippet(id, () => !disabled && removeValue(id), disabled)}
        {:else}
          <Pill text={labelOf(id)} dismissible {disabled} ondismiss={() => removeValue(id)} />
        {/if}
      {/each}
    {/if}
    <div class="combobox-input">
      <Input
        {...inputProperties}
        bind:value={inputValue}
        bind:this={inputRef}
        placeholder={multiple && selected.length > 0 ? '' : placeholder}
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
        oninput={handleInput}
        onkeydown={handleKeydown}
        onfocus={handleFocus}
        onblur={handleBlur}
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

      {#if atLimit}
        <div class="combobox-limit" role="alert">{limitText}</div>
      {:else if filteredItems.length === 0 && !showCreate && !action}
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
            class:selected={!multiple && item.id === value}
            class:combobox-option-disabled={item.disabled === true}
            role="option"
            id={`${listboxId}-option-${selectableIndex}`}
            aria-selected={!multiple && item.id === value}
            aria-disabled={item.disabled === true ? 'true' : null}
            tabindex="-1"
            onclick={() => selectItem(item)}
            onmouseenter={() => {
              if (item.disabled !== true) {
                highlightedIndex = selectableIndex;
              }
            }}
            data-pw={typeof testId === 'string' ? `${testId}-option-${item.id}` : null}
            testID={typeof testId === 'string' ? `${testId}-option-${item.id}` : null}
          >
            {#if typeof itemSnippet === 'function'}
              {@render itemSnippet(item, isHighlighted)}
            {:else}
              {item.label}
            {/if}
          </div>
        {/each}
      {/if}

      {#if showCreate}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class="combobox-option combobox-create"
          class:highlighted={highlightedIndex === createNavIndex}
          class:with-divider={navItemCount > 0}
          role="option"
          id={`${listboxId}-option-${createNavIndex}`}
          aria-selected="false"
          tabindex="-1"
          onclick={() => create()}
          onmouseenter={() => (highlightedIndex = createNavIndex)}
          data-pw={typeof testId === 'string' ? `${testId}-create` : null}
          testID={typeof testId === 'string' ? `${testId}-create` : null}
        >
          <span class="combobox-create-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
              <path
                d="M10 4v12M4 10h12"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
              />
            </svg>
          </span>
          {createLabel(trimmedQuery)}
        </div>
      {/if}

      {#if action}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class="combobox-option combobox-action"
          class:highlighted={highlightedIndex === actionNavIndex}
          class:with-divider={navItemCount > 0 || showCreate}
          role="option"
          id={`${listboxId}-option-${actionNavIndex}`}
          aria-selected="false"
          tabindex="-1"
          onclick={() => runAction()}
          onmouseenter={() => (highlightedIndex = actionNavIndex)}
          data-pw={typeof testId === 'string' ? `${testId}-action` : null}
          testID={typeof testId === 'string' ? `${testId}-action` : null}
        >
          {#if typeof actionIcon === 'function'}
            <span class="combobox-action-icon" aria-hidden="true">{@render actionIcon()}</span>
          {/if}
          {action.label}
        </div>
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
    border-radius: var(--combobox-input-border-radius, var(--radius, 4px));
    transition: var(--combobox-input-transition, border-color 0.15s, box-shadow 0.15s);
  }

  /* Multi-select control: pills wrap above the typeahead input. */
  .combobox-input-wrapper.multiple {
    flex-wrap: wrap;
    gap: var(--combobox-pill-gap, 4px);
    padding: var(--combobox-multiple-padding, 4px 6px);
    cursor: text;
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

  .combobox-input-wrapper.multiple .combobox-input {
    flex: 1 1 60px;
    min-width: 60px;
    --input-padding: var(--combobox-multiple-input-padding, 2px 4px);
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
    border-radius: var(--combobox-dropdown-border-radius, var(--radius, 4px));
    box-shadow: var(--combobox-dropdown-shadow, 0 4px 12px rgba(0, 0, 0, 0.1));
    max-height: var(--combobox-dropdown-max-height, 200px);
    overflow-y: auto;
    z-index: var(--combobox-dropdown-z-index, 10);
    padding: var(--combobox-dropdown-padding, 0);
  }

  .combobox-option {
    display: flex;
    align-items: center;
    gap: var(--combobox-option-gap, 8px);
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

  .combobox-create {
    color: var(--combobox-create-color, #2563eb);
  }

  .combobox-action {
    color: var(--combobox-action-color, #374151);
  }

  .combobox-option.with-divider {
    border-top: var(--combobox-divider, 1px solid #e5e7eb);
  }

  .combobox-create-icon,
  .combobox-action-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .combobox-action-icon :global(svg) {
    width: 14px;
    height: 14px;
  }

  .combobox-limit {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: var(--combobox-limit-padding, 8px 12px);
    font-size: var(--combobox-limit-font-size, 13px);
    font-weight: 500;
    color: var(--combobox-limit-color, #b45309);
    background: var(--combobox-limit-background, #fffbeb);
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
