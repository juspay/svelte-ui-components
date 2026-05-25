<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Progress from '$lib/Progress/Progress.svelte';

  let progressValue = $state(65);
  let installments = $state(3);
  let showDividers = $state(true);

  const totalInstallments = 12;
</script>

<div class="page-header">
  <span class="category-badge">Feedback & Status</span>
  <h1>Progress</h1>
</div>

<div class="demo-row" style="max-width: 400px; flex-direction: column; gap: 12px;">
  <Progress value={progressValue} max={100} showLabel testId="progress-continuous" />
  <div style="display: flex; gap: 8px;">
    <Button text="-10" onclick={() => (progressValue = Math.max(0, progressValue - 10))} />
    <Button text="+10" onclick={() => (progressValue = Math.min(100, progressValue + 10))} />
  </div>
</div>

<h2>Indeterminate</h2>
<div class="demo-row" style="max-width: 400px;">
  <Progress value={-1} testId="progress-indeterminate" />
</div>

<h2>Segmented</h2>
<p class="demo-caption">
  Discrete count-based progress — {installments} of {totalInstallments} installments paid.
</p>
<div class="demo-row" style="max-width: 400px; flex-direction: column; gap: 12px;">
  <Progress
    value={installments}
    max={totalInstallments}
    segments={totalInstallments}
    testId="progress-segmented"
  />
  <div style="display: flex; gap: 8px;">
    <Button text="-1" onclick={() => (installments = Math.max(0, installments - 1))} />
    <Button
      text="+1"
      onclick={() => (installments = Math.min(totalInstallments, installments + 1))}
    />
  </div>
</div>

<h2>Segmented — divider gap</h2>
<p class="demo-caption">
  Toggle the inter-segment gap via the <code>--progress-segments-gap</code> variable. Dividers
  {showDividers ? 'on' : 'off'}.
</p>
<div class="demo-row" style="max-width: 400px; flex-direction: column; gap: 12px;">
  <Progress
    value={5}
    max={8}
    segments={8}
    classes={showDividers ? 'segments-gap-on' : 'segments-gap-off'}
    testId="progress-segmented-dividers"
  />
  <div style="display: flex; gap: 8px;">
    <Button
      text={showDividers ? 'Fuse segments' : 'Show dividers'}
      onclick={() => (showDividers = !showDividers)}
    />
  </div>
</div>

<h2>Segmented — indeterminate ignored</h2>
<p class="demo-caption">
  A negative value renders an empty segmented bar (no sliding animation) rather than the
  continuous-mode indeterminate effect.
</p>
<div class="demo-row" style="max-width: 400px;">
  <Progress value={-1} max={6} segments={6} testId="progress-segmented-indeterminate" />
</div>

<style>
  .demo-caption {
    margin: 0 0 4px;
    font-size: 13px;
    color: var(--doc-text-secondary, #666);
  }

  :global(.segments-gap-on) {
    --progress-segments-gap: 6px;
  }

  :global(.segments-gap-off) {
    --progress-segments-gap: 0;
  }
</style>
