<script lang="ts">
  import type { CardProperties } from './properties';

  let { children, title, description, classes, testId, onclick }: CardProperties = $props();

  const isInteractive = $derived(typeof onclick === 'function');

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      if (event.key === ' ') {
        event.preventDefault();
      }
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
  {#if typeof title === 'string' && title.length > 0}
    <div class="card-header">
      <div class="card-title">{title}</div>
      {#if typeof description === 'string' && description.length > 0}
        <div class="card-description">{description}</div>
      {/if}
    </div>
  {/if}
  {#if typeof children === 'function'}
    <div class="card-content">
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .card {
    background: var(--card-background, inherit);
    border: var(--card-border, 1px solid currentColor);
    border-radius: var(--card-border-radius, 8px);
    overflow: var(--card-overflow, hidden);
    color: inherit;
    cursor: var(--card-cursor, inherit);
    box-shadow: var(--card-box-shadow, none);
    width: var(--card-width, auto);
    min-width: var(--card-min-width, 0);
    max-width: var(--card-max-width, none);
    height: var(--card-height, auto);
    max-height: var(--card-max-height, none);
    margin: var(--card-margin, 0);
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

  .card-title {
    font-size: var(--card-title-font-size, 16px);
    font-weight: var(--card-title-font-weight, 600);
    color: var(--card-title-color, inherit);
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
