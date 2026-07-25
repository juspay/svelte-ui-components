<script lang="ts">
  import type { ChartTooltipProperties, TooltipData } from './types';
  import { computeTooltipPosition } from './tooltipPosition';

  let {
    data,
    mouseX = 0,
    mouseY = 0,
    anchor = null,
    portal = false,
    originEl = null,
    unstyled = false,
    content,
    customSnippet,
    classes
  }: ChartTooltipProperties = $props();

  let tooltipEl = $state<HTMLDivElement | null>(null);
  let tooltipWidth = $state(0);
  let tooltipHeight = $state(0);
  // Portal position depends on untracked DOM reads (originEl rect, viewport
  // size); bump a tick on scroll/resize so the $derived re-runs while open.
  let portalTick = $state(0);

  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    if (!portal || data === null || typeof window === 'undefined') {
      return;
    }
    const bump = () => {
      portalTick += 1;
    };
    window.addEventListener('scroll', bump, { capture: true, passive: true });
    window.addEventListener('resize', bump);
    return () => {
      window.removeEventListener('scroll', bump, { capture: true });
      window.removeEventListener('resize', bump);
    };
  });

  /**
   * Svelte action: relocates the tooltip to document.body so a position:fixed
   * tooltip is never clipped by an overflow/scroll ancestor. `use:` actions
   * never run during SSR.
   */
  const portalToBody = (node: HTMLElement) => {
    document.body.appendChild(node);
    return { destroy: () => node.remove() };
  };

  const pos = $derived.by(() => {
    const tooltip = { width: tooltipWidth, height: tooltipHeight };
    if (portal) {
      void portalTick;
      // Convert container coords to viewport coords and clamp to the viewport.
      const rect = originEl?.getBoundingClientRect();
      const dx = rect?.left ?? 0;
      const dy = rect?.top ?? 0;
      const container =
        typeof window === 'undefined'
          ? { width: Number.POSITIVE_INFINITY, height: Number.POSITIVE_INFINITY }
          : { width: window.innerWidth, height: window.innerHeight };
      return computeTooltipPosition({
        mouseX: mouseX + dx,
        mouseY: mouseY + dy,
        anchor: anchor === null ? null : { ...anchor, x: anchor.x + dx, y: anchor.y + dy },
        tooltip,
        container
      });
    }
    const container = {
      width: tooltipEl?.offsetParent?.clientWidth ?? Number.POSITIVE_INFINITY,
      height: tooltipEl?.offsetParent?.clientHeight ?? Number.POSITIVE_INFINITY
    };
    return computeTooltipPosition({ mouseX, mouseY, anchor, tooltip, container });
  });
</script>

{#snippet inner(tooltipData: TooltipData)}
  {#if content}
    {@render content()}
  {:else if typeof customSnippet === 'function'}
    {@render customSnippet(tooltipData)}
  {:else}
    {#if tooltipData.title}
      <div class="tooltip-title">{tooltipData.title}</div>
    {/if}
    {#each tooltipData.items as item, i (i)}
      <div class="tooltip-item" data-pw={`tooltip-item-${i}`} testID={`tooltip-item-${i}`}>
        {#if item.color}
          <span class="tooltip-swatch" style="background: {item.color}"></span>
        {/if}
        <span class="tooltip-label">{item.label}</span>
        <span class="tooltip-value">{item.value}</span>
      </div>
    {/each}
  {/if}
{/snippet}

{#if data !== null}
  {#if portal}
    <div
      bind:this={tooltipEl}
      bind:clientWidth={tooltipWidth}
      bind:clientHeight={tooltipHeight}
      class="chart-tooltip portal {unstyled ? 'unstyled' : ''} {classes ?? ''}"
      style="left: {pos.left}px; top: {pos.top}px;"
      use:portalToBody
      data-pw="chart-tooltip"
      testID="chart-tooltip"
    >
      {@render inner(data)}
    </div>
  {:else}
    <div
      bind:this={tooltipEl}
      bind:clientWidth={tooltipWidth}
      bind:clientHeight={tooltipHeight}
      class="chart-tooltip {unstyled ? 'unstyled' : ''} {classes ?? ''}"
      style="left: {pos.left}px; top: {pos.top}px;"
      data-pw="chart-tooltip"
      testID="chart-tooltip"
    >
      {@render inner(data)}
    </div>
  {/if}
{/if}

<style>
  .chart-tooltip {
    position: absolute;
    z-index: var(--chart-tooltip-z-index, 10);
    background: var(--chart-tooltip-background, light-dark(rgba(0, 0, 0, 0.85), #1f2937));
    color: var(--chart-tooltip-color, light-dark(#fff, #f3f4f6));
    font-size: var(--chart-tooltip-font-size, 12px);
    font-family: var(--chart-font-family, inherit);
    padding: var(--chart-tooltip-padding, 8px 12px);
    border-radius: var(--chart-tooltip-border-radius, var(--radius, 4px));
    box-shadow: var(--chart-tooltip-shadow, 0 2px 8px rgba(0, 0, 0, 0.2));
    border: 1px solid
      var(
        --chart-tooltip-border-color,
        light-dark(rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.08))
      );
    pointer-events: none;
    max-width: var(--chart-tooltip-max-width, 280px);
    width: fit-content;
  }

  .chart-tooltip.portal {
    position: fixed;
  }

  .chart-tooltip.unstyled {
    background: none;
    padding: 0;
    border: none;
    box-shadow: none;
    border-radius: 0;
    max-width: none;
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
