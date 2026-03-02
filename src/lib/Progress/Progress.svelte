<script lang="ts">
  import type { ProgressProperties } from './properties';

  let { value, max = 100, showLabel = false, testId, classes }: ProgressProperties = $props();

  let percentage = $derived(Math.min(100, Math.max(0, (value / max) * 100)));
  let isIndeterminate = $derived(value < 0);
</script>

<div class="container {classes ?? ''}" data-pw={typeof testId === 'string' ? testId : null}>
  <div class="track">
    <div
      class="bar"
      class:indeterminate={isIndeterminate}
      style:width={isIndeterminate ? null : `${percentage}%`}
    ></div>
  </div>
  {#if showLabel && !isIndeterminate}
    <div class="label">{Math.round(percentage)}%</div>
  {/if}
</div>

<style>
  .container {
    display: flex;
    align-items: center;
    width: var(--progress-container-width, 100%);
    padding: var(--progress-container-padding, 0);
    gap: var(--progress-container-gap, 8px);
  }

  .track {
    flex: 1;
    height: var(--progress-track-height, 8px);
    background: var(--progress-track-background, #e0e0e0);
    border-radius: var(--progress-track-border-radius, 4px);
    overflow: hidden;
  }

  .bar {
    height: 100%;
    background: var(--progress-bar-background, #2196f3);
    border-radius: var(--progress-bar-border-radius, 4px);
    transition: var(--progress-bar-transition, width 0.3s ease);
  }

  .bar.indeterminate {
    width: 30%;
    animation: indeterminate var(--progress-indeterminate-duration, 1.5s) ease-in-out infinite;
  }

  .label {
    font-size: var(--progress-label-font-size, 14px);
    font-weight: var(--progress-label-font-weight, 500);
    color: var(--progress-label-color, #333);
    font-family: var(--progress-label-font-family, inherit);
    margin: var(--progress-label-margin, 0);
  }

  @keyframes indeterminate {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(400%);
    }
  }
</style>
