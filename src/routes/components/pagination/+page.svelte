<script lang="ts">
  import Pagination from '$lib/Pagination/Pagination.svelte';

  let currentPage = $state(1);
</script>

<div class="page-header">
  <span class="category-badge">Navigation</span>
  <h1>Pagination</h1>
</div>

<div class="demo-row">
  <Pagination totalPages={10} bind:currentPage siblingCount={1} />
  <span class="state-display">Page: {currentPage}</span>
</div>
