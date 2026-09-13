<svelte:options
  customElement={{
    tag: 'sui-line-chart',
    shadow: 'open',
    props: {
      // Complex props (arrays / objects / functions / snippets) cannot cross the
      // HTML-attribute boundary, so they are exposed as JS properties only:
      //   document.querySelector('sui-line-chart').series = [{ name: 'Revenue', data: [...] }];
      series: { type: 'Object' },
      curve: { type: 'String' },
      gradientFill: { type: 'Boolean', attribute: 'gradient-fill' },
      fillOpacity: { type: 'Number', attribute: 'fill-opacity' },
      showArea: { type: 'Boolean', attribute: 'show-area' },
      areaGradient: { type: 'Object' },
      showDots: { type: 'Boolean', attribute: 'show-dots' },
      showValues: { type: 'Boolean', attribute: 'show-values' },
      dotRadius: { type: 'Number', attribute: 'dot-radius' },
      strokeWidth: { type: 'Number', attribute: 'stroke-width' },
      showGridlines: { type: 'Boolean', attribute: 'show-gridlines' },
      showXAxis: { type: 'Boolean', attribute: 'show-x-axis' },
      showYAxis: { type: 'Boolean', attribute: 'show-y-axis' },
      showLegend: { type: 'Boolean', attribute: 'show-legend' },
      xDomain: { type: 'Object' },
      yDomain: { type: 'Object' },
      xAxisLabel: { type: 'String', attribute: 'x-axis-label' },
      yAxisLabel: { type: 'String', attribute: 'y-axis-label' },
      xAxisCategories: { type: 'Object' },
      xTickFormat: { type: 'Object' },
      yTickFormat: { type: 'Object' },
      yIntegerTicks: { type: 'Boolean', attribute: 'y-integer-ticks' },
      aspectRatio: { type: 'Number', attribute: 'aspect-ratio' },
      minHeight: { type: 'Number', attribute: 'min-height' },
      maxHeight: { type: 'Number', attribute: 'max-height' },
      tooltipSnippet: { type: 'Object' },
      empty: { type: 'Object' },
      sharedTooltip: { type: 'Boolean', attribute: 'shared-tooltip' },
      interactiveLegend: { type: 'Boolean', attribute: 'interactive-legend' },
      hideLegendBelow: { type: 'Number', attribute: 'hide-legend-below' },
      tooltipPortal: { type: 'Boolean', attribute: 'tooltip-portal' },
      highlightedIndex: { type: 'Number', attribute: 'highlighted-index' },
      onchartready: { type: 'Object' },
      onpointclick: { type: 'Object' },
      onpointhover: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import LineChart from '$lib/LineChart/LineChart.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  /*
   * LineChart renders its own empty-state fallback only when
   * `typeof empty === 'function'`, and otherwise falls through to the chart
   * frame itself. A wrapper that defined the snippet unconditionally would
   * make that gate always true, so an empty dataset would render a blank
   * `<div class="chart-empty">` in place of the frame -- and would also shadow
   * a JS-assigned `empty` property. Claim it only when the consumer really
   * slotted content, mirroring `sui-pie-chart` / `sui-sankey-chart`.
   *
   * `tooltipSnippet` is deliberately absent from the markup below: LineChart
   * calls it with a `LineChartTooltipContext` (`{x, points}`), and a `<slot>`
   * projects markup only -- it cannot forward that argument, so wiring it to
   * markup would silently drop the very values it exists to render. It stays
   * a JS-property-only prop, as on `sui-pie-chart` and `sui-sankey-chart`.
   *
   * Named hostEl, not host: svelte2tsx confuses a local variable named after a
   * rune's name minus its `$` with the rune itself (sveltejs/svelte#13715),
   * reporting `$host` as used before its declaration.
   */
  const hostEl = $host();
  const hasEmptySlot = hostEl.querySelector('[slot="empty"]') !== null;

  // None of onchartready/onpointclick/onpointhover collide with a native
  // HTMLElement handler, so all three dispatch -- 'chartready', 'pointclick',
  // 'pointhover' -- for a consumer who only calls addEventListener. Each carries
  // its own single argument as detail (the ChartHighlightAPI, or the point-hit
  // object / null) -- one argument needs no CALLBACK_ARGUMENT_NAMES entry.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!--
  One branch rather than a top-level `{#snippet empty()}`, because a snippet
  declared at the top level of the template is hoisted to module scope, while
  the `<slot>` inside it compiles to `$.slot(node, $$props, …)` -- and
  `$$props` only exists inside the component function. The hoisted version
  throws `$$props is not defined` the moment the snippet renders, which
  surfaces as a silently empty shadow root rather than as a build error.
-->
{#if hasEmptySlot}
  <LineChart {...props} {...dispatchers}>
    {#snippet empty()}
      <slot name="empty"></slot>
    {/snippet}
  </LineChart>
{:else}
  <LineChart {...props} {...dispatchers} />
{/if}

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-line-chart-display, block);
  }
</style>
