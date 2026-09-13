<svelte:options
  customElement={{
    tag: 'sui-snippet',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      prompt: { type: 'String', reflect: true },
      showCopyButton: { type: 'Boolean', reflect: true, attribute: 'show-copy-button' },
      testId: { type: 'String', attribute: 'test-id' },
      copiedLabel: { type: 'String', reflect: true, attribute: 'copied-label' },
      copyResetMs: { type: 'Number', reflect: true, attribute: 'copy-reset-ms' },
      classes: { type: 'String' },
      oncopy: { type: 'Object' },
      onerror: { type: 'Object' },
      copyIcon: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Snippet from '$lib/Snippet/Snippet.svelte';
  import { dispatchEvents } from '../dispatch';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // Snippet's only callback props are oncopy and onerror, and BOTH collide
  // with HTMLElement's own accessors of the same name -- so dispatchEvents
  // returns no dispatcher for either, and neither ever dispatches a DOM event.
  // Wired anyway, and called unconditionally like every other wrapper, so the
  // collision guard's no-op is proven rather than assumed.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Snippet {...props} {...dispatchers}>
  {#snippet copyIcon()}
    <slot name="copy-icon"></slot>
  {/snippet}
</Snippet>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-snippet-display, block);
  }
</style>
