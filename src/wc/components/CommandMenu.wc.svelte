<svelte:options
  customElement={{
    tag: 'sui-command-menu',
    shadow: 'open',
    props: {
      items: { type: 'Object' },
      open: { type: 'Boolean', reflect: true },
      placeholder: { type: 'String', reflect: true },
      emptyText: { type: 'String', reflect: true, attribute: 'empty-text' },
      testId: { type: 'String', attribute: 'test-id' },
      searchIcon: { type: 'Object' },
      classes: { type: 'String' },
      onselect: { type: 'Object' },
      onclose: { type: 'Object' },
      itemIcon: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import CommandMenu from '$lib/CommandMenu/CommandMenu.svelte';
  import searchSvg from '$lib/assets/search.svg?raw';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onselect and onclose are CommandMenu's only callback props, and both collide
  // with HTMLElement's own accessors with no exception recorded for
  // 'sui-command-menu:onselect' / 'sui-command-menu:onclose' in ../dispatch.ts's
  // DISPATCH_COLLISION_EXCEPTIONS -- so dispatchEvents intentionally returns nothing for
  // either. They stay callback-only. Called anyway, on every wrapper, rather than
  // special-cased away: proves the collision guard produces this no-op instead of
  // assuming it.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<CommandMenu {...props} {...dispatchers}>
  {#snippet searchIcon()}
    <!-- Mirrors CommandMenu.svelte's searchIcon fallback:
         <span class="command-menu-search-icon">{@html searchSvg}</span> -->
    <slot name="search-icon">
      <span class="command-menu-search-icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html searchSvg}
      </span>
    </slot>
  {/snippet}
</CommandMenu>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-command-menu-display, block);
  }
</style>
