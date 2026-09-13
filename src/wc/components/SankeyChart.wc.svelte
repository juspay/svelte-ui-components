<svelte:options
  customElement={{
    tag: 'sui-sankey-chart',
    shadow: 'open',
    props: {
      // Complex props (arrays / objects / functions / snippets) cannot cross the
      // HTML-attribute boundary, so they are exposed as JS properties only:
      //   document.querySelector('sui-sankey-chart').nodes = [{ id: 'a', label: 'A' }];
      nodes: { type: 'Object' },
      links: { type: 'Object' },
      columnLabels: { type: 'Object' },
      nodeWidth: { type: 'Number', attribute: 'node-width' },
      nodePadding: { type: 'Number', attribute: 'node-padding' },
      iterations: { type: 'Number' },
      showValues: { type: 'Boolean', attribute: 'show-values' },
      showLabels: { type: 'Boolean', attribute: 'show-labels' },
      aspectRatio: { type: 'Number', attribute: 'aspect-ratio' },
      radius: { type: 'Number' },
      maxHeight: { type: 'Number', attribute: 'max-height' },
      minLinkWidth: { type: 'Number', attribute: 'min-link-width' },
      dataLabelOffsetX: { type: 'Number', attribute: 'data-label-offset-x' },
      disableDimOnHover: { type: 'Boolean', attribute: 'disable-dim-on-hover' },
      firstColumnLabelSide: { type: 'String', attribute: 'first-column-label-side' },
      lastColumnLabelSide: { type: 'String', attribute: 'last-column-label-side' },
      marginX: { type: 'Number', attribute: 'margin-x' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      valueFormat: { type: 'Object' },
      nodeColorResolver: { type: 'Object' },
      tooltipPortal: { type: 'Boolean', attribute: 'tooltip-portal' },
      tooltipSnippet: { type: 'Object' },
      empty: { type: 'Object' },
      onnodeclick: { type: 'Object' },
      onlinkclick: { type: 'Object' },
      onnodehover: { type: 'Object' },
      onlinkhover: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import SankeyChart from '$lib/SankeyChart/SankeyChart.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  /*
   * SankeyChart renders its empty state only when `typeof empty === 'function'`,
   * and otherwise falls through to the chart frame itself. A wrapper that
   * defined the snippet unconditionally would make that test always true, so an
   * empty dataset would render an empty `<div class="chart-empty">` -- a blank
   * box where the frame used to be -- and would also shadow a JS-assigned
   * `empty` property. Claim it only when the consumer really slotted content.
   *
   * `tooltipSnippet` is deliberately absent from the markup below: it is called
   * with a `SankeyTooltipContext`, and a `<slot>` cannot receive that argument,
   * so wiring it to markup would silently drop the very values it exists to
   * render. It stays a JS-property-only prop, as on `sui-pie-chart`.
   */
  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();
  const hasEmptySlot = hostEl.querySelector('[slot="empty"]') !== null;

  // None of onnodeclick/onlinkclick/onnodehover/onlinkhover collide with a
  // native HTMLElement handler, so all four dispatch -- 'nodeclick', 'linkclick',
  // 'nodehover', 'linkhover' -- for a consumer who only calls addEventListener.
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
  <SankeyChart {...props} {...dispatchers}>
    {#snippet empty()}
      <slot name="empty"></slot>
    {/snippet}
  </SankeyChart>
{:else}
  <SankeyChart {...props} {...dispatchers} />
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
    display: var(--sui-sankey-chart-display, block);
  }
</style>
