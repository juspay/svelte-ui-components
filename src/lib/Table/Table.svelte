<script lang="ts">
  import type { TableProperties, TableCheckboxSelectionConfig, TableRow } from './properties';
  import { normalizeColumns } from './normalizeColumns';
  import BuiltinCell from './BuiltinCell.svelte';
  import type { JSONValue } from 'type-decoder';
  import { SvelteSet } from 'svelte/reactivity';
  import Button from '../Button/Button.svelte';
  import Menu from '../Menu/Menu.svelte';
  import Tooltip from '../Tooltip/Tooltip.svelte';
  import Pagination from '../Pagination/Pagination.svelte';
  import Select from '../Select/Select.svelte';
  import chevronDownSmSvg from '$lib/assets/chevron-down-sm.svg?raw';
  import sortDefaultSvg from '$lib/assets/sort-default.svg?raw';
  import searchSvg from '$lib/assets/search.svg?raw';
  import closeSvg from '$lib/assets/close.svg?raw';
  import checkmarkSvg from '$lib/assets/checkmark.svg?raw';
  import minusSvg from '$lib/assets/minus.svg?raw';

  let {
    tableTitle = '',
    tableHeaders = [],
    tableData = [],
    columns,
    rows,
    sortable = true,
    sortableColumns,
    sortMode = 'client',
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
    onSearchChange,
    pagination,
    toolbarSlot,
    rowNumberColumn = false,
    rowNumberLabel = '#',
    headerTooltipIcon,
    headerTooltipPosition,
    usePortal = false
  }: TableProperties = $props();

  // ─── Keyed column model → positional projection ─────────────────────────────
  // When `columns` is provided, the keyed model is normalized once and the
  // positional engine below runs on the projection; when absent, the positional
  // props pass through untouched, preserving existing behavior exactly.
  let normalized = $derived(columns ? normalizeColumns(columns, rows ?? []) : null);
  let effectiveHeaders = $derived(normalized ? normalized.tableHeaders : tableHeaders);
  let effectiveData = $derived(normalized ? normalized.tableData : tableData);
  // Maps each row reference back to its index in the consumer-supplied `rows`
  // (pre-sort/pre-filter). Row refs are preserved through sort/filter/paginate,
  // so cell callbacks can hand consumers a sort-stable `originalIndex`.
  let originalIndexByRow = $derived(new Map(effectiveData.map((row, index) => [row, index])));
  let effectiveSortableColumns = $derived(
    normalized ? normalized.sortableColumns : sortableColumns
  );

  /**
   * Recovers the original keyed row from a projected positional row so
   * column-scoped `cell` snippets receive the keyed shape. Sorting and
   * filtering copy the outer array but keep row references, so reference
   * identity survives the whole pipeline.
   */
  let keyedRowByProjected = $derived.by((): Map<JSONValue[], TableRow> | null => {
    if (!normalized || !rows) {
      return null;
    }
    return new Map(
      normalized.tableData.map((projectedRow, rowIndex) => [projectedRow, rows[rowIndex]])
    );
  });

  // ─── Sort state ──────────────────────────────────────────────────────────────
  let sortColumn = $state<number | null>(null);
  let sortDirection = $state<'asc' | 'desc'>('asc');

  const isColumnSortable = (colIndex: number): boolean => {
    if (!sortable) {
      return false;
    }
    if (effectiveSortableColumns) {
      return effectiveSortableColumns.includes(colIndex);
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
  const handleRowClick = (rowIndex: number, rowData: JSONValue[], originalIndex: number): void => {
    onRowClick?.(rowIndex, rowData, originalIndex);
  };

  const handleRowKeydown = (
    event: KeyboardEvent,
    rowIndex: number,
    rowData: JSONValue[],
    originalIndex: number
  ): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick?.(rowIndex, rowData, originalIndex);
    }
  };

  let isRowClickable = $derived(typeof onRowClick === 'function');
  let isStickyHeader = $derived(stickyHeader || isTableScrollable);

  // ─── Horizontal-scroll affordance ────────────────────────────────────────
  // The table clips columns behind an internal horizontal scroll on narrow
  // viewports, but a bare scroll container gives no visual hint that more
  // columns exist. Track whether either edge has hidden content and surface
  // it as edge scrims (see .table-scroll-shell styles).
  let canScrollLeft = $state(false);
  let canScrollRight = $state(false);

  const trackHorizontalScroll = (scrollNode: HTMLElement) => {
    const updateScrollHints = () => {
      canScrollLeft = scrollNode.scrollLeft > 2;
      canScrollRight = scrollNode.scrollLeft + scrollNode.clientWidth < scrollNode.scrollWidth - 2;
    };
    updateScrollHints();
    scrollNode.addEventListener('scroll', updateScrollHints, { passive: true });
    // Both the container resizing (viewport changes) and the table resizing
    // (async rows/columns arriving) change scrollWidth, so observe both.
    const hintResizeObserver = new ResizeObserver(updateScrollHints);
    hintResizeObserver.observe(scrollNode);
    const tableElement = scrollNode.querySelector('table');
    if (tableElement) {
      hintResizeObserver.observe(tableElement);
    }
    return {
      destroy: () => {
        scrollNode.removeEventListener('scroll', updateScrollHints);
        hintResizeObserver.disconnect();
      }
    };
  };

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
    pageOverride = 1;
    if (isServerSearch) {
      onSearchChange?.(searchTerm);
    }
  };

  const clearSearch = (): void => {
    searchTerm = '';
    pageOverride = 1;
    if (isServerSearch) {
      onSearchChange?.('');
    }
  };

  // ─── Sort + Search pipeline ──────────────────────────────────────────────────
  let sortedTableData = $derived.by(() => {
    if (sortColumn === null || sortMode === 'server') {
      return [...effectiveData];
    }

    const colIndex = sortColumn;
    const direction = sortDirection;

    // Keyed-mode per-column sort-value extraction: the consumer's getSortValue
    // supplies the comparable (currency/date parsing stays app-side), the
    // built-in scalar comparator below does the ordering.
    const getSortValue = columns?.[colIndex]?.getSortValue;
    const keyedLookup = keyedRowByProjected;
    if (typeof getSortValue === 'function' && keyedLookup) {
      const emptyRow: TableRow = {};
      const decorated = effectiveData.map((row, rowIndex) => ({
        row,
        sortValue: getSortValue(keyedLookup.get(row) ?? emptyRow, rowIndex)
      }));
      decorated.sort((entryA, entryB) => {
        const valueA = entryA.sortValue;
        const valueB = entryB.sortValue;
        let comparison: number;
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          comparison = valueA - valueB;
        } else if (typeof valueA === 'boolean' && typeof valueB === 'boolean') {
          comparison = valueA === valueB ? 0 : valueA ? -1 : 1;
        } else {
          comparison = String(valueA).localeCompare(String(valueB));
        }
        return direction === 'asc' ? comparison : -comparison;
      });
      return decorated.map((entry) => entry.row);
    }

    return [...effectiveData].sort((rowA, rowB) => {
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

  // ─── Built-in pagination ─────────────────────────────────────────────────
  // Client mode slices the filtered rows internally; server mode leaves the
  // supplied rows untouched (they ARE the current page) and only drives the
  // paginator chrome. Search input and page-size changes snap back to page 1.
  let pageOverride = $state<number | null>(null);
  let pageSizeOverride = $state<number | null>(null);
  let paginationMode = $derived(pagination?.mode ?? 'client');
  let effectivePageSize = $derived(pageSizeOverride ?? pagination?.pageSize ?? 10);
  let effectivePage = $derived.by(() => {
    if (!pagination) {
      return 1;
    }
    if (paginationMode === 'server') {
      return pagination.page ?? 1;
    }
    return pageOverride ?? pagination.page ?? 1;
  });
  let paginationTotalItems = $derived.by(() => {
    if (!pagination) {
      return 0;
    }
    if (paginationMode === 'server') {
      return pagination.totalItems ?? 0;
    }
    return filteredTableData.length;
  });
  let paginationTotalPages = $derived(
    Math.max(1, Math.ceil(paginationTotalItems / Math.max(1, effectivePageSize)))
  );
  let paginatedTableData = $derived.by(() => {
    if (!pagination || paginationMode === 'server') {
      return filteredTableData;
    }
    const startIndex = (effectivePage - 1) * effectivePageSize;
    return filteredTableData.slice(startIndex, startIndex + effectivePageSize);
  });
  let paginationRangeText = $derived.by(() => {
    if (!pagination) {
      return '';
    }
    const total = paginationTotalItems;
    const from = total === 0 ? 0 : (effectivePage - 1) * effectivePageSize + 1;
    const to = Math.min(effectivePage * effectivePageSize, total);
    if (pagination.rangeLabel) {
      return pagination.rangeLabel(from, to, total);
    }
    return total > 0 ? `${from}-${to} of ${total}` : '';
  });
  let pageSizeOptions = $derived(pagination?.pageSizeOptions ?? [10, 25, 50, 100]);

  const handlePageChange = (page: number): void => {
    pageOverride = page;
    pagination?.onPageChange?.(page);
  };

  const handlePageSizeChange = (nextSize: number): void => {
    pageSizeOverride = nextSize;
    pageOverride = 1;
    pagination?.onPageSizeChange?.(nextSize);
  };

  /** 1-based, pagination-aware sequence number for the row-number column. */
  const rowNumberFor = (rowIndex: number): number => {
    if (pagination) {
      return (effectivePage - 1) * effectivePageSize + rowIndex + 1;
    }
    return rowIndex + 1;
  };

  /**
   * Offset that converts the render loop's page-local index back into an index
   * into the consumer-supplied rows. Client-mode pagination slices internally,
   * so page 2+ would otherwise hand handlers (onRowClick, column handlers,
   * cell snippets, test-id callbacks) an index that mis-addresses the
   * consumer's full array. Server mode supplies the current page as the whole
   * array, so no offset applies.
   */
  let rowIndexOffset = $derived(
    pagination && (pagination.mode ?? 'client') === 'client'
      ? (effectivePage - 1) * effectivePageSize
      : 0
  );

  // ─── C2-1: Checkbox selection ─────────────────────────────────────────────
  const resolveRowId = (
    cfg: TableCheckboxSelectionConfig,
    row: JSONValue[],
    rowIndex: number,
    originalIndex: number
  ): string => {
    return cfg.getRowId ? cfg.getRowId(row, rowIndex, originalIndex) : String(rowIndex);
  };

  let internalSelectedIds = new SvelteSet<string>();

  // Controlled-selection overlay: when the consumer supplies selectedIds,
  // Table renders FROM that set and never mutates it — onSelectionChange
  // reports the would-be next set instead. Absent (every pre-existing
  // consumer), the internal reactive set behaves exactly as before.
  let controlledSelectedIds = $derived(checkboxSelection?.selectedIds ?? null);
  let effectiveSelectedIds = $derived<ReadonlySet<string>>(
    controlledSelectedIds ?? internalSelectedIds
  );

  const isRowDisabled = (rowId: string): boolean => {
    return checkboxSelection?.disabledRowIds?.has(rowId) ?? false;
  };

  const isRowSelected = (rowId: string): boolean => {
    return effectiveSelectedIds.has(rowId);
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
        return resolveRowId(
          checkboxSelection,
          row,
          stableIndex,
          originalIndexByRow.get(row) ?? stableIndex
        );
      }
      return String(stableIndex);
    });
  });

  /**
   * Row-reference → stable-ID lookup so the paginated view resolves the same
   * IDs as the full filtered view (slicing preserves row references).
   */
  let rowIdByRow = $derived(
    new Map(filteredTableData.map((row, index) => [row, filteredRowIds[index]]))
  );

  /**
   * IDs of all selectable (non-disabled) rows in the CURRENT VIEW — the page
   * the user is looking at under client pagination, the whole filtered set
   * otherwise (no pagination, and server mode, where the consumer's rows array
   * already is the page).
   *
   * The header select-all and its tri-state operate on this set, so checking
   * the header selects exactly the rows the user can see. Selections made on
   * other pages are left untouched by a header toggle on this page.
   */
  let selectableRowIds = $derived.by((): string[] => {
    if (!checkboxSelection || checkboxSelection.enabled === false) {
      return [];
    }
    return paginatedTableData.flatMap((row) => {
      const rowId = rowIdByRow.get(row) ?? null;
      return rowId !== null && !isRowDisabled(rowId) ? [rowId] : [];
    });
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
    const selectedCount = selectableRowIds.filter((rowId) =>
      effectiveSelectedIds.has(rowId)
    ).length;
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

    if (controlledSelectedIds) {
      const wasSelected = controlledSelectedIds.has(rowId);
      const nextSelection =
        checkboxSelection.selectionMode === 'single'
          ? new Set(wasSelected ? [] : [rowId])
          : wasSelected
            ? new Set([...controlledSelectedIds].filter((selectedId) => selectedId !== rowId))
            : new Set([...controlledSelectedIds, rowId]);
      checkboxSelection.onSelectionChange?.(nextSelection);
      return;
    }

    if (checkboxSelection.selectionMode === 'single') {
      const wasSelected = internalSelectedIds.has(rowId);
      internalSelectedIds.clear();
      if (!wasSelected) {
        internalSelectedIds.add(rowId);
      }
    } else {
      if (internalSelectedIds.has(rowId)) {
        internalSelectedIds.delete(rowId);
      } else {
        internalSelectedIds.add(rowId);
      }
    }
    checkboxSelection.onSelectionChange?.(new Set(internalSelectedIds));
  };

  const toggleAllSelection = (): void => {
    if (!checkboxSelection || checkboxSelection.enabled === false) {
      return;
    }

    if (controlledSelectedIds) {
      const selectableSet = new Set(selectableRowIds);
      const nextSelection =
        headerCheckboxState === 'all'
          ? new Set(
              [...controlledSelectedIds].filter((selectedId) => !selectableSet.has(selectedId))
            )
          : new Set([...controlledSelectedIds, ...selectableRowIds]);
      checkboxSelection.onSelectionChange?.(nextSelection);
      return;
    }

    // selectableRowIds already excludes disabled rows
    if (headerCheckboxState === 'all') {
      // deselect all selectable rows in the current view
      for (const rowId of selectableRowIds) {
        internalSelectedIds.delete(rowId);
      }
    } else {
      // select all selectable rows in the current view
      for (const rowId of selectableRowIds) {
        internalSelectedIds.add(rowId);
      }
    }
    checkboxSelection.onSelectionChange?.(new Set(internalSelectedIds));
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

{#if typeof toolbarSlot === 'function' && isCheckboxMode && effectiveSelectedIds.size > 0}
  <div class="table-toolbar">
    {@render toolbarSlot({ selectedIds: new Set(effectiveSelectedIds) })}
  </div>
{/if}

{#if effectiveHeaders.length !== 0 || effectiveData.length !== 0}
  <div
    class="table-container {isTableScrollable ? 'scrollable-table' : ''} {classes ?? ''}"
    data-pw={testId}
  >
    <div
      class="table-scroll-shell"
      class:scrollable-left={canScrollLeft}
      class:scrollable-right={canScrollRight}
    >
      <div class="table-scroll" use:trackHorizontalScroll>
        <table>
          {#if caption}
            <caption class="sr-only">{caption}</caption>
          {/if}
          <thead>
            <tr>
              {#if isCheckboxMode && !isSingleSelect}
                <th
                  class="table-header table-checkbox-col"
                  class:table-header-sticky={isStickyHeader}
                >
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
                    {...checkboxSelection?.getRowAttributes
                      ? checkboxSelection.getRowAttributes('__header__', -1)
                      : {}}
                    aria-controls={selectableRowIds
                      .map((rowId) => `row-checkbox-${rowId}`)
                      .join(' ')}
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
                <th
                  class="table-header table-checkbox-col"
                  class:table-header-sticky={isStickyHeader}
                >
                </th>
              {/if}
              {#if rowNumberColumn}
                <th
                  class="table-header table-row-number-col"
                  class:table-header-sticky={isStickyHeader}>{rowNumberLabel}</th
                >
              {/if}
              {#each effectiveHeaders as header, colIndex (colIndex)}
                {@const headerColumn = columns?.[colIndex]}
                <th
                  class="table-header"
                  class:table-header-sticky={isStickyHeader}
                  class:table-col-highlighted={headerColumn?.highlighted === true}
                  data-pw={headerColumn?.testId ?? null}
                  style:text-align={headerColumn?.align ?? null}
                  style:max-width={headerColumn?.maxWidth ?? null}
                >
                  <span
                    class="table-header-content"
                    style:justify-content={headerColumn?.align === 'right'
                      ? 'flex-end'
                      : headerColumn?.align === 'center'
                        ? 'center'
                        : null}
                  >
                    {#if headerColumn?.tooltip}
                      <Tooltip
                        text={headerColumn.tooltip}
                        position={headerTooltipPosition}
                        icon={headerTooltipIcon}
                        iconPosition="trailing"
                      >
                        <span
                          class="table-header-label"
                          class:table-header-label-plain={headerTooltipIcon}>{header}</span
                        >
                      </Tooltip>
                    {:else}
                      {header}
                    {/if}
                    {#if headerColumn?.filter}
                      {@const filter = headerColumn.filter}
                      <span class="table-header-filter">
                        <Menu
                          items={filter.options.map((option) => ({
                            value: option.value,
                            label: option.label
                          }))}
                          selectedValue={filter.selectedValue ?? null}
                          role="listbox"
                          testId={headerColumn.testId && `${headerColumn.testId}-filter`}
                          onselect={(menuItem) =>
                            filter.onFilterChange?.(
                              menuItem.value === filter.selectedValue ? null : menuItem.value
                            )}
                        >
                          {#snippet trigger()}
                            <span
                              class="table-header-filter-trigger"
                              class:table-header-filter-active={typeof filter.selectedValue ===
                                'string'}
                            >
                              <Button
                                ariaLabel="Filter by {header}"
                                testId={headerColumn.testId &&
                                  `${headerColumn.testId}-filter-trigger`}
                              >
                                {#snippet icon()}
                                  <!-- eslint-disable svelte/no-at-html-tags -->
                                  <span class="table-header-filter-icon"
                                    >{@html chevronDownSmSvg}</span
                                  >
                                {/snippet}
                              </Button>
                            </span>
                          {/snippet}
                        </Menu>
                      </span>
                    {/if}
                    {#if isColumnSortable(colIndex)}
                      <div class="sort-button">
                        <Button onclick={() => handleSort(colIndex)} ariaLabel="Sort by {header}">
                          {#if sortColumn === colIndex && sortDirection === 'asc'}
                            {#if typeof sortAscIcon === 'function'}
                              {@render sortAscIcon()}
                            {:else}
                              <span class="sort-icon sort-icon-asc">
                                <!-- eslint-disable svelte/no-at-html-tags -->
                                {@html sortDefaultSvg}
                              </span>
                            {/if}
                          {:else if sortColumn === colIndex && sortDirection === 'desc'}
                            {#if typeof sortDescIcon === 'function'}
                              {@render sortDescIcon()}
                            {:else}
                              <span class="sort-icon sort-icon-desc">
                                <!-- eslint-disable svelte/no-at-html-tags -->
                                {@html sortDefaultSvg}
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
                  colspan={effectiveHeaders.length +
                    (isCheckboxMode ? 1 : 0) +
                    (rowNumberColumn ? 1 : 0)}
                >
                  {@render empty()}
                </td>
              </tr>
            {:else}
              {#each paginatedTableData as row, pageRowIndex (rowIdByRow.get(row) ?? pageRowIndex)}
                {@const rowIndex = pageRowIndex + rowIndexOffset}
                {@const originalIndex = originalIndexByRow.get(row) ?? rowIndex}
                {@const rowId = rowIdByRow.get(row) ?? String(rowIndex)}
                {@const rowDisabled = isCheckboxMode && isRowDisabled(rowId)}
                {@const rowSelected = isCheckboxMode && isRowSelected(rowId)}
                <tr
                  class="table-row"
                  class:table-row-clickable={isRowClickable}
                  class:table-row-selected={rowSelected}
                  data-pw={typeof getRowTestId === 'function' ? getRowTestId(row, rowIndex) : null}
                  onclick={isRowClickable
                    ? () => handleRowClick(rowIndex, row, originalIndex)
                    : null}
                  onkeydown={isRowClickable
                    ? (keyboardEvent) =>
                        handleRowKeydown(keyboardEvent, rowIndex, row, originalIndex)
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
                        aria-label={`Select row ${rowId || 'non-selectable'}`}
                        {...checkboxSelection?.getRowAttributes
                          ? checkboxSelection.getRowAttributes(rowId, rowIndex)
                          : {}}
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
                  {#if rowNumberColumn}
                    <td class="table-content table-row-number-col">{rowNumberFor(pageRowIndex)}</td>
                  {/if}
                  {#each row as cellValue, colIndex (colIndex)}
                    {@const keyedColumn = columns?.[colIndex]}
                    {@const keyedRow = keyedRowByProjected?.get(row)}
                    {@const isScalarCell =
                      typeof cellValue === 'string' ||
                      typeof cellValue === 'number' ||
                      typeof cellValue === 'boolean'}
                    <td
                      class="table-content"
                      class:table-col-highlighted={keyedColumn?.highlighted === true}
                      data-pw={typeof getCellTestId === 'function'
                        ? getCellTestId(row, cellValue, rowIndex)
                        : null}
                      style:text-align={keyedColumn?.align ?? null}
                      style:max-width={keyedColumn?.maxWidth ?? null}
                      title={keyedColumn?.maxWidth && isScalarCell ? String(cellValue) : null}
                    >
                      <div
                        class={isContentScrollable ? 'scrollable-content' : ''}
                        class:table-cell-clamp={keyedColumn?.maxWidth && isScalarCell}
                      >
                        {#if keyedColumn && typeof keyedColumn.cell === 'function' && keyedRow}
                          {@render keyedColumn.cell(keyedRow, rowIndex, originalIndex)}
                        {:else if keyedColumn?.type && keyedColumn.type !== 'text' && keyedColumn.type !== 'custom'}
                          <BuiltinCell
                            column={keyedColumn}
                            value={cellValue}
                            {rowIndex}
                            {originalIndex}
                            {usePortal}
                          />
                        {:else if typeof cell === 'function'}
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
      </div>
    </div>
    {#if typeof paginatorSlot === 'function'}
      <div class="table-footer">
        {@render paginatorSlot()}
      </div>
    {:else if pagination && (paginationTotalPages > 1 || pagination.hasMore)}
      <!-- DataGrid parity: pagination chrome only renders when the data spans
           more than one page (or the server reports more chunks); a
           single-page table shows no footer. -->
      <div class="table-footer table-paginator" data-pw={pagination.testId ?? null}>
        <span class="table-paginator-range">{paginationRangeText}</span>
        <span class="table-paginator-controls">
          {#if pageSizeOptions.length > 0}
            <span class="table-paginator-size">
              <Select
                items={pageSizeOptions.map((sizeOption) => ({
                  id: String(sizeOption),
                  label: String(sizeOption)
                }))}
                value={[String(effectivePageSize)]}
                disabled={pagination.isLoading ?? false}
                testId={pagination.testId && `${pagination.testId}-page-size`}
                onchange={(selectedSizes) => {
                  if (selectedSizes.length > 0) {
                    handlePageSizeChange(Number(selectedSizes[0]));
                  }
                }}
              />
            </span>
          {/if}
          <Pagination
            totalPages={paginationTotalPages}
            currentPage={effectivePage}
            hasMore={pagination.hasMore ?? false}
            disabled={pagination.isLoading ?? false}
            testId={pagination.testId && `${pagination.testId}-pages`}
            onchange={handlePageChange}
            onLoadMore={pagination.onLoadMore}
          />
        </span>
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

  .table-scroll-shell {
    position: relative;
    min-width: 0;
  }

  /* Edge scrims: fade the clipped side of the table into its background so
     hidden columns read as "more content this way". Class-driven from live
     scroll state — never shown when the table fits. pointer-events: none
     keeps cells under the fade clickable; z-index 2 paints above sticky
     headers (z-index 1). */
  .table-scroll-shell::before,
  .table-scroll-shell::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: var(--table-scroll-scrim-width, 32px);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
    z-index: 2;
  }

  .table-scroll-shell::before {
    left: 0;
    border-radius: var(--table-border-radius, var(--radius, 4px)) 0 0
      var(--table-border-radius, var(--radius, 4px));
    background: linear-gradient(to right, var(--table-scroll-scrim-color, #ffffff), transparent);
  }

  .table-scroll-shell::after {
    right: 0;
    border-radius: 0 var(--table-border-radius, var(--radius, 4px))
      var(--table-border-radius, var(--radius, 4px)) 0;
    background: linear-gradient(to left, var(--table-scroll-scrim-color, #ffffff), transparent);
  }

  .table-scroll-shell.scrollable-left::before {
    opacity: 1;
  }

  .table-scroll-shell.scrollable-right::after {
    opacity: 1;
  }

  .table-scroll {
    overflow-x: auto;
    min-width: 0;
    scrollbar-width: thin;
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
    /* Wrap at word boundaries; only a single word wider than the column may
       split as a last resort. break-word (not anywhere) keeps each column's
       min-content width at its longest word, so ordinary labels never split
       mid-word — the old break-all default did. Opt back in per consumer via
       --table-word-break / --table-overflow-wrap. */
    word-break: var(--table-word-break, normal);
    overflow-wrap: var(--table-overflow-wrap, break-word);
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
    border-bottom: var(--table-header-border, var(--table-inner-border, none));
  }

  .table-header-content {
    display: flex;
    align-items: center;
    gap: 4px;
    justify-content: var(--table-header-justify, flex-start);
  }

  .table-header-label {
    text-decoration: var(--table-header-tooltip-underline, underline dotted);
    text-underline-offset: 2px;
    cursor: help;
  }

  .table-header-label-plain {
    text-decoration: none;
  }

  .table-header-filter {
    display: inline-flex;
    align-items: center;
  }

  .table-header-filter-trigger {
    --button-color: transparent;
    --button-border: none;
    --button-padding: 2px;
    --button-margin: 0;
    --button-width: fit-content;
    --button-height: fit-content;
    --button-text-color: var(--table-sort-button-color, inherit);
    --button-border-radius: 4px;
    --button-hover-color: var(--table-sort-button-hover-background, rgba(0, 0, 0, 0.05));
    display: inline-flex;
    align-items: center;
    opacity: var(--table-sort-idle-opacity, 0.5);
  }

  .table-header-filter-trigger:hover {
    opacity: var(--table-sort-idle-hover-opacity, 0.85);
  }

  .table-header-filter-active {
    opacity: 1;
    color: var(--table-filter-active-color, #2563eb);
  }

  .table-header-filter-icon :global(svg) {
    width: var(--table-sort-icon-size, 14px);
    height: var(--table-sort-icon-size, 14px);
    display: block;
  }

  .table-cell-clamp {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

  /* Column highlight (TableColumn.highlighted). Row hover keeps higher
     specificity and row selection is declared later at equal specificity, so
     both row states paint over the column wash. */
  .table-header.table-col-highlighted {
    background-color: var(
      --table-col-highlight-header-background,
      var(--table-col-highlight-background, #f3f9ff)
    );
  }

  .table-content.table-col-highlighted {
    background-color: var(--table-col-highlight-background, #f3f9ff);
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

  /* The sorted-direction half paints via currentColor; without an explicit
     color it inherits the Button's text color (white on the default button
     theme), which disappears on light headers. Default to the design
     system's active blue. */
  .sort-button :global(.sort-icon:not(.sort-icon-idle)) {
    color: var(--table-sort-active-color, #1b85ff);
  }

  .sort-button :global(.sort-icon svg) {
    width: var(--table-sort-icon-size, 14px);
    height: var(--table-sort-icon-size, 14px);
    display: block;
  }

  /* Two-tone state painting. The shared sort-default.svg asset stays
     color-agnostic (fill="currentColor", like every other icon asset); the
     state colors live here. All halves default to the inactive fill, then
     the sorted direction's half is released back to currentColor (the
     active color above). Path order in the asset is up-chevron first,
     down-chevron second. */
  .sort-button :global(.sort-icon svg path) {
    fill: var(--table-sort-inactive-color, #c7c7c7);
  }

  .sort-button :global(.sort-icon-asc svg path:first-child),
  .sort-button :global(.sort-icon-desc svg path:last-child) {
    fill: currentColor;
  }

  /* The design system draws every sort state fully opaque — faintness comes
     from the glyph fills (inactive halves #C7C7C7, active direction
     currentColor), never from transparency. The opacity vars remain for
     consumers that prefer a fade but now default to solid; hover steps the
     inactive halves to the design system's hover gray. */
  .sort-button :global(.sort-icon-idle) {
    opacity: var(--table-sort-idle-opacity, 1);
  }

  .sort-button:hover :global(.sort-icon-idle) {
    opacity: var(--table-sort-idle-hover-opacity, 1);
    --table-sort-inactive-color: var(--table-sort-hover-color, #797979);
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

  .table-paginator {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--table-paginator-gap, 12px);
    flex-wrap: wrap;
  }

  .table-paginator-range {
    font-size: var(--table-paginator-range-font-size, 13px);
    color: var(--table-paginator-range-color, #6b7280);
    font-variant-numeric: tabular-nums;
  }

  .table-paginator-controls {
    display: flex;
    align-items: center;
    gap: var(--table-paginator-gap, 12px);
  }

  .table-paginator-size {
    display: inline-flex;
    min-width: var(--table-paginator-size-width, 72px);
  }

  /* ── Toolbar (bulk actions) ─────────────────────────────────────────────── */
  .table-toolbar {
    display: flex;
    align-items: center;
    gap: var(--table-toolbar-gap, 12px);
    padding: var(--table-toolbar-padding, 8px 12px);
    border: var(--table-toolbar-border, 1px solid #e5e7eb);
    border-radius: var(--table-toolbar-border-radius, var(--radius, 4px));
    background-color: var(--table-toolbar-background, #f9fafb);
    margin-bottom: var(--table-toolbar-margin-bottom, 8px);
  }

  /* ── Row-number column ──────────────────────────────────────────────────── */
  .table-row-number-col {
    width: var(--table-row-number-col-width, 48px);
    color: var(--table-row-number-color, #6b7280);
    font-variant-numeric: tabular-nums;
    text-align: var(--table-row-number-align, var(--table-text-align, left));
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
