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
    searchPosition = 'trigger',
    placeholder = '',
    disabled = false,
    error = false,
    errorMessage,
    clearable = false,
    onclear,
    bottomContent,
    optionIndicator,
    showSelectAll = false,
    selectAllLabel = 'Select all',
    showSelectedTick = false,
    triggerSummary,
    testId,
    itemTestId,
    onchange,
    onopen,
    onclose,
    classes,
    open = $bindable(false),
    dropdownAlign = 'left',
    hierarchy = 'default',
    leftIcon,
    leftIconTestId,
    usePortal = false
  }: SelectProperties = $props();

  function normalizeItems(source: SelectItem[] | string[]): SelectItem[] {
    return source.map((entry) => (typeof entry === 'string' ? { id: entry, label: entry } : entry));
  }

  let items: SelectItem[] = $derived(normalizeItems(rawItems));
  let query = $state('');
  let restoringFocus = false;
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

  const instanceId = $props.id();
  const listboxId = `select-listbox-${instanceId}`;
  const errorMessageId = `${listboxId}-error`;

  /* `searchable` alone no longer says where the input goes, so every place
     that used to branch on it now asks which of the two it meant. Filtering
     still keys off `searchable`, since that is true in both placements. */
  const searchInTrigger = $derived(searchable && searchPosition !== 'menu');
  const searchInMenu = $derived(searchable && searchPosition === 'menu');

  const hasErrorMessage = $derived(
    error && typeof errorMessage === 'string' && errorMessage.trim().length > 0
  );

  /* Nothing selected means nothing to clear, so the control is not rendered at
     all rather than rendered inert -- a disabled × that never enables reads as
     broken. Same for `disabled`, where the whole field is inert already. */
  const showClearButton = $derived(clearable && !disabled && value.length > 0);

  function handleClear(event: MouseEvent): void {
    /* The point of a trigger-level clear is that it does NOT open the menu.
       The trigger's own click handler sits on the ancestor, so without this
       the click would clear and then immediately open. */
    event.stopPropagation();
    if (value.length === 0) {
      return;
    }
    value = [];
    onchange?.(value);
    onclear?.();
    if (searchable && searchInputEl !== null) {
      restoringFocus = true;
      searchInputEl.focus();
      restoringFocus = false;
    } else {
      triggerEl?.focus();
    }
  }

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
    if (searchInTrigger) {
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
      // Focus was in the menu's own search box, which is now gone; without
      // this it falls back to <body> and the keyboard user loses their place.
      if (searchInMenu) {
        triggerEl?.focus();
      }
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

  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /* Options carry tabindex="-1", so this is the search box plus whatever the
     consumer pinned via bottomContent -- the panel's real tab stops. */
  function menuFocusables(): HTMLElement[] {
    return dropdownEl === null ? [] : [...dropdownEl.querySelectorAll<HTMLElement>(FOCUSABLE)];
  }

  /* Leaving the menu forwards should continue from the trigger, as if the
     panel had never been in the tab order -- which is literally true for a
     portaled one, whose DOM position is the end of <body>. */
  function focusAfterTrigger(): void {
    if (triggerEl === null || typeof document === 'undefined') {
      return;
    }
    const tabbable = [...document.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (element) => element.closest('.select-dropdown') === null
    );
    tabbable.at(tabbable.indexOf(triggerEl) + 1)?.focus();
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
          if (!searchInTrigger && triggerEl !== null) {
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
      case 'Tab': {
        if (!open) {
          break;
        }
        /* Outside the in-menu variant, Tab always means focus is leaving. */
        if (!searchInMenu) {
          close();
          break;
        }
        const active = document.activeElement;
        if (event.shiftKey) {
          /* Backwards out of the trigger genuinely leaves the widget; every
             other Shift+Tab walks back through the menu and must not close
             it, or the search box could never be left and re-entered. */
          if (active === triggerEl) {
            close();
          } else if (active === searchInputEl) {
            /* The trigger is not the portaled panel's DOM predecessor, so
               native Shift+Tab would land outside the widget entirely. */
            event.preventDefault();
            triggerEl?.focus();
          }
          break;
        }
        if (active === triggerEl) {
          /* A portaled panel is appended to <body>, so it is not the
             trigger's DOM-order successor and native Tab would skip the whole
             menu. Moving focus explicitly makes the in-flow and portaled
             variants answer Tab identically. */
          event.preventDefault();
          searchInputEl?.focus();
          break;
        }
        /* Forward Tab only leaves once there is nothing left to reach: the
           search box is followed by any pinned bottom actions, which were
           unreachable while Tab from the search closed the menu outright. */
        if (active === menuFocusables().at(-1)) {
          event.preventDefault();
          close();
          focusAfterTrigger();
        }
        break;
      }
    }
  }

  /* The panel handler exists for the pinned bottom actions, which have no
     handler of their own. The search box already carries one, and letting its
     bubbled event run a second time here moved the highlight twice per key. */
  function handleMenuKeydown(event: KeyboardEvent): void {
    if (event.target !== searchInputEl) {
      handleKeydown(event);
    }
  }

  /* Attached imperatively: the panel is a plain container, and a keydown
     handler written in the template would demand an ARIA role that the
     wrapper around the search box and the listbox must not claim. */
  const menuKeys = (node: HTMLElement) => {
    node.addEventListener('keydown', handleMenuKeydown);
    return { destroy: () => node.removeEventListener('keydown', handleMenuKeydown) };
  };

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
    if (!open && !restoringFocus) {
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
  class:error
  class:ghost={hierarchy === 'ghost'}
  bind:this={containerEl}
  {...typeof testId === 'string' ? { 'data-pw': testId, testID: testId } : {}}
>
  <div class="select-control" class:has-clear={showClearButton}>
    <div
      class="select-trigger"
      bind:this={triggerEl}
      onclick={handleTriggerClick}
      onkeydown={handleKeydown}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={listboxId}
      aria-invalid={error ? 'true' : null}
      aria-describedby={hasErrorMessage ? errorMessageId : null}
      {...highlightedOptionId !== null ? { 'aria-activedescendant': highlightedOptionId } : {}}
      tabindex={disabled ? -1 : searchInTrigger ? -1 : 0}
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
          {#if searchInTrigger}
            <input
              class="select-search"
              type="text"
              value={query}
              oninput={handleSearchInput}
              onfocus={handleSearchFocus}
              bind:this={searchInputEl}
              placeholder={value.length === 0 ? placeholder : ''}
              {disabled}
              aria-invalid={error ? 'true' : null}
              aria-describedby={hasErrorMessage ? errorMessageId : null}
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
          {#if searchInTrigger}
            <input
              class="select-search"
              type="text"
              value={query}
              oninput={handleSearchInput}
              onfocus={handleSearchFocus}
              bind:this={searchInputEl}
              placeholder={value.length === 0 ? placeholder : ''}
              {disabled}
              aria-invalid={error ? 'true' : null}
              aria-describedby={hasErrorMessage ? errorMessageId : null}
              autocomplete="off"
              tabindex={disabled ? -1 : 0}
              data-pw={typeof testId === 'string' ? `${testId}-search` : null}
              testID={typeof testId === 'string' ? `${testId}-search` : null}
            />
          {:else if value.length === 0}
            <span class="select-placeholder">{placeholder}</span>
          {/if}
        {/if}
      {:else if searchInTrigger}
        <input
          class="select-search"
          type="text"
          value={open ? query : displayText}
          oninput={handleSearchInput}
          onfocus={handleSearchFocus}
          bind:this={searchInputEl}
          placeholder={searchPlaceholder}
          {disabled}
          aria-invalid={error ? 'true' : null}
          aria-describedby={hasErrorMessage ? errorMessageId : null}
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
    {#if showClearButton}
      <button
        type="button"
        class="select-clear"
        aria-label="Clear selection"
        onkeydown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.stopPropagation();
          }
        }}
        onclick={handleClear}
        data-pw={typeof testId === 'string' ? `${testId}-clear` : null}
        testID={typeof testId === 'string' ? `${testId}-clear` : null}
      >
        <span aria-hidden="true">×</span>
      </button>
    {/if}
  </div>

  {#if hasErrorMessage}
    <div
      id={errorMessageId}
      role="alert"
      class="select-error-message"
      data-pw={typeof testId === 'string' ? `${testId}-error-message` : null}
      testID={typeof testId === 'string' ? `${testId}-error-message` : null}
    >
      {errorMessage}
    </div>
  {/if}

  {#snippet menuOptions()}
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
              <Img inlineSvg src={row.item.icon} alt="" fallback="" classes="select-option-icon" />
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
    {#if typeof bottomContent === 'function' && !searchInMenu}
      <div class="select-bottom-content">
        {@render bottomContent()}
      </div>
    {/if}
  {/snippet}

  {#if open && !disabled}
    {#if searchInMenu}
      <!-- The panel itself carries no role here: a listbox may only contain
           options, so the search box has to be a SIBLING of the listbox rather
           than a child of it. `aria-controls` on the trigger still points at
           the inner element that actually holds the options. -->
      <div
        class="select-dropdown"
        class:select-dropdown-right={dropdownAlign === 'right'}
        class:select-dropdown-portal={usePortal}
        bind:this={dropdownEl}
        bind:clientWidth={dropdownWidth}
        bind:clientHeight={dropdownHeight}
        style={portalStyle}
        use:menuKeys
        use:portalToBody
      >
        <input
          class="select-menu-search"
          type="search"
          value={query}
          oninput={handleSearchInput}
          onkeydown={handleKeydown}
          bind:this={searchInputEl}
          placeholder={placeholder.length > 0 ? placeholder : 'Search'}
          aria-label="Search options"
          aria-controls={listboxId}
          autocomplete="off"
          data-pw={typeof testId === 'string' ? `${testId}-menu-search` : null}
          testID={typeof testId === 'string' ? `${testId}-menu-search` : null}
        />
        <!-- tabindex="-1" because the list scrolls, and a scroll container is
             a tab stop of its own in Chromium -- which swallowed the Tab that
             should reach the pinned bottom actions. The options are navigated
             from the search box via aria-activedescendant, so the list itself
             never needs to hold focus. -->
        <div
          class="select-menu-list"
          role="listbox"
          id={listboxId}
          aria-multiselectable={multiple}
          tabindex="-1"
        >
          {@render menuOptions()}
        </div>
        {#if typeof bottomContent === 'function'}
          <!-- Outside the listbox: a listbox may only contain options, so
               pinned actions (clear-all, apply) would be invalid children and
               assistive tech would announce them as options. -->
          <div class="select-bottom-content">
            {@render bottomContent()}
          </div>
        {/if}
      </div>
    {:else}
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
        {@render menuOptions()}
      </div>
    {/if}
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

  /* Pressed feedback on the trigger. `:active` only, so it lasts exactly as
     long as the pointer is down and never lingers as a stuck state the way a
     class-driven one can. */
  .select:not(.disabled) .select-trigger:active {
    background: var(--select-trigger-pressed-background, #ededed);
  }

  /* The error border has to outrank BOTH hover and focus/open, or the field
     stops reading as invalid the moment the user enters it -- which is the one
     moment they most need to see it. Listed after them, at equal or higher
     specificity, rather than reached for with !important. */
  .select.error .select-trigger,
  .select.error .select-trigger:hover,
  .select.error .select-trigger:focus-within,
  .select.error.open .select-trigger {
    border-color: var(--select-trigger-error-border-color, #dc2626);
  }

  .select.error .select-trigger:focus-within,
  .select.error.open .select-trigger {
    box-shadow: var(--select-trigger-error-shadow, 0 0 0 2px rgba(220, 38, 38, 0.2));
  }

  .select-error-message {
    margin-top: var(--select-error-message-margin-top, 4px);
    font-size: var(--select-error-message-font-size, 12px);
    color: var(--select-error-message-color, #dc2626);
  }

  .select-control {
    position: relative;
  }

  .select-control.has-clear .select-trigger {
    padding-inline-end: calc(var(--select-clear-size, 18px) + 36px);
  }

  .select-control.has-clear .select-arrow {
    position: absolute;
    right: 12px;
  }

  .select-clear {
    position: absolute;
    right: 32px;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: var(--select-clear-size, 18px);
    height: var(--select-clear-size, 18px);
    margin: 0;
    padding: 0;
    border: none;
    border-radius: var(--select-clear-border-radius, var(--radius, 4px));
    background: var(--select-clear-background, transparent);
    color: var(--select-clear-color, #666666);
    font-size: var(--select-clear-font-size, 16px);
    line-height: 1;
    cursor: pointer;
  }

  .select-clear:focus-visible {
    outline: var(--select-clear-focus-outline, 2px solid currentColor);
    outline-offset: 2px;
  }

  .select-clear:hover {
    background: var(--select-clear-hover-background, #ededed);
    color: var(--select-clear-hover-color, #111111);
  }

  .select-clear:active {
    background: var(--select-clear-pressed-background, #e0e0e0);
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

  /* With the search box inside the panel, the PANEL must stop scrolling and
     the list scroll instead -- otherwise the search box scrolls away as soon
     as the user moves down the results, which is the one control they still
     need. The max-height moves down with the scrolling, so the panel keeps
     growing to fit the search box plus a list of the same height as before. */
  .select-dropdown:has(> .select-menu-list) {
    max-height: none;
    overflow-y: visible;
    display: flex;
    flex-direction: column;
  }

  .select-menu-list {
    max-height: var(--select-dropdown-max-height, 200px);
    overflow-y: auto;
  }

  .select-menu-search {
    flex: none;
    margin: var(--select-menu-search-margin, 6px);
    padding: var(--select-menu-search-padding, 6px 8px);
    border: var(--select-menu-search-border, 1px solid #cccccc);
    border-radius: var(--select-menu-search-border-radius, var(--radius, 4px));
    background: var(--select-menu-search-background, #ffffff);
    color: var(--select-menu-search-color, inherit);
    font-family: inherit;
    font-size: var(--select-menu-search-font-size, inherit);
    outline: none;
  }

  .select-menu-search:focus-visible {
    border-color: var(--select-menu-search-focus-border-color, #2563eb);
    box-shadow: var(--select-menu-search-focus-shadow, 0 0 0 2px rgba(37, 99, 235, 0.2));
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

  /* Pressed feedback comes last, and each selector carries enough specificity
     to outrank its non-active counterpart above. An option is always hovered
     when pressed and is often selected too, so a single low-specificity rule
     earlier in the sheet would be correct in isolation and invisible in
     practice -- which is how a pressed state ends up shipping as dead CSS.
     A press on an already-selected row still has to confirm the tap landed. */
  .select-option:active,
  .select-option.selected:active,
  .select-option.selected.highlighted:active {
    background: var(--select-option-pressed-background, #ededed);
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
