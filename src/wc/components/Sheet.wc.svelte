<svelte:options
  customElement={{
    tag: 'sui-sheet',
    shadow: 'open',
    props: {
      open: { type: 'Boolean', reflect: true },
      side: { type: 'String', reflect: true },
      sheetTitle: { type: 'String', reflect: true, attribute: 'title' },
      showOverlay: { type: 'Boolean', reflect: true, attribute: 'show-overlay' },
      overlayAriaLabel: { type: 'String', reflect: true, attribute: 'overlay-aria-label' },
      showCloseButton: { type: 'Boolean', reflect: true, attribute: 'show-close-button' },
      headingLevel: { type: 'Number', reflect: true, attribute: 'heading-level' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onclose: { type: 'Object' },
      onafteropen: { type: 'Object' },
      onafterclose: { type: 'Object' },
      dismissOnOutsideClick: { type: 'Boolean', attribute: 'dismiss-on-outside-click' },
      content: { type: 'Object' },
      footer: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Sheet from '$lib/Sheet/Sheet.svelte';
  import { dispatchEvents } from '../dispatch';
  let { sheetTitle, ...props } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onafteropen and onafterclose do not collide with a native HTMLElement
  // handler, so they dispatch 'afteropen' and 'afterclose' (both 0-argument, no
  // detail) for a consumer who only calls addEventListener. onclose DOES collide
  // with HTMLElement's own close accessor, so it stays callback-only -- unchanged
  // from before this wiring.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Sheet {...props} {...dispatchers} title={sheetTitle}>
  {#snippet content()}
    <slot></slot>
  {/snippet}
  {#snippet footer()}
    <slot name="footer"></slot>
  {/snippet}
</Sheet>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-sheet-display, block);
  }
</style>
