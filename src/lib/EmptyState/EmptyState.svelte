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
    descriptionSnippet,
    density
  }: EmptyStateProperties = $props();
</script>

<div
  class="empty-state {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
  data-density={typeof density === 'string' ? density : null}
>
  {#if typeof icon === 'function'}
    <div class="empty-state-icon">
      {@render icon()}
    </div>
  {/if}
  <div
    class="empty-state-title"
    data-pw={typeof testId === 'string' ? `${testId}-title` : null}
    testID={typeof testId === 'string' ? `${testId}-title` : null}
  >
    {#if typeof titleSnippet === 'function'}
      {@render titleSnippet()}
    {:else}
      {title}
    {/if}
  </div>
  {#if typeof descriptionSnippet === 'function'}
    <div
      class="empty-state-description"
      data-pw={typeof testId === 'string' ? `${testId}-description` : null}
      testID={typeof testId === 'string' ? `${testId}-description` : null}
    >
      {@render descriptionSnippet()}
    </div>
  {:else if typeof description === 'string' && description.length > 0}
    <div
      class="empty-state-description"
      data-pw={typeof testId === 'string' ? `${testId}-description` : null}
      testID={typeof testId === 'string' ? `${testId}-description` : null}
    >
      {description}
    </div>
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
    align-items: var(--empty-state-align-items, center);
    padding: var(--empty-state-padding, 32px 16px);
    text-align: var(--empty-state-text-align, center);
    gap: var(--empty-state-gap, 0px);
    color: inherit;
  }

  /* Density-scoped fallbacks. Higher specificity than `.empty-state` alone, so
     these only take over when `data-density` is actually set — no attribute,
     no match, today's defaults above stand untouched. `--empty-state-padding`
     and `--empty-state-gap` are read first in both cases, so an instance-level
     override always wins over either density's default. */
  .empty-state[data-density='page'] {
    padding: var(--empty-state-padding, 48px 24px);
    gap: var(--empty-state-gap, 12px);
  }

  .empty-state[data-density='panel'] {
    padding: var(--empty-state-padding, 16px 12px);
    gap: var(--empty-state-gap, 4px);
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
