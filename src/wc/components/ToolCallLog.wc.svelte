<svelte:options
  customElement={{
    tag: 'sui-tool-call-log',
    shadow: 'open',
    props: {
      chips: { type: 'Array' },
      onchipclick: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      usePortal: { type: 'Boolean', attribute: 'use-portal' }
    }
  }}
/>

<script lang="ts">
  import ToolCallLog from '$lib/ToolCallLog/ToolCallLog.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onchipclick does not collide with a native HTMLElement handler, so it
  // dispatches 'chipclick' with detail: { index, chip } (ToolCallLog.svelte's own
  // onchipclick?.(index, chip) parameter names, named once in ../dispatch.ts's
  // CALLBACK_ARGUMENT_NAMES) for a consumer who only calls addEventListener.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<ToolCallLog {...props} {...dispatchers} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-tool-call-log-display, block);
  }
</style>
