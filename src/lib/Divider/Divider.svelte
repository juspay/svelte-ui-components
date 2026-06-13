<script lang="ts">
  import type { DividerProperties } from './properties';

  let { orientation = 'horizontal', testId, classes }: DividerProperties = $props();
  const resolvedOrientation = orientation === 'vertical' ? 'vertical' : 'horizontal';
</script>

<div
  class="divider divider-{resolvedOrientation} {classes ?? ''}"
  role="separator"
  aria-orientation={resolvedOrientation}
  data-pw={typeof testId === 'string' ? testId : null}
></div>

<style>
  .divider-horizontal {
    width: var(--divider-length, 100%);
    border-top: var(--divider-border, 1px solid #e2e8f0);
    margin: var(--divider-margin, 0);
  }

  .divider-vertical {
    height: var(--divider-length, 100%);
    border-left: var(--divider-border, 1px solid #e2e8f0);
    margin: var(--divider-margin, 0);
  }
</style>
