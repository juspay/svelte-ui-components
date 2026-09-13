<svelte:options
  customElement={{
    tag: 'sui-draggable',
    shadow: 'open',
    props: {
      x: { type: 'Number', reflect: true },
      y: { type: 'Number', reflect: true },
      axis: { type: 'String' },
      handle: { type: 'String' },
      bounds: { type: 'String' },
      disabled: { type: 'Boolean', reflect: true },
      step: { type: 'Number' },
      dragLabel: { type: 'String', attribute: 'drag-label' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onmovestart: { type: 'Object' },
      onmove: { type: 'Object' },
      onmoveend: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Draggable from '$lib/Draggable/Draggable.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onmovestart, onmove, and onmoveend collide with nothing in
  // HOST_EVENT_HANDLER_PROPS, so all three dispatch 'movestart', 'move', 'moveend'.
  // Each is a single-argument callback (Draggable/properties.ts's own
  // `(position: DragPosition) => void`), so `detail` is exactly that position object
  // with no CALLBACK_ARGUMENT_NAMES entry needed.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Draggable {...props} {...dispatchers}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
</Draggable>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-draggable-display, block);
  }
</style>
