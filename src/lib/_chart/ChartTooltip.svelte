<script lang="ts">
  import type { ChartTooltipProperties } from './types';

  let { data, mouseX = 0, mouseY = 0, customSnippet, classes }: ChartTooltipProperties = $props();

  const OFFSET = 12;

  let tooltipEl = $state<HTMLDivElement | null>(null);
  let tooltipWidth = $state(0);
  let tooltipHeight = $state(0);

  // Clamp against the positioned chart container so the tooltip never spills past
  // (and gets clipped by) an overflow:hidden edge. Re-read on each measure/move.
  const containerWidth = $derived(tooltipEl?.offsetParent?.clientWidth ?? Number.POSITIVE_INFINITY);
  const containerHeight = $derived(
    tooltipEl?.offsetParent?.clientHeight ?? Number.POSITIVE_INFINITY
  );

  // Horizontal: flip to the left of the cursor when it would overflow the right edge.
  const left = $derived.by(() => {
    let value = mouseX + OFFSET;
    if (value + tooltipWidth > containerWidth) {
      value = mouseX - tooltipWidth - OFFSET;
    }
    return Math.max(0, value);
  });

  // Vertical: keep the tooltip within the container's top and bottom edges.
  const top = $derived.by(() => {
    let value = mouseY - OFFSET;
    if (value + tooltipHeight > containerHeight) {
      value = containerHeight - tooltipHeight;
    }
    return Math.max(0, value);
  });
</script>

{#if data !== null}
  <div
    bind:this={tooltipEl}
    bind:clientWidth={tooltipWidth}
    bind:clientHeight={tooltipHeight}
    class="chart-tooltip {classes ?? ''}"
    style="left: {left}px; top: {top}px;"
  >
    {#if typeof customSnippet === 'function'}
      {@render customSnippet(data)}
    {:else}
      {#if data.title}
        <div class="tooltip-title">{data.title}</div>
      {/if}
      {#each data.items as item, i (i)}
        <div class="tooltip-item">
          {#if item.color}
            <span class="tooltip-swatch" style="background: {item.color}"></span>
          {/if}
          <span class="tooltip-label">{item.label}</span>
          <span class="tooltip-value">{item.value}</span>
        </div>
      {/each}
    {/if}
  </div>
{/if}

<style>
  .chart-tooltip {
    position: absolute;
    z-index: var(--chart-tooltip-z-index, 10);
    background: var(--chart-tooltip-background, rgba(0, 0, 0, 0.85));
    color: var(--chart-tooltip-color, #fff);
    font-size: var(--chart-tooltip-font-size, 12px);
    font-family: var(--chart-font-family, inherit);
    padding: var(--chart-tooltip-padding, 8px 12px);
    border-radius: var(--chart-tooltip-border-radius, var(--radius, 4px));
    box-shadow: var(--chart-tooltip-shadow, 0 2px 8px rgba(0, 0, 0, 0.2));
    pointer-events: none;
    max-width: var(--chart-tooltip-max-width, 280px);
    width: fit-content;
  }

  .tooltip-title {
    font-weight: 600;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tooltip-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 1px 0;
  }

  .tooltip-swatch {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: var(--chart-swatch-radius, 2px);
    flex-shrink: 0;
  }

  .tooltip-label {
    opacity: 0.8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .tooltip-value {
    font-weight: 600;
    margin-left: auto;
    padding-left: 12px;
    white-space: nowrap;
  }
</style>
