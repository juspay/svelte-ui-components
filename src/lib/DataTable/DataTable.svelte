<script lang="ts" generics="T extends import('./properties').DataRow">
  import type {
    ColumnDefinition,
    ColumnFilterValue,
    DataRow,
    DataTableProperties
  } from './properties';
  import type { JSONValue } from 'type-decoder';
  import { SvelteSet } from 'svelte/reactivity';
  import Pagination from '$lib/Pagination/Pagination.svelte';
  import ColumnFilter from './ColumnFilter.svelte';
  import ColumnManager from './ColumnManager.svelte';
  import {
    applyFilters,
    applySearch,
    applySort,
    coerceCellValue,
    decodeAvatarColumnValue,
    decodeProgressColumnValue,
    decodeTagColumnValue,
    displayValue,
    isFilterEmpty,
    nextSortDirection,
    paginate,
    rowIdOf,
    totalPagesOf
  } from './utils';
  import chevronUpSvg from '$lib/assets/chevron-up.svg?raw';
  import chevronDownSvg from '$lib/assets/chevron-down.svg?raw';
  import chevronRightSvg from '$lib/assets/chevron-right.svg?raw';
  import sortDefaultSvg from '$lib/assets/sort-default.svg?raw';
  import searchSvg from '$lib/assets/search.svg?raw';
  import closeSvg from '$lib/assets/close.svg?raw';
  import checkmarkSvg from '$lib/assets/checkmark.svg?raw';
  import minusSvg from '$lib/assets/minus.svg?raw';
  import pencilSvg from './icons/pencil.svg?raw';

  let {
    data = [],
    columns = [],
    idField,
    title = '',
    description = '',
    caption,
    classes,
    testId,
    isHoverable = true,
    stickyHeader = false,
    isTableScrollable = false,
    tableBodyHeight,
    sortable = true,
    defaultSort,
    serverSideSort = false,
    onSortChange,
    enableSearch = false,
    searchPlaceholder = 'Search…',
    searchFields,
    serverSideSearch = false,
    onSearchChange,
    enableFiltering = false,
    serverSideFiltering = false,
    onFilterChange,
    pagination,
    serverSidePagination = false,
    onPageChange,
    onPageSizeChange,
    enableColumnManager = false,
    enableColumnReordering = false,
    onColumnReorder,
    onColumnVisibilityChange,
    isLoading = false,
    showSkeleton = true,
    skeletonRows,
    isRowLoading,
    enableRowSelection = false,
    rowSelectionConfig,
    showBulkActionBar = true,
    onRowSelectionChange,
    bulkActions,
    enableRowExpansion = false,
    isRowExpandable,
    renderExpandedRow,
    onRowExpansionChange,
    enableInlineEdit = false,
    showActionsColumn = false,
    rowActions,
    onRowSave,
    onRowCancel,
    onFieldChange,
    onRowClick,
    cell,
    empty,
    toolbarSlot
  }: DataTableProperties<T> = $props();

  // ─── Sort state ────────────────────────────────────────────────────────────
  let sortField = $state<string | null>(defaultSort?.field ?? null);
  let sortDirection = $state<'asc' | 'desc' | 'none'>(defaultSort?.direction ?? 'none');

  const isColumnSortable = (column: ColumnDefinition<T>): boolean => {
    if (!sortable || column.isSortable === false) {
      return false;
    }
    // Custom columns have no inherent comparable value — they're sortable only
    // when the consumer opts in (explicit isSortable) or supplies their own
    // sort logic via sortValueFormatter.
    if (column.type === 'custom') {
      return column.isSortable === true || typeof column.sortValueFormatter === 'function';
    }
    return true;
  };

  const handleSort = (column: ColumnDefinition<T>): void => {
    if (!isColumnSortable(column)) return;
    if (sortField === column.field) {
      sortDirection = nextSortDirection(sortDirection);
      if (sortDirection === 'none') sortField = null;
    } else {
      sortField = column.field;
      sortDirection = 'asc';
    }
    onSortChange?.({ field: column.field, direction: sortField ? sortDirection : 'none' });
  };

  // ─── Search state ──────────────────────────────────────────────────────────
  let searchTerm = $state('');
  const handleSearchInput = (event: Event): void => {
    searchTerm = (event.currentTarget as HTMLInputElement).value;
    pageState = 1;
    if (serverSideSearch) onSearchChange?.(searchTerm);
  };
  const clearSearch = (): void => {
    searchTerm = '';
    pageState = 1;
    if (serverSideSearch) onSearchChange?.('');
  };

  // ─── Filter state ──────────────────────────────────────────────────────────
  let filters = $state<Record<string, ColumnFilterValue>>({});
  const activeFilters = $derived(Object.values(filters).filter((f) => !isFilterEmpty(f)));

  const applyColumnFilter = (filter: ColumnFilterValue): void => {
    filters = { ...filters, [filter.field]: filter };
    pageState = 1;
    if (serverSideFiltering) onFilterChange?.(activeFilters);
  };
  const clearColumnFilter = (field: string): void => {
    const next = { ...filters };
    delete next[field];
    filters = next;
    pageState = 1;
    if (serverSideFiltering) onFilterChange?.(activeFilters);
  };

  // ─── Column visibility + order ───────────────────────────────────────────────
  let hiddenFields = new SvelteSet<string>(
    columns.filter((c) => c.isVisible === false).map((c) => c.field)
  );
  // User drag-reorder overrides; `null` until the user reorders. The effective
  // order is derived so columns added/removed via the prop reconcile on their
  // own — no $effect (banned in lib code) and no stale local copy.
  let manualOrder = $state<string[] | null>(null);
  const columnOrder = $derived.by(() => {
    const incoming = columns.map((c) => c.field);
    const order = manualOrder;
    if (order === null) {
      return incoming;
    }
    const known = new Set(incoming);
    const kept = order.filter((f) => known.has(f));
    const added = incoming.filter((f) => !order.includes(f));
    return [...kept, ...added];
  });

  const columnByField = $derived(new Map(columns.map((c) => [c.field, c])));
  const visibleColumns = $derived(
    columnOrder
      .map((field) => columnByField.get(field))
      .filter((c): c is ColumnDefinition<T> => !!c && !hiddenFields.has(c.field))
  );

  const toggleColumn = (field: string, visible: boolean): void => {
    if (visible) hiddenFields.delete(field);
    else hiddenFields.add(field);
    onColumnVisibilityChange?.(visibleColumns.map((c) => c.field));
  };
  const reorderColumns = (order: string[]): void => {
    manualOrder = order;
    onColumnReorder?.(
      order.map((f) => columnByField.get(f)).filter((c): c is ColumnDefinition<T> => !!c)
    );
  };

  // ─── Data pipeline (client side; bypassed per server-side flags) ─────────────
  const processedData = $derived.by(() => {
    let rows = data;
    if (!serverSideFiltering) rows = applyFilters(rows, activeFilters);
    if (!serverSideSearch) {
      const fields = searchFields ?? visibleColumns.map((c) => c.field);
      rows = applySearch(rows, searchTerm, fields as (keyof T & string)[], visibleColumns);
    }
    if (!serverSideSort) rows = applySort(rows, columns, sortField, sortDirection);
    return rows;
  });

  // ─── Pagination ──────────────────────────────────────────────────────────────
  const paginationEnabled = $derived(!!pagination);
  // Internal pager state used in client-side mode only. In server-side mode the
  // pager is controlled by the `pagination` prop (see `page`/`pageSize` below),
  // so a parent resetting currentPage/pageSize after a new query is reflected.
  let pageState = $state(pagination?.currentPage ?? 1);
  let pageSizeState = $state(pagination?.pageSize ?? 10);

  const pageSize = $derived(
    serverSidePagination ? (pagination?.pageSize ?? pageSizeState) : pageSizeState
  );

  const totalRows = $derived(
    serverSidePagination ? (pagination?.totalRows ?? data.length) : processedData.length
  );
  const totalPages = $derived(totalPagesOf(totalRows, pageSize));

  // Effective current page. Server-side: mirror the prop (controlled). Client-side:
  // clamp internal state so a shrunk dataset can't strand us past the last page —
  // derived rather than an $effect (banned in lib code).
  const page = $derived.by(() => {
    if (serverSidePagination) {
      return pagination?.currentPage ?? 1;
    }
    return Math.min(Math.max(pageState, 1), totalPages);
  });

  const displayRows = $derived.by(() => {
    if (!paginationEnabled || serverSidePagination) return processedData;
    return paginate(processedData, page, pageSize);
  });

  const handlePageChange = (next: number): void => {
    pageState = next;
    if (serverSidePagination) onPageChange?.(next);
  };
  const handlePageSizeChange = (nextSize: number): void => {
    pageSizeState = nextSize;
    pageState = 1;
    onPageSizeChange?.(nextSize);
  };

  // ─── Row identity helpers ────────────────────────────────────────────────────
  const idOf = (row: T): string => rowIdOf(row, idField);

  // ─── Selection ───────────────────────────────────────────────────────────────
  let selectedIds = new SvelteSet<string>();
  const isSingleSelect = $derived(rowSelectionConfig?.selectionMode === 'single');

  const isRowSelectionDisabled = (row: T, index: number): boolean =>
    rowSelectionConfig?.isDisabled?.(row, index) ?? false;

  const selectableRowIds = $derived(
    enableRowSelection
      ? processedData.filter((row, i) => !isRowSelectionDisabled(row, i)).map(idOf)
      : []
  );

  const headerCheckboxState = $derived.by((): 'all' | 'some' | 'none' => {
    if (!enableRowSelection || isSingleSelect || selectableRowIds.length === 0) return 'none';
    const count = selectableRowIds.filter((id) => selectedIds.has(id)).length;
    if (count === 0) return 'none';
    if (count === selectableRowIds.length) return 'all';
    return 'some';
  });

  const emitSelection = (): void => onRowSelectionChange?.([...selectedIds]);

  const toggleRowSelection = (row: T, index: number): void => {
    if (!enableRowSelection || isRowSelectionDisabled(row, index)) return;
    const id = idOf(row);
    if (isSingleSelect) {
      const wasSelected = selectedIds.has(id);
      selectedIds.clear();
      if (!wasSelected) selectedIds.add(id);
    } else if (selectedIds.has(id)) {
      selectedIds.delete(id);
    } else {
      selectedIds.add(id);
    }
    emitSelection();
  };

  const toggleAllSelection = (): void => {
    if (!enableRowSelection || isSingleSelect) return;
    if (headerCheckboxState === 'all') {
      for (const id of selectableRowIds) selectedIds.delete(id);
    } else {
      for (const id of selectableRowIds) selectedIds.add(id);
    }
    emitSelection();
  };

  const clearSelection = (): void => {
    selectedIds.clear();
    emitSelection();
  };

  // ─── Expansion ───────────────────────────────────────────────────────────────
  let expandedIds = new SvelteSet<string>();
  const canExpand = (row: T, index: number): boolean =>
    enableRowExpansion && (isRowExpandable?.(row, index) ?? true);
  const toggleExpansion = (row: T, index: number): void => {
    if (!canExpand(row, index)) return;
    const id = idOf(row);
    const isExpanded = expandedIds.has(id);
    if (isExpanded) expandedIds.delete(id);
    else expandedIds.add(id);
    onRowExpansionChange?.(id, !isExpanded, row);
  };

  // ─── Inline edit ─────────────────────────────────────────────────────────────
  let editingId = $state<string | null>(null);
  let editDraft = $state<Record<string, JSONValue>>({});

  const startEdit = (row: T): void => {
    editingId = idOf(row);
    editDraft = { ...row };
  };
  const cancelEdit = (): void => {
    const id = editingId;
    editingId = null;
    editDraft = {};
    if (id !== null) onRowCancel?.(id);
  };
  const saveEdit = (row: T): void => {
    const id = idOf(row);
    onRowSave?.(id, { ...row, ...editDraft } as T);
    editingId = null;
    editDraft = {};
  };
  const handleFieldInput = (field: string, raw: string, previous: JSONValue): void => {
    const value = coerceCellValue(raw, previous);
    editDraft = { ...editDraft, [field]: value };
    if (editingId !== null) onFieldChange?.(editingId, field as keyof T & string, value);
  };

  // ─── Layout (utility columns + freezing) ─────────────────────────────────────
  type RenderColumn =
    | { kind: 'expand'; width: number; left: number | null }
    | { kind: 'select'; width: number; left: number | null }
    | { kind: 'data'; column: ColumnDefinition<T>; width: number | null; left: number | null }
    | { kind: 'actions'; width: number; left: null };

  const EXPAND_WIDTH = 44;
  const SELECT_WIDTH = 44;

  const hasActionsColumn = $derived(
    showActionsColumn ||
      !!rowActions?.slot1 ||
      !!rowActions?.slot2 ||
      (enableInlineEdit && !!rowActions?.showEditAction)
  );

  const renderColumns = $derived.by((): RenderColumn[] => {
    const cols: RenderColumn[] = [];
    if (enableRowExpansion) cols.push({ kind: 'expand', width: EXPAND_WIDTH, left: null });
    if (enableRowSelection) cols.push({ kind: 'select', width: SELECT_WIDTH, left: null });
    for (const column of visibleColumns) {
      const width = column.frozen && column.width ? parseInt(column.width, 10) : null;
      cols.push({ kind: 'data', column, width, left: null });
    }
    if (hasActionsColumn) cols.push({ kind: 'actions', width: 96, left: null });

    // Compute sticky-left offsets for the contiguous frozen prefix.
    const anyFrozen = visibleColumns.some((c) => c.frozen && c.width);
    if (anyFrozen) {
      let offset = 0;
      for (const col of cols) {
        if (col.kind === 'data') {
          if (col.column.frozen && col.width) {
            col.left = offset;
            offset += col.width;
          } else {
            break;
          }
        } else if (col.kind === 'expand' || col.kind === 'select') {
          col.left = offset;
          offset += col.width;
        } else {
          break;
        }
      }
    }
    return cols;
  });

  const totalColspan = $derived(renderColumns.length);
  const isStickyHeader = $derived(stickyHeader || isTableScrollable || !!tableBodyHeight);
  const isRowClickable = $derived(typeof onRowClick === 'function');
  const skeletonCount = $derived(skeletonRows ?? (paginationEnabled ? pageSize : 5));

  const handleRowClick = (row: T, index: number): void => {
    if (editingId === idOf(row)) return;
    onRowClick?.(row, index);
  };
  const handleRowKeydown = (event: KeyboardEvent, row: T, index: number): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRowClick(row, index);
    }
  };
  const handleCheckboxKeydown = (event: KeyboardEvent, action: () => void): void => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      action();
    }
  };

  const resolvePredicate = <V,>(
    value: V | ((row: T, index: number) => V),
    row: T,
    index: number
  ): V =>
    typeof value === 'function' ? (value as (row: T, index: number) => V)(row, index) : value;

  const pageSizeOptions = $derived(pagination?.pageSizeOptions ?? [10, 25, 50, 100]);
