<svelte:options
  customElement={{
    tag: 'sui-table',
    shadow: 'open',
    props: {
      tableTitle: { type: 'String', reflect: true },
      tableHeaders: { type: 'Object' },
      tableData: { type: 'Object' },
      sortable: { type: 'Boolean', reflect: true },
      sortableColumns: { type: 'Object' },
      stickyHeader: { type: 'Boolean', reflect: true },
      isTableScrollable: { type: 'Boolean', reflect: true },
      isContentScrollable: { type: 'Boolean' },
      testId: { type: 'String' },
      caption: { type: 'String' },
      classes: { type: 'String' },
      onRowClick: { type: 'Object' },
      onSort: { type: 'Object' }
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
</Table>
