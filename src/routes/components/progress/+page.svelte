<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Progress from '$lib/Progress/Progress.svelte';

  let progressValue = $state(65);
</script>

<div class="page-header">
  <span class="category-badge">Feedback & Status</span>
  <h1>Progress</h1>
</div>

<div class="demo-row" style="max-width: 400px; flex-direction: column; gap: 12px;">
  <Progress value={progressValue} max={100} showLabel />
  <div style="display: flex; gap: 8px;">
    <Button text="-10" onclick={() => (progressValue = Math.max(0, progressValue - 10))} />
    <Button text="+10" onclick={() => (progressValue = Math.min(100, progressValue + 10))} />
  </div>
</div>

<h2>Indeterminate</h2>
<div class="demo-row" style="max-width: 400px;">
  <Progress value={-1} />
</div>
