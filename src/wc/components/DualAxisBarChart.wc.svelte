<svelte:options
  customElement={{
    tag: 'sui-dual-axis-bar-chart',
    shadow: 'open',
    props: {
      // Complex props (arrays / objects / functions / snippets) cannot cross the
      // HTML-attribute boundary, so they are exposed as JS properties only:
      //   document.querySelector('sui-dual-axis-bar-chart').categories = ['Jan', 'Feb'];
      categories: { type: 'Object' },
      series: { type: 'Object' },
      leftAxis: { type: 'Object' },
      rightAxis: { type: 'Object' },
      showGridlines: { type: 'Boolean', attribute: 'show-gridlines' },
      showLegend: { type: 'Boolean', attribute: 'show-legend' },
      barRadius: { type: 'Number', attribute: 'bar-radius' },
      barPadding: { type: 'Number', attribute: 'bar-padding' },
      aspectRatio: { type: 'Number', attribute: 'aspect-ratio' },
      maxHeight: { type: 'Number', attribute: 'max-height' },
      minHeight: { type: 'Number', attribute: 'min-height' },
      minBarHeight: { type: 'Number', attribute: 'min-bar-height' },
      margin: { type: 'Object' },
      tooltipPortal: { type: 'Boolean', attribute: 'tooltip-portal' },
      interactiveLegend: { type: 'Boolean', attribute: 'interactive-legend' },
      hideLegendBelow: { type: 'Number', attribute: 'hide-legend-below' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      tooltipSnippet: { type: 'Object' },
      onbarclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import DualAxisBarChart from '$lib/DualAxisBarChart/DualAxisBarChart.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  /*
   * DualAxisBarChart has exactly one snippet prop, `tooltipSnippet`, and it is
   * gated on `typeof tooltipSnippet === 'function'` with its own `{:else}`
   * fallback -- the default multi-series `ChartTooltip`. Unlike SankeyChart's
   * `empty` or PieChart's `center`/`empty`, there is no non-parameterized
   * snippet here to bridge to a `<slot>` behind a `$host().querySelector(...)`
   * guard: `tooltipSnippet` is declared `Snippet<[DualAxisTooltipContext]>`, so
   * it is called WITH an argument, and a `<slot>` projects markup only -- it
   * cannot carry that context. Defining
   * `{#snippet tooltipSnippet(ctx)}<slot name="tooltip"></slot>{/snippet}`
   * would compile and render, but `ctx` has nowhere to go and is silently
   * dropped, AND it would make the component's `typeof` gate permanently true,
   * replacing the default tooltip with an empty shell for every consumer who
   * slotted nothing. Both failure modes are exactly what
   * scripts/check-wc-contract.js's rule 2 and rule 3 exist to catch. So
   * `tooltipSnippet` stays a JS-property-only prop, same as on `sui-sankey-chart`
   * and `sui-pie-chart`:
   *   document.querySelector('sui-dual-axis-bar-chart').tooltipSnippet = (ctx) => ...;
   * (in practice only reachable from a Svelte consumer, since only Svelte can
   * construct a Snippet value). The component's empty-data state
   * ("No data available.") is likewise plain markup, not a snippet, so there is
   * nothing to bridge there either.
   */

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onbarclick collides with nothing in HOST_EVENT_HANDLER_PROPS, so it
  // dispatches 'barclick'. It is a single-argument callback (DualAxisBarChart/
  // properties.ts's own `(event: { categoryIndex, context }) => void`), so `detail`
  // is exactly that event object with no CALLBACK_ARGUMENT_NAMES entry needed.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<DualAxisBarChart {...props} {...dispatchers} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-dual-axis-bar-chart-display, block);
  }
</style>
