<script lang="ts">
  import Pagination from '$lib/Pagination/Pagination.svelte';

  let currentPage = $state(1);
  let cursorPage = $state(1);
  let hasMore = $state(true);
</script>

<div class="page-header">
  <span class="category-badge">Navigation</span>
  <h1>Pagination</h1>
</div>

<h3>Default</h3>
<div class="demo-row">
  <Pagination totalPages={10} bind:currentPage siblingCount={1} />
  <span class="state-display">Page: {currentPage}</span>
</div>

<h3>hasMore — cursor-based pagination</h3>
<p class="state-display">
  When <code>hasMore</code> is true the next button stays enabled past <code>totalPages</code>.
  Toggle it to simulate a cursor API that signals "no more results".
</p>
<div class="demo-row">
  <Pagination
    totalPages={3}
    bind:currentPage={cursorPage}
    {hasMore}
    prevButtonTestId="cursor-prev"
    nextButtonTestId="cursor-next"
  />
  <span class="state-display">Page: {cursorPage}</span>
  <button class="toggle-btn" onclick={() => (hasMore = !hasMore)}>
    hasMore: {hasMore}
  </button>
</div>

<h3>Disabled</h3>
<div class="demo-row">
  <Pagination totalPages={10} currentPage={5} disabled />
</div>
