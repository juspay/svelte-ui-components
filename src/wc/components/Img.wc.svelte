<svelte:options
  customElement={{
    tag: 'sui-img',
    shadow: 'open',
    props: {
      src: { type: 'String', reflect: true },
      alt: { type: 'String', reflect: true },
      fallback: { type: 'String', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onerror: { type: 'Object' },
      inlineSvg: { type: 'Boolean', attribute: 'inline-svg' },
      transformSvg: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Img from '$lib/Img/Img.svelte';
  import { dispatchEvents } from '../dispatch';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onerror is this element's ONLY callback prop, and it collides with
  // HTMLElement's own onerror accessor with no exception recorded for
  // 'sui-img:onerror' in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS (unlike
  // sui-lottie-player, which predates the callback-dispatch rule and keeps a
  // reasoned one) -- so
  // dispatchEvents intentionally returns nothing for it. It stays callback-only:
  // `img.onerror = fn` still runs exactly as before, but no synthetic 'error' is
  // ever dispatched. Called anyway, on every wrapper, rather than special-cased
  // away: proves the collision guard produces this no-op instead of assuming it.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Img {...props} {...dispatchers} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (inline-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-img-display, inline-block);
  }
</style>
