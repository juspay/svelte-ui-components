<script lang="ts">
  import type { MasonryGridProperties } from './properties';

  let { columns = 3, gap = '16px', testId, classes, children }: MasonryGridProperties = $props();
</script>

<div
  class="masonry-grid {classes ?? ''}"
  data-pw={testId}
  style="--masonry-columns:{columns}; --masonry-gap:{gap};"
>
  {@render children?.()}
</div>

<style>
  .masonry-grid {
    column-count: var(--masonry-columns);
    column-gap: var(--masonry-gap);
  }

  .masonry-grid > :global(*) {
    break-inside: avoid;
    margin-bottom: var(--masonry-gap);
  }
</style>
