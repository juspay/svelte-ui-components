<svelte:options
  customElement={{
    tag: 'sui-book',
    shadow: 'open',
    props: {
      pages: { type: 'Object' },
      currentPage: { type: 'Number', reflect: true, attribute: 'current-page' },
      transition: { type: 'String', reflect: true },
      showNavigation: { type: 'Boolean', reflect: true, attribute: 'show-navigation' },
      showPageIndicator: { type: 'Boolean', reflect: true, attribute: 'show-page-indicator' },
      enableSwipe: { type: 'Boolean', reflect: true, attribute: 'enable-swipe' },
      testId: { type: 'String', attribute: 'test-id' },
      previousIcon: { type: 'Object' },
      nextIcon: { type: 'Object' },
      classes: { type: 'String' },
      onpagechange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Book from '$lib/Book/Book.svelte';
  // Mirrors Book.svelte's own previousIcon/nextIcon defaults.
  import chevronLeftLgSvg from '$lib/assets/chevron-left-lg.svg?raw';
  import chevronRightLgSvg from '$lib/assets/chevron-right-lg.svg?raw';
  import { dispatchEvents } from '../dispatch';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onpagechange does not collide with a native HTMLElement handler, so it
  // dispatches 'pagechange' with detail: the new page number (Book.svelte's own
  // onpagechange?.(currentPage) argument, unchanged -- a single scalar argument needs
  // no CALLBACK_ARGUMENT_NAMES entry) for a consumer who only calls addEventListener.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Book {...props} {...dispatchers}>
  {#snippet previousIcon()}
    <!--
      A snippet declared here is always a function, so Book.svelte's own
      `{#if typeof previousIcon === 'function'} ... {:else}{@html chevronLeftLgSvg}{/if}`
      would always take the true branch and never show its default chevron. Native
      slot fallback content renders exactly when the host assigns nothing, restoring it.
    -->
    <slot name="previous-icon">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html chevronLeftLgSvg}
    </slot>
  {/snippet}
  {#snippet nextIcon()}
    <slot name="next-icon">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html chevronRightLgSvg}
    </slot>
  {/snippet}
</Book>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-book-display, block);
  }
</style>
