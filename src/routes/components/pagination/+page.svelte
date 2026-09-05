<script lang="ts">
  import Pagination from '$lib/Pagination/Pagination.svelte';

  let currentPage = $state(1);
  let cursorPage = $state(1);
  let hasMore = $state(true);

  // Cursor / load-more mode (starts at 3 known pages, load-more adds one each click).
  let loadMorePage = $state(1);
  let cursorTotalPages = $state(3);
  let cursorHasMore = $state(true);

  function handleLoadMore() {
    cursorTotalPages = cursorTotalPages + 1;
    if (cursorTotalPages >= 6) {
      cursorHasMore = false;
    }
  }
</script>

<div class="page-header">
  <span class="category-badge">Navigation</span>
  <h1>Pagination</h1>
</div>

<h3>Default</h3>
<div class="demo-row">
  <Pagination totalPages={10} bind:currentPage siblingCount={1} testId="pagination-basic" />
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

<h3>Cursor / load-more mode</h3>
<div class="demo-row">
  <Pagination
    totalPages={cursorTotalPages}
    bind:currentPage={loadMorePage}
    hasMore={cursorHasMore}
    onloadmore={handleLoadMore}
    testId="pagination-cursor"
  />
  <span class="state-display"
    >Page: {loadMorePage} / {cursorTotalPages}{cursorHasMore ? '+' : ''}</span
  >
</div>

<h3>Disabled</h3>
<div class="demo-row">
  <Pagination totalPages={10} currentPage={5} disabled />
</div>
