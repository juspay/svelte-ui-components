<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ComponentType } from 'svelte';

  let {
    class: className = '', // Renamed from class
    style = '',
    leftContent = null,
    centerContent = null,
    rightContent = null,
    additionalContent = null,
    testId = 'toolbar'
  }: {
    class?: string;
    style?: string;
    leftContent?: ComponentType | string | null;
    centerContent?: ComponentType | string | null;
    rightContent?: ComponentType | string | null;
    additionalContent?: ComponentType | string | null;
    testId?: string;
  } = $props();

  const dispatch = createEventDispatcher<{ backClick: void }>();

  // backClick event is now formally declared.
  // UI for it was removed as per new props.
  // If back button functionality is desired with new props,
  // it would need a dedicated prop like `showBackButton` and `onBackClick` callback.
</script>

<div class="toolbar {className}" {style} data-testid={testId}>
  <div class="content">
    {#if leftContent}
      <div class="toolbar-content left">
        {#if typeof leftContent === 'string'}
          {@html leftContent}
        {:else if leftContent}
          <svelte:component this={leftContent} />
        {/if}
      </div>
    {/if}
    {#if centerContent}
      <div class="toolbar-content center-content">
        {#if typeof centerContent === 'string'}
          {@html centerContent}
        {:else if centerContent}
          <svelte:component this={centerContent} />
        {/if}
      </div>
    {/if}
    {#if rightContent}
      <div class="toolbar-content right-content">
        {#if typeof rightContent === 'string'}
          {@html rightContent}
        {:else if rightContent}
          <svelte:component this={rightContent} />
        {/if}
      </div>
    {/if}
  </div>
  <div class="additional-content">
    {#if additionalContent}
      <div class="toolbar-content additional">
        {#if typeof additionalContent === 'string'}
          {@html additionalContent}
        {:else if additionalContent}
          <svelte:component this={additionalContent} />
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  /* Ensure styles for .center-content and .right-content exist or are adapted if needed */
  /* Added .left class and .toolbar-content generic class */
  .toolbar-content {
    display: flex; /* Basic styling for content wrappers */
    align-items: center;
  }
  /* Removed empty .left CSS rule */
  .toolbar {
    /* Existing styles for toolbar */
    display: flex;
    flex-direction: column;
    /* Ensure other styles like padding, height, width etc. are appropriate */
    padding: var(--toolbar-padding, 0px); /* Default to 0px if not set by consumer */
    height: var(--toolbar-height, fit-content); /* Default to fit-content */
    width: var(--toolbar-width, 100%); /* Default to 100% */
    position: var(--toolbar-position, relative); /* Default to relative, common for inline usage */
    top: var(--toolbar-top, auto);
    left: var(--toolbar-left, auto);
    right: var(--toolbar-right, auto);
    background: var(--toolbar-background, #ffffff);
    box-shadow: var(--toolbar-box-shadow, 0px 2px 12px #55687c1a);
    z-index: var(--toolbar-z-index, 10);
    border-radius: var(--toolbar-border-radius, 0px);
  }

  .content {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: var(--toolbar-content-padding, 0px);
    justify-content: var(
      --toolbar-justify-content,
      space-between
    ); /* Adjusted for typical toolbar */
    visibility: var(--toolbar-content-visibility, visible);
    flex: 1; /* Allow content to take available space */
  }

  .additional-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: var(--toolbar-additional-content-padding, 0px);
    height: var(--toolbar-additional-content-height, fit-content);
    justify-content: var(--toolbar-justify-additional-content, normal);
    visibility: var(--toolbar-additional-content-visibility, visible);
  }

  /* Removed .back and .text styles as the elements were removed */

  .center-content {
    /* Style for explicit center content slot */
    /* display: flex; */ /* Already handled by .toolbar-content */
    justify-content: center; /* Center its own content */
    flex: 1; /* Allow it to grow and push left/right apart if needed */
  }

  /* Removed empty .right-content CSS rule */

  .additional {
    /* Specific styles for additional content if needed */
    width: 100%; /* Example: make it full width within its parent */
  }
  /* Styles for leftContent would be implicitly handled unless it needs specific wrapper */
</style>
