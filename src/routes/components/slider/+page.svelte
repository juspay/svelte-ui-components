<script lang="ts">
  import Slider from '$lib/Slider/Slider.svelte';

  let sliderValue = $state(50);
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>Slider</h1>
</div>

<div class="demo-row" style="max-width: 400px;">
  <Slider bind:value={sliderValue} min={0} max={100} step={1} showValue />
</div>
