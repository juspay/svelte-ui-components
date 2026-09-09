<svelte:options
  customElement={{
    tag: 'sui-pie-chart',
    shadow: 'open',
    props: {
      // Complex props (arrays / objects / functions / snippets) cannot cross the
      // HTML-attribute boundary, so they are exposed as JS properties only:
      //   document.querySelector('sui-pie-chart').data = [{ label: 'UPI', value: 62 }];
      data: { type: 'Object' },
      innerRadius: { type: 'Number', attribute: 'inner-radius' },
      padAngle: { type: 'Number', attribute: 'pad-angle' },
      showLabels: { type: 'Boolean', attribute: 'show-labels' },
      showValues: { type: 'Boolean', attribute: 'show-values' },
      labelPosition: { type: 'String', attribute: 'label-position' },
      showLegend: { type: 'Boolean', attribute: 'show-legend' },
      startAngle: { type: 'Number', attribute: 'start-angle' },
      aspectRatio: { type: 'Number', attribute: 'aspect-ratio' },
      maxHeight: { type: 'Number', attribute: 'max-height' },
      minHeight: { type: 'Number', attribute: 'min-height' },
      semiCircle: { type: 'Boolean', attribute: 'semi-circle' },
      legendShowValues: { type: 'Boolean', attribute: 'legend-show-values' },
      legendPosition: { type: 'String', attribute: 'legend-position' },
      legendMaxItems: { type: 'Number', attribute: 'legend-max-items' },
      percentDecimals: { type: 'Number', attribute: 'percent-decimals' },
      highlightedIndex: { type: 'Number', attribute: 'highlighted-index' },
      changePercentage: { type: 'Number', attribute: 'change-percentage' },
      changeInvertColors: { type: 'Boolean', attribute: 'change-invert-colors' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      valueFormat: { type: 'Object' },
      tooltipSnippet: { type: 'Object' },
      center: { type: 'Object' },
      empty: { type: 'Object' },
      onlegendmore: { type: 'Object' },
      onchartready: { type: 'Object' },
      onsliceclick: { type: 'Object' },
      onslicehover: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import PieChart from '$lib/PieChart/PieChart.svelte';

  let props = $props();

  /*
   * PieChart gates its own defaults on `typeof snippet === 'function'`, so a
   * wrapper that defined these unconditionally would replace the built-in empty
   * state with a blank box and force an empty centre onto every donut. Claim a
   * snippet only when the consumer actually slotted content into it, which also
   * leaves a JS-assigned `center`/`empty` property working when they did not.
   *
   * `tooltipSnippet` is deliberately absent here: it is called with
   * `(slice, index)`, and a `<slot>` cannot receive those arguments, so it stays
   * a JS-property-only prop rather than being wired to markup that would drop
   * the values it exists to render.
   *
   * `$host()` is called inline rather than held in a `const host`: a `$`-prefixed
   * identifier is Svelte's store-subscription spelling, so a local named `host`
   * makes `$host` read as that store and svelte-check reports the initializer as
   * referencing itself.
   */
  const hasCenterSlot = $host().querySelector('[slot="center"]') !== null;
  const hasEmptySlot = $host().querySelector('[slot="empty"]') !== null;
</script>

<!--
  Four branches rather than two conditional snippet props, because a `{#snippet}`
  declared at the top level of the template is hoisted to module scope, while the
  `<slot>` inside it compiles to `$.slot(node, $$props, …)` — and `$$props` only
  exists inside the component function. The hoisted version throws
  `$$props is not defined` the moment the snippet is rendered, which shows up as
  a silently empty shadow root rather than as a build error. Declaring each
  snippet inside `<PieChart>` keeps it in component scope, which is what every
  other wrapper in this directory does; the branching is what makes it
  conditional without a top-level declaration.
-->
{#if hasCenterSlot && hasEmptySlot}
  <PieChart {...props}>
    {#snippet center()}
      <slot name="center"></slot>
    {/snippet}
    {#snippet empty()}
      <slot name="empty"></slot>
    {/snippet}
  </PieChart>
{:else if hasCenterSlot}
  <PieChart {...props}>
    {#snippet center()}
      <slot name="center"></slot>
    {/snippet}
  </PieChart>
{:else if hasEmptySlot}
  <PieChart {...props}>
    {#snippet empty()}
      <slot name="empty"></slot>
    {/snippet}
  </PieChart>
{:else}
  <PieChart {...props} />
{/if}
