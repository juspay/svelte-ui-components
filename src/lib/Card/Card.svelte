<script lang="ts">
  import type { CardProperties } from './properties';

  let {
    children,
    title,
    description,
    classes,
    testId,
    onclick,
    headerLeading,
    headerAction,
    headerSubtext
  }: CardProperties = $props();

  const isInteractive = $derived(typeof onclick === 'function');

  const hasHeader = $derived(
    (typeof title === 'string' && title.length > 0) ||
      typeof headerLeading === 'function' ||
      typeof headerAction === 'function'
  );

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.click();
      }
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="card {classes ?? ''}"
  class:card-interactive={isInteractive}
  data-pw={typeof testId === 'string' ? testId : null}
  role={isInteractive ? 'button' : null}
  tabindex={isInteractive ? 0 : null}
  onclick={isInteractive ? onclick : null}
  onkeydown={isInteractive ? handleKeydown : null}
>
  {#if hasHeader}
    <div class="card-header">
      <div class="card-header-row">
        {#if typeof headerLeading === 'function'}
          <div class="card-header-leading">
            {@render headerLeading()}
          </div>
        {/if}
        {#if typeof title === 'string' && title.length > 0}
          <div class="card-title">{title}</div>
        {/if}
        {#if typeof headerAction === 'function'}
          <div class="card-header-action">
            {@render headerAction()}
          </div>
        {/if}
      </div>
      {#if typeof headerSubtext === 'string' && headerSubtext.length > 0}
        <div class="card-header-subtext">{headerSubtext}</div>
      {/if}
      {#if typeof description === 'string' && description.length > 0}
        <div class="card-description">{description}</div>
      {/if}
    </div>
  {/if}
  <div class="card-content">
    {@render children()}
  </div>
</div>

<style>
  .card {
    background: var(--card-background, inherit);
    border: var(--card-border, 1px solid currentColor);
    border-radius: var(--card-border-radius, 8px);
    overflow: var(--card-overflow, hidden);
    color: inherit;
    cursor: var(--card-cursor, inherit);
  }

  .card-interactive {
    cursor: var(--card-cursor, pointer);
  }

  .card-interactive:focus-visible {
    outline: var(--card-focus-outline, 2px solid currentColor);
    outline-offset: var(--card-focus-outline-offset, 2px);
  }

  .card-header {
    padding: var(--card-header-padding, 16px 16px 0);
    border-bottom: var(--card-header-border-bottom, none);
  }

  .card-header-row {
    display: flex;
    align-items: center;
    gap: var(--card-header-gap, 8px);
  }

  .card-header-leading {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .card-title {
    flex: 1;
    font-size: var(--card-title-font-size, 16px);
    font-weight: var(--card-title-font-weight, 600);
    color: var(--card-title-color, inherit);
  }

  .card-header-action {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .card-header-subtext {
    color: var(--card-header-subtext-color, inherit);
    opacity: var(--card-header-subtext-opacity, 0.6);
    margin-top: var(--card-header-subtext-margin-top, 4px);
  }

  .card-description {
    font-size: var(--card-description-font-size, 14px);
    color: var(--card-description-color, inherit);
    opacity: var(--card-description-opacity, 0.6);
    margin-top: var(--card-description-margin-top, 4px);
  }

  .card-content {
    padding: var(--card-content-padding, 16px);
  }
</style>
