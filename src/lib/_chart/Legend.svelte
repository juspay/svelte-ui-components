<script lang="ts">
  import type { LegendProperties } from './types';

  let { items, position = 'bottom', customSnippet, classes }: LegendProperties = $props();
</script>

{#if items.length > 0}
  <div class="chart-legend position-{position} {classes ?? ''}">
    {#if typeof customSnippet === 'function'}
      {@render customSnippet(items)}
    {:else}
      {#each items as item, i (i)}
        <div class="legend-item">
          <span class="legend-swatch" style="background: {item.color}"></span>
          <span class="legend-label">{item.label}</span>
        </div>
      {/each}
    {/if}
  </div>
{/if}

<style>
  .chart-legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--chart-legend-gap, 16px);
    font-family: var(--chart-font-family, inherit);
    padding: 8px 0;
  }

  .position-top {
    padding-bottom: 12px;
  }

  .position-bottom {
    padding-top: 12px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .legend-swatch {
    display: inline-block;
    width: var(--chart-legend-swatch-size, 12px);
    height: var(--chart-legend-swatch-size, 12px);
    border-radius: var(--chart-swatch-radius, 2px);
    flex-shrink: 0;
  }

  .legend-label {
    font-size: var(--chart-legend-font-size, 12px);
    color: var(--chart-legend-color, #333);
  }
</style>
