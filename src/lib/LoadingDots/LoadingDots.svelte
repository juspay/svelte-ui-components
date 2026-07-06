<script lang="ts">
  import type { LoadingDotsProperties } from './properties';

  let { dots = 3, animation = 'bounce', testId, classes }: LoadingDotsProperties = $props();

  let count = $derived(Math.max(1, Math.round(dots)));
</script>

<span
  class="loading-dots {classes ?? ''}"
  role="status"
  aria-label="Loading"
  data-pw={typeof testId === 'string' ? testId : null}
>
  {#each { length: count } as _, i (i)}
    <span class="dot" class:pulse={animation === 'pulse'} style="--i: {i}"></span>
  {/each}
</span>

<style>
  .loading-dots {
    display: inline-flex;
    align-items: center;
    gap: var(--loading-dots-gap, 3px);
    vertical-align: middle;
    line-height: 1;
  }

  .dot {
    display: block;
    width: var(--loading-dots-size, 6px);
    height: var(--loading-dots-size, 6px);
    border-radius: var(--loading-dots-border-radius, 50%);
    background-color: var(--loading-dots-color, currentColor);
    animation: loading-dots-bounce var(--loading-dots-duration, 1.4s) ease-in-out infinite;
    animation-delay: calc(var(--i) * var(--loading-dots-stagger, 0.16s));
  }

  .dot.pulse {
    animation-name: loading-dots-pulse;
  }

  @keyframes loading-dots-bounce {
    0%,
    80%,
    100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(var(--loading-dots-bounce-height, -6px));
    }
  }

  @keyframes loading-dots-pulse {
    0%,
    80%,
    100% {
      opacity: var(--loading-dots-pulse-min-opacity, 0.2);
      transform: scale(var(--loading-dots-pulse-min-scale, 1));
    }
    40% {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
