<svelte:options
  customElement={{
    tag: 'sui-media-upload',
    shadow: 'open',
    props: {
      label: { type: 'String' },
      description: { type: 'String' },
      addText: { type: 'String', attribute: 'add-text' },
      hintText: { type: 'String', attribute: 'hint-text' },
      maxLength: { type: 'Number', attribute: 'max-length' },
      accept: { type: 'String' },
      maxFileSize: { type: 'Number', attribute: 'max-file-size' },
      multiple: { type: 'Boolean' },
      dragAndDrop: { type: 'Boolean', attribute: 'drag-and-drop' },
      disabled: { type: 'Boolean', reflect: true },
      showCounter: { type: 'Boolean', attribute: 'show-counter' },
      showFileName: { type: 'Boolean', attribute: 'show-file-name' },
      showFileSize: { type: 'Boolean', attribute: 'show-file-size' },
      addIcon: { type: 'Object' },
      removeIcon: { type: 'Object' },
      fileIcon: { type: 'Object' },
      errorMessages: { type: 'Object' },
      files: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onchange: { type: 'Object' },
      onremove: { type: 'Object' },
      onerror: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import MediaUpload from '$lib/MediaUpload/MediaUpload.svelte';
  import addSvg from '$lib/assets/add.svg?raw';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onchange and onerror both collide with native HTMLElement accessors
  // (HOST_EVENT_HANDLER_PROPS), so dispatchEvents returns nothing for either --
  // they stay callback-only. onremove does not collide, so it dispatches 'remove'
  // with detail: the removed File for a consumer who only calls addEventListener.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!--
  A property-assigned icon wins; the slot is the fallback, carrying MediaUpload's
  own plus glyph as ITS fallback so a consumer supplying neither still sees the
  built-in one. The branch stays inside the body snippet so `<slot>` keeps its
  `$$props` scope.

  `removeIcon` and `fileIcon` are deliberately NOT bridged. MediaUpload renders
  both inside `{#each items}`, once per attachment, and Svelte appends one `<slot>`
  element per render site while the DOM assigns light-DOM children to the FIRST
  matching slot only. With two files slotted content would reach file one and file
  two would render EMPTY -- losing the built-in glyph as well, since the generated
  per-site `<slot>` carries no fallback. They stay JS-property-only props.
-->
<MediaUpload {...props} {...dispatchers}>
  {#snippet addIcon()}
    {#if props.addIcon}{@render props.addIcon()}{:else}<slot name="add-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html addSvg}
      </slot>{/if}
  {/snippet}
</MediaUpload>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-media-upload-display, block);
  }
</style>
