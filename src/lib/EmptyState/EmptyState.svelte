<script lang="ts">
  import type { EmptyStateProperties } from './properties';

  let {
    title,
    description,
    icon,
    children,
    classes,
    testId,
    titleSnippet,
    descriptionSnippet
  }: EmptyStateProperties = $props();
</script>

<div
  class="empty-state {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#if typeof icon === 'function'}
    <div class="empty-state-icon">
      {@render icon()}
    </div>
  {/if}
  <div class="empty-state-title">
    {#if typeof titleSnippet === 'function'}
      {@render titleSnippet()}
    {:else}
      {title}
    {/if}
  </div>
  {#if typeof descriptionSnippet === 'function'}
    <div class="empty-state-description">
      {@render descriptionSnippet()}
    </div>
  {:else if typeof description === 'string' && description.length > 0}
    <div class="empty-state-description">{description}</div>
  {/if}
  {#if typeof children === 'function'}
    <div class="empty-state-actions">
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--empty-state-padding, 32px 16px);
    text-align: var(--empty-state-text-align, center);
    gap: var(--empty-state-gap, 0px);
    color: inherit;
  }

  .empty-state-icon {
    width: var(--empty-state-icon-size, 48px);
    height: var(--empty-state-icon-size, 48px);
    color: var(--empty-state-icon-color, currentColor);
    opacity: var(--empty-state-icon-opacity, 0.4);
    margin-bottom: var(--empty-state-icon-margin-bottom, 16px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-state-icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  .empty-state-title {
    font-size: var(--empty-state-title-font-size, 16px);
    font-weight: var(--empty-state-title-font-weight, 600);
    color: var(--empty-state-title-color, inherit);
  }

  .empty-state-description {
    font-size: var(--empty-state-description-font-size, 14px);
    color: var(--empty-state-description-color, inherit);
    opacity: var(--empty-state-description-opacity, 0.6);
    max-width: var(--empty-state-description-max-width, 360px);
    margin-top: 4px;
  }

  .empty-state-actions {
    display: var(--empty-state-actions-display, block);
    flex-direction: var(--empty-state-actions-flex-direction, row);
    align-items: var(--empty-state-actions-align-items, stretch);
    justify-content: var(--empty-state-actions-justify-content, normal);
    gap: var(--empty-state-actions-gap, 0);
    margin-top: var(--empty-state-actions-margin-top, 16px);
  }
</style>
