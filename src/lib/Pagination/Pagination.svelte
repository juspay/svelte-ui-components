<script lang="ts">
  import type { PaginationProperties } from './properties';

  let {
    totalPages,
    currentPage = $bindable(1),
    siblingCount = 1,
    disabled = false,
    testId,
    onchange,
    classes,
    hasMore = false,
    prevButtonTestId,
    nextButtonTestId,
    onLoadMore
  }: PaginationProperties = $props();

  function generatePages(total: number, current: number, siblings: number): (number | '...')[] {
    const pages: (number | '...')[] = [];
    pages.push(1);

    const leftSibling = Math.max(2, current - siblings);
    const rightSibling = Math.min(total - 1, current + siblings);

    if (leftSibling > 2) {
      pages.push('...');
    }

    for (let i = leftSibling; i <= rightSibling; i++) {
      pages.push(i);
    }

    if (rightSibling < total - 1) {
      pages.push('...');
    }

    if (total > 1) {
      pages.push(total);
    }

    return pages;
  }

  let pages = $derived(generatePages(totalPages, currentPage, siblingCount));

  function goToPage(page: number): void {
    const isForwardAllowed = hasMore || page <= totalPages;
    if (disabled || page < 1 || !isForwardAllowed || page === currentPage) {
      return;
    }
    currentPage = page;
    onchange?.(page);
  }

  let isNextDisabled = $derived(disabled || (!hasMore && currentPage >= totalPages));
  // Cursor mode: on the last known page with more to load, swap the next-button
  // for a load-more CTA.
  let isLoadMore = $derived(hasMore && currentPage >= totalPages);

  function loadMore(): void {
    if (disabled) {
      return;
    }
    currentPage = currentPage + 1;
    onLoadMore?.();
  }
</script>

<nav
  class="pagination {classes ?? ''}"
  class:disabled
  data-pw={typeof testId === 'string' && testId.length > 0 ? testId : null}
>
  <button
    class="page-button prev-button"
    disabled={disabled || currentPage <= 1}
    onclick={() => goToPage(currentPage - 1)}
    aria-label="Previous page"
    data-pw={typeof prevButtonTestId === 'string' ? prevButtonTestId : null}
  >
    &#8249;
  </button>

  {#each pages as page, i (i)}
    {#if page === '...'}
      <span class="ellipsis">&#8230;</span>
    {:else}
      <button
        class="page-button"
        class:active={page === currentPage}
        {disabled}
        onclick={() => goToPage(page)}
        aria-label="Page {page}"
        aria-current={page === currentPage ? 'page' : null}
      >
        {page}
      </button>
    {/if}
  {/each}

  {#if isLoadMore}
    <button
      class="page-button load-more-button"
      {disabled}
      onclick={loadMore}
      aria-label="Load more"
      data-pw={typeof nextButtonTestId === 'string' ? nextButtonTestId : null}
    >
      &#8250;
    </button>
  {:else}
    <button
      class="page-button next-button"
      disabled={isNextDisabled}
      onclick={() => goToPage(currentPage + 1)}
      aria-label="Next page"
      data-pw={typeof nextButtonTestId === 'string' ? nextButtonTestId : null}
    >
      &#8250;
    </button>
  {/if}
</nav>

<style>
  .pagination {
    display: var(--pagination-display, flex);
    gap: var(--pagination-gap, 4px);
    align-items: var(--pagination-align-items, center);
  }

  .pagination.disabled {
    opacity: var(--pagination-disabled-opacity, 0.5);
    cursor: var(--pagination-disabled-cursor, not-allowed);
  }

  .page-button {
    padding: var(--pagination-button-padding, 6px 10px);
    font-size: var(--pagination-button-font-size, 14px);
    font-weight: var(--pagination-button-font-weight, 400);
    font-family: var(--pagination-button-font-family, inherit);
    color: var(--pagination-button-color, #3a4550);
    background: var(--pagination-button-background, transparent);
    border: var(--pagination-button-border, 1px solid #d1d5db);
    border-radius: var(--pagination-button-border-radius, 4px);
    cursor: var(--pagination-button-cursor, pointer);
    min-width: var(--pagination-button-min-width, 36px);
    height: var(--pagination-button-height, 36px);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--pagination-transition, background 0.15s ease, color 0.15s ease);
  }

  .page-button:hover:not(:disabled):not(.active) {
    color: var(--pagination-button-hover-color, #111827);
    background: var(--pagination-button-hover-background, #f3f4f6);
  }

  .page-button.active {
    color: var(--pagination-active-color, #ffffff);
    background: var(--pagination-active-background, #3a4550);
    border: var(--pagination-active-border, 1px solid #3a4550);
    font-weight: var(--pagination-active-font-weight, 600);
  }

  .load-more-button {
    width: var(--pagination-load-more-width, auto);
    padding: var(--pagination-load-more-padding, 6px 14px);
    color: var(--pagination-load-more-color, #3a4550);
    background: var(--pagination-load-more-background, transparent);
    border-color: var(--pagination-load-more-border-color, #d1d5db);
  }

  .load-more-button:hover:not(:disabled) {
    color: var(--pagination-load-more-hover-color, #111827);
    background: var(--pagination-load-more-hover-background, #f3f4f6);
  }

  .page-button:disabled {
    opacity: var(--pagination-disabled-opacity, 0.5);
    cursor: var(--pagination-disabled-cursor, not-allowed);
  }

  .pagination.disabled .page-button {
    opacity: 1;
  }

  .ellipsis {
    color: var(--pagination-ellipsis-color, #6b7280);
    font-size: var(--pagination-ellipsis-font-size, 14px);
    min-width: var(--pagination-button-min-width, 36px);
    height: var(--pagination-button-height, 36px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
