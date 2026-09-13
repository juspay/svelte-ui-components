<svelte:options
  customElement={{
    tag: 'sui-resizable',
    shadow: 'open',
    props: {
      width: { type: 'Number', reflect: true },
      height: { type: 'Number', reflect: true },
      minWidth: { type: 'Number', attribute: 'min-width' },
      maxWidth: { type: 'Number', attribute: 'max-width' },
      minHeight: { type: 'Number', attribute: 'min-height' },
      maxHeight: { type: 'Number', attribute: 'max-height' },
      handles: { type: 'Object' },
      step: { type: 'Number' },
      disabled: { type: 'Boolean', reflect: true },
      handleLabel: { type: 'String', attribute: 'handle-label' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onresize: { type: 'Object' },
      onresizestart: { type: 'Object' },
      onresizeend: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Resizable from '$lib/Resizable/Resizable.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onresize collides with HTMLElement's own onresize accessor
  // (HOST_EVENT_HANDLER_PROPS), so dispatchEvents returns nothing for it -- it
  // stays callback-only. onresizestart and onresizeend do not collide, so both
  // dispatch -- 'resizestart' and 'resizeend' -- with detail: the size object
  // Resizable.svelte's own callback already receives, for a consumer who only
  // calls addEventListener. The capture is safe and the warning does not apply
  // to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Resizable {...props} {...dispatchers}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
</Resizable>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-resizable-display, block);
  }
</style>
