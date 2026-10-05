<script lang="ts">
  import { onMount } from 'svelte';
  import Table from '$lib/Table/Table.svelte';

  // A plain element of a known width around a Table, so the width the paginator
  // has to live inside is the test's input rather than the docs layout's.
  //   ?width=240            host width in px (default 400)
  //   ?variant=builtin      the built-in paginator (default)
  //   ?variant=no-size      built-in paginator with the page-size selector suppressed
  //   ?variant=loading      built-in paginator while pagination.isLoading
  //   ?variant=slot         a consumer paginatorSlot instead of the built-in one
  //   ?page=4               the page to start on (default 1). Page 4 of 8 renders the widest
  //                         stepper: Prev, 1, ellipsis, 3, 4, 5, ellipsis, 8, Next
  const params = new URLSearchParams(window.location.search);
  const parsedWidth = Number(params.get('width'));
  const hostWidth = Number.isFinite(parsedWidth) && parsedWidth > 0 ? parsedWidth : 400;
  const variant = params.get('variant') ?? 'builtin';
  const parsedPage = Number(params.get('page'));
  const startPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const columns = [
    { id: 'name', label: 'Name' },
    { id: 'owner', label: 'Owner' }
  ];
  const rows = Array.from({ length: 80 }, (_, index) => ({
    name: `Row ${String(index + 1).padStart(2, '0')}`,
    owner: `Owner ${index + 1}`
  }));

  onMount(() => {
    document.documentElement.dataset.fixtureReady = 'true';
  });
</script>

<div data-pw="paginator-host" style="width: {hostWidth}px; box-sizing: border-box;">
  {#if variant === 'slot'}
    <Table {columns} {rows} testId="paginator-table">
      {#snippet paginatorSlot()}
        <span data-pw="paginator-slot-content">Consumer paginator</span>
      {/snippet}
    </Table>
  {:else}
    <Table
      {columns}
      {rows}
      testId="paginator-table"
      pagination={{
        pageSize: 10,
        page: startPage,
        testId: 'paginator',
        isLoading: variant === 'loading',
        hidePageSizeSelector: variant === 'no-size'
      }}
    />
  {/if}
</div>
