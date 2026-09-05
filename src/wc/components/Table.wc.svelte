<svelte:options
  customElement={{
    tag: 'sui-table',
    shadow: 'open',
    props: {
      tableTitle: { type: 'String', reflect: true, attribute: 'table-title' },
      tableHeaders: { type: 'Object' },
      tableData: { type: 'Object' },
      columns: { type: 'Object' },
      rows: { type: 'Object' },
      sortMode: { type: 'String', attribute: 'sort-mode' },
      pagination: { type: 'Object' },
      rowNumberColumn: { type: 'Boolean', reflect: true, attribute: 'row-number-column' },
      sortable: { type: 'Boolean', reflect: true },
      sortableColumns: { type: 'Object' },
      stickyHeader: { type: 'Boolean', reflect: true, attribute: 'sticky-header' },
      isTableScrollable: { type: 'Boolean', reflect: true, attribute: 'is-table-scrollable' },
      isContentScrollable: { type: 'Boolean', attribute: 'is-content-scrollable' },
      testId: { type: 'String', attribute: 'test-id' },
      caption: { type: 'String' },
      classes: { type: 'String' },
      onRowClick: { type: 'Object' },
      onSort: { type: 'Object' },
      getRowTestId: { type: 'Object' },
      getCellTestId: { type: 'Object' },
      checkboxSelection: { type: 'Object' },
      searchConfig: { type: 'Object' },
      onCellChange: { type: 'Object' },
      onSearchChange: { type: 'Object' },
      sortAscIcon: { type: 'Object' },
      sortDescIcon: { type: 'Object' },
      sortDefaultIcon: { type: 'Object' },
      cell: { type: 'Object' },
      empty: { type: 'Object' },
      paginatorSlot: { type: 'Object' },
      toolbarSlot: { type: 'Object' },
      rowNumberLabel: { type: 'String', attribute: 'row-number-label' },
      summaryRowIndex: { type: 'Number', attribute: 'summary-row-index' },
      headerTooltipIcon: { type: 'Object' },
      headerTooltipPosition: { type: 'Object' },
      usePortal: { type: 'Boolean', attribute: 'use-portal' },
      onrowclick: { type: 'Object' },
      onsort: { type: 'Object' },
      oncellchange: { type: 'Object' },
      onsearchchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Table from '$lib/Table/Table.svelte';
  let props = $props();
</script>

<Table {...props}>
  {#snippet empty()}
    <slot name="empty"></slot>
  {/snippet}
  {#snippet sortAscIcon()}
    <slot name="sort-asc-icon"></slot>
  {/snippet}
  {#snippet sortDescIcon()}
    <slot name="sort-desc-icon"></slot>
  {/snippet}
  {#snippet sortDefaultIcon()}
    <slot name="sort-default-icon"></slot>
  {/snippet}
  {#snippet paginatorSlot()}
    <slot name="paginator-slot"></slot>
  {/snippet}
  {#snippet toolbarSlot()}
    <slot name="toolbar-slot"></slot>
  {/snippet}
</Table>
