<svelte:options
  customElement={{
    tag: 'sui-icon',
    shadow: 'open',
    props: {
      icon: { type: 'String', reflect: true },
      svg: { type: 'String', reflect: true },
      text: { type: 'String', reflect: true },
      classes: { type: 'String' },
      onclick: { type: 'Object' },
      onkeydown: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' }
    }
  }}
/>

<script lang="ts">
  import Icon from '$lib/Icon/Icon.svelte';
  import { dispatchEvents } from '../dispatch';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onclick and onkeydown are this element's ONLY callback props, and BOTH
  // collide with HTMLElement's own accessors with no exception recorded for
  // 'sui-icon:onclick' / 'sui-icon:onkeydown' in ../dispatch.ts's
  // DISPATCH_COLLISION_EXCEPTIONS -- so dispatchEvents intentionally returns nothing
  // for either. They stay callback-only: `icon.onclick = fn` / `.onkeydown = fn`
  // still run exactly as before, but no synthetic 'click'/'keydown' is ever
  // dispatched (a real composed click/keydown already bubbles out of the shadow
  // root). Called anyway, on every wrapper, rather than special-cased away: proves
  // the collision guard produces this no-op instead of assuming it.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Icon {...props} {...dispatchers} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-icon-display, block);
  }
</style>
