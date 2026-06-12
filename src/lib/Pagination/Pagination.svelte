<script lang="ts">
  import type { PaginationProperties } from './properties';

  let {
    totalPages,
    currentPage = $bindable(1),
    siblingCount = 1,
    disabled = false,
    testId,
    onchange,
    classes
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
    if (disabled || page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    currentPage = page;
    onchange?.(page);
  }
</script>

<nav
  class="pagination {classes ?? ''}"
  class:disabled
  data-pw={typeof testId === 'string' ? testId : null}
>
  <button
    class="page-button prev-button"
    disabled={disabled || currentPage <= 1}
    onclick={() => goToPage(currentPage - 1)}
    aria-label="Previous page"
    data-pw={typeof testId === 'string' ? `${testId}-prev` : null}
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

  <button
    class="page-button next-button"
    disabled={disabled || currentPage >= totalPages}
    onclick={() => goToPage(currentPage + 1)}
    aria-label="Next page"
    data-pw={typeof testId === 'string' ? `${testId}-next` : null}
  >
    &#8250;
  </button>
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
