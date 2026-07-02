<script lang="ts">
  import type { TableProperties, TableCheckboxSelectionConfig } from './properties';
  import type { JSONValue } from 'type-decoder';
  import { SvelteSet } from 'svelte/reactivity';
  import Button from '../Button/Button.svelte';
  import chevronUpSvg from '$lib/assets/chevron-up.svg?raw';
  import chevronDownSvg from '$lib/assets/chevron-down.svg?raw';
  import sortDefaultSvg from '$lib/assets/sort-default.svg?raw';
  import searchSvg from '$lib/assets/search.svg?raw';
  import closeSvg from '$lib/assets/close.svg?raw';
  import checkmarkSvg from '$lib/assets/checkmark.svg?raw';
  import minusSvg from '$lib/assets/minus.svg?raw';

  let {
    tableTitle = '',
    tableHeaders = [],
    tableData = [],
    sortable = true,
    sortableColumns,
    stickyHeader = false,
    isTableScrollable = false,
    isContentScrollable = false,
    testId,
    caption,
    sortAscIcon,
    sortDescIcon,
    sortDefaultIcon,
    cell,
    empty,
    onRowClick,
    onSort,
    onCellChange: _onCellChange,
    classes,
    paginatorSlot,
    getRowTestId,
    getCellTestId,
    checkboxSelection,
    searchConfig,
    onSearchChange
  }: TableProperties = $props();

  // ─── Sort state ──────────────────────────────────────────────────────────────
  let sortColumn = $state<number | null>(null);
  let sortDirection = $state<'asc' | 'desc'>('asc');

  const isColumnSortable = (colIndex: number): boolean => {
    if (!sortable) {
      return false;
    }
    if (sortableColumns) {
      return sortableColumns.includes(colIndex);
    }
    return true;
  };

  const handleSort = (colIndex: number): void => {
    if (!isColumnSortable(colIndex)) {
      return;
    }

    if (sortColumn === colIndex) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = colIndex;
      sortDirection = 'asc';
    }
    onSort?.(colIndex, sortDirection);
  };

  // ─── Row click ───────────────────────────────────────────────────────────────
  const handleRowClick = (rowIndex: number, rowData: JSONValue[]): void => {
    onRowClick?.(rowIndex, rowData);
  };

  const handleRowKeydown = (event: KeyboardEvent, rowIndex: number, rowData: JSONValue[]): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick?.(rowIndex, rowData);
    }
  };

  let isRowClickable = $derived(typeof onRowClick === 'function');
  let isStickyHeader = $derived(stickyHeader || isTableScrollable);

  // ─── C2-3: Search ─────────────────────────────────────────────────────────
  let searchTerm = $state('');
  let hasSearchConfig = $derived(!!searchConfig);
  let isServerSearch = $derived(typeof onSearchChange === 'function');
  let searchInputRef = $state<HTMLInputElement | null>(null);

  const handleSearchInput = (): void => {
    if (!searchInputRef) {
      return;
    }
    searchTerm = searchInputRef.value;
    if (isServerSearch) {
      onSearchChange?.(searchTerm);
    }
  };

  const clearSearch = (): void => {
    searchTerm = '';
    if (isServerSearch) {
      onSearchChange?.('');
    }
  };

  // ─── Sort + Search pipeline ──────────────────────────────────────────────────
  let sortedTableData = $derived.by(() => {
    if (sortColumn === null) {
      return [...tableData];
    }

    const colIndex = sortColumn;
    const direction = sortDirection;

    return [...tableData].sort((rowA, rowB) => {
      const valueA = rowA[colIndex];
      const valueB = rowB[colIndex];

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return direction === 'asc' ? valueA - valueB : valueB - valueA;
      } else if (typeof valueA === 'string' && typeof valueB === 'string') {
        // Separator-formatted numeric strings (e.g. "1,11,600") must sort by their
        // numeric value, not lexicographically; anything unparseable falls back to
        // locale comparison. Empty strings stay in the locale branch so they are not
        // coerced to 0.
        const numericA = valueA.trim() === '' ? NaN : Number(valueA.replace(/,/g, ''));
        const numericB = valueB.trim() === '' ? NaN : Number(valueB.replace(/,/g, ''));
        if (Number.isFinite(numericA) && Number.isFinite(numericB)) {
          return direction === 'asc' ? numericA - numericB : numericB - numericA;
        }
        return direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      } else if (typeof valueA === 'boolean' && typeof valueB === 'boolean') {
        return direction === 'asc'
          ? valueA === valueB
            ? 0
            : valueA
              ? -1
              : 1
          : valueA === valueB
            ? 0
            : valueA
              ? 1
              : -1;
      }
      return 0;
    });
  });

  /**
   * Client-side filtered rows. When `onSearchChange` is provided (server
   * delegation) or `searchConfig` is absent, the sorted data passes through
   * untouched.
   */
  let filteredTableData = $derived.by(() => {
    if (!hasSearchConfig || isServerSearch || searchTerm.trim() === '') {
      return sortedTableData;
    }

    const term = searchTerm.trim().toLowerCase();
    const colIndices = searchConfig?.searchableColumnIndices;

    return sortedTableData.filter((row) => {
      const indicesToSearch = colIndices ? colIndices : row.map((_cell, idx) => idx);
      return indicesToSearch.some((idx) => {
        const cellValue = row[idx];
        return cellValue !== null && String(cellValue).toLowerCase().includes(term);
      });
    });
  });

  // ─── C2-1: Checkbox selection ─────────────────────────────────────────────
  const resolveRowId = (
    cfg: TableCheckboxSelectionConfig,
    row: JSONValue[],
    rowIndex: number
  ): string => {
    return cfg.getRowId ? cfg.getRowId(row, rowIndex) : String(rowIndex);
  };

  let selectedIds = new SvelteSet<string>();

  const isRowDisabled = (rowId: string): boolean => {
    return checkboxSelection?.disabledRowIds?.has(rowId) ?? false;
  };

  const isRowSelected = (rowId: string): boolean => {
    return selectedIds.has(rowId);
  };

  /**
   * Stable string ID for every row in the currently visible (filtered) view.
   *
   * Each entry is resolved by iterating `filteredTableData` and looking up the
   * row's pre-sort position via `sortedTableData.indexOf(row)`. Using the
   * pre-filter index as the default numeric ID keeps `String(originalIndex)`
   * stable even when the visible set shrinks or expands as the search term
   * changes — so a row that was "row 2" in the full set keeps ID `"2"` even
   * when it becomes the only visible result.
   *
   * The Map lookup uses object reference equality, so row objects in
   * `filteredTableData` must be the same references as those in
   * `sortedTableData`. When `originalIndex` cannot be found (reference mismatch
   * after a transform), the fallback positional index is used instead.
   */
  let filteredRowIds = $derived.by((): string[] => {
    const indexMap = new Map(sortedTableData.map((row, index) => [row, index]));
    return filteredTableData.map((row, fallbackIndex) => {
      const originalIndex = indexMap.get(row) ?? -1;
      const stableIndex = originalIndex === -1 ? fallbackIndex : originalIndex;
      if (checkboxSelection && checkboxSelection.enabled !== false) {
        return resolveRowId(checkboxSelection, row, stableIndex);
      }
      return String(stableIndex);
    });
  });

  /**
   * IDs of all selectable (non-disabled) rows in the currently filtered view.
   *
   * Iterates `filteredTableData` (the post-filter, post-sort visible rows) and
   * resolves each row's stable ID using `sortedTableData.indexOf(row)` for the
   * pre-filter positional index. When `getRowId` is absent this keeps the
   * default numeric ID (`String(originalIndex)`) unchanged regardless of which
   * rows the current search term hides, preventing ID collisions as the visible
   * set changes.
   */
  let selectableRowIds = $derived.by((): string[] => {
    if (!checkboxSelection || checkboxSelection.enabled === false) {
      return [];
    }
    return filteredRowIds.filter((rowId) => !isRowDisabled(rowId));
  });

  /**
   * Header checkbox tri-state.
   * - `'all'`   → every selectable row is selected → show checked
   * - `'some'`  → some but not all → show indeterminate
   * - `'none'`  → nothing selected → show unchecked
   */
  let headerCheckboxState = $derived.by((): 'all' | 'some' | 'none' => {
    if (
      !checkboxSelection ||
      checkboxSelection.enabled === false ||
      selectableRowIds.length === 0
    ) {
      return 'none';
    }
    const selectedCount = selectableRowIds.filter((rowId) => selectedIds.has(rowId)).length;
    if (selectedCount === 0) {
      return 'none';
    }
    if (selectedCount === selectableRowIds.length) {
      return 'all';
    }
    return 'some';
  });

  const toggleRowSelection = (rowId: string): void => {
    if (!checkboxSelection || checkboxSelection.enabled === false || isRowDisabled(rowId)) {
      return;
    }

    if (checkboxSelection.selectionMode === 'single') {
      const wasSelected = selectedIds.has(rowId);
      selectedIds.clear();
      if (!wasSelected) {
        selectedIds.add(rowId);
      }
    } else {
      if (selectedIds.has(rowId)) {
        selectedIds.delete(rowId);
      } else {
        selectedIds.add(rowId);
      }
    }
    checkboxSelection.onSelectionChange?.(new Set(selectedIds));
  };

  const toggleAllSelection = (): void => {
    if (!checkboxSelection || checkboxSelection.enabled === false) {
      return;
    }
    // selectableRowIds already excludes disabled rows
    if (headerCheckboxState === 'all') {
      // deselect all selectable rows in the current view
      for (const rowId of selectableRowIds) {
        selectedIds.delete(rowId);
      }
    } else {
      // select all selectable rows in the current view
      for (const rowId of selectableRowIds) {
        selectedIds.add(rowId);
      }
    }
    checkboxSelection.onSelectionChange?.(new Set(selectedIds));
  };

  const handleCheckboxKeydown = (event: KeyboardEvent, action: () => void): void => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      action();
    }
  };

  let isCheckboxMode = $derived(!!checkboxSelection && checkboxSelection.enabled !== false);
  let isSingleSelect = $derived(checkboxSelection?.selectionMode === 'single');
