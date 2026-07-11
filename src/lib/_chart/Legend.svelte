<script lang="ts">
  import type { LegendProperties } from './types';

  let { items, position = 'bottom', onToggle, customSnippet, classes }: LegendProperties = $props();
</script>

{#if items.length > 0}
  <div class="chart-legend position-{position} {classes ?? ''}">
    {#if typeof customSnippet === 'function'}
      {@render customSnippet(items)}
    {:else}
      {#each items as item, i (i)}
        {#if typeof onToggle === 'function'}
          <button
            type="button"
            class="legend-item legend-toggle"
            class:legend-hidden={item.hidden}
            aria-pressed={!item.hidden}
            onclick={() => onToggle(i)}
            data-pw={`legend-toggle-${i}`}
          >
            <span class="legend-swatch" style="background: {item.color}"></span>
            <span class="legend-label">{item.label}</span>
          </button>
        {:else}
          <div class="legend-item">
            <span class="legend-swatch" style="background: {item.color}"></span>
            <span class="legend-label">{item.label}</span>
          </div>
        {/if}
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
    color: var(--chart-legend-color, light-dark(#333, #e5e7eb));
  }

  .legend-toggle {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font: inherit;
    cursor: pointer;
  }

  .legend-hidden .legend-swatch {
    opacity: 0.25;
  }

  .legend-hidden .legend-label {
    color: var(--chart-legend-hidden-color, light-dark(#bbb, #555));
  }
</style>
