<svelte:options
  customElement={{
    tag: 'sui-carousel',
    shadow: 'open',
    props: {
      views: { type: 'Object' },
      autoplay: { type: 'Boolean', reflect: true },
      autoplayInterval: { type: 'Number', reflect: true, attribute: 'autoplay-interval' },
      showDots: { type: 'Boolean', reflect: true, attribute: 'show-dots' },
      isScrollableLast: { type: 'Boolean', reflect: true, attribute: 'is-scrollable-last' },
      classes: { type: 'String' },
      onkeydown: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      dotsWrapperTestId: { type: 'String', attribute: 'dots-wrapper-test-id' },
      dotTestId: { type: 'String', attribute: 'dot-test-id' }
    }
  }}
/>

<script lang="ts">
  import Carousel from '$lib/Carousel/Carousel.svelte';
  import { dispatchEvents } from '../dispatch';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onkeydown is this element's ONLY callback prop, and it collides with
  // HTMLElement's own onkeydown accessor with no exception recorded for
  // 'sui-carousel:onkeydown' in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS -- so
  // dispatchEvents intentionally returns nothing for it. It stays callback-only:
  // `carousel.onkeydown = fn` still runs `fn(event)` exactly as before, but no
  // synthetic 'keydown' is ever dispatched. Called anyway, rather than special-cased
  // away: proves the collision guard produces this no-op instead of assuming it.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Carousel {...props} {...dispatchers} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-carousel-display, block);
  }
</style>
