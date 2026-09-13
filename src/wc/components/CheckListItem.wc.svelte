<svelte:options
  customElement={{
    tag: 'sui-check-list-item',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      checked: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      onclick: { type: 'Object' },
      checkboxLabel: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import CheckListItem from '$lib/CheckListItem/CheckListItem.svelte';
  import { dispatchEvents } from '../dispatch';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onclick is this element's ONLY callback prop, and it collides with
  // HTMLElement's own onclick accessor with no exception recorded for
  // 'sui-check-list-item:onclick' in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS --
  // so dispatchEvents intentionally returns nothing for it. It stays callback-only:
  // `item.onclick = fn` still runs `fn(checked)` exactly as before, but no synthetic
  // 'click' event is ever dispatched (a real composed click already bubbles out of the
  // shadow root, and doubling it up is the exact hazard the collision rule exists to
  // prevent). Called anyway, on every wrapper, rather than special-cased away: proves
  // the collision guard produces this no-op instead of assuming it.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<CheckListItem {...props} {...dispatchers}>
  {#snippet checkboxLabel()}
    <!-- Mirrors CheckListItem.svelte's checkboxLabel fallback:
         <span class="text" class:checked>{text}</span> -->
    <slot name="checkbox-label">
      <span class="text" class:checked={props.checked}>{props.text}</span>
    </slot>
  {/snippet}
</CheckListItem>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-check-list-item-display, block);
  }
</style>
