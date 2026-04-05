<script lang="ts">
  import type { CardProperties } from './properties';

  let { children, title, description, classes }: CardProperties = $props();
</script>

<div class="card {classes ?? ''}">
  {#if typeof title === 'string' && title.length > 0}
    <div class="card-header">
      <div class="card-title">{title}</div>
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
