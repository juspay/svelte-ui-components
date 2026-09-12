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
      getRowTestId: { type: 'Object' },
      getCellTestId: { type: 'Object' },
      checkboxSelection: { type: 'Object' },
      searchConfig: { type: 'Object' },
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
      onsearchchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Table from '$lib/Table/Table.svelte';
  // Mirrors Table.svelte's own sortAscIcon/sortDescIcon defaults so the fallback
  // below is the same artwork, not a retyped copy.
  import sortDefaultSvg from '$lib/assets/sort-default.svg?raw';
  let props = $props();
</script>

<Table {...props}>
  {#snippet empty()}
    <slot name="empty"></slot>
  {/snippet}
  {#snippet sortAscIcon()}
    <!--
      A snippet declared here is always a function, so Table.svelte's own
      `{#if typeof sortAscIcon === 'function'} ... {:else}<span class="sort-icon sort-icon-asc">{@html sortDefaultSvg}</span>{/if}`
      would always take the true branch and never show its default icon. Native slot
      fallback content renders exactly when the host assigns nothing, restoring it.
    -->
    <slot name="sort-asc-icon">
      <span class="sort-icon sort-icon-asc">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html sortDefaultSvg}
      </span>
    </slot>
  {/snippet}
  {#snippet sortDescIcon()}
    <slot name="sort-desc-icon">
      <span class="sort-icon sort-icon-desc">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html sortDefaultSvg}
      </span>
    </slot>
  {/snippet}
  {#snippet sortDefaultIcon()}
    <slot name="sort-default-icon"></slot>
  {/snippet}
  <!--
    The paginator keeps a bare slot with no fallback, unlike the sort icons above.
    Gating the snippet on assigned light-DOM content restored Table's own paginator
    but stopped host content reaching the slot at all, and its default is a whole
    Pagination subtree rather than an icon, so reproducing it here would couple this
    wrapper to Table's internals. Recorded as unfinished rather than shipped half
    working: through `<sui-table>` the built-in paginator still cannot render.
  -->
  {#snippet paginatorSlot()}
    <slot name="paginator-slot"></slot>
  {/snippet}
  {#snippet toolbarSlot()}
    <slot name="toolbar-slot"></slot>
  {/snippet}
</Table>
