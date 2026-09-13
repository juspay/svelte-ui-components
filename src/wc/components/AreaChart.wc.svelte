<svelte:options
  customElement={{
    tag: 'sui-area-chart',
    shadow: 'open',
    props: {
      // Complex props (arrays / objects / functions / snippets) cannot cross the
      // HTML-attribute boundary, so they are exposed as JS properties only:
      //   document.querySelector('sui-area-chart').series = [{ name: 'Traffic', data: [...] }];
      series: { type: 'Object' },
      curve: { type: 'String', attribute: 'curve' },
      stacked: { type: 'Boolean', attribute: 'stacked' },
      stackNormalize: { type: 'Boolean', attribute: 'stack-normalize' },
      fillOpacity: { type: 'Number', attribute: 'fill-opacity' },
      gradientFill: { type: 'Boolean', attribute: 'gradient-fill' },
      showDots: { type: 'Boolean', attribute: 'show-dots' },
      showLine: { type: 'Boolean', attribute: 'show-line' },
      showValues: { type: 'Boolean', attribute: 'show-values' },
      strokeWidth: { type: 'Number', attribute: 'stroke-width' },
      showGridlines: { type: 'Boolean', attribute: 'show-gridlines' },
      showXAxis: { type: 'Boolean', attribute: 'show-x-axis' },
      showYAxis: { type: 'Boolean', attribute: 'show-y-axis' },
      showLegend: { type: 'Boolean', attribute: 'show-legend' },
      xDomain: { type: 'Object' },
      yDomain: { type: 'Object' },
      xAxisLabel: { type: 'String', attribute: 'x-axis-label' },
      yAxisLabel: { type: 'String', attribute: 'y-axis-label' },
      xTickFormat: { type: 'Object' },
      yTickFormat: { type: 'Object' },
      aspectRatio: { type: 'Number', attribute: 'aspect-ratio' },
      minHeight: { type: 'Number', attribute: 'min-height' },
      maxHeight: { type: 'Number', attribute: 'max-height' },
      tooltipSnippet: { type: 'Object' },
      empty: { type: 'Object' },
      tooltipPortal: { type: 'Boolean', attribute: 'tooltip-portal' },
      onpointhover: { type: 'Object' },
      onpointclick: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import AreaChart from '$lib/AreaChart/AreaChart.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  /*
   * AreaChart renders its empty state only when `isEmpty && typeof empty ===
   * 'function'`, and otherwise falls through to the chart frame (legend, axes,
   * hover overlay) itself. A wrapper that defined the snippet unconditionally
   * would make that test permanently true whenever the series are empty, so a
   * consumer who slots nothing would get a blank `<div class="chart-empty">`
   * where the frame used to be, and it would also shadow a JS-assigned `empty`
   * property. Claim it only when the consumer really slotted content.
   *
   * `tooltipSnippet` is deliberately absent from the markup below: it is called
   * with an `AreaChartTooltipContext` (`{x, points}`), and a `<slot>` cannot
   * receive that argument, so wiring it to markup would silently drop the very
   * values it exists to render. It stays a JS-property-only prop, as on
   * `sui-pie-chart` and `sui-sankey-chart`.
   */
  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();
  const hasEmptySlot = hostEl.querySelector('[slot="empty"]') !== null;

  // Neither onpointhover nor onpointclick collides with a native HTMLElement
  // handler, so both dispatch -- 'pointhover' and 'pointclick' -- for a consumer who
  // only calls addEventListener. Each callback takes exactly one argument (the
  // `{seriesIndex, pointIndex, point}` object, or null for onpointhover when the
  // pointer leaves every point), so detail is that value unchanged -- no
  // CALLBACK_ARGUMENT_NAMES entry needed.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!--
  Two branches rather than one conditional snippet prop, because a `{#snippet}`
  declared at the top level of the template is hoisted to module scope, while the
  `<slot>` inside it compiles to `$.slot(node, $$props, …)` -- and `$$props` only
  exists inside the component function. The hoisted version throws
  `$$props is not defined` the moment the snippet renders, which surfaces as a
  silently empty shadow root rather than as a build error.
-->
{#if hasEmptySlot}
  <AreaChart {...props} {...dispatchers}>
    {#snippet empty()}
      <slot name="empty"></slot>
    {/snippet}
  </AreaChart>
{:else}
  <AreaChart {...props} {...dispatchers} />
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
    display: var(--sui-area-chart-display, block);
  }
</style>
