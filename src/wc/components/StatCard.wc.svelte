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
  import AnimatedNumber from '$lib/AnimatedNumber/AnimatedNumber.svelte';
  import { isAnimatableMetric } from '$lib/StatCard/metric';
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

  const animatesValue = $derived(
    isAnimatableMetric(String(props.value ?? '')) &&
      (props.animatePrimary
        ? props.primary === undefined || props.primary === 'auto' || props.primary === 'value'
        : Boolean(props.animateValue))
  );
</script>

<!-- Mirrors StatCard.svelte's own fallback for `value`, including its animateValue
     branch, and its metric gate -- `animateValue` alone used to be enough here,
     so the wrapper rolled identifiers the Svelte component would have refused.

     `animatePrimary` alone is NOT enough either: it means "animate ONE slot",
     and that slot is only this one when `primary` resolves to the value. With
     `primary="subtitle"` the wrapper animated the value while StatCard animated
     the subtitle, so the custom element rolled two things and the component
     rolled one.

     `'auto'` is treated as selecting the value here because this fallback only
     renders when the card has no rows, which leaves the value as the sole
     animatable slot in every case but a subtitle that happens to be larger.
     Resolving it exactly needs the measurement StatCard does on mounted DOM,
     which a snippet cannot reach. The wrapper passes `valueSnippet` UNCONDITIONALLY to bridge the
     value-snippet slot, and StatCard gives that snippet full precedence -- so
     without this branch the custom element could never animate its value however
     the attribute was set, while the Svelte component could.

     Kept as a separate snippet rather than inlined into the slot because
     check-wc-contract.js reads a slot's fallback with indexOf('</slot>'), and the
     inline form was long enough that Prettier broke the closing tag across lines,
     leaving the rule unable to see any fallback at all. -->
{#snippet valueFallback()}
  {#if animatesValue}<AnimatedNumber
      value={props.value}
      animateOnMount={props.animateOnMount}
    />{:else}{props.value}{/if}
{/snippet}

<StatCard {...props} {...dispatchers} title={statCardTitle}>
  {#snippet headerRight()}
    <slot name="header-right"></slot>
  {/snippet}
  {#snippet footer()}
    <slot name="footer"></slot>
  {/snippet}
  {#snippet valueSnippet()}
    <slot name="value-snippet">{@render valueFallback()}</slot>
  {/snippet}
  <slot></slot>
</StatCard>

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
