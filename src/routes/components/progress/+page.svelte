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
  <Progress
    value={progressValue}
    max={100}
    showLabel
    ariaLabel="File upload progress"
    testId="progress-determinate-demo"
  />
  <div style="display: flex; gap: 8px;">
    <Button text="-10" onclick={() => (progressValue = Math.max(0, progressValue - 10))} />
    <Button text="+10" onclick={() => (progressValue = Math.min(100, progressValue + 10))} />
  </div>
</div>

<h2>Indeterminate</h2>
<div class="demo-row" style="max-width: 400px;">
  <Progress value={-1} testId="progress-indeterminate-demo" />
</div>

<h2>Fractional value / max</h2>
<div class="demo-row" style="max-width: 400px;">
  <Progress value={1} max={3} showLabel testId="progress-fractional-demo" />
</div>

<h2>Invalid range (falls back to a 0% bar, not NaN)</h2>
<div class="demo-row" style="max-width: 400px; flex-direction: column; gap: 12px;">
  <Progress value={0} max={0} showLabel testId="progress-zero-range-demo" />
  <Progress value={5} max={-10} showLabel testId="progress-negative-max-demo" />
  <Progress value={5} max={NaN} showLabel testId="progress-nan-max-demo" />
  <Progress value={NaN} max={100} showLabel testId="progress-nan-value-demo" />
  <Progress value={-1} max={0} testId="progress-negative-value-invalid-max-demo" />
</div>
