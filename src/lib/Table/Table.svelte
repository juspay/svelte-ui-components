<script lang="ts">
  import type { TableProperties } from './properties';
  import type { JSONValue } from 'type-decoder';
  import Button from '../Button/Button.svelte';
  import chevronUpSvg from '$lib/assets/chevron-up.svg?raw';
  import chevronDownSvg from '$lib/assets/chevron-down.svg?raw';
  import sortDefaultSvg from '$lib/assets/sort-default.svg?raw';

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
    classes
  }: TableProperties = $props();

  let sortColumn = $state<number | null>(null);
  let sortDirection = $state<'asc' | 'desc'>('asc');

  function isColumnSortable(colIndex: number): boolean {
    if (!sortable) {
      return false;
    }
    if (sortableColumns) {
      return sortableColumns.includes(colIndex);
    }
    return true;
  }

  let sortedTableData = $derived.by(() => {
    if (sortColumn === null) {
      return [...tableData];
    }

    const colIndex = sortColumn;
    const direction = sortDirection;

    return [...tableData].sort((a, b) => {
      const valueA = a[colIndex];
      const valueB = b[colIndex];

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return direction === 'asc' ? valueA - valueB : valueB - valueA;
      } else if (typeof valueA === 'string' && typeof valueB === 'string') {
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

  function handleSort(colIndex: number) {
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
  }

  function handleRowClick(rowIndex: number, rowData: JSONValue[]) {
    onRowClick?.(rowIndex, rowData);
  }

  function handleRowKeydown(event: KeyboardEvent, rowIndex: number, rowData: JSONValue[]) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick?.(rowIndex, rowData);
    }
  }

  let isRowClickable = $derived(typeof onRowClick === 'function');
  let isStickyHeader = $derived(stickyHeader || isTableScrollable);
</script>

{#if typeof tableTitle === 'string' && tableTitle.length > 0}
  <div class="table-title">
    {tableTitle}
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
        {#if sortedTableData.length === 0 && typeof empty === 'function'}
          <tr>
            <td class="table-empty" colspan={tableHeaders.length}>
              {@render empty()}
            </td>
          </tr>
        {:else}
          {#each sortedTableData as row, rowIndex (rowIndex)}
            <tr
              class="table-row"
              class:table-row-clickable={isRowClickable}
              onclick={isRowClickable ? () => handleRowClick(rowIndex, row) : null}
              onkeydown={isRowClickable ? (e) => handleRowKeydown(e, rowIndex, row) : null}
              tabindex={isRowClickable ? 0 : null}
            >
              {#each row as cellValue, colIndex (colIndex)}
                <td class="table-content">
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
  </div>
{/if}

<style>
  .table-title {
    margin: var(--table-title-margin, 0px 0px 12px 0px);
    font-size: var(--table-title-font-size, var(--table-tile-font-size, 18px));
    font-weight: var(--table-title-font-weight, 600);
    color: var(--table-title-color, #111827);
    font-family: var(--table-title-font-family);
    padding: var(--table-title-padding);
  }

  .table-container {
    border: var(--table-border, 1px solid #e5e7eb);
    border-radius: var(--table-border-radius, 8px);
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
    opacity: var(--table-sort-idle-opacity, 0.3);
  }

  .sort-button:hover :global(.sort-icon-idle) {
    opacity: 0.6;
  }

  .table-empty {
    padding: var(--table-empty-padding, 32px 24px);
    text-align: center;
    color: var(--table-empty-color, #9ca3af);
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
