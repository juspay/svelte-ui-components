<svelte:options
  customElement={{
    tag: 'sui-bar-chart',
    shadow: 'open',
    props: {
      // Complex props (arrays / objects / functions / snippets) cannot cross the
      // HTML-attribute boundary, so they are exposed as JS properties only:
      //   document.querySelector('sui-bar-chart').data = [{ label: 'Jan', value: 4200 }];
      data: { type: 'Object' },
      series: { type: 'Object' },
      groupMode: { type: 'String', attribute: 'group-mode' },
      orientation: { type: 'String', attribute: 'orientation' },
      showValues: { type: 'Boolean', attribute: 'show-values' },
      showGridlines: { type: 'Boolean', attribute: 'show-gridlines' },
      showXAxis: { type: 'Boolean', attribute: 'show-x-axis' },
      showYAxis: { type: 'Boolean', attribute: 'show-y-axis' },
      showLegend: { type: 'Boolean', attribute: 'show-legend' },
      barPadding: { type: 'Number', attribute: 'bar-padding' },
      barRadius: { type: 'Number', attribute: 'bar-radius' },
      aspectRatio: { type: 'Number', attribute: 'aspect-ratio' },
      maxHeight: { type: 'Number', attribute: 'max-height' },
      minHeight: { type: 'Number', attribute: 'min-height' },
      xAxisLabel: { type: 'String', attribute: 'x-axis-label' },
      yAxisLabel: { type: 'String', attribute: 'y-axis-label' },
      yDomain: { type: 'Object' },
      valueFormat: { type: 'Object' },
      stackNormalize: { type: 'Boolean', attribute: 'stack-normalize' },
      scrollable: { type: 'Boolean', attribute: 'scrollable' },
      minBandWidth: { type: 'Number', attribute: 'min-band-width' },
      marginX: { type: 'Number', attribute: 'margin-x' },
      tooltipSnippet: { type: 'Object' },
      empty: { type: 'Object' },
      renderOverlay: { type: 'Object' },
      onchartready: { type: 'Object' },
      highlightedIndex: { type: 'Number', attribute: 'highlighted-index' },
      normaliseToFirstPoint: { type: 'Boolean', attribute: 'normalise-to-first-point' },
      topN: { type: 'Number', attribute: 'top-n' },
      overflowLabel: { type: 'String', attribute: 'overflow-label' },
      hideBarGraphics: { type: 'Boolean', attribute: 'hide-bar-graphics' },
      interactiveLegend: { type: 'Boolean', attribute: 'interactive-legend' },
      hideLegendBelow: { type: 'Number', attribute: 'hide-legend-below' },
      tooltipPortal: { type: 'Boolean', attribute: 'tooltip-portal' },
      onbarclick: { type: 'Object' },
      onbarhover: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import BarChart from '$lib/BarChart/BarChart.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  /*
   * BarChart renders its own empty-state frame only when `isEmpty &&
   * typeof empty === 'function'` (see BarChart.svelte); a wrapper that defined
   * the snippet unconditionally would make that gate permanently true, so a
   * consumer who slots nothing would get a blank `<div class="chart-empty">`
   * in place of the chart's own fallback frame. Claim it only when the
   * consumer really slotted content.
   *
   * `tooltipSnippet` (`Snippet<[BarChartDataPoint, number]>`) and
   * `renderOverlay` (`Snippet<[BarChartRenderContext]>`) are deliberately
   * absent from the markup below: both are called with arguments, and a
   * `<slot>` projects markup only -- it cannot receive them, so wiring either
   * to markup would silently drop the very values they exist to render. They
   * stay JS-property-only props, the way `tooltipSnippet` does on
   * `sui-pie-chart` and `sui-sankey-chart`.
   */
  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();
  const hasEmptySlot = hostEl.querySelector('[slot="empty"]') !== null;

  // None of onchartready/onbarclick/onbarhover collide with a native HTMLElement
  // handler, so all three dispatch -- 'chartready', 'barclick', 'barhover' -- for a
  // consumer who only calls addEventListener. onchartready always firing on mount now
  // (rather than only when a callback was supplied) is the one visible cost: it was
  // already unconditional work, just previously skipped for callback-less consumers.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!--
  Two branches rather than one conditional snippet prop, because a `{#snippet}`
  declared at the top level of the template is hoisted to module scope, while
  the `<slot>` inside it compiles to `$.slot(node, $$props, …)` -- and `$$props`
  only exists inside the component function. The hoisted version throws
  `$$props is not defined` the moment the snippet renders, which surfaces as a
  silently empty shadow root rather than as a build error.
-->
{#if hasEmptySlot}
  <BarChart {...props} {...dispatchers}>
    {#snippet empty()}
      <slot name="empty"></slot>
    {/snippet}
  </BarChart>
{:else}
  <BarChart {...props} {...dispatchers} />
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
    display: var(--sui-bar-chart-display, block);
  }
</style>
