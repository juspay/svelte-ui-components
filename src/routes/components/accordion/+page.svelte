<script lang="ts">
  import Accordion from '$lib/Accordion/Accordion.svelte';

  let accordionExpanded = $state(false);
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>Accordion</h1>
</div>

<div class="demo-row" style="flex-direction: column; max-width: 500px;">
  <button class="toggle-btn" onclick={() => (accordionExpanded = !accordionExpanded)}>
    {accordionExpanded ? 'Collapse' : 'Expand'} Accordion
  </button>
  <Accordion expand={accordionExpanded}>
    <div style="padding: 16px; background: #f5f5f5; border-radius: 8px;">
      <p>This is the accordion content that can be expanded or collapsed.</p>
      <p>It supports any content inside including other components.</p>
    </div>
  </Accordion>
</div>
