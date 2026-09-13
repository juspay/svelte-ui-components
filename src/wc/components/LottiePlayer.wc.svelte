<svelte:options
  customElement={{
    tag: 'sui-lottie-player',
    shadow: 'open',
    props: {
      src: { type: 'String', reflect: true },
      animationData: { type: 'Object' },
      autoplay: { type: 'Boolean', reflect: true },
      loop: { type: 'Boolean', reflect: true },
      speed: { type: 'Number', reflect: true },
      renderer: { type: 'String', reflect: true },
      lottiePlayerAriaHidden: { type: 'Boolean', reflect: true, attribute: 'aria-hidden' },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      oncomplete: { type: 'Object' },
      onerror: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import LottiePlayer from '$lib/LottiePlayer/LottiePlayer.svelte';
  import { dispatchEvents } from '../dispatch';
  let { lottiePlayerAriaHidden, ...props } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's name
  // minus its `$` with the rune itself (sveltejs/svelte#13715, same class as `state` vs
  // `$state`), reporting `$host` as used before its declaration.
  const hostEl = $host();

  // This element already dispatched 'complete' and 'error' before the rule
  // existed. 'error' collides with HTMLElement's own onerror accessor, so it is the one
  // named exception in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS -- kept rather than
  // silenced, so a consumer already listening for it sees no change. These sit after
  // {...props}, so they are the only ones the child can call: declaring
  // `oncomplete`/`onerror` made them assignable without making them reachable, and
  // dispatchEvents is what closes that gap.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<LottiePlayer {...props} ariaHidden={lottiePlayerAriaHidden} {...dispatchers} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-lottie-player-display, block);
  }
</style>
