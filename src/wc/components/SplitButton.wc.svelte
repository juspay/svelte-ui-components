<svelte:options
  customElement={{
    tag: 'sui-split-button',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      items: { type: 'Object' },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      triggerAriaLabel: { type: 'String', attribute: 'trigger-aria-label' },
      onclick: { type: 'Object' },
      onselect: { type: 'Object' },
      dropdownIcon: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import SplitButton from '$lib/SplitButton/SplitButton.svelte';
  import { dispatchEvents } from '../dispatch';
  import chevronDownSmSvg from '$lib/assets/chevron-down-sm.svg?raw';
  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // SplitButton's only callback props are onclick and onselect, and BOTH
  // collide with HTMLElement's own accessors of the same name -- so
  // dispatchEvents returns no dispatcher for either, and neither ever dispatches
  // a DOM event. Wired anyway, and called unconditionally like every other
  // wrapper, so the collision guard's no-op is proven rather than assumed.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<SplitButton {...props} {...dispatchers}>
  {#snippet dropdownIcon()}
    <!-- Mirrors SplitButton.svelte's dropdownIcon fallback: {@html chevronDownSmSvg} -->
    <slot name="dropdown-icon">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html chevronDownSmSvg}
    </slot>
  {/snippet}
</SplitButton>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-split-button-display, block);
  }
</style>
