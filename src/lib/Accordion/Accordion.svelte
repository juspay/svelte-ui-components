<script lang="ts">
  import type { AccordionProperties } from './properties';

  let { expand = false, children, classes }: AccordionProperties = $props();
</script>

<div class="accordion {classes ?? ''}" class:expanded={expand}>
  <div class="accordion-content">
    {@render children?.()}
  </div>
</div>

<style>
  .accordion {
    display: grid;
    grid-template-rows: 0fr;
    overflow: hidden;
    transition: grid-template-rows 0.2s ease-out;
  }

  .accordion.expanded {
    grid-template-rows: 1fr;
  }

  .accordion-content {
    min-height: 0;
  }
</style>
