<svelte:options
  customElement={{
    tag: 'sui-funnel-chart',
    shadow: 'open',
    props: {
      // Complex props (arrays / objects / functions / snippets) cannot cross the
      // HTML-attribute boundary, so they are exposed as JS properties only:
      //   document.querySelector('sui-funnel-chart').data = [{ category: 'Visit', value: 12000 }];
      data: { type: 'Object' },
      stageColors: { type: 'Object' },
      connectorColor: { type: 'String', attribute: 'connector-color' },
      slopeWidth: { type: 'Number', attribute: 'slope-width' },
      onHoverExpand: { type: 'Number', attribute: 'on-hover-expand' },
      showValueLabels: { type: 'Boolean', attribute: 'show-value-labels' },
      valueFormat: { type: 'Object' },
      aspectRatio: { type: 'Number', attribute: 'aspect-ratio' },
      maxHeight: { type: 'Number', attribute: 'max-height' },
      minHeight: { type: 'Number', attribute: 'min-height' },
      radius: { type: 'Number' },
      tooltipPortal: { type: 'Boolean', attribute: 'tooltip-portal' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      empty: { type: 'Object' },
      onstageclick: { type: 'Object' },
      onstagehover: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import FunnelChart from '$lib/FunnelChart/FunnelChart.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  /*
   * FunnelChart renders its own chart frame unless `isEmpty && typeof empty ===
   * 'function'`, and only then falls through to `{@render empty()}`. A wrapper
   * that defined the snippet unconditionally would make that check permanently
   * true, so an empty (or all-zero) dataset would always show whatever the
   * wrapper put in the snippet -- an `<sui-funnel-chart>` with nothing slotted
   * would get an empty box where the built-in fallback used to render. Claim it
   * only when the consumer really slotted content, which also leaves a
   * JS-assigned `empty` property working when they did not.
   *
   * FunnelChart has no `tooltipSnippet` (or any tooltip-customizing prop) --
   * unlike SankeyChart and PieChart it always renders ChartTooltip's own default
   * markup internally -- so there is nothing parameterized here to bridge or
   * leave out. `tooltipPortal` is a plain boolean and crosses the attribute
   * boundary fine now that ChartTooltip resolves its portal target from the
   * node's own root instead of hardcoding `document.body`.
   *
   * `$host()` is called inline rather than held in a `const host`: a `$`-prefixed
   * identifier is Svelte's store-subscription spelling, so a local named `host`
   * makes `$host` read as that store and svelte-check reports the initializer as
   * referencing itself.
   */
  const hasEmptySlot = $host().querySelector('[slot="empty"]') !== null;

  // dispatchEvents needs an actual value to call methods on, not another inline
  // `$host()` call per use -- named hostEl, not host, for the same reason as above:
  // svelte2tsx confuses a local variable named after a rune's name minus its `$` with
  // the rune itself (sveltejs/svelte#13715), reporting `$host` as used before its
  // declaration.
  const hostEl = $host();

  // onstageclick and onstagehover collide with nothing in
  // HOST_EVENT_HANDLER_PROPS, so both dispatch 'stageclick' and 'stagehover'. Each
  // is a single-argument callback (FunnelChart/properties.ts's own
  // `(event: { index, stage } | null) => void`), so `detail` is exactly that
  // argument (including `null` when the pointer leaves a stage) with no
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
  <FunnelChart {...props} {...dispatchers}>
    {#snippet empty()}
      <slot name="empty"></slot>
    {/snippet}
  </FunnelChart>
{:else}
  <FunnelChart {...props} {...dispatchers} />
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
    display: var(--sui-funnel-chart-display, block);
  }
</style>
