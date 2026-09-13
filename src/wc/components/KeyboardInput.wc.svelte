<svelte:options
  customElement={{
    tag: 'sui-keyboard-input',
    shadow: 'open',
    props: {
      keys: { type: 'Object', reflect: true },
      separator: { type: 'String', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      literal: { type: 'Boolean', reflect: true },
      onclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import KeyboardInput from '$lib/KeyboardInput/KeyboardInput.svelte';
  import { dispatchEvents } from '../dispatch';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onclick is this element's ONLY callback prop, and it collides with
  // HTMLElement's own onclick accessor with no exception recorded for
  // 'sui-keyboard-input:onclick' in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS --
  // so dispatchEvents intentionally returns nothing for it. It stays callback-only:
  // `keyboardInput.onclick = fn` still runs exactly as before, but no synthetic
  // 'click' is ever dispatched (a real composed click already bubbles out of the
  // shadow root). Called anyway, on every wrapper, rather than special-cased away:
  // proves the collision guard produces this no-op instead of assuming it.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<KeyboardInput {...props} {...dispatchers} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (inline-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-keyboard-input-display, inline-block);
  }
</style>
