<script lang="ts">
  import LoadingDots from '$lib/LoadingDots/LoadingDots.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Feedback & Status</span>
  <h1>LoadingDots</h1>
</div>

<div class="demo-row" style="align-items: center; gap: 32px;">
  <LoadingDots />
  <LoadingDots animation="pulse" />
  <div style="--loading-dots-size: 10px;">
    <LoadingDots dots={5} />
  </div>
</div>
