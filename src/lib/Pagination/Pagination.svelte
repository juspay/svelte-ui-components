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
    totalItems = null,
    pageSize = null,
    pageSizes = null,
    hasMore = false,
    prevButtonTestId = null,
    nextButtonTestId = null,
    selectedItemLabel = 'items',
    onPageSizeChange
  }: PaginationProperties = $props();

  const generatePages = (total: number, current: number, siblings: number): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    pages.push(1);

    const leftSibling = Math.max(2, current - siblings);
    const rightSibling = Math.min(total - 1, current + siblings);

    if (leftSibling > 2) {
      pages.push('...');
    }

    for (let pageIndex = leftSibling; pageIndex <= rightSibling; pageIndex++) {
      pages.push(pageIndex);
    }

    if (rightSibling < total - 1) {
      pages.push('...');
    }

    if (total > 1) {
      pages.push(total);
    }

    return pages;
  };

  let pages = $derived(generatePages(totalPages, currentPage, siblingCount));

  const goToPage = (page: number): void => {
    const isNextAllowed = hasMore || page <= totalPages;
    if (disabled || page < 1 || !isNextAllowed || page === currentPage) {
      return;
    }
    currentPage = page;
    onchange?.(page);
  };

  const computedRangeStart = $derived(
    totalItems !== null && pageSize !== null
      ? Math.min((currentPage - 1) * pageSize + 1, totalItems)
      : null
  );

  const computedRangeEnd = $derived(
    totalItems !== null && pageSize !== null ? Math.min(currentPage * pageSize, totalItems) : null
  );

  const isNextDisabled = $derived(disabled || (hasMore ? false : currentPage >= totalPages));

  const handlePageSizeChange = (event: Event): void => {
    if (!(event.currentTarget instanceof HTMLSelectElement)) {
      return;
    }
    const newSize = parseInt(event.currentTarget.value, 10);
    if (!isNaN(newSize)) {
      onPageSizeChange?.(newSize);
    }
  };
</script>

<div class="pagination-wrapper {classes ?? ''}">
  {#if totalItems !== null && computedRangeStart !== null && computedRangeEnd !== null}
    <span class="pagination-summary" aria-live="polite">
      Showing {computedRangeStart}–{computedRangeEnd} of {totalItems}
      {selectedItemLabel}
    </span>
  {/if}

  {#if pageSizes !== null && pageSizes.length > 0}
    <label class="page-size-label">
      Rows per page:
      <select
        class="page-size-select"
        value={pageSize}
        onchange={handlePageSizeChange}
        {disabled}
        aria-label="Rows per page"
      >
        {#each pageSizes as sizeOption (sizeOption)}
          <option value={sizeOption} selected={sizeOption === pageSize}>{sizeOption}</option>
        {/each}
      </select>
    </label>
  {/if}

  <nav
    class="pagination"
    class:disabled
    data-pw={typeof testId === 'string' ? testId : null}
    aria-label="Pagination"
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

    {#each pages as page, pageIdx (pageIdx)}
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
      disabled={isNextDisabled}
      onclick={() => goToPage(currentPage + 1)}
      aria-label="Next page"
      data-pw={typeof nextButtonTestId === 'string' ? nextButtonTestId : null}
    >
      &#8250;
    </button>
  </nav>
</div>

<style>
  .pagination-wrapper {
    display: var(--pagination-wrapper-display, flex);
    flex-wrap: var(--pagination-wrapper-flex-wrap, wrap);
    gap: var(--pagination-wrapper-gap, 12px);
    align-items: var(--pagination-wrapper-align-items, center);
  }

  .pagination-summary {
    color: var(--pagination-summary-color, #6b7280);
  }

  .page-size-label {
    display: var(--pagination-page-size-label-display, inline-flex);
    align-items: var(--pagination-page-size-label-align-items, center);
    gap: var(--pagination-page-size-label-gap, 6px);
    color: var(--pagination-page-size-label-color, #6b7280);
  }

  .page-size-select {
    padding: var(--pagination-page-size-select-padding, 4px 8px);
    color: var(--pagination-page-size-select-color, #3a4550);
    background: var(--pagination-page-size-select-background, #ffffff);
    border: var(--pagination-page-size-select-border, 1px solid #d1d5db);
    border-radius: var(--pagination-page-size-select-border-radius, 4px);
    cursor: var(--pagination-page-size-select-cursor, pointer);
  }

  .page-size-select:disabled {
    opacity: var(--pagination-disabled-opacity, 0.5);
    cursor: var(--pagination-disabled-cursor, not-allowed);
  }

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
