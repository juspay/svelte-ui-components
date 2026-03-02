<script lang="ts">
  import Scroller from '$lib/Scroller/Scroller.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Navigation</span>
  <h1>Scroller</h1>
</div>

<div class="demo-row" style="max-width: 500px;">
  <Scroller direction="horizontal" showArrows showGradient dragToScroll>
    <div style="display: flex; gap: 12px; padding: 8px;">
      {#each Array(12) as _, i (i)}
        <div class="scroll-item">Item {i + 1}</div>
      {/each}
    </div>
  </Scroller>
</div>

<h2>Vertical</h2>
<div class="demo-row">
  <div style="--scroller-height: 200px;">
    <Scroller direction="vertical" showArrows showGradient>
      <div style="display: flex; flex-direction: column; gap: 12px; padding: 8px;">
        {#each Array(12) as _, i (i)}
          <div class="scroll-item">Row {i + 1}</div>
        {/each}
      </div>
    </Scroller>
  </div>
</div>
