<script lang="ts">
  import LoadingDots from '$lib/LoadingDots/LoadingDots.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Feedback & Status</span>
  <h1>LoadingDots</h1>
</div>

<div class="demo-row" style="align-items: center; gap: 32px;">
  <LoadingDots />
  <LoadingDots animation="pulse" testId="loading-dots-pulse" />
  <div style="--loading-dots-size: 10px;">
    <LoadingDots dots={5} />
  </div>
  <div style="--loading-dots-pulse-min-scale: 0.5; --loading-dots-pulse-min-opacity: 0.5;">
    <LoadingDots animation="pulse" testId="loading-dots-breathing" />
  </div>
</div>