</script>

{#if title || description}
  <div class="table-heading">
    {#if title}<div class="table-title">{title}</div>{/if}
    {#if description}<div class="table-description">{description}</div>{/if}
  </div>
{/if}

<!-- ── Toolbar: search + filters/columns + bulk actions ───────────────────── -->
{#if enableSearch || enableColumnManager || toolbarSlot || (enableRowSelection && showBulkActionBar)}
  <div class="dt-toolbar">
    {#if enableRowSelection && showBulkActionBar && selectedIds.size > 0}
      <div class="dt-bulk-bar" role="region" aria-label="Bulk actions">
        <span class="dt-bulk-count">{selectedIds.size} selected</span>
        <button type="button" class="dt-bulk-clear" onclick={clearSelection}>Clear</button>
        {#if bulkActions}
          <div class="dt-bulk-actions">
            {@render bulkActions({ selectedIds: [...selectedIds], clear: clearSelection })}
          </div>
        {/if}
      </div>
    {:else}
      {#if enableSearch}
        <div class="table-search dt-toolbar-search">
          <span class="table-search-icon">
            <!-- eslint-disable svelte/no-at-html-tags -->
            {@html searchSvg}
          </span>
          <input
            class="table-search-input"
            type="search"
            placeholder={searchPlaceholder}
            value={searchTerm}
            oninput={handleSearchInput}
            aria-label={searchPlaceholder}
            autocomplete="off"
          />
          {#if searchTerm.length > 0}
            <button
              class="table-search-clear"
              type="button"
              onclick={clearSearch}
              aria-label="Clear search"
            >
              {@html closeSvg}
            </button>
          {/if}
        </div>
      {/if}
      <div class="dt-toolbar-actions">
        {#if toolbarSlot}{@render toolbarSlot()}{/if}
        {#if enableColumnManager}
          <ColumnManager
            {columns}
            {hiddenFields}
            order={columnOrder}
            reorderable={enableColumnReordering}
            onToggle={toggleColumn}
            onReorder={reorderColumns}
          />
        {/if}
      </div>
    {/if}
  </div>
{/if}

<div
  class="table-container {isTableScrollable ? 'scrollable-table' : ''} {classes ?? ''}"
  class:dt-fixed-body={!!tableBodyHeight}
  style={tableBodyHeight ? `--table-body-height:${tableBodyHeight}` : undefined}
  data-pw={testId}
>
  <table>
    {#if caption}
      <caption class="sr-only">{caption}</caption>
    {/if}
    <thead>
      <tr>
        {#each renderColumns as rc (rc.kind === 'data' ? rc.column.field : rc.kind)}
          {#if rc.kind === 'expand'}
            <th
              class="table-header table-checkbox-col"
              class:table-header-sticky={isStickyHeader}
              class:dt-frozen={rc.left !== null}
              style={rc.left !== null ? `left:${rc.left}px` : undefined}
            ></th>
          {:else if rc.kind === 'select'}
            <th
              class="table-header table-checkbox-col"
              class:table-header-sticky={isStickyHeader}
              class:dt-frozen={rc.left !== null}
              style={rc.left !== null ? `left:${rc.left}px` : undefined}
            >
              {#if !isSingleSelect}
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
                  onclick={toggleAllSelection}
                  onkeydown={(e) => handleCheckboxKeydown(e, toggleAllSelection)}
                >
                  {#if headerCheckboxState === 'all'}
                    <span class="table-checkbox-icon">{@html checkmarkSvg}</span>
                  {:else if headerCheckboxState === 'some'}
                    <span class="table-checkbox-icon">{@html minusSvg}</span>
                  {/if}
                </span>
              {/if}
            </th>
          {:else if rc.kind === 'data'}
            {@const column = rc.column}
            {@const sortActive = sortField === column.field && sortDirection !== 'none'}
            <th
              class="table-header {column.className ?? ''}"
              class:table-header-sticky={isStickyHeader}
              class:dt-frozen={rc.left !== null}
              style={`${rc.left !== null ? `left:${rc.left}px;` : ''}${column.width ? `width:${column.width};` : ''}${column.minWidth ? `min-width:${column.minWidth};` : ''}${column.maxWidth ? `max-width:${column.maxWidth};` : ''}${column.align ? `text-align:${column.align};` : ''}`}
            >
              <span class="table-header-content" class:dt-header-end={column.align === 'right'}>
                <span class="dt-header-text">
                  {column.header}
                  {#if column.headerSubtext}
                    <span class="dt-header-subtext">{column.headerSubtext}</span>
                  {/if}
                </span>
                {#if enableFiltering && column.filterType}
                  <ColumnFilter
                    field={column.field}
                    header={column.header}
                    filterType={column.filterType}
                    filterOptions={column.filterOptions}
                    value={filters[column.field] ?? null}
                    onApply={applyColumnFilter}
                    onClear={clearColumnFilter}
                  />
                {/if}
                {#if isColumnSortable(column)}
                  <button
                    type="button"
                    class="dt-sort-button"
                    onclick={() => handleSort(column)}
                    aria-label={`Sort by ${column.header}`}
                  >
                    {#if sortActive && sortDirection === 'asc'}
                      <span class="sort-icon">{@html chevronUpSvg}</span>
                    {:else if sortActive && sortDirection === 'desc'}
                      <span class="sort-icon">{@html chevronDownSvg}</span>
                    {:else}
                      <span class="sort-icon sort-icon-idle">{@html sortDefaultSvg}</span>
                    {/if}
                  </button>
                {/if}
              </span>
            </th>
          {:else}
            <th class="table-header dt-actions-col" class:table-header-sticky={isStickyHeader}></th>
          {/if}
        {/each}
      </tr>
    </thead>

    <tbody>
      {#if isLoading && showSkeleton}
        {#each Array(skeletonCount) as _, skeletonRow (skeletonRow)}
          <tr class="table-row">
            {#each renderColumns as rc, ci (ci)}
              <td
                class="table-content {rc.kind === 'data' && rc.column.className
                  ? rc.column.className
                  : ''}"
              >
                <span class="dt-skeleton"></span>
              </td>
            {/each}
          </tr>
        {/each}
      {:else if displayRows.length === 0}
        <tr>
          <td class="table-empty" colspan={totalColspan}>
            {#if empty}{@render empty()}{:else}No data{/if}
          </td>
        </tr>
      {:else}
        {#each displayRows as row, rowIndex (idOf(row))}
          {@const rowId = idOf(row)}
          {@const selectionDisabled = enableRowSelection && isRowSelectionDisabled(row, rowIndex)}
          {@const rowSelected = enableRowSelection && selectedIds.has(rowId)}
          {@const expandable = canExpand(row, rowIndex)}
          {@const expanded = expandedIds.has(rowId)}
          {@const editing = editingId === rowId}
          {@const rowLoading = isRowLoading?.(row, rowIndex) ?? false}
          <tr
            class="table-row"
            class:table-row-clickable={isRowClickable}
            class:table-row-selected={rowSelected}
            class:dt-hoverable={isHoverable}
            onclick={isRowClickable ? () => handleRowClick(row, rowIndex) : null}
            onkeydown={isRowClickable ? (e) => handleRowKeydown(e, row, rowIndex) : null}
            tabindex={isRowClickable ? 0 : null}
          >
            {#each renderColumns as rc (rc.kind === 'data' ? rc.column.field : rc.kind)}
              {#if rc.kind === 'expand'}
                <td
                  class="table-content table-checkbox-col"
                  class:dt-frozen={rc.left !== null}
                  style={rc.left !== null ? `left:${rc.left}px` : undefined}
                >
                  {#if expandable}
                    <button
                      type="button"
                      class="dt-expand-btn"
                      class:expanded
                      aria-label={expanded ? 'Collapse row' : 'Expand row'}
                      aria-expanded={expanded}
                      onclick={(e) => {
                        e.stopPropagation();
                        toggleExpansion(row, rowIndex);
                      }}
                      onkeydown={(e) => e.stopPropagation()}
                    >
                      <span class="dt-expand-icon">{@html chevronRightSvg}</span>
                    </button>
                  {/if}
                </td>
              {:else if rc.kind === 'select'}
                <td
                  class="table-content table-checkbox-col"
                  class:dt-frozen={rc.left !== null}
                  style={rc.left !== null ? `left:${rc.left}px` : undefined}
                >
                  <span
                    class="table-checkbox-box"
                    class:checked={rowSelected}
                    class:disabled={selectionDisabled}
                    class:dt-radio={isSingleSelect}
                    role={isSingleSelect ? 'radio' : 'checkbox'}
                    tabindex={selectionDisabled ? -1 : 0}
                    aria-checked={rowSelected}
                    aria-disabled={selectionDisabled}
                    aria-label={rowSelectionConfig?.disabledText?.(row, rowIndex) ?? 'Select row'}
                    onclick={(e) => {
                      e.stopPropagation();
                      toggleRowSelection(row, rowIndex);
                    }}
                    onkeydown={(e) => {
                      e.stopPropagation();
                      handleCheckboxKeydown(e, () => toggleRowSelection(row, rowIndex));
                    }}
                  >
                    {#if rowSelected}
                      <span class="table-checkbox-icon">
                        {@html isSingleSelect ? '' : checkmarkSvg}
                      </span>
                    {/if}
                  </span>
                </td>
              {:else if rc.kind === 'data'}
                {@const column = rc.column}
                {@const value = row[column.field]}
                <!-- Only scalar renderers can round-trip through the text input;
                     object-backed types (tag/avatar/progress) would be coerced to
                     a string and break their renderers, so they never edit inline. -->
                {@const supportsInlineTextEdit =
                  !column.type ||
                  column.type === 'text' ||
                  column.type === 'number' ||
                  column.type === 'date'}
                {@const cellEditable =
                  editing && enableInlineEdit && column.isEditable && supportsInlineTextEdit}
                {@const tagValue = column.type === 'tag' ? decodeTagColumnValue(value) : null}
                {@const avatarValue =
                  column.type === 'avatar' ? decodeAvatarColumnValue(value) : null}
                {@const progressValue =
                  column.type === 'progress' ? decodeProgressColumnValue(value) : null}
                <td
                  class="table-content {column.className ?? ''}"
                  class:dt-frozen={rc.left !== null}
                  style={`${rc.left !== null ? `left:${rc.left}px;` : ''}${column.align ? `text-align:${column.align};` : ''}`}
                >
                  {#if rowLoading}
                    <span class="dt-skeleton"></span>
                  {:else if cellEditable}
                    <input
                      class="dt-edit-input"
                      value={String(editDraft[column.field] ?? '')}
                      onclick={(e) => e.stopPropagation()}
                      onkeydown={(e) => e.stopPropagation()}
                      oninput={(e) => handleFieldInput(column.field, e.currentTarget.value, value)}
                    />
                  {:else if cell}
                    {@render cell(column, value, row, rowIndex)}
                  {:else if tagValue}
                    <span class="dt-tag dt-tag-{tagValue.color ?? 'neutral'}">{tagValue.text}</span>
                  {:else if avatarValue}
                    <span class="dt-avatar-cell">
                      <span class="dt-avatar" aria-hidden="true">
                        {#if avatarValue.imageUrl}
                          <img src={avatarValue.imageUrl} alt="" />
                        {:else}
                          {avatarValue.label.charAt(0)}
                        {/if}
                      </span>
                      <span class="dt-avatar-text">
                        <span class="dt-avatar-label">{avatarValue.label}</span>
                        {#if avatarValue.sublabel}
                          <span class="dt-avatar-sublabel">{avatarValue.sublabel}</span>
                        {/if}
                      </span>
                    </span>
                  {:else if progressValue}
                    {@const pct = Math.min(
                      100,
                      Math.round((progressValue.value / (progressValue.max ?? 100)) * 100)
                    )}
                    <span class="dt-progress">
                      <span class="dt-progress-track"
                        ><span class="dt-progress-fill" style={`width:${pct}%`}></span></span
                      >
                      {#if progressValue.showPercentage !== false}<span class="dt-progress-label"
                          >{pct}%</span
                        >{/if}
                    </span>
                  {:else}
                    {displayValue(column, row, rowIndex)}
                  {/if}
                </td>
              {:else}
                <td class="table-content dt-actions-col">
                  <div class="dt-actions" role="group">
                    {#if editing}
                      <button
                        type="button"
                        class="dt-action-btn dt-action-save"
                        aria-label="Save"
                        onclick={(e) => {
                          e.stopPropagation();
                          saveEdit(row);
                        }}
                        onkeydown={(e) => e.stopPropagation()}
                      >
                        <span class="dt-action-icon">{@html checkmarkSvg}</span>
                      </button>
                      <button
                        type="button"
                        class="dt-action-btn"
                        aria-label="Cancel"
                        onclick={(e) => {
                          e.stopPropagation();
                          cancelEdit();
                        }}
                        onkeydown={(e) => e.stopPropagation()}
                      >
                        <span class="dt-action-icon">{@html closeSvg}</span>
                      </button>
                    {:else}
                      {#if enableInlineEdit && rowActions?.showEditAction}
                        <button
                          type="button"
                          class="dt-action-btn"
                          aria-label="Edit row"
                          onclick={(e) => {
                            e.stopPropagation();
                            startEdit(row);
                          }}
                          onkeydown={(e) => e.stopPropagation()}
                        >
                          <span class="dt-action-icon">{@html pencilSvg}</span>
                        </button>
                      {/if}
                      {#each [rowActions?.slot1, rowActions?.slot2].filter(Boolean) as action (action!.id)}
                        {@const disabled = resolvePredicate(
                          action!.disabled ?? false,
                          row,
                          rowIndex
                        )}
                        {@const hidden = resolvePredicate(action!.hidden ?? false, row, rowIndex)}
                        {#if !hidden}
                          <button
                            type="button"
                            class="dt-action-btn"
                            {disabled}
                            aria-label={action!.text ?? action!.id}
                            onclick={(e) => {
                              e.stopPropagation();
                              action!.onClick(row, rowIndex);
                            }}
                            onkeydown={(e) => e.stopPropagation()}
                          >
                            {#if action!.icon}{@render action!.icon()}{:else}{action!.text}{/if}
                          </button>
                        {/if}
                      {/each}
                    {/if}
                  </div>
                </td>
              {/if}
            {/each}
          </tr>
          {#if expandable && expanded && renderExpandedRow}
            <tr class="dt-expanded-row">
              <td colspan={totalColspan} class="dt-expanded-cell">
                {@render renderExpandedRow({ row, index: rowIndex })}
              </td>
            </tr>
          {/if}
        {/each}
      {/if}
    </tbody>
  </table>
</div>

{#if paginationEnabled && totalPages > 0}
  <div class="table-footer dt-footer">
    <div class="dt-pagesize">
      <span>Rows per page</span>
      <select
        class="dt-pagesize-select"
        value={pageSize}
        onchange={(e) => handlePageSizeChange(Number(e.currentTarget.value))}
      >
        {#each pageSizeOptions as size (size)}
          <option value={size}>{size}</option>
        {/each}
      </select>
      <span class="dt-rowcount">{totalRows} total</span>
    </div>
    <Pagination {totalPages} currentPage={page} onchange={handlePageChange} bordered={false} />
  </div>
{/if}

<style>
  /* ── Table foundation tokens ────────────────────────────────────────────── */
  .table-heading,
  .dt-toolbar,
  .table-container,
  .table-footer {
    --table-color-surface: var(--sui-color-surface, #ffffff);
    --table-color-surface-muted: var(--sui-color-surface-muted, #f9fafb);
    --table-color-surface-subtle: var(--sui-color-surface-subtle, #f3f4f6);
    --table-color-border: var(--sui-color-border, #e5e7eb);
    --table-color-border-subtle: var(--sui-color-border-subtle, #f3f4f6);
    --table-color-border-strong: var(--sui-color-border-strong, #d1d5db);
    --table-color-text: var(--sui-color-text, #111827);
    --table-color-text-secondary: var(--sui-color-text-secondary, #374151);
    --table-color-text-muted: var(--sui-color-text-muted, #6b7280);
    --table-color-text-subtle: var(--sui-color-text-subtle, #9ca3af);
    --table-color-on-accent: var(--sui-color-on-accent, #ffffff);
    --table-color-accent: var(--sui-color-accent, #2563eb);
    --table-color-accent-strong: var(--sui-color-accent-strong, #1d4ed8);
    --table-color-accent-muted: var(--sui-color-accent-muted, #eff6ff);
    --table-color-accent-border: var(--sui-color-accent-border, #bfdbfe);
    --table-color-focus: var(--sui-color-focus, #3b82f6);
    --table-color-success: var(--sui-color-success, #16a34a);
    --table-color-success-surface: var(--sui-color-success-surface, #dcfce7);
    --table-color-success-text: var(--sui-color-success-text, #15803d);
    --table-color-warning-surface: var(--sui-color-warning-surface, #fef9c3);
    --table-color-warning-text: var(--sui-color-warning-text, #a16207);
    --table-color-error-surface: var(--sui-color-error-surface, #fee2e2);
    --table-color-error-text: var(--sui-color-error-text, #b91c1c);
    --table-color-info-surface: var(--sui-color-info-surface, #dbeafe);
    --table-color-info-text: var(--sui-color-info-text, #1d4ed8);
    --table-color-hover-overlay: var(--sui-color-hover-overlay, rgba(0, 0, 0, 0.05));
    --table-color-hover-overlay-subtle: var(--sui-color-hover-overlay-subtle, rgba(0, 0, 0, 0.04));
    --table-color-hover-overlay-muted: var(--sui-color-hover-overlay-muted, rgba(0, 0, 0, 0.03));
    --table-shadow-popover: var(--sui-shadow-popover, 0 8px 24px rgba(0, 0, 0, 0.12));
    --table-shadow-focus: var(--sui-shadow-focus, 0 0 0 3px rgba(59, 130, 246, 0.3));
    --table-shadow-focus-subtle: var(--sui-shadow-focus-subtle, rgba(59, 130, 246, 0.2));
    --table-font-size-2xs: var(--sui-font-size-2xs, 11px);
    --table-font-size-xs: var(--sui-font-size-xs, 12px);
    --table-font-size-sm: var(--sui-font-size-sm, 13px);
    --table-font-size-md: var(--sui-font-size-md, 14px);
    --table-font-size-lg: var(--sui-font-size-lg, 18px);
    --table-font-weight-regular: var(--sui-font-weight-regular, 400);
    --table-font-weight-medium: var(--sui-font-weight-medium, 500);
    --table-font-weight-semibold: var(--sui-font-weight-semibold, 600);
    --table-line-height-tight: var(--sui-line-height-tight, 1);
    --table-line-height-ui: var(--sui-line-height-ui, 1.3);
    --table-line-height-badge: var(--sui-line-height-badge, 1.4);
    --table-skeleton-base-color: var(--sui-color-skeleton-base, #eceff3);
    --table-skeleton-highlight-color: var(--sui-color-skeleton-highlight, #f5f7fa);
  }

  /* ── Heading ─────────────────────────────────────────────────────────────── */
  .table-heading {
    margin-bottom: 12px;
  }
  .table-title {
    font-size: var(--table-title-font-size, var(--table-font-size-lg));
    font-weight: var(--table-title-font-weight, var(--table-font-weight-semibold));
    color: var(--table-title-color, var(--table-color-text));
    font-family: var(--table-title-font-family);
  }
  .table-description {
    margin-top: 2px;
    font-size: var(--table-description-font-size, var(--table-font-size-sm));
    color: var(--table-description-color, var(--table-color-text-muted));
  }

  /* ── Toolbar ─────────────────────────────────────────────────────────────── */
  .dt-toolbar {
    display: flex;
    align-items: center;
    gap: var(--table-toolbar-gap, 8px);
    margin-bottom: var(--table-toolbar-margin-bottom, 8px);
    min-height: 36px;
  }
  .dt-toolbar-search {
    flex: 1;
    margin-bottom: 0;
  }
  .dt-toolbar-actions {
    display: flex;
    align-items: center;
    gap: var(--table-toolbar-gap, 8px);
    margin-left: auto;
  }

  /* Search bar (shared look with Table) */
  .table-search {
    display: flex;
    align-items: center;
    gap: var(--table-search-gap, 8px);
    padding: var(--table-search-padding, 8px 12px);
    border: var(--table-search-border, 1px solid var(--table-color-border));
    border-radius: var(--table-search-border-radius, 8px);
    background-color: var(--table-search-background, var(--table-color-surface));
  }
  .table-search-icon {
    display: inline-flex;
    align-items: center;
    color: var(--table-search-icon-color, var(--table-color-text-subtle));
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
    font-size: var(--table-search-font-size, var(--table-font-size-md));
    color: var(--table-search-color, var(--table-color-text));
    min-width: 0;
  }
  .table-search-input::placeholder {
    color: var(--table-search-placeholder-color, var(--table-color-text-subtle));
  }
  .table-search-input::-webkit-search-cancel-button {
    display: none;
  }
  .table-search-clear {
    display: inline-flex;
    align-items: center;
    padding: 2px;
    border: none;
    background: transparent;
    color: var(--table-search-clear-color, var(--table-color-text-muted));
    cursor: pointer;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .table-search-clear:hover {
    color: var(--table-search-clear-hover-color, var(--table-color-text));
    background-color: var(--table-search-clear-hover-background, var(--table-color-hover-overlay));
  }
  .table-search-clear :global(svg) {
    width: var(--table-search-clear-icon-size, 14px);
    height: var(--table-search-clear-icon-size, 14px);
  }

  /* ── Bulk action bar ─────────────────────────────────────────────────────── */
  .dt-bulk-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: var(--table-bulk-padding, 6px 12px);
    border: var(--table-bulk-border, 1px solid var(--table-color-accent-border));
    border-radius: var(--table-bulk-border-radius, 8px);
    background: var(--table-bulk-background, var(--table-color-accent-muted));
  }
  .dt-bulk-count {
    font-size: var(--table-bulk-font-size, var(--table-font-size-sm));
    font-weight: var(--table-bulk-font-weight, var(--table-font-weight-semibold));
    color: var(--table-bulk-color, var(--table-color-accent-strong));
  }
  .dt-bulk-clear {
    border: none;
    background: transparent;
    color: var(--table-bulk-clear-color, var(--table-color-accent));
    font-size: var(--table-bulk-clear-font-size, var(--table-font-size-sm));
    cursor: pointer;
    text-decoration: underline;
  }
  .dt-bulk-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  /* ── Container (shared look with Table) ──────────────────────────────────── */
  .table-container {
    border: var(--table-border, 1px solid var(--table-color-border));
    border-radius: var(--table-border-radius, 8px);
    width: var(--table-container-width, 100%);
    overflow: auto;
  }
  .scrollable-table {
    height: var(--table-container-height, 143px);
    overflow-y: auto;
  }
  .dt-fixed-body {
    max-height: var(--table-body-height, 400px);
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
    overflow-wrap: anywhere;
  }
  .table-header {
    background-color: var(
      --table-header-background,
      var(--table-header-border-bgcolor, var(--table-color-surface-muted))
    );
    font-size: var(--table-header-font-size, var(--table-font-size-sm));
    font-family: var(--table-header-font-family);
    font-weight: var(--table-header-font-weight, var(--table-font-weight-semibold));
    letter-spacing: var(--table-header-letter-spacing, 0.02em);
    text-transform: var(--table-header-text-transform);
    color: var(--table-header-color, var(--table-header-font-color, var(--table-color-text-muted)));
    white-space: nowrap;
  }
  .table-header-content {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .dt-header-end {
    justify-content: flex-end;
  }
  .dt-header-text {
    display: inline-flex;
    flex-direction: column;
  }
  .dt-header-subtext {
    font-size: var(--table-header-subtext-font-size, var(--table-font-size-2xs));
    font-weight: var(--table-header-subtext-font-weight, var(--table-font-weight-regular));
    text-transform: none;
    letter-spacing: normal;
    color: var(--table-header-subtext-color, var(--table-color-text-subtle));
  }
  .table-header-sticky {
    position: sticky;
    top: var(--table-header-sticky-top, 0);
    z-index: 2;
  }
  .table-content {
    background-color: var(--table-content-background, var(--table-content-border-bgcolor));
    font-size: var(--table-content-font-size, var(--table-font-size-md));
    font-family: var(--table-content-font-family);
    color: var(--table-content-color, var(--table-content-font-color, var(--table-color-text)));
  }

  /* Frozen (sticky-left) columns. Inherit the same background as normal cells so
     theming matches Table; the opaque fallback only applies on un-themed pages. */
  .dt-frozen {
    position: sticky;
    z-index: 1;
    background-color: var(
      --table-frozen-background,
      var(
        --table-content-background,
        var(--table-content-border-bgcolor, var(--table-color-surface))
      )
    );
  }
  .table-header.dt-frozen {
    z-index: 3;
    background-color: var(
      --table-frozen-header-background,
      var(
        --table-header-background,
        var(--table-header-border-bgcolor, var(--table-color-surface-muted))
      )
    );
  }
  /* A selected row's frozen cell must keep the selected tint. */
  .table-row-selected > .table-content.dt-frozen {
    background-color: var(--table-row-selected-background, var(--table-color-accent-muted));
  }

  .table-row {
    border-bottom: var(--table-row-border, 1px solid var(--table-color-border-subtle));
    background-color: var(--table-row-background);
  }
  .table-row:last-child {
    border-bottom: var(--table-row-last-border, none);
  }
  .table-row.dt-hoverable:hover {
    background-color: var(--table-row-hover-background, var(--table-color-surface-muted));
  }
  .table-row.dt-hoverable:hover > .table-content:not(.dt-frozen) {
    background-color: var(--table-row-hover-background, var(--table-color-surface-muted));
  }
  .table-row-clickable {
    cursor: pointer;
  }
  .table-row-clickable:focus-visible {
    outline: 2px solid var(--table-focus-outline-color, var(--table-color-focus));
    outline-offset: -2px;
  }
  .table-row-selected,
  .table-row-selected > .table-content {
    background-color: var(
      --table-row-selected-background,
      var(--table-color-accent-muted)
    ) !important;
  }

  /* ── Checkbox column (shared look with Table) ────────────────────────────── */
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
    border: var(--table-checkbox-border, 2px solid var(--table-color-text-subtle));
    border-radius: var(--table-checkbox-border-radius, 3px);
    background-color: var(--table-checkbox-background, transparent);
    cursor: pointer;
    flex-shrink: 0;
    transition:
      background-color 0.15s,
      border-color 0.15s;
    user-select: none;
  }
  .table-checkbox-box.dt-radio {
    border-radius: 50%;
  }
  .table-checkbox-box:focus-visible {
    outline: none;
    box-shadow: var(--table-checkbox-focus-ring, var(--table-shadow-focus));
  }
  .table-checkbox-box:not(.disabled):hover {
    border-color: var(--table-checkbox-hover-border-color, var(--table-color-text-muted));
  }
  .table-checkbox-box.checked {
    background-color: var(--table-checkbox-checked-background, var(--table-color-accent));
    border-color: var(--table-checkbox-checked-border-color, var(--table-color-accent));
  }
  .table-checkbox-box.dt-radio.checked {
    background-color: var(--table-checkbox-background, var(--table-color-surface));
    box-shadow: inset 0 0 0 4px var(--table-checkbox-checked-background, var(--table-color-accent));
  }
  .table-checkbox-box.indeterminate {
    background-color: var(--table-checkbox-indeterminate-background, var(--table-color-accent));
    border-color: var(--table-checkbox-indeterminate-border-color, var(--table-color-accent));
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
    color: var(--table-checkbox-icon-color, var(--table-color-on-accent));
  }
  .table-checkbox-icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  /* ── Sort button ─────────────────────────────────────────────────────────── */
  .dt-sort-button {
    display: inline-flex;
    align-items: center;
    padding: 2px;
    border: none;
    background: transparent;
    color: var(--table-sort-button-color, inherit);
    cursor: pointer;
    border-radius: 4px;
    line-height: var(--table-line-height-tight);
  }
  .dt-sort-button:hover {
    background-color: var(--table-sort-button-hover-background, var(--table-color-hover-overlay));
  }
  .dt-sort-button :global(.sort-icon) {
    display: inline-flex;
    align-items: center;
  }
  .dt-sort-button :global(.sort-icon svg) {
    width: var(--table-sort-icon-size, 14px);
    height: var(--table-sort-icon-size, 14px);
    display: block;
  }
  .dt-sort-button :global(.sort-icon-idle) {
    opacity: var(--table-sort-idle-opacity, 0.5);
  }
  .dt-sort-button:hover :global(.sort-icon-idle) {
    opacity: var(--table-sort-idle-hover-opacity, 0.85);
  }

  /* ── Expansion ───────────────────────────────────────────────────────────── */
  .dt-expand-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border: none;
    background: transparent;
    color: var(--table-expand-color, var(--table-color-text-muted));
    cursor: pointer;
    border-radius: 4px;
  }
  .dt-expand-icon {
    display: inline-flex;
    transition: transform 0.15s ease;
  }
  .dt-expand-btn.expanded .dt-expand-icon {
    transform: rotate(90deg);
  }
  .dt-expand-icon :global(svg) {
    width: 16px;
    height: 16px;
    display: block;
  }
  .dt-expanded-row > .dt-expanded-cell {
    padding: var(--table-expanded-padding, 12px 16px);
    background: var(--table-expanded-background, var(--table-color-surface-muted));
    border-bottom: var(--table-row-border, 1px solid var(--table-color-border-subtle));
  }

  /* ── Built-in cell types ─────────────────────────────────────────────────── */
  .dt-tag {
    display: inline-flex;
    align-items: center;
    padding: var(--table-tag-padding, 2px 8px);
    border-radius: var(--table-tag-border-radius, 9999px);
    font-size: var(--table-tag-font-size, var(--table-font-size-xs));
    font-weight: var(--table-tag-font-weight, var(--table-font-weight-medium));
    line-height: var(--table-tag-line-height, var(--table-line-height-badge));
  }
  .dt-tag-neutral {
    background: var(--table-tag-neutral-background, var(--table-color-surface-subtle));
    color: var(--table-tag-neutral-color, var(--table-color-text-secondary));
  }
  .dt-tag-primary {
    background: var(--table-tag-primary-background, var(--table-color-info-surface));
    color: var(--table-tag-primary-color, var(--table-color-info-text));
  }
  .dt-tag-success {
    background: var(--table-tag-success-background, var(--table-color-success-surface));
    color: var(--table-tag-success-color, var(--table-color-success-text));
  }
  .dt-tag-warning {
    background: var(--table-tag-warning-background, var(--table-color-warning-surface));
    color: var(--table-tag-warning-color, var(--table-color-warning-text));
  }
  .dt-tag-error {
    background: var(--table-tag-error-background, var(--table-color-error-surface));
    color: var(--table-tag-error-color, var(--table-color-error-text));
  }

  .dt-avatar-cell {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .dt-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--table-avatar-size, 32px);
    height: var(--table-avatar-size, 32px);
    border-radius: 50%;
    background: var(--table-avatar-background, var(--table-color-border));
    color: var(--table-avatar-color, var(--table-color-text-secondary));
    font-size: var(--table-avatar-font-size, var(--table-font-size-xs));
    font-weight: var(--table-avatar-font-weight, var(--table-font-weight-semibold));
    overflow: hidden;
    flex-shrink: 0;
  }
  .dt-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .dt-avatar-text {
    display: inline-flex;
    flex-direction: column;
    line-height: var(--table-avatar-line-height, var(--table-line-height-ui));
  }
  .dt-avatar-sublabel {
    font-size: var(--table-avatar-sublabel-font-size, var(--table-font-size-xs));
    color: var(--table-avatar-sublabel-color, var(--table-color-text-subtle));
  }

  .dt-progress {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }
  .dt-progress-track {
    flex: 1;
    height: var(--table-progress-height, 6px);
    background: var(--table-progress-track-background, var(--table-color-border));
    border-radius: 9999px;
    overflow: hidden;
    min-width: 60px;
  }
  .dt-progress-fill {
    display: block;
    height: 100%;
    background: var(--table-progress-fill-background, var(--table-color-accent));
    border-radius: 9999px;
  }
  .dt-progress-label {
    font-size: var(--table-progress-label-font-size, var(--table-font-size-xs));
    color: var(--table-progress-label-color, var(--table-color-text-muted));
    min-width: 32px;
    text-align: right;
  }

  /* ── Inline edit ─────────────────────────────────────────────────────────── */
  .dt-edit-input {
    width: 100%;
    box-sizing: border-box;
    font-size: var(--table-content-font-size, var(--table-font-size-md));
    padding: var(--table-edit-input-padding, 4px 8px);
    border: var(--table-edit-input-border, 1px solid var(--table-color-border-strong));
    border-radius: var(--table-edit-input-border-radius, 6px);
    color: var(--table-content-color, var(--table-color-text));
    background: var(--table-edit-input-background, var(--table-color-surface));
    outline: none;
  }
  .dt-edit-input:focus-visible {
    border-color: var(--table-focus-outline-color, var(--table-color-focus));
    box-shadow: 0 0 0 2px var(--table-edit-input-focus-ring, var(--table-shadow-focus-subtle));
  }

  /* ── Row actions ─────────────────────────────────────────────────────────── */
  .dt-actions-col {
    width: var(--table-actions-col-width, 96px);
    white-space: nowrap;
  }
  .dt-actions {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .dt-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 6px;
    border: none;
    background: transparent;
    color: var(--table-action-color, var(--table-color-text-muted));
    cursor: pointer;
    border-radius: 6px;
    font-size: var(--table-action-font-size, var(--table-font-size-sm));
  }
  .dt-action-btn:hover:not(:disabled) {
    background: var(--table-action-hover-background, var(--table-color-hover-overlay));
    color: var(--table-action-hover-color, var(--table-color-text));
  }
  .dt-action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .dt-action-save {
    color: var(--table-action-save-color, var(--table-color-success));
  }
  .dt-action-icon {
    display: inline-flex;
    width: 14px;
    height: 14px;
  }
  .dt-action-icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  /* ── Skeleton ────────────────────────────────────────────────────────────── */
  .dt-skeleton {
    display: block;
    height: var(--table-skeleton-height, 14px);
    width: var(--table-skeleton-width, 80%);
    border-radius: 4px;
    background: linear-gradient(
      90deg,
      var(--table-skeleton-base, var(--table-skeleton-base-color)) 25%,
      var(--table-skeleton-highlight, var(--table-skeleton-highlight-color)) 37%,
      var(--table-skeleton-base, var(--table-skeleton-base-color)) 63%
    );
    background-size: 400% 100%;
    animation: dt-shimmer 1.4s ease infinite;
  }
  @keyframes dt-shimmer {
    0% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0 50%;
    }
  }

  /* ── Footer / pagination ─────────────────────────────────────────────────── */
  .table-footer {
    border: var(--table-border, 1px solid var(--table-color-border));
    border-top: none;
    border-radius: 0 0 var(--table-border-radius, 8px) var(--table-border-radius, 8px);
    padding: var(--table-footer-padding, 8px 16px);
    background-color: var(--table-footer-background, transparent);
  }
  .dt-footer {
    display: flex;
    /* Span the full table width so the pager can sit at the right edge even when
       the table is placed inside a flex/inline-shrink parent. */
    width: 100%;
    box-sizing: border-box;
    align-items: center;
    /* Rows-per-page block on the left, pager on the right edge. Override with
       --table-footer-justify (e.g. flex-start to group them together). */
    justify-content: var(--table-footer-justify, space-between);
    gap: var(--table-footer-gap, 16px);
    flex-wrap: wrap;
    /* Borderless pager needs more breathing room between buttons. */
    --pagination-gap: var(--table-pagination-gap, 6px);
  }
  .dt-pagesize {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--table-pagesize-font-size, var(--table-font-size-sm));
    color: var(--table-pagesize-color, var(--table-color-text-muted));
  }
  .dt-pagesize-select {
    font-size: var(--table-pagesize-select-font-size, var(--table-font-size-sm));
    padding: 4px 6px;
    border: 1px solid var(--table-pagesize-border-color, var(--table-color-border));
    border-radius: 6px;
    background: var(--table-pagesize-background, var(--table-color-surface));
    color: var(--table-pagesize-select-color, var(--table-color-text));
    cursor: pointer;
  }
  .dt-rowcount {
    color: var(--table-rowcount-color, var(--table-color-text-subtle));
  }

  /* ── Accessibility ───────────────────────────────────────────────────────── */
  .table-empty {
    padding: var(--table-empty-padding, 32px 24px);
    text-align: center;
    color: var(--table-empty-color, var(--table-color-text-subtle));
  }
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
