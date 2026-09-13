<svelte:options
  customElement={{
    tag: 'sui-pagination',
    shadow: 'open',
    props: {
      totalPages: { type: 'Number', reflect: true, attribute: 'total-pages' },
      currentPage: { type: 'Number', reflect: true, attribute: 'current-page' },
      siblingCount: { type: 'Number', reflect: true, attribute: 'sibling-count' },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      hasMore: { type: 'Boolean', reflect: true, attribute: 'has-more' },
      prevButtonTestId: { type: 'String', attribute: 'prev-button-test-id' },
      nextButtonTestId: { type: 'String', attribute: 'next-button-test-id' },
      onchange: { type: 'Object' },
      onloadmore: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Pagination from '$lib/Pagination/Pagination.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onchange collides with HTMLElement's own onchange accessor
  // (HOST_EVENT_HANDLER_PROPS), so dispatchEvents returns nothing for it -- it
  // stays callback-only. onloadmore does not collide, so it dispatches
  // 'loadmore' for a consumer who only calls addEventListener. The capture is
  // safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Pagination {...props} {...dispatchers} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-pagination-display, block);
  }
</style>
