<script lang="ts">
  import type { BreadcrumbProperties } from './properties';

  let { items, item, ariaLabel, separator, classes, testId }: BreadcrumbProperties = $props();
</script>

<nav
  class="breadcrumb {classes ?? ''}"
  aria-label={ariaLabel}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  <ol class="breadcrumb-list">
    {#each items as crumb, index (index)}
      <li class="breadcrumb-item">
        {#if typeof item === 'function'}
          {@render item({
            href: crumb.href,
            label: crumb.label,
            isLast: index === items.length - 1,
            index
          })}
        {/if}
      </li>
      {#if index < items.length - 1}
        <li class="breadcrumb-separator" aria-hidden="true">
          {#if typeof separator === 'function'}
            {@render separator()}
          {:else}
            /
          {/if}
        </li>
      {/if}
    {/each}
  </ol>
</nav>

<style>
  .breadcrumb-list {
    display: flex;
    list-style: none;
    padding: 0;
    margin: 0;
    gap: var(--breadcrumb-list-gap);
    flex-wrap: var(--breadcrumb-flex-wrap, nowrap);
    align-items: center;
  }

  .breadcrumb-item {
    display: flex;
    align-items: center;
  }

  .breadcrumb-separator {
    display: flex;
    align-items: center;
    color: var(--breadcrumb-separator-color, currentColor);
  }
</style>
