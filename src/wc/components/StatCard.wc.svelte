<svelte:options
  customElement={{
    tag: 'sui-stat-card',
    shadow: 'open',
    props: {
      statCardTitle: { type: 'String', reflect: true, attribute: 'title' },
      value: { type: 'String', reflect: true },
      delta: { type: 'String', reflect: true },
      deltaPositive: { type: 'Boolean', attribute: 'delta-positive', reflect: true },
      subtitle: { type: 'String', reflect: true },
      animateValue: { type: 'Boolean', attribute: 'animate-value', reflect: true },
      // `animatePrimary` animates ONE value -- the card's largest metric -- and
      // is what a dashboard should reach for; `animateValue` animates them all.
      animatePrimary: { type: 'Boolean', attribute: 'animate-primary', reflect: true },
      // 'auto' | 'subtitle' | 'value' | a row index. A number crosses the
      // attribute boundary as a string, which StatCard's own String() coercion
      // of `primary` already handles, so it is safe as an attribute.
      primary: { type: 'String', reflect: true },
      animateOnMount: { type: 'Boolean', attribute: 'animate-on-mount', reflect: true },
      // Complex props (arrays / objects / functions) cannot cross the HTML-attribute
      // boundary, so they are exposed as JS properties only:
      //   document.querySelector('sui-stat-card').rows = [{ heading: 'Revenue', value: '₹1.2Cr', change: 8.2 }];
      rows: { type: 'Object' },
      rowsDirection: { type: 'String', attribute: 'rows-direction' },
      tooltip: { type: 'Object' },
      checkbox: { type: 'Object' },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      onclick: { type: 'Object' },
      footer: { type: 'Object' },
      valueSnippet: { type: 'Object' },
      headerRight: { type: 'Object' },
      oncheckboxchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import StatCard from '$lib/StatCard/StatCard.svelte';
  import { dispatchEvents } from '../dispatch';
  let { statCardTitle, ...props } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // oncheckboxchange does not collide with a native HTMLElement handler, so
  // it dispatches 'checkboxchange' with detail: the checkbox's boolean checked
  // state (its one argument), for a consumer who only calls addEventListener.
  // onclick DOES collide with HTMLElement's own click accessor, so it stays
  // callback-only -- unchanged from before this wiring.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));

  /*
   * Claimed only when the consumer really slotted content.
   *
   * Passing `valueSnippet` unconditionally made StatCard take its
   * `{#if typeof valueSnippet === 'function'}` branch on EVERY `<sui-stat-card>`,
   * and that branch is the one without `data-sc-slot="value"`. So through the
   * custom element the value was never a candidate for `primary: 'auto'`, which
   * measures `[data-sc-slot]` elements -- `auto` could only ever resolve to the
   * subtitle. The wrapper then re-implemented the animation decision from props
   * and animated the value as well, so the element rolled TWO values where the
   * Svelte component rolls one.
   *
   * Guarding the snippet lets StatCard render its own value branch and make its
   * own decision, which is the whole fix: the wrapper no longer has an animation
   * opinion to disagree with.
   *
   * It also stops this snippet shadowing `props.valueSnippet` in Svelte's
   * spread-props lookup, leaving a JS-assigned property working when no light-DOM
   * slot was present at setup. Because the standalone WC bundle owns its Svelte
   * runtime, consumers must create that property with the `createRawSnippet`
   * exported by `@juspay/svelte-ui-components/wc`, not a separate `svelte`
   * import; the latter closes over incompatible runtime state.
   */
  const hasValueSnippetSlot = $host().querySelector('[slot="value-snippet"]') !== null;
</script>

<!--
  Two branches rather than one conditional snippet prop, because a `{#snippet}`
  declared at the top level of the template is hoisted to module scope while the
  `<slot>` inside it compiles to `$.slot(node, $$props, ...)` -- and `$$props`
  only exists inside the component function. PieChart.wc.svelte carries the same
  shape and the same reason.

  The duplication looks collapsible and is not. Review suggested the obvious
  single-call form:

      {#snippet valueSnippetImpl()}<slot name="value-snippet"></slot>{/snippet}
      <StatCard ... valueSnippet={hasValueSnippetSlot ? valueSnippetImpl : props.valueSnippet}>

  That was measured, not argued about: it BUILDS CLEANLY and then drops the
  consumer's slotted content on the floor. `tests/statcard-wc-auto-parity.spec.ts`
  caught it -- "slotted value-snippet content still replaces the built-in value"
  fails with `assignedIds` empty, because the hoisted snippet's `<slot>` never
  assigns. No build error, no console error, just a card that quietly ignores
  what was slotted into it.

  So the branching stays. If it is ever collapsed, that test is the thing that
  will say so.
-->
{#if hasValueSnippetSlot}
  <StatCard {...props} {...dispatchers} title={statCardTitle}>
    {#snippet headerRight()}
      <slot name="header-right"></slot>
    {/snippet}
    {#snippet footer()}
      <slot name="footer"></slot>
    {/snippet}
    {#snippet valueSnippet()}
      <slot name="value-snippet"></slot>
    {/snippet}
    <slot></slot>
  </StatCard>
{:else}
  <StatCard {...props} {...dispatchers} title={statCardTitle}>
    {#snippet headerRight()}
      <slot name="header-right"></slot>
    {/snippet}
    {#snippet footer()}
      <slot name="footer"></slot>
    {/snippet}
    <slot></slot>
  </StatCard>
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
    display: var(--sui-stat-card-display, block);
  }
</style>
