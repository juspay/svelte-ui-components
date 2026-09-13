<script module lang="ts">
  /**
   * Resolves a caller-stable id (a category label, series name, or any other id
   * the CALLER chose to remember) to its CURRENT position in a chart's live
   * category list -- e.g. the array `ChartHighlightAPI.getCategories()` returns.
   *
   * Both `highlightedIndex` and `ChartHighlightAPI.highlight()` take a numeric
   * index, but that index shifts whenever the chart reorders, filters, or
   * folds tail categories into a `topN` "Other" bucket. A synchronized legend
   * (or any external driver) should not cache the index it first saw; it
   * should re-resolve the id against the current `getCategories()` output
   * right before calling `highlight()`. Returns `null` when the id is not
   * currently present (filtered out, or absorbed into an aggregate bucket),
   * which callers should treat as "clear the highlight", not "highlight -1".
   */
  export function resolveLegendIndex(categories: readonly string[], id: string): number | null {
    const index = categories.indexOf(id);
    return index === -1 ? null : index;
  }
</script>

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
          <!-- The aggregate sits OUTSIDE the button deliberately. Every bit of
               text inside a button becomes part of its accessible name, so an
               aggregate inside it would make the control's name change whenever
               the data does -- "Revenue $6,500" today, something else tomorrow.
               A name that moves breaks voice-control targeting and any consumer
               test matching it exactly, and announces a figure as the control's
               identity rather than as information about the series. It also
               stops a number being a click target for toggling a series, which
               it never should have been. -->
          <div class="legend-item" class:legend-hidden={item.hidden}>
            <button
              type="button"
              class="legend-toggle"
              aria-pressed={!item.hidden}
              onclick={() => onToggle(i)}
              data-pw={`legend-toggle-${i}`}
              testID={`legend-toggle-${i}`}
            >
              <span class="legend-swatch" style="background: {item.color}"></span>
              <span class="legend-label">{item.label}</span>
            </button>
            {#if item.aggregateLabel}
              <span class="legend-aggregate">{item.aggregateLabel}</span>
            {/if}
          </div>
        {:else}
          <div class="legend-item">
            <span class="legend-swatch" style="background: {item.color}"></span>
            <span class="legend-label">{item.label}</span>
            {#if item.aggregateLabel}
              <span class="legend-aggregate">{item.aggregateLabel}</span>
            {/if}
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

  .legend-aggregate {
    font-size: var(--chart-legend-font-size, 12px);
    font-weight: 600;
    color: var(--chart-legend-aggregate-color, light-dark(#111, #f5f5f5));
  }

  .legend-toggle {
    /* The button no longer IS the row -- it holds the swatch and label, and the
       aggregate is its sibling -- so it carries its own flex layout. */
    display: flex;
    align-items: center;
    gap: 6px;
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

  .legend-hidden .legend-label,
  .legend-hidden .legend-aggregate {
    color: var(--chart-legend-hidden-color, light-dark(#bbb, #555));
  }
</style>
