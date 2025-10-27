<script lang="ts">
  import type { TableProperties } from './properties';

  let {
    tableTitle = '',
    tableHeaders = [],
    tableData = [],
    isTableScrollable = false,
    isContentScrollable = false
  }: TableProperties = $props();

  let sortOrders = $state<{ [key: string]: 'asc' | 'desc' }>({});

  let sortedTableData = $derived.by(() => {
    const columns = Object.keys(sortOrders);
    if (columns.length === 0) {
      return [...tableData];
    }

    // Sort by the last clicked column
    const column = columns[columns.length - 1];
    const order = sortOrders[column];

    return [...tableData].sort((a, b) => {
      const colIndex = tableHeaders.indexOf(column);
      const valueA = a[colIndex];
      const valueB = b[colIndex];

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return order === 'asc' ? valueA - valueB : valueB - valueA;
      } else if (typeof valueA === 'string' && typeof valueB === 'string') {
        return order === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      } else if (typeof valueA === 'boolean' && typeof valueB === 'boolean') {
        return order === 'asc'
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
      } else {
        return 0;
      }
    });
  });

  function sortTableData(column: string) {
    if (!sortOrders[column]) {
      sortOrders[column] = 'asc';
    } else {
      sortOrders[column] = sortOrders[column] === 'asc' ? 'desc' : 'asc';
    }
  }

  function handleKeydown(event: KeyboardEvent, header: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      sortTableData(header);
    }
  }
</script>

{#if tableTitle}
  <div class="table-title">
    {tableTitle}
  </div>
{/if}
{#if tableHeaders.length !== 0 || tableData.length !== 0}
  <div class="table-container {isTableScrollable ? 'scrollable-table' : ' '}" role="grid">
    <table>
      <thead>
        <tr>
          {#each tableHeaders as header}
            <th class="table-header {isTableScrollable ? 'table-header-sticky' : ' '}">
              {header}
              {#if sortOrders[header] === 'asc'}
                <span
                  class="sort-arrow"
                  onclick={() => sortTableData(header)}
                  onkeydown={(e) => handleKeydown(e, header)}
                  role="button"
                  tabindex="0">▼</span
                >
              {:else}
                <span
                  class="sort-arrow"
                  onclick={() => sortTableData(header)}
                  onkeydown={(e) => handleKeydown(e, header)}
                  role="button"
                  tabindex="0">▲</span
                >
              {/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each sortedTableData as row}
          <tr>
            {#each row as cell}
              <td class="table-content">
                <div class={isContentScrollable ? 'scrollable-content' : ' '}>
                  {cell}
                </div>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  .table-title {
    margin: var(--table-title-margin, 0px 0px 10px 0px);
    font-size: var(--table-tile-font-size, 25px);
    font-family: var(--table-title-font-family);
    padding: var(--table-title-padding);
  }
  .table-container {
    border-top: var(--table-border, 0.5px solid #ccc);
    width: var(--table-container-width, 400px);
  }

  .scrollable-table {
    height: var(--table-container-height, 143px);
    overflow-y: auto;
  }
  table {
    width: var(--table-width, 400px);
    border-collapse: var(--table-border-collapse, collapse);
  }
  .table-header,
  .table-content {
    border: var(--table-inner-border, 1px solid #ccc);
    padding: var(--table-padding, 8px);
    text-align: var(--table-text-align, left);
    width: var(--table-column-width, 100px);
    word-break: break-all;
  }
  .scrollable-content {
    overflow-y: auto;
    height: var(--scrollable-column-height, 20px);
  }

  .table-header {
    background-color: var(--table-header-border-bgcolor, beige);
    font-size: var(--table-header-font-size);
    font-family: var(--table-header-font-family);
    color: var(--table-header-font-color);
  }

  .table-header-sticky {
    position: sticky;
    top: -1px;
  }

  .table-content {
    background-color: var(--table-content-border-bgcolor);
    font-size: var(--table-content-font-size);
    font-family: var(--table-content-font-family);
    color: var(--table-content-font-color);
  }

  .sort-arrow {
    font-size: 10px;
  }
</style>
