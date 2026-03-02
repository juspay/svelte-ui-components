<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Tooltip from '$lib/Tooltip/Tooltip.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Overlays</span>
  <h1>Tooltip</h1>
</div>

<div class="demo-row" style="gap: 32px;">
  <Tooltip text="This is a top tooltip" position="top">
    <Button text="Hover (Top)" />
  </Tooltip>
  <Tooltip text="This is a bottom tooltip" position="bottom">
    <Button text="Hover (Bottom)" />
  </Tooltip>
  <Tooltip text="This is a right tooltip" position="right">
    <Button text="Hover (Right)" />
  </Tooltip>
</div>
