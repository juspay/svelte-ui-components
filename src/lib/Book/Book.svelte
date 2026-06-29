<script lang="ts">
  import type { BookProperties } from './properties';
  import chevronLeftLgSvg from '$lib/assets/chevron-left-lg.svg?raw';
  import chevronRightLgSvg from '$lib/assets/chevron-right-lg.svg?raw';
  import Button from '../Button/Button.svelte';

  let {
    pages,
    currentPage = $bindable(0),
    transition = 'slide',
    showNavigation = true,
    showPageIndicator = true,
    enableSwipe = false,
    testId,
    previousIcon,
    nextIcon,
    onpagechange,
    classes
  }: BookProperties = $props();

  let startX = 0;
  let isDragging = false;

  function goToPage(page: number): void {
    if (page < 0 || page >= pages.length || page === currentPage) {
      return;
    }
    currentPage = page;
    onpagechange?.(currentPage);
  }

  function previousPage(): void {
    goToPage(currentPage - 1);
  }

  function nextPage(): void {
    goToPage(currentPage + 1);
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      previousPage();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextPage();
    }
  }

  function handleTouchStart(event: TouchEvent): void {
    if (!enableSwipe) {
      return;
    }
    const touch = event.touches.item(0);
    if (touch !== null) {
      startX = touch.clientX;
      isDragging = true;
    }
  }

  function handleTouchEnd(event: TouchEvent): void {
    if (!enableSwipe || !isDragging) {
      return;
    }
    isDragging = false;
    const changedTouch = event.changedTouches.item(0);
    if (changedTouch !== null) {
      const diff = startX - changedTouch.clientX;
      if (diff > 20) {
        nextPage();
      } else if (diff < -20) {
        previousPage();
      }
    }
  }

  function handleMouseDown(event: MouseEvent): void {
    if (!enableSwipe) {
      return;
    }
    startX = event.clientX;
    isDragging = true;
  }

  function handleMouseUp(event: MouseEvent): void {
    if (!enableSwipe || !isDragging) {
      return;
    }
    isDragging = false;
    const diff = startX - event.clientX;
    if (diff > 20) {
      nextPage();
    } else if (diff < -20) {
      previousPage();
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="book {classes ?? ''}"
  data-pw={testId}
  onkeydown={handleKeyDown}
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
  onmousedown={handleMouseDown}
  onmouseup={handleMouseUp}
  role="region"
  tabindex="0"
>
  <div class="book-viewport">
    {#if showNavigation}
      <div class="nav-button nav-prev" class:nav-disabled={currentPage === 0}>
        <Button onclick={previousPage} disabled={currentPage === 0} ariaLabel="Previous page">
          {#if typeof previousIcon === 'function'}
            {@render previousIcon()}
          {:else}
            <!-- eslint-disable svelte/no-at-html-tags -->
            {@html chevronLeftLgSvg}
          {/if}
        </Button>
      </div>
    {/if}

    <div class="pages-container">
      {#each pages as page, index (index)}
        {#if transition === 'none'}
          {#if index === currentPage}
            <div class="page">
              {@render page.content()}
            </div>
          {/if}
        {:else if transition === 'fade'}
          <div class="page page-fade" class:page-active={index === currentPage}>
            {@render page.content()}
          </div>
        {:else}
          <div class="page page-slide" style:transform="translateX({(index - currentPage) * 100}%)">
            {@render page.content()}
          </div>
        {/if}
      {/each}
    </div>

    {#if showNavigation}
      <div class="nav-button nav-next" class:nav-disabled={currentPage === pages.length - 1}>
        <Button
          onclick={nextPage}
          disabled={currentPage === pages.length - 1}
          ariaLabel="Next page"
        >
          {#if typeof nextIcon === 'function'}
            {@render nextIcon()}
          {:else}
            <!-- eslint-disable svelte/no-at-html-tags -->
            {@html chevronRightLgSvg}
          {/if}
        </Button>
      </div>
    {/if}
  </div>

  {#if showPageIndicator}
    <div class="page-indicator">
      {#each pages as _, index (index)}
        <button
          class="dot"
          class:dot-active={index === currentPage}
          onclick={() => goToPage(index)}
          aria-label="Go to page {index + 1}"
        ></button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .book {
    width: var(--book-width, 100%);
    background-color: var(--book-background, #ffffff);
    border-radius: var(--book-border-radius, var(--radius, 4px));
    border: var(--book-border, 1px solid #e0e0e0);
    outline: none;
  }

  .book-viewport {
    position: relative;
    display: flex;
    align-items: center;
  }

  .pages-container {
    position: relative;
    width: 100%;
    height: var(--book-height, 400px);
    overflow: var(--book-overflow, hidden);
  }

  .page {
    width: 100%;
    height: 100%;
  }

  .page-slide {
    position: absolute;
    top: 0;
    left: 0;
    transition: transform var(--book-transition-duration, 0.3s) ease;
  }

  .page-fade {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
    transition: opacity var(--book-transition-duration, 0.3s) ease;
    pointer-events: none;
  }

  .page-fade.page-active {
    opacity: 1;
    pointer-events: auto;
  }

  .nav-button {
    display: flex;
    align-items: center;
    justify-content: center;

    --button-width: var(--book-nav-size, 36px);
    --button-height: var(--book-nav-size, 36px);
    --button-min-width: var(--book-nav-size, 36px);
    --button-background: var(--book-nav-background, rgba(0, 0, 0, 0.05));
    --button-border: none;
    --button-border-radius: var(--book-nav-border-radius, 50%);
    --button-padding: 0;
    --button-color: var(--book-nav-color, #333333);
    --button-hover-background: var(--book-nav-hover-background, rgba(0, 0, 0, 0.1));
  }

  .nav-disabled {
    opacity: var(--book-nav-disabled-opacity, 0.3);
  }

  .nav-button :global(svg) {
    width: 18px;
    height: 18px;
  }

  .nav-prev {
    margin-right: 4px;
  }

  .nav-next {
    margin-left: 4px;
  }

  .page-indicator {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--book-dot-gap, 8px);
    padding: var(--book-indicator-padding, 12px 0);
  }

  .dot {
    width: var(--book-dot-size, 8px);
    height: var(--book-dot-size, 8px);
    border-radius: var(--book-dot-border-radius, 50%);
    background-color: var(--book-dot-color, #cccccc);
    border: none;
    padding: 0;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .dot-active {
    background-color: var(--book-dot-active-color, #333333);
  }
</style>
