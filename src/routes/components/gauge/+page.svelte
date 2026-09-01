<script lang="ts">
  import Gauge from '$lib/Gauge/Gauge.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Feedback & Status</span>
  <h1>Gauge</h1>
</div>

<div class="demo-row" style="align-items: center;">
  <Gauge value={25} showLabel ariaLabel="Storage used, 25 percent" testId="gauge-with-arialabel" />
  <Gauge value={50} showLabel />
  <Gauge value={75} showLabel />
  <Gauge value={100} showLabel />
</div>
