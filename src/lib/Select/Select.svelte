<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { SelectItem, SelectProperties } from './properties';
  import Pill from '$lib/Pill/Pill.svelte';
  import Img from '$lib/Img/Img.svelte';
  import { computeSelectDropdownPosition } from './dropdownPosition';
  import chevronDownSvg from '$lib/assets/chevron-down.svg?raw';
  import checkmarkSvg from '$lib/assets/checkmark.svg?raw';

  let {
    items: rawItems,
    value = $bindable([]),
    multiple = false,
    searchable = false,
    placeholder = '',
    disabled = false,
    bottomContent,
    optionIndicator,
    showSelectAll = false,
    selectAllLabel = 'Select all',
    showSelectedTick = false,
    triggerSummary,
    testId,
    itemTestId,
    onchange: onchangeLegacy,
    onChange,
    onopen: onopenLegacy,
    onOpen,
    onclose: oncloseLegacy,
    onClose,
    classes,
    open = $bindable(false),
    dropdownAlign = 'left',
    hierarchy = 'default',
    leftIcon,
    leftIconTestId,
    usePortal = false
  }: SelectProperties = $props();

  // Event-casing phase 1: both spellings accepted, the correct one wins.
  const onchange = $derived(onChange ?? onchangeLegacy);
  const onclose = $derived(onClose ?? oncloseLegacy);
  const onopen = $derived(onOpen ?? onopenLegacy);

  function normalizeItems(source: SelectItem[] | string[]): SelectItem[] {
    return source.map((entry) => (typeof entry === 'string' ? { id: entry, label: entry } : entry));
  }

  let items: SelectItem[] = $derived(normalizeItems(rawItems));
  let query = $state('');
  let highlightedIndex = $state(-1);
  let containerEl: HTMLDivElement | null = $state(null);
  let searchInputEl: HTMLInputElement | null = $state(null);
  let triggerEl: HTMLDivElement | null = $state(null);
  let dropdownEl: HTMLDivElement | null = $state(null);
  let dropdownWidth = $state(0);
  let dropdownHeight = $state(0);
  // Portal placement reads untracked DOM (trigger rect, viewport size); bump on
  // scroll/resize so the derived style re-runs while the dropdown is open.
  let portalTick = $state(0);

  // Gap between trigger and portaled panel, matching the --select-dropdown-gap
  // default. The in-flow panel still honours the CSS var via its margin-top.
  const PORTAL_DROPDOWN_GAP = 4;

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

  type SelectRow = { kind: 'select-all' } | { kind: 'item'; item: SelectItem };

  let selectAllVisible: boolean = $derived(multiple && showSelectAll && filteredItems.length > 0);

  let selectedFilteredCount: number = $derived(
    filteredItems.filter((item) => value.includes(item.id)).length
  );
  let allFilteredSelected: boolean = $derived(
    filteredItems.length > 0 && selectedFilteredCount === filteredItems.length
  );
  let selectAllIndeterminate: boolean = $derived(
    selectedFilteredCount > 0 && selectedFilteredCount < filteredItems.length
  );

  // Unified, keyboard-navigable row list: the optional "select all" row shares the same
  // highlightedIndex space as the options, so arrow-key navigation needs no special casing.
  let optionRows: SelectRow[] = $derived(
    selectAllVisible
      ? [
          { kind: 'select-all' },
          ...filteredItems.map((item): SelectRow => ({ kind: 'item', item }))
        ]
      : filteredItems.map((item): SelectRow => ({ kind: 'item', item }))
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

  let searchPlaceholder = $derived(open && displayText.length > 0 ? displayText : placeholder);

  // Keep the portaled panel anchored to its trigger while the page scrolls or
  // resizes. Mirrors the chart-tooltip portal pattern; $effect is the sanctioned
  // reactive escape hatch here for untracked window listeners. Reposition work is
  // coalesced into one animation frame so fast/inertial scrolling can't thrash
  // layout with a getBoundingClientRect on every event.
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    if (!usePortal || !open || typeof window === 'undefined') {
      return;
    }
    let frame: number | null = null;
    const bump = (): void => {
      if (frame !== null) {
        return;
      }
      frame = requestAnimationFrame(() => {
        frame = null;
        portalTick += 1;
      });
    };
    window.addEventListener('scroll', bump, { capture: true, passive: true });
    window.addEventListener('resize', bump);
    return () => {
      window.removeEventListener('scroll', bump, { capture: true });
      window.removeEventListener('resize', bump);
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
    };
  });

  /**
   * Svelte action: relocates the dropdown to document.body when usePortal is set,
   * so a position:fixed panel is never clipped by an overflow/scroll ancestor
   * (e.g. a table cell). No-op otherwise; `use:` actions never run during SSR.
   */
  const portalToBody = (node: HTMLElement) => {
    if (!usePortal) {
      return;
    }
    document.body.appendChild(node);
    return { destroy: () => node.remove() };
  };

  let portalStyle = $derived.by(() => {
    if (!usePortal || !open || triggerEl === null) {
      return '';
    }
    void portalTick;
    const rect = triggerEl.getBoundingClientRect();
    const viewport =
      typeof window === 'undefined'
        ? { width: Number.POSITIVE_INFINITY, height: Number.POSITIVE_INFINITY }
        : { width: window.innerWidth, height: window.innerHeight };
    const placement = computeSelectDropdownPosition({
      trigger: {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width
      },
      dropdown: { width: dropdownWidth, height: dropdownHeight },
      viewport,
      align: dropdownAlign,
      gap: PORTAL_DROPDOWN_GAP
    });
    const widthRule = placement.width === null ? '' : `width:${placement.width}px;`;
    return `top:${placement.top}px;left:${placement.left}px;min-width:${placement.minWidth}px;${widthRule}`;
  });

  async function openDropdown(): Promise<void> {
    if (disabled || open) {
      return;
    }
    open = true;
    onopen?.();
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
    open = false;
    onclose?.();
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

  function toggleSelectAll(): void {
    if (disabled) {
      return;
    }
    if (allFilteredSelected) {
      value = value.filter((id) => !filteredItems.some((item) => item.id === id));
    } else {
      value = [...new Set([...value, ...filteredItems.map((item) => item.id)])];
    }
    onchange?.(value);
  }

  function selectHighlighted(): void {
    if (highlightedIndex < 0 || highlightedIndex >= optionRows.length) {
      return;
    }
    const row = optionRows.at(highlightedIndex);
    if (typeof row !== 'object' || row === null) {
      return;
    }
    if (row.kind === 'select-all') {
      toggleSelectAll();
    } else {
      selectItem(row.item.id);
    }
  }

  async function moveHighlight(delta: number): Promise<void> {
    const next = highlightedIndex + delta;
    if (next < 0 || next >= optionRows.length) {
      return;
    }
    highlightedIndex = next;
    await tick();
    // Query the dropdown node itself, not containerEl, so highlight-scrolling
    // keeps working once the panel is portaled out to <body>.
    if (dropdownEl !== null) {
      const el = dropdownEl.querySelector('.select-option.highlighted');
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  function handleTriggerClick(event: MouseEvent): void {
    if (event.target instanceof HTMLInputElement) {
      if (!open) {
        openDropdown();
      }
      return;
    }
    // Clicks on the search input are handled above (kept open while typing), so a click
    // on the trigger chrome — including the chevron — can toggle even for a multi-select
    // searchable Select. The previous multiple && searchable branch never closed on click.
    if (open) {
      close();
    } else {
      openDropdown();
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (disabled) {
      return;
    }
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (open) {
          selectHighlighted();
        } else {
          openDropdown();
        }
        break;
      case ' ':
        if (!(event.target instanceof HTMLInputElement)) {
          event.preventDefault();
          if (open) {
            selectHighlighted();
          } else {
            openDropdown();
          }
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (open) {
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
        if (open) {
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
        if (open) {
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
    if (!open) {
      openDropdown();
    }
    highlightedIndex = -1;
  }

  function handleSearchFocus(): void {
    if (!open) {
      openDropdown();
    }
  }

  function handleClickOutside(event: Event): void {
    // A portaled dropdown lives outside containerEl, so a click on an option is
    // not contained by it — treat the dropdown node as "inside" too, otherwise a
    // multi-select would close on every pick.
    if (
      event.target instanceof Node &&
      containerEl !== null &&
      !containerEl.contains(event.target) &&
      !(dropdownEl !== null && dropdownEl.contains(event.target))
    ) {
      close();
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      if (open) {
        onclose?.();
      }
    };
  });
</script>

<div
  class="select {classes ?? ''}"
  class:open
  class:disabled
  class:ghost={hierarchy === 'ghost'}
  bind:this={containerEl}
  {...typeof testId === 'string' ? { 'data-pw': testId, testID: testId } : {}}
>
  <div
    class="select-trigger"
    bind:this={triggerEl}
    onclick={handleTriggerClick}
    onkeydown={handleKeydown}
    role="combobox"
    aria-expanded={open}
    aria-haspopup="listbox"
    aria-controls={listboxId}
    {...highlightedOptionId !== null ? { 'aria-activedescendant': highlightedOptionId } : {}}
    tabindex={disabled ? -1 : searchable ? -1 : 0}
  >
    {#if typeof leftIcon === 'string' && leftIcon.length > 0}
      <Img
        inlineSvg
        src={leftIcon}
        alt=""
        fallback=""
        classes="select-left-icon"
        {...typeof leftIconTestId === 'string' ? { testId: leftIconTestId } : {}}
      />
    {/if}
    {#if multiple}
      {#if typeof triggerSummary === 'function'}
        {@render triggerSummary({ value, items })}
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
            data-pw={typeof testId === 'string' ? `${testId}-search` : null}
            testID={typeof testId === 'string' ? `${testId}-search` : null}
          />
        {/if}
      {:else}
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
            data-pw={typeof testId === 'string' ? `${testId}-search` : null}
            testID={typeof testId === 'string' ? `${testId}-search` : null}
          />
        {:else if value.length === 0}
          <span class="select-placeholder">{placeholder}</span>
        {/if}
      {/if}
    {:else if searchable}
      <input
        class="select-search"
        type="text"
        value={open ? query : displayText}
        oninput={handleSearchInput}
        onfocus={handleSearchFocus}
        bind:this={searchInputEl}
        placeholder={searchPlaceholder}
        {disabled}
        autocomplete="off"
        tabindex={disabled ? -1 : 0}
        data-pw={typeof testId === 'string' ? `${testId}-search` : null}
        testID={typeof testId === 'string' ? `${testId}-search` : null}
      />
    {:else}
      <span class={displayText.length > 0 ? 'select-value' : 'select-placeholder'}>
        {displayText.length > 0 ? displayText : placeholder}
      </span>
    {/if}
    <!-- eslint-disable svelte/no-at-html-tags -->
    <span class="select-arrow">{@html chevronDownSvg}</span>
  </div>

  {#if open && !disabled}
    <div
      class="select-dropdown"
      class:select-dropdown-right={dropdownAlign === 'right'}
      class:select-dropdown-portal={usePortal}
      bind:this={dropdownEl}
      bind:clientWidth={dropdownWidth}
      bind:clientHeight={dropdownHeight}
      role="listbox"
      id={listboxId}
      aria-multiselectable={multiple}
      style={portalStyle}
      use:portalToBody
    >
      {#if filteredItems.length === 0}
        <div class="select-empty">No results</div>
      {:else}
        {#each optionRows as row, index (row.kind === 'select-all' ? 'select-all' : row.item.id)}
          {#if row.kind === 'select-all'}
            <div
              class="select-option select-all"
              class:multi={multiple}
              class:selected={allFilteredSelected}
              class:highlighted={index === highlightedIndex}
              role="option"
              id={`${listboxId}-option-${index}`}
              aria-selected={allFilteredSelected}
              aria-label={selectAllIndeterminate
                ? `${selectAllLabel}, ${selectedFilteredCount} of ${filteredItems.length} selected`
                : selectAllLabel}
              tabindex="-1"
              {...typeof testId === 'string'
                ? { 'data-pw': `${testId}-select-all`, testID: `${testId}-select-all` }
                : {}}
              onclick={toggleSelectAll}
              onmouseenter={() => (highlightedIndex = index)}
            >
              {#if typeof optionIndicator === 'function'}
                {@render optionIndicator({
                  checked: allFilteredSelected,
                  indeterminate: selectAllIndeterminate
                })}
              {:else}
                <span
                  class="select-option-indicator"
                  class:checked={allFilteredSelected}
                  class:indeterminate={selectAllIndeterminate}
                  aria-hidden="true"
                  data-checked={allFilteredSelected ? 'true' : 'false'}
                  data-pw={typeof testId === 'string' ? `${testId}-select-all-indicator` : null}
                  testID={typeof testId === 'string' ? `${testId}-select-all-indicator` : null}
                >
                  {#if allFilteredSelected}
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    <span class="select-option-check">{@html checkmarkSvg}</span>
                  {:else if selectAllIndeterminate}
                    <span
                      class="select-option-dash"
                      data-pw={typeof testId === 'string' ? `${testId}-select-all-dash` : null}
                      testID={typeof testId === 'string' ? `${testId}-select-all-dash` : null}
                    ></span>
                  {/if}
                </span>
              {/if}
              {selectAllLabel}
            </div>
          {:else}
            <div
              class="select-option"
              class:multi={multiple}
              class:tickable={showSelectedTick && !multiple}
              class:selected={value.includes(row.item.id)}
              class:highlighted={index === highlightedIndex}
              role="option"
              id={`${listboxId}-option-${index}`}
              aria-selected={value.includes(row.item.id)}
              tabindex="-1"
              {...typeof row.item.testId === 'string'
                ? { 'data-pw': row.item.testId, testID: row.item.testId }
                : typeof itemTestId === 'string'
                  ? {
                      'data-pw': `${itemTestId}-${row.item.id}`,
                      testID: `${itemTestId}-${row.item.id}`
                    }
                  : typeof testId === 'string'
                    ? { 'data-pw': `${testId}-${row.item.id}`, testID: `${testId}-${row.item.id}` }
                    : {}}
              onclick={() => selectItem(row.item.id)}
              onmouseenter={() => (highlightedIndex = index)}
            >
              {#if multiple}
                {#if typeof optionIndicator === 'function'}
                  {@render optionIndicator({
                    checked: value.includes(row.item.id),
                    indeterminate: false
                  })}
                {:else}
                  <span
                    class="select-option-indicator"
                    class:checked={value.includes(row.item.id)}
                    aria-hidden="true"
                    data-checked={value.includes(row.item.id) ? 'true' : 'false'}
                    data-pw={typeof testId === 'string'
                      ? `${testId}-option-indicator-${row.item.id}`
                      : null}
                    testID={typeof testId === 'string'
                      ? `${testId}-option-indicator-${row.item.id}`
                      : null}
                  >
                    {#if value.includes(row.item.id)}
                      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                      <span class="select-option-check">{@html checkmarkSvg}</span>
                    {/if}
                  </span>
                {/if}
              {/if}
              {#if typeof row.item.icon === 'string' && row.item.icon.length > 0}
                <Img
                  inlineSvg
                  src={row.item.icon}
                  alt=""
                  fallback=""
                  classes="select-option-icon"
                />
              {/if}
              <span class="select-option-label">{row.item.label}</span>
              {#if showSelectedTick && !multiple && value.includes(row.item.id)}
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                <span class="select-option-tick" aria-hidden="true">{@html checkmarkSvg}</span>
              {/if}
            </div>
          {/if}
        {/each}
      {/if}
      {#if typeof bottomContent === 'function'}
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
    border-radius: var(--select-trigger-border-radius, var(--radius, 4px));
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    transition: var(--select-trigger-transition, border-color 0.15s, box-shadow 0.15s);
  }

  .select-trigger :global(.select-left-icon) {
    --image-width: var(--select-left-icon-size, 16px);
    --image-height: var(--select-left-icon-size, 16px);
    --image-object-fit: contain;

    /* The icon inlines, so a currentColor asset resolves against this. Defaults to
       `inherit` — the trigger's text colour, which is what it already did — so this is
       a hook, not a change. Without it a consumer cannot tint the icon independently
       of the label, and an icon migrated to currentColor is forced to match its label
       exactly, flattening any deliberate muted-icon/strong-label hierarchy. */
    color: var(--select-left-icon-color, inherit);
    flex: none;
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
    text-align: var(--select-value-align, left);
  }

  .select-placeholder {
    flex: 1;
    color: var(--select-placeholder-color, #999999);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: var(--select-value-align, left);
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
    left: var(--select-dropdown-left, 0);
    right: var(--select-dropdown-right, 0);
    min-width: var(--select-dropdown-min-width, auto);
    max-width: var(--select-dropdown-max-width, none);
    width: var(--select-dropdown-width, auto);
    margin-top: var(--select-dropdown-gap, 4px);
    background: var(--select-dropdown-background, #ffffff);
    border: var(--select-dropdown-border, 1px solid #cccccc);
    border-radius: var(--select-dropdown-border-radius, var(--radius, 4px));
    box-shadow: var(--select-dropdown-shadow, 0 4px 12px rgba(0, 0, 0, 0.1));
    max-height: var(--select-dropdown-max-height, 200px);
    overflow-y: auto;
    z-index: var(--select-dropdown-z-index, 10);
  }

  .select-dropdown-right {
    left: auto;
    right: var(--select-dropdown-right, 0);
    min-width: var(--select-dropdown-min-width, 100%);
    max-width: var(--select-dropdown-max-width, none);
    width: var(--select-dropdown-width, max-content);
  }

  .select-dropdown.select-dropdown-portal {
    /* Portaled to <body>: fixed positioning escapes overflow/scroll ancestors
       (e.g. a table cell). Placement (top/left/width/min-width) is set inline
       from the trigger rect, so neutralise the in-flow anchoring here. */
    position: fixed;
    right: auto;
    margin-top: 0;
    /* In the root stacking context the panel competes with modals/sheets rather
       than painting above same-container siblings, so default it into the
       top-layer band (consumers still override via --select-dropdown-z-index). */
    z-index: var(--select-dropdown-z-index, 1000);
  }

  .select-option {
    padding: var(--select-option-padding, 8px 12px);
    color: var(--select-option-color, #333333);
    font-size: var(--select-option-font-size, inherit);
    cursor: pointer;
    transition: background 0.1s;
  }

  /* Per-option leading icon (SelectItem.icon). Kept inline + vertically centred so
     it needs no change to the option's display and can't regress icon-less lists. */
  .select-option :global(.select-option-icon) {
    --image-width: var(--select-option-icon-size, 16px);
    --image-height: var(--select-option-icon-size, 16px);
    --image-object-fit: contain;

    color: var(--select-option-icon-color, inherit);
    vertical-align: middle;
    margin-right: var(--select-option-icon-gap, 8px);
  }

  .select-option.multi {
    display: flex;
    align-items: center;
    gap: var(--select-option-gap, 0);
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

  .select-option-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-sizing: border-box;
    width: var(--select-option-indicator-size, 18px);
    height: var(--select-option-indicator-size, 18px);
    border: var(--select-option-indicator-border, 2px solid #757575);
    border-radius: var(--select-option-indicator-border-radius, var(--radius, 4px));
    background-color: var(--select-option-indicator-background, transparent);
    color: var(--select-option-indicator-color, currentColor);
    transition:
      background-color 0.15s,
      border-color 0.15s;
  }

  .select-option-indicator.checked {
    background-color: var(--select-option-indicator-checked-background, #2196f3);
    border-color: var(--select-option-indicator-checked-border-color, #2196f3);
  }

  .select-option-check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--select-option-indicator-check-size, 12px);
    height: var(--select-option-indicator-check-size, 12px);
    color: var(--select-option-indicator-check-color, #ffffff);
  }

  .select-option-check :global(svg) {
    width: 100%;
    height: 100%;
  }

  .select-option-indicator.indeterminate {
    background-color: var(--select-option-indicator-checked-background, #2196f3);
    border-color: var(--select-option-indicator-checked-border-color, #2196f3);
  }

  .select-option-dash {
    width: var(--select-option-indicator-dash-size, 10px);
    height: var(--select-option-indicator-dash-thickness, 2px);
    border-radius: 1px;
    background-color: var(--select-option-indicator-dash-color, #ffffff);
  }

  .select-option.select-all {
    border-bottom: var(--select-all-border, none);
    font-weight: var(--select-all-font-weight, inherit);
  }

  .select-empty {
    padding: var(--select-empty-padding, 8px 12px);
    color: var(--select-empty-color, #999999);
    font-style: var(--select-empty-font-style, italic);
    font-size: var(--select-empty-font-size, inherit);
  }

  .select-bottom-content {
    border-top: var(--select-bottom-content-border, none);
    padding: var(--select-bottom-content-padding, 8px 12px);
  }

  .select-trigger :global(.pill) {
    --pill-background: var(--select-pill-background, #e0e0e0);
    --pill-color: var(--select-pill-color, #333333);
    --pill-border-radius: var(--select-pill-border-radius, 999px);
    --pill-padding: var(--select-pill-padding, 2px 8px);
    --pill-font-size: var(--select-pill-font-size, 13px);
  }

  /* Ghost hierarchy: transparent, borderless trigger */
  .select.ghost .select-trigger {
    background: var(--select-ghost-trigger-background, transparent);
    border-color: var(--select-ghost-trigger-border-color, transparent);
    box-shadow: none;
  }

  .select.ghost .select-trigger:hover:not(.disabled .select-trigger) {
    border-color: var(--select-ghost-trigger-hover-border-color, transparent);
    background: var(--select-ghost-trigger-hover-background, rgba(0, 0, 0, 0.04));
  }

  .select.ghost.open .select-trigger {
    border-color: var(--select-ghost-trigger-open-border-color, transparent);
    background: var(--select-ghost-trigger-open-background, rgba(0, 0, 0, 0.06));
    box-shadow: none;
  }

  /* Single-select right-edge tick (showSelectedTick) */
  .select-option.tickable {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .select-option.tickable .select-option-label {
    flex: 1 1 auto;
    min-width: 0;
  }

  .select-option-tick {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--select-option-tick-size, 16px);
    height: var(--select-option-tick-size, 16px);
    color: var(--select-option-tick-color, #2563eb);
  }

  .select-option-tick :global(svg) {
    width: 100%;
    height: 100%;
  }
</style>
