<svelte:options
  customElement={{
    tag: 'sui-scroller',
    shadow: 'open',
    props: {
      direction: { type: 'String', reflect: true },
      scrollAmount: { type: 'Number', attribute: 'scroll-amount' },
      showArrows: { type: 'Boolean', reflect: true, attribute: 'show-arrows' },
      showGradient: { type: 'Boolean', reflect: true, attribute: 'show-gradient' },
      dragToScroll: { type: 'Boolean', reflect: true, attribute: 'drag-to-scroll' },
      snapToItem: { type: 'Boolean', reflect: true, attribute: 'snap-to-item' },
      hideScrollbar: { type: 'Boolean', reflect: true, attribute: 'hide-scrollbar' },
      hideArrowsOnTouch: { type: 'Boolean', attribute: 'hide-arrows-on-touch' },
      smoothScroll: { type: 'Boolean', reflect: true, attribute: 'smooth-scroll' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onscrollposition: { type: 'Object' },
      arrowPrevious: { type: 'Object' },
      arrowNext: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Scroller from '$lib/Scroller/Scroller.svelte';
  import { dispatchEvents } from '../dispatch';
  // Mirrors Scroller.svelte's own arrowPrevious/arrowNext defaults, which pick their
  // glyph from `direction` the same way.
  import chevronLeftSvg from '$lib/assets/chevron-left.svg?raw';
  import chevronRightSvg from '$lib/assets/chevron-right.svg?raw';
  import chevronUpSvg from '$lib/assets/chevron-up.svg?raw';
  import chevronDownSvg from '$lib/assets/chevron-down.svg?raw';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onscrollposition does not collide with a native HTMLElement handler, so
  // it dispatches 'scrollposition' with detail: the ScrollPosition object (its one
  // argument), for a consumer who only calls addEventListener.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Scroller {...props} {...dispatchers}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
  {#snippet arrowPrevious()}
    <!--
      A snippet declared here is always a function, so Scroller.svelte's own
      `{#if typeof arrowPrevious === 'function'} ... {:else}<span class="arrow-icon">...</span>{/if}`
      would always take the true branch and never show its default chevron. Native
      slot fallback content renders exactly when the host assigns nothing, restoring it.
    -->
    <slot name="arrow-previous">
      <span class="arrow-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html props.direction === 'horizontal' ? chevronLeftSvg : chevronUpSvg}
      </span>
    </slot>
  {/snippet}
  {#snippet arrowNext()}
    <slot name="arrow-next">
      <span class="arrow-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html props.direction === 'horizontal' ? chevronRightSvg : chevronDownSvg}
      </span>
    </slot>
  {/snippet}
</Scroller>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-scroller-display, block);
  }
</style>
