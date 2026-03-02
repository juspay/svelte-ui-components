<script lang="ts">
  import type { ShimmerProperties } from './properties';

  let { testId, classes }: ShimmerProperties = $props();
</script>

<div class="shimmer {classes ?? ''}" data-pw={typeof testId === 'string' ? testId : null}></div>

<style>
  .shimmer {
    width: var(--shimmer-width, 100%);
    height: var(--shimmer-height, 16px);
    border-radius: var(--shimmer-border-radius, 4px);
    background-color: var(--shimmer-background, #e0e0e0);
    opacity: var(--shimmer-opacity, 1);
    overflow: hidden;
    position: relative;
  }

  .shimmer::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      var(--shimmer-highlight, rgba(255, 255, 255, 0.4)),
      transparent
    );
    animation: shimmer var(--shimmer-duration, 1.5s) infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
</style>
