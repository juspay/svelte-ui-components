<svelte:options
  customElement={{
    tag: 'sui-file-dropzone-trigger',
    shadow: 'open',
    props: {
      icon: { type: 'String' },
      heading: { type: 'String' },
      caption: { type: 'String' },
      compact: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import FileDropzoneTrigger from '$lib/FileDropzoneTrigger/FileDropzoneTrigger.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onclick is FileDropzoneTrigger's only callback prop, and it collides with
  // HTMLElement's own accessor with no exception recorded for
  // 'sui-file-dropzone-trigger:onclick' in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS
  // -- so dispatchEvents intentionally returns nothing. It stays callback-only. Called
  // anyway, rather than special-cased away: proves the collision guard produces this
  // no-op instead of assuming it.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<FileDropzoneTrigger {...props} {...dispatchers} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-file-dropzone-trigger-display, block);
  }
</style>
