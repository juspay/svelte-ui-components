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
      sortState: { type: 'Object' },
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
      mobileCardLayout: { type: 'Boolean', reflect: true, attribute: 'mobile-card-layout' },
      onrowclick: { type: 'Object' },
      onsort: { type: 'Object' },
      onsortchange: { type: 'Object' },
      onsearchchange: { type: 'Object' },
      labels: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Table from '$lib/Table/Table.svelte';
  import { dispatchEvents } from '../dispatch';
  // Mirrors Table.svelte's own sortAscIcon/sortDescIcon defaults so the fallback
  // below is the same artwork, not a retyped copy.
  import sortDefaultSvg from '$lib/assets/sort-default.svg?raw';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // None of onrowclick/onsort/onsortchange/onsearchchange collide with a native
  // HTMLElement handler, so all four dispatch for a consumer who only calls
  // addEventListener -- 'rowclick' with detail: { rowIndex, rowData, originalIndex },
  // 'sort' with detail: { columnIndex, direction } (both named once in ../dispatch.ts's
  // CALLBACK_ARGUMENT_NAMES, from Table/properties.ts's own onrowclick/onsort parameter
  // names), 'sortchange' with detail: the callback's own TableSortState object, and
  // 'searchchange' with detail: the callback's own search-term string.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Table {...props} {...dispatchers}>
  <!--
    Same shape as toolbarSlot below, for the same reason: Table calls `empty`
    with `{ reason, searchTerm }` so one snippet can say "no records yet" or
    "nothing matched", and a `<slot>` cannot carry that. A static empty message
    is still perfectly useful, so the slot stays as the fallback rather than
    being deleted out from under any consumer whose markup targets it.
  -->
  {#snippet empty(emptyContext)}
    {#if props.empty}{@render props.empty(emptyContext)}{:else}<slot name="empty"></slot>{/if}
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
  <!--
    Table calls this one WITH `{ selectedIds }`, and that context is the entire
    point of a selection toolbar — a bare `<slot>` projects markup and cannot
    receive it, so the bridge alone silently dropped the selection (and, because
    a body snippet shadows the spread, also swallowed a JS-assigned
    `toolbarSlot`). Menu's shape fixes both: a property-assigned snippet is
    rendered with the real arguments, and the slot remains the fallback for a
    static toolbar that does not need them.
  -->
  {#snippet toolbarSlot(toolbarProps)}
    {#if props.toolbarSlot}{@render props.toolbarSlot(toolbarProps)}{:else}<slot name="toolbar-slot"
      ></slot>{/if}
  {/snippet}
</Table>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-table-display, block);
  }
</style>
