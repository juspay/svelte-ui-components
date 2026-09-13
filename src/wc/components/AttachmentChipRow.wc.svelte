<svelte:options
  customElement={{
    tag: 'sui-attachment-chip-row',
    shadow: 'open',
    props: {
      images: { type: 'Object' },
      files: { type: 'Object' },
      videos: { type: 'Object' },
      imageTooltip: { type: 'Object' },
      videoTooltip: { type: 'Object' },
      removeIcon: { type: 'Object' },
      fileIcon: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onremoveimage: { type: 'Object' },
      onremovefile: { type: 'Object' },
      onremovevideo: { type: 'Object' },
      onopenimage: { type: 'Object' },
      onopenvideo: { type: 'Object' },
      onopenfile: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import AttachmentChipRow from '$lib/AttachmentChipRow/AttachmentChipRow.svelte';
  import { dispatchEvents } from '../dispatch';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // None of the six on* props (onremoveimage, onremovefile, onremovevideo,
  // onopenimage, onopenvideo, onopenfile) collides with a native HTMLElement handler,
  // so all six dispatch -- 'removeimage', 'removefile', 'removevideo', 'openimage',
  // 'openvideo', 'openfile' -- for a consumer who only calls addEventListener. Each
  // callback takes exactly one argument (an id string for the three remove callbacks,
  // the attachment object for the three open callbacks), so detail is that value
  // unchanged -- no CALLBACK_ARGUMENT_NAMES entry needed.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!--
  No named slot, deliberately. `removeIcon` and `fileIcon` are both argument-less
  content props, but AttachmentChipRow renders them inside `{#each images}`,
  `{#each videos}` and `{#each files}` -- once per attachment. Svelte appends one
  one slot element per render site, and the DOM assigns light-DOM children to the FIRST
  matching slot only, so with three chips the slotted icon would reach chip one and
  chips two and three would render EMPTY: the generated per-site slot element carries no
  fallback, so even the built-in cross and document glyphs would be lost. Both stay
  JS-property-only props.
-->
<AttachmentChipRow {...props} {...dispatchers} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-attachment-chip-row-display, block);
  }
</style>