</script>

{#if typeof tableTitle === 'string' && tableTitle.length > 0}
  <div class="table-title">
    {tableTitle}
  </div>
{/if}

{#if hasSearchConfig}
  <div class="table-search">
    <span class="table-search-icon">
      <!-- eslint-disable svelte/no-at-html-tags -->
      {@html searchSvg}
    </span>
    <input
      bind:this={searchInputRef}
      class="table-search-input"
      type="search"
      placeholder={searchConfig?.placeholder ?? 'Search…'}
      value={searchTerm}
      oninput={handleSearchInput}
      data-pw={searchConfig?.testId ?? null}
      aria-label={searchConfig?.placeholder ?? 'Search'}
      autocomplete="off"
    />
    {#if searchTerm.length > 0}
      <button
        class="table-search-clear"
        type="button"
        onclick={clearSearch}
        aria-label="Clear search"
      >
        <!-- eslint-disable svelte/no-at-html-tags -->
        {@html closeSvg}
      </button>
    {/if}
  </div>
{/if}

{#if tableHeaders.length !== 0 || tableData.length !== 0}
  <div
    class="table-container {isTableScrollable ? 'scrollable-table' : ''} {classes ?? ''}"
    data-pw={testId}
  >
    <table>
      {#if caption}
        <caption class="sr-only">{caption}</caption>
      {/if}
      <thead>
        <tr>
          {#if isCheckboxMode && !isSingleSelect}
            <th class="table-header table-checkbox-col" class:table-header-sticky={isStickyHeader}>
              <!-- Header tri-state checkbox -->
              <span
                class="table-checkbox-box"
                class:checked={headerCheckboxState === 'all'}
                class:indeterminate={headerCheckboxState === 'some'}
                role="checkbox"
                tabindex={0}
                aria-checked={headerCheckboxState === 'some'
                  ? 'mixed'
                  : headerCheckboxState === 'all'}
                aria-label="Select all rows"
                aria-controls={selectableRowIds.map((rowId) => `row-checkbox-${rowId}`).join(' ')}
                onclick={toggleAllSelection}
                onkeydown={(keyboardEvent) =>
                  handleCheckboxKeydown(keyboardEvent, toggleAllSelection)}
              >
                {#if headerCheckboxState === 'all'}
                  <!-- eslint-disable svelte/no-at-html-tags -->
                  <span class="table-checkbox-icon">{@html checkmarkSvg}</span>
                {:else if headerCheckboxState === 'some'}
                  <!-- eslint-disable svelte/no-at-html-tags -->
                  <span class="table-checkbox-icon">{@html minusSvg}</span>
                {/if}
              </span>
            </th>
          {:else if isCheckboxMode && isSingleSelect}
            <!-- In single-select mode the header cell is an empty spacer -->
            <th class="table-header table-checkbox-col" class:table-header-sticky={isStickyHeader}>
            </th>
          {/if}
          {#each tableHeaders as header, colIndex (colIndex)}
            <th class="table-header" class:table-header-sticky={isStickyHeader}>
              <span class="table-header-content">
                {header}
                {#if isColumnSortable(colIndex)}
                  <div class="sort-button">
                    <Button onclick={() => handleSort(colIndex)} ariaLabel="Sort by {header}">
                      {#if sortColumn === colIndex && sortDirection === 'asc'}
                        {#if typeof sortAscIcon === 'function'}
                          {@render sortAscIcon()}
                        {:else}
                          <span class="sort-icon">
                            <!-- eslint-disable svelte/no-at-html-tags -->
                            {@html chevronUpSvg}
                          </span>
                        {/if}
                      {:else if sortColumn === colIndex && sortDirection === 'desc'}
                        {#if typeof sortDescIcon === 'function'}
                          {@render sortDescIcon()}
                        {:else}
                          <span class="sort-icon">
                            <!-- eslint-disable svelte/no-at-html-tags -->
                            {@html chevronDownSvg}
                          </span>
                        {/if}
                      {:else if typeof sortDefaultIcon === 'function'}
                        {@render sortDefaultIcon()}
                      {:else}
                        <span class="sort-icon sort-icon-idle">
                          <!-- eslint-disable svelte/no-at-html-tags -->
                          {@html sortDefaultSvg}
                        </span>
                      {/if}
                    </Button>
                  </div>
                {/if}
              </span>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#if filteredTableData.length === 0 && typeof empty === 'function'}
          <tr>
            <td
              class="table-empty"
              colspan={isCheckboxMode ? tableHeaders.length + 1 : tableHeaders.length}
            >
              {@render empty()}
            </td>
          </tr>
        {:else}
          {#each filteredTableData as row, rowIndex (filteredRowIds[rowIndex])}
            {@const rowId = filteredRowIds[rowIndex]}
            {@const rowDisabled = isCheckboxMode && isRowDisabled(rowId)}
            {@const rowSelected = isCheckboxMode && isRowSelected(rowId)}
            <tr
              class="table-row"
              class:table-row-clickable={isRowClickable}
              class:table-row-selected={rowSelected}
              data-pw={typeof getRowTestId === 'function' ? getRowTestId(row, rowIndex) : null}
              onclick={isRowClickable ? () => handleRowClick(rowIndex, row) : null}
              onkeydown={isRowClickable
                ? (keyboardEvent) => handleRowKeydown(keyboardEvent, rowIndex, row)
                : null}
              tabindex={isRowClickable ? 0 : null}
            >
              {#if isCheckboxMode}
                <td class="table-content table-checkbox-col">
                  <span
                    class="table-checkbox-box"
                    class:checked={rowSelected}
                    class:disabled={rowDisabled}
                    role="checkbox"
                    id={`row-checkbox-${rowId}`}
                    tabindex={rowDisabled ? -1 : 0}
                    aria-checked={rowSelected}
                    aria-disabled={rowDisabled}
                    onclick={(mouseEvent) => {
                      mouseEvent.stopPropagation();
                      toggleRowSelection(rowId);
                    }}
                    onkeydown={(keyboardEvent) => {
                      keyboardEvent.stopPropagation();
                      handleCheckboxKeydown(keyboardEvent, () => toggleRowSelection(rowId));
                    }}
                  >
                    {#if rowSelected}
                      <!-- eslint-disable svelte/no-at-html-tags -->
                      <span class="table-checkbox-icon">{@html checkmarkSvg}</span>
                    {/if}
                  </span>
                </td>
              {/if}
              {#each row as cellValue, colIndex (colIndex)}
                <td
                  class="table-content"
                  data-pw={typeof getCellTestId === 'function'
                    ? getCellTestId(row, cellValue, rowIndex)
                    : null}
                >
                  <div class={isContentScrollable ? 'scrollable-content' : ''}>
                    {#if typeof cell === 'function'}
                      {@render cell(cellValue, rowIndex, colIndex)}
                    {:else}
                      {cellValue}
                    {/if}
                  </div>
                </td>
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
    {#if typeof paginatorSlot === 'function'}
      <div class="table-footer">
        {@render paginatorSlot()}
      </div>
    {/if}
  </div>
{/if}

<style>
  /* ── Title ─────────────────────────────────────────────────────────────── */
  .table-title {
    margin: var(--table-title-margin, 0px 0px 12px 0px);
    font-size: var(--table-title-font-size, var(--table-tile-font-size, 18px));
    font-weight: var(--table-title-font-weight, 600);
    color: var(--table-title-color, #111827);
    font-family: var(--table-title-font-family);
    padding: var(--table-title-padding);
  }

  /* ── C2-3 Search bar ────────────────────────────────────────────────────── */
  .table-search {
    display: flex;
    align-items: center;
    gap: var(--table-search-gap, 8px);
    padding: var(--table-search-padding, 8px 12px);
    border: var(--table-search-border, 1px solid #e5e7eb);
    border-radius: var(--table-search-border-radius, var(--radius, 4px));
    background-color: var(--table-search-background, #ffffff);
    margin-bottom: var(--table-search-margin-bottom, 8px);
  }

  .table-search-icon {
    display: inline-flex;
    align-items: center;
    color: var(--table-search-icon-color, #9ca3af);
    flex-shrink: 0;
  }

  .table-search-icon :global(svg) {
    width: var(--table-search-icon-size, 16px);
    height: var(--table-search-icon-size, 16px);
  }

  .table-search-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: var(--table-search-font-size, 14px);
    color: var(--table-search-color, #111827);
    min-width: 0;
  }

  .table-search-input:focus-visible {
    outline: 2px solid var(--table-focus-outline-color, #3b82f6);
    outline-offset: 2px;
    border-radius: var(--table-search-focus-border-radius, var(--radius, 4px));
  }

  .table-search-input::placeholder {
    color: var(--table-search-placeholder-color, #9ca3af);
  }

  /* Hide browser-default clear button on search inputs */
  .table-search-input::-webkit-search-cancel-button {
    display: none;
  }

  .table-search-clear {
    display: inline-flex;
    align-items: center;
    padding: 2px;
    border: none;
    background: transparent;
    color: var(--table-search-clear-color, #6b7280);
    cursor: pointer;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .table-search-clear:hover {
    color: var(--table-search-clear-hover-color, #111827);
    background-color: var(--table-search-clear-hover-background, rgba(0, 0, 0, 0.05));
  }

  .table-search-clear :global(svg) {
    width: var(--table-search-clear-icon-size, 14px);
    height: var(--table-search-clear-icon-size, 14px);
  }

  /* ── Container ──────────────────────────────────────────────────────────── */
  .table-container {
    border: var(--table-border, 1px solid #e5e7eb);
    border-radius: var(--table-border-radius, var(--radius, 4px));
    width: var(--table-container-width, 100%);
    overflow: hidden;
  }

  .scrollable-table {
    height: var(--table-container-height, 143px);
    overflow-y: auto;
  }

  table {
    width: var(--table-width, 100%);
    border-collapse: var(--table-border-collapse, collapse);
  }

  .table-header,
  .table-content {
    border: var(--table-inner-border, none);
    padding: var(--table-padding, 12px 16px);
    text-align: var(--table-text-align, left);
    width: var(--table-column-width);
    word-break: break-all;
  }

  .scrollable-content {
    overflow-y: auto;
    height: var(--scrollable-column-height, 20px);
  }

  .table-header {
    background-color: var(--table-header-background, var(--table-header-border-bgcolor, #f9fafb));
    font-size: var(--table-header-font-size, 13px);
    font-family: var(--table-header-font-family);
    font-weight: var(--table-header-font-weight, 600);
    letter-spacing: var(--table-header-letter-spacing, 0.02em);
    text-transform: var(--table-header-text-transform);
    color: var(--table-header-color, var(--table-header-font-color, #6b7280));
  }

  .table-header-content {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .table-header-sticky {
    position: sticky;
    top: var(--table-header-sticky-top, 0);
    z-index: 1;
  }

  .table-content {
    background-color: var(--table-content-background, var(--table-content-border-bgcolor));
    font-size: var(--table-content-font-size, 14px);
    font-family: var(--table-content-font-family);
    color: var(--table-content-color, var(--table-content-font-color, #111827));
  }

  .table-row {
    border-bottom: var(--table-row-border, 1px solid #f3f4f6);
    background-color: var(--table-row-background);
  }

  .table-row:last-child {
    border-bottom: var(--table-row-last-border, none);
  }

  .table-row:nth-child(even) {
    background-color: var(--table-row-alt-background, var(--table-row-background));
  }

  .table-row:hover {
    background-color: var(--table-row-hover-background);
  }

  .table-row:hover > .table-content {
    background-color: var(
      --table-row-hover-background,
      var(--table-content-background, var(--table-content-border-bgcolor))
    );
  }

  .table-row-clickable {
    cursor: pointer;
  }

  .table-row-clickable:focus-visible {
    outline: 2px solid var(--table-focus-outline-color, #3b82f6);
    outline-offset: -2px;
  }

  /* C2-1: Selected row highlight */
  .table-row-selected {
    background-color: var(--table-row-selected-background, #eff6ff);
  }

  .table-row-selected > .table-content {
    background-color: var(--table-row-selected-background, #eff6ff);
  }

  /* ── C2-1 Checkbox column ───────────────────────────────────────────────── */
  .table-checkbox-col {
    width: var(--table-checkbox-col-width, 44px);
    padding: var(--table-checkbox-col-padding, 12px 12px);
  }

  .table-checkbox-box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--table-checkbox-size, 18px);
    height: var(--table-checkbox-size, 18px);
    border: var(--table-checkbox-border, 2px solid #9ca3af);
    border-radius: var(--table-checkbox-border-radius, var(--radius, 4px));
    background-color: var(--table-checkbox-background, transparent);
    cursor: pointer;
    flex-shrink: 0;
    transition:
      background-color 0.15s,
      border-color 0.15s;
    user-select: none;
  }

  .table-checkbox-box:focus-visible {
    outline: none;
    box-shadow: var(--table-checkbox-focus-ring, 0 0 0 3px rgba(59, 130, 246, 0.3));
  }

  .table-checkbox-box:not(.disabled):hover {
    border-color: var(--table-checkbox-hover-border-color, #6b7280);
  }

  .table-checkbox-box.checked {
    background-color: var(--table-checkbox-checked-background, #2563eb);
    border-color: var(--table-checkbox-checked-border-color, #2563eb);
  }

  .table-checkbox-box.indeterminate {
    background-color: var(--table-checkbox-indeterminate-background, #2563eb);
    border-color: var(--table-checkbox-indeterminate-border-color, #2563eb);
  }

  .table-checkbox-box.disabled {
    opacity: var(--table-checkbox-disabled-opacity, 0.4);
    cursor: not-allowed;
  }

  .table-checkbox-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--table-checkbox-icon-size, 12px);
    height: var(--table-checkbox-icon-size, 12px);
    color: var(--table-checkbox-icon-color, #ffffff);
  }

  .table-checkbox-icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  /* ── Sort button ────────────────────────────────────────────────────────── */
  .sort-button {
    --button-color: transparent;
    --button-border: none;
    --button-padding: 2px;
    --button-margin: 0;
    --button-text-color: var(--table-sort-button-color, inherit);
    --button-border-radius: 4px;
    --button-width: fit-content;
    --button-height: fit-content;
    --button-hover-color: var(--table-sort-button-hover-background, rgba(0, 0, 0, 0.05));
    --button-hover-text-color: var(
      --table-sort-button-hover-color,
      var(--table-sort-button-color, inherit)
    );
    display: inline-flex;
    align-items: center;
    line-height: 1;
  }

  .sort-button :global(.sort-icon) {
    display: inline-flex;
    align-items: center;
  }

  .sort-button :global(.sort-icon svg) {
    width: var(--table-sort-icon-size, 14px);
    height: var(--table-sort-icon-size, 14px);
    display: block;
  }

  .sort-button :global(.sort-icon-idle) {
    opacity: var(--table-sort-idle-opacity, 0.5);
  }

  .sort-button:hover :global(.sort-icon-idle) {
    opacity: var(--table-sort-idle-hover-opacity, 0.85);
  }

  /* ── Empty ──────────────────────────────────────────────────────────────── */
  .table-empty {
    padding: var(--table-empty-padding, 32px 24px);
    text-align: center;
    color: var(--table-empty-color, #9ca3af);
  }

  /* ── Footer ─────────────────────────────────────────────────────────────── */
  .table-footer {
    border-top: var(--table-footer-border, 1px solid #e5e7eb);
    padding: var(--table-footer-padding, 8px 16px);
    background-color: var(--table-footer-background, transparent);
  }

  /* ── Accessibility ──────────────────────────────────────────────────────── */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border-width: 0;
  }
</style>
