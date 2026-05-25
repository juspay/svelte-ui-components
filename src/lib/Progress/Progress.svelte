<script lang="ts">
  import type { ProgressProperties } from './properties';
  import { clampFilledSegments } from './segments';

  let {
    value,
    max = 100,
    showLabel = false,
    testId,
    classes,
    segments
  }: ProgressProperties = $props();

  let percentage = $derived(Math.min(100, Math.max(0, (value / max) * 100)));
  let isIndeterminate = $derived(value < 0);

  let segmentCount = $derived(segments && segments > 0 ? Math.floor(segments) : 0);
  let filledSegments = $derived(clampFilledSegments(value, segmentCount));
  let segmentIndices = $derived([...Array(segmentCount).keys()]);
</script>

<div class="container {classes ?? ''}" data-pw={typeof testId === 'string' ? testId : null}>
  {#if segmentCount > 0}
    <div class="segmented-track">
      {#each segmentIndices as i (i)}
        <div
          class="segment"
          class:filled={i < filledSegments}
          class:first={i === 0}
          class:last={i === segmentCount - 1}
        ></div>
      {/each}
    </div>
  {:else}
    <div class="track">
      <div
        class="bar"
        class:indeterminate={isIndeterminate}
        style:width={isIndeterminate ? null : `${percentage}%`}
      ></div>
    </div>
  {/if}
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

  .segmented-track {
    flex: 1;
    display: flex;
    gap: var(--progress-segments-gap, 2px);
  }

  .segment {
    flex: 1;
    height: var(--progress-track-height, 8px);
    background: var(--progress-segment-empty-background, var(--progress-track-background, #e0e0e0));
    border-radius: var(--progress-segment-radius, 0);
    transition: var(--progress-segment-transition, background 0.2s ease);
  }

  .segment.filled {
    background: var(--progress-segment-filled-background, var(--progress-bar-background, #2196f3));
  }

  .segment.first {
    border-top-left-radius: var(--progress-segment-radius-end, 4px);
    border-bottom-left-radius: var(--progress-segment-radius-end, 4px);
  }

  .segment.last {
    border-top-right-radius: var(--progress-segment-radius-end, 4px);
    border-bottom-right-radius: var(--progress-segment-radius-end, 4px);
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
