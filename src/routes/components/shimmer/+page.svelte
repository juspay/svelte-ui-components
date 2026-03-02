<script lang="ts">
  import Shimmer from '$lib/Shimmer/Shimmer.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Feedback & Status</span>
  <h1>Shimmer</h1>
</div>

<div class="demo-row" style="align-items: flex-start;">
  <div style="--shimmer-width: 48px; --shimmer-height: 48px; --shimmer-border-radius: 50%;">
    <Shimmer />
  </div>
  <div style="display: flex; flex-direction: column; gap: 8px; flex: 1; max-width: 300px;">
    <div style="--shimmer-width: 60%; --shimmer-height: 20px;">
      <Shimmer />
    </div>
    <Shimmer />
    <div style="--shimmer-height: 120px; --shimmer-border-radius: 0;">
      <Shimmer />
    </div>
  </div>
</div>
