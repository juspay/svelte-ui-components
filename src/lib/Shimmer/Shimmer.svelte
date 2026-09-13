<script lang="ts">
  import type { ShimmerProperties } from './properties';

  let { testId, classes }: ShimmerProperties = $props();
</script>

<div
  class="shimmer {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
></div>

<style>
  .shimmer {
    width: var(--shimmer-width, 100%);
    height: var(--shimmer-height, 16px);
    border-radius: var(--shimmer-border-radius, var(--radius, 4px));
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
  /* An indefinite animation is the case this preference exists for: it never
     ends, so a user who asked the OS to minimise motion gets a permanent loop.
     The animation stops, but the element must still read as "busy" -- a guard
     that leaves nothing on screen, or leaves a frame that means something else,
     is worse than the motion it removed. This block lives in the component's own
     <style> because that is the only stylesheet that reaches inside the shadow
     root a custom-element consumer gets. */
  @media (prefers-reduced-motion: reduce) {
    .shimmer::after {
      /* The sweep is the only animated part; the base block underneath is the
         skeleton. Removing the sweep leaves exactly that -- a flat placeholder
         -- rather than a highlight band frozen somewhere across it. */
      display: none;
    }
  }
</style>
