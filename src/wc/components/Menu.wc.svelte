<svelte:options
  customElement={{
    tag: 'sui-menu',
    shadow: 'open',
    props: {
      items: { type: 'Object' },
      open: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      transformSvg: { type: 'Object' },
      triggerAriaLabel: { type: 'String', attribute: 'trigger-aria-label' },
      menuAriaLabel: { type: 'String', attribute: 'aria-label' },
      onselect: { type: 'Object' },
      onopen: { type: 'Object' },
      onclose: { type: 'Object' },
      trigger: { type: 'Object' },
      interactiveTrigger: { type: 'Boolean', attribute: 'interactive-trigger' },
      selectedValue: { type: 'String', attribute: 'selected-value' },
      placement: { type: 'String', attribute: 'placement' },
      usePortal: { type: 'Boolean', attribute: 'use-portal' }
    }
  }}
/>

<script lang="ts">
  import Menu from '$lib/Menu/Menu.svelte';
  import type { MenuProperties } from '$lib/Menu/properties';
  import { dispatchEvents } from '../dispatch';
  // The element renames `ariaLabel` to `menuAriaLabel` because the platform already defines `ariaLabel` on every
  // HTMLElement. The rest still carries the component's own props -- saying so is what
  // a destructured `$props()` no longer infers on its own.
  let {
    menuAriaLabel,
    ...props
  }: Omit<MenuProperties, 'ariaLabel'> & { menuAriaLabel?: MenuProperties['ariaLabel'] } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onselect and onclose both collide with native HTMLElement accessors
  // (HOST_EVENT_HANDLER_PROPS: 'select' and 'close' are genuine host events), so
  // dispatchEvents returns nothing for either -- they stay callback-only. onopen
  // does not collide, so it dispatches 'open' for a consumer who only calls
  // addEventListener. The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!-- A property-assigned trigger wins; the slot is the fallback. The branch stays
     inside the body snippet so `<slot>` keeps its `$$props` scope. -->
<Menu {...props} {...dispatchers} ariaLabel={menuAriaLabel}>
  {#snippet trigger(triggerProps)}
    {#if props.trigger}{@render props.trigger(triggerProps)}{:else}<slot name="trigger"></slot>{/if}
  {/snippet}
</Menu>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-menu-display, block);
  }
</style>
