<svelte:options
  customElement={{
    tag: 'sui-context-menu',
    shadow: 'open',
    props: {
      items: { type: 'Object' },
      open: { type: 'Boolean', reflect: true },
      maxHeight: { type: 'String', reflect: true, attribute: 'max-height' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onselect: { type: 'Object' },
      onopen: { type: 'Object' },
      onclose: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ContextMenu from '$lib/ContextMenu/ContextMenu.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onselect and onclose collide with HTMLElement's own accessors with no
  // recorded exception, so dispatchEvents leaves those two callback-only. onopen
  // collides with nothing and dispatches 'open' -- a 0-argument callback
  // (ContextMenu/properties.ts), so no `detail` is included.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<ContextMenu {...props} {...dispatchers}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
</ContextMenu>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-context-menu-display, block);
  }
</style>
