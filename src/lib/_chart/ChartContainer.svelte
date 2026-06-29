<script lang="ts">
  import type { ChartContainerProperties } from './types';
  import { onMount } from 'svelte';

  let {
    width = $bindable(0),
    height = $bindable(0),
    aspectRatio = 16 / 9,
    minHeight = 0,
    maxHeight = Infinity,
    testId,
    classes,
    children
  }: ChartContainerProperties = $props();

  let containerEl: HTMLDivElement | null = $state(null);
  let isMounted = false;

  function measure() {
    if (containerEl === null) {
      return;
    }
    const rect = containerEl.getBoundingClientRect();
    const w = Math.round(rect.width);
    width = w;
    height = Math.min(maxHeight, Math.max(minHeight, Math.round(w / aspectRatio)));
  }

  // Re-measure whenever aspectRatio changes at runtime (e.g. semiCircle toggled).
  // isMounted guards against running after the onMount cleanup has disconnected
  // the ResizeObserver and the component is being torn down.
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    // Reading aspectRatio/maxHeight here makes this effect re-run whenever either
    // changes, so the computed height stays current without waiting for a resize.
    void aspectRatio;
    void maxHeight;
    if (isMounted) {
      measure();
    }
  });

  onMount(() => {
    if (containerEl === null) {
      return;
    }

    isMounted = true;
    measure();

    // Coalesce bursts of resize events into a single measure per frame, always
    // using the latest size (a leading-edge debounce would drop the final size).
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(containerEl);

    return () => {
      isMounted = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  });
</script>

<div
  class="chart-container {classes ?? ''}"
  bind:this={containerEl}
  data-pw={typeof testId === 'string' ? testId : null}
>
  {#if width > 0 && height > 0}
    <svg
      viewBox="0 0 {width} {height}"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      {width}
      {height}
    >
      {@render children()}
    </svg>
  {/if}
</div>

<style>
  .chart-container {
    width: 100%;
    background: var(--chart-background, transparent);
    font-family: var(--chart-font-family, inherit);
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
</style>
